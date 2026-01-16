/**
 * Conversation Manager
 * Orquesta los diferentes flujos conversacionales
 * Punto central de ruteo de mensajes
 * 
 * Configuración en: src/config/dataServices.js (CONVERSATION_FLOWS)
 */

import appointmentFlow from './conversationFlows/appointmentFlow.js';
import quotationFlow from './conversationFlows/quotationFlow.js';
import assistantFlow from './conversationFlows/assistantFlow.js';
import humanHandoffFlow from './conversationFlows/humanHandoffFlow.js';
import { handleSalesFlow, detectSalesIntent } from './conversationFlows/salesFlow.js';
import sessionManager from './sessionManager.js';
import whatsappService from './whatsappService.js';
import * as firebaseService from './firebaseService.js';
import { CONVERSATION_FLOWS, KEYWORDS } from '../config/dataServices.js';
import { 
  logEvent, 
  logIntentDetected, 
  logFlowStarted,
  logFirebaseWrite 
} from '../utils/eventLogger.js';
import { isFeatureEnabled } from '../utils/featureGating.js';

const MENU_BUTTONS = CONVERSATION_FLOWS.welcome.buttons;
const GREETINGS = KEYWORDS.greetings;

class ConversationManager {
  /**
   * Procesar mensaje entrante
   */
  async handleIncomingMessage(message, senderInfo, ctx) {
    const conversationStartTime = Date.now();
    const userId = message.from;
    const userPhone = senderInfo?.wa_id || userId;
    const session = sessionManager.getSession(userId);

    // Enriquecer contexto con datos de sesión
    ctx.addMetadata('currentFlow', session.currentFlow || 'none');
    ctx.addMetadata('historyCount', session.conversationHistory?.length || 0);
    
    logEvent('info', 'conversation.start', ctx, {
      userPhone,
      hasActiveFlow: !!session.currentFlow
    });

    // Guardar teléfono en metadata
    sessionManager.setMetadata(userId, 'phone', userPhone, ctx.traceId);

    // Guardar en historial
    if (message.type === 'text') {
      const text = message.text.body;
      logEvent('debug', 'conversation.user_message', ctx, { 
        textPreview: text.substring(0, 100) 
      });
      sessionManager.addToHistory(userId, 'user', text, ctx.traceId);

      // Persistir conversación en Firebase (usuario) - GATED: memoryPersistent
      if (firebaseService && firebaseService.isFirebaseAvailable && ctx.req && isFeatureEnabled(ctx.req, 'memoryPersistent')) {
        ctx.startFirebaseOp();
        const fbStartTime = Date.now();
        
        try {
          const phone = sessionManager.getMetadata(userId, 'phone') || userPhone;
          await firebaseService.saveConversation({
            phoneNumber: phone,
            role: 'user',
            content: text,
            userId,
            traceId: ctx.traceId
          }, ctx.traceId);
          
          ctx.recordLatency('firebase_conversation', fbStartTime);
          logFirebaseWrite(ctx, 'saveConversation', true);
        } catch (err) {
          ctx.recordLatency('firebase_conversation', fbStartTime);
          logFirebaseWrite(ctx, 'saveConversation', false, err.code || 'UNKNOWN');
        }
      }
    } else if (message.type === 'interactive') {
      const buttonId = message.interactive?.button_reply?.id;
      logEvent('debug', 'conversation.button_click', ctx, { buttonId });
    }

    // Obtener nombre del cliente
    const clientName = this.getClientName(senderInfo);
    sessionManager.setMetadata(userId, 'clientName', clientName, ctx.traceId);

    // Actualizar perfil del cliente en Firebase (incrementa interacción y guarda nombre)
    ctx.startFirebaseOp();
    const fbProfileStartTime = Date.now();
    
    try {
      if (userPhone) {
        await firebaseService.saveClientProfile(userPhone, { firstName: clientName }, ctx.traceId);
        ctx.recordLatency('firebase_profile', fbProfileStartTime);
        logFirebaseWrite(ctx, 'saveClientProfile', true);
      }
    } catch (err) {
      ctx.recordLatency('firebase_profile', fbProfileStartTime);
      logFirebaseWrite(ctx, 'saveClientProfile', false, err.code || 'UNKNOWN');
    }

    // Manejar según tipo de flujo actual
    if (session.currentFlow) {
      logEvent('info', 'conversation.continue_flow', ctx, { flowName: session.currentFlow });
      return this.continueFlow(userId, message, session, ctx);
    }

    // Si no hay flujo activo, procesar como nuevo mensaje
    logEvent('info', 'conversation.new_message', ctx, {});
    return this.handleNewMessage(userId, message, clientName, ctx);
  }

  /**
   * Manejar mensaje nuevo (sin flujo activo)
   */
  async handleNewMessage(userId, message, clientName, ctx) {
    const messageId = message.id;

    if (message.type === 'text') {
      const text = message.text.body.toLowerCase().trim();
      logEvent('debug', 'conversation.text_analysis', ctx, { 
        textLength: text.length 
      });

      // Retomar conversación previa
      if (text.includes('continuar') || text.includes('retomar')) {
        logIntentDetected(ctx, 'resume_conversation');
        await whatsappService.markAsRead(messageId);
        const userPhone = sessionManager.getMetadata(userId, 'phone');

        let loaded = 0;
        if (userPhone) {
          const fbLoadStartTime = Date.now();
          ctx.startFirebaseOp();
          
          try {
            const history = await firebaseService.getUserConversations(userPhone, 8);
            ctx.recordLatency('firebase_load_history', fbLoadStartTime);
            logFirebaseWrite(ctx, 'getUserConversations', true);
            
            if (Array.isArray(history) && history.length > 0) {
              for (const msg of history) {
                const role = msg?.role || 'user';
                const content = msg?.content || '';
                sessionManager.addToHistory(userId, role, content, { source: 'firebase' }, ctx.traceId);
                loaded++;
              }
              
              logEvent('info', 'conversation.history_loaded', ctx, {
                messagesLoaded: loaded
              });
            }
          } catch (error) {
            ctx.recordLatency('firebase_load_history', fbLoadStartTime);
            logFirebaseWrite(ctx, 'getUserConversations', false, error.code || 'UNKNOWN');
          }
        }

        const resumeText = loaded > 0
          ? '👌 Listo, retomamos donde lo dejamos. ¿Qué te gustaría preguntar?'
          : 'No encontré conversación previa, igual te escucho. ¿Qué te gustaría preguntar?';
        await whatsappService.sendMessage(userId, resumeText);

        return assistantFlow.initiate(userId, ctx);
      }

      if (this.isGreeting(text)) {
        logIntentDetected(ctx, 'greeting');
        
        // Detectar servicio mencionado en el saludo inicial
        const detectedService = this.detectService(text);
        
        if (detectedService) {
          logEvent('info', 'conversation.service_detected', ctx, { 
            serviceName: detectedService.name,
            serviceKey: detectedService.key
          });
          await whatsappService.markAsRead(messageId);
          
          // Guardar servicio detectado en metadata
          sessionManager.setMetadata(userId, 'detectedService', detectedService, ctx.traceId);
          
          // Saludo rápido + iniciar cotización con contexto
          const quickGreeting = `¡Hola ${clientName}! 👋 Vi que te interesa *${detectedService.name}*. ¡Perfecto!\n\nCuéntame más detalles de tu proyecto para armar tu cotización 💰`;
          await whatsappService.sendMessage(userId, quickGreeting);
          
          // Iniciar flujo de cotización con servicio pre-cargado
          logFlowStarted(ctx, 'quotation', 'description');
          return quotationFlow.initiate(userId, detectedService, ctx);
        }
        
        // Bienvenida personalizada normal
        logEvent('info', 'conversation.greeting_standard', ctx, {});
        return this.sendWelcome(userId, messageId, clientName, ctx);
      }

      // Detectar solicitud de asesor/agente
      if (this.matchesKeywords(text, KEYWORDS.escalation)) {
        logIntentDetected(ctx, 'human_handoff');
        sessionManager.clearFlow(userId, ctx.traceId);
        await whatsappService.markAsRead(messageId);
        logFlowStarted(ctx, 'humanHandoff', 'initial');
        return humanHandoffFlow.initiate(userId, ctx);
      }

      // Verificar si es una selección de número (1, 2, 3, 4)
      if (KEYWORDS.menuOptions.includes(text)) {
        logIntentDetected(ctx, 'menu_number_selection', text);
        await whatsappService.markAsRead(messageId);
        return this.handleMenuOption(userId, text, ctx);
      }

      // Detectar intención de ventas antes de mostrar menú
      const salesIntent = detectSalesIntent(text);
      if (salesIntent.hasSalesIntent && salesIntent.confidence >= 0.7) {
        logIntentDetected(ctx, 'sales_intent', { 
          confidence: salesIntent.confidence,
          urgency: salesIntent.urgency 
        });
        await whatsappService.markAsRead(messageId);
        
        // Iniciar salesFlow con el contexto de req
        sessionManager.setFlow(userId, 'sales', { stage: 'scoring' }, ctx.traceId);
        logFlowStarted(ctx, 'sales', 'scoring');
        
        const salesResult = await handleSalesFlow(text, {}, ctx.req ? { aiService: ctx.req.aiService } : {});
        
        // Guardar sessionData del salesFlow
        if (salesResult.sessionData) {
          sessionManager.setMetadata(userId, 'salesFlowData', salesResult.sessionData, ctx.traceId);
        }
        
        // Enviar respuesta
        await whatsappService.sendMessage(userId, salesResult.message);
        
        // Manejar transiciones
        if (salesResult.nextFlow === 'appointment') {
          sessionManager.setFlow(userId, 'appointment', { stage: 'start' }, ctx.traceId);
          return appointmentFlow.initiate(userId, ctx);
        } else if (salesResult.nextFlow === 'humanHandoff') {
          sessionManager.setFlow(userId, 'humanHandoff', { stage: 'initial', priority: salesResult.metadata?.priority }, ctx.traceId);
          return humanHandoffFlow.initiate(userId, ctx);
        }
        
        return;
      }
      
      // Mensaje de texto sin contexto → solo mostrar menú si es realmente un nuevo usuario
      // No reenviar múltiples veces a usuarios que ya han interactuado
      logEvent('debug', 'conversation.no_context', ctx, {});
      const session = sessionManager.getSession(userId);
      
      // Si el usuario tiene historial pero no flujo activo, probablemente canceló algo
      if (session.conversationHistory.length > 0) {
        logEvent('info', 'conversation.session_restart_offer', ctx, { 
          historyLength: session.conversationHistory.length 
        });
        await whatsappService.markAsRead(messageId);
        const restartMessage = `Parece que tu sesión anterior se cerró.\n\nEscribe *hola* para comenzar de nuevo. 👋`;
        await whatsappService.sendMessage(userId, restartMessage);
        return;
      }

      // Nuevo usuario sin historial → mostrar menú
      logEvent('info', 'conversation.new_user_menu', ctx, {});
      await whatsappService.markAsRead(messageId);
      return this.showMainMenu(userId, ctx);
    }

    if (message.type === 'interactive') {
      // Usuario seleccionó botón del menú
      const option = message.interactive?.button_reply?.id?.toLowerCase();
      logEvent('info', 'conversation.button_selected', ctx, { option });
      await whatsappService.markAsRead(messageId);
      return this.handleMenuOption(userId, option, ctx);
    }
  }

  /**
   * Continuar flujo activo
   */
  async continueFlow(userId, message, session, ctx) {
    const messageId = message.id;

    // Si es un saludo mientras hay flujo activo, reiniciar
    if (message.type === 'text') {
      const text = message.text.body.toLowerCase().trim();
      if (this.isGreeting(text)) {
        logEvent('info', 'conversation.greeting_during_flow', ctx, { 
          currentFlow: session.currentFlow,
          action: 'reset_flow'
        });
        sessionManager.clearFlow(userId, ctx.traceId);
        await whatsappService.markAsRead(messageId);
        const clientName = sessionManager.getMetadata(userId, 'clientName') || 'amigo';
        return this.sendWelcome(userId, messageId, clientName, ctx);
      }
    }

    logEvent('info', 'conversation.delegate_to_flow', ctx, { 
      flowName: session.currentFlow 
    });

    switch (session.currentFlow) {
      case 'appointment':
        await whatsappService.markAsRead(messageId);
        return appointmentFlow.continueFlow(userId, message, ctx.traceId);

      case 'quotation':
        await whatsappService.markAsRead(messageId);
        return quotationFlow.continueFlow(userId, message, ctx.traceId);

      case 'assistant':
        await whatsappService.markAsRead(messageId);
        return assistantFlow.continueFlow(userId, message, ctx.traceId);

      case 'humanHandoff':
        await whatsappService.markAsRead(messageId);
        return humanHandoffFlow.continueFlow(userId, message, ctx.traceId);
      
      case 'sales':
        await whatsappService.markAsRead(messageId);
        // Continuar salesFlow con contexto previo
        const salesSessionData = sessionManager.getMetadata(userId, 'salesFlowData') || {};
        const salesResult = await handleSalesFlow(
          message.type === 'text' ? message.text.body : '', 
          salesSessionData,
          ctx.req ? { aiService: ctx.req.aiService } : {}
        );
        
        // Actualizar sessionData
        if (salesResult.sessionData) {
          sessionManager.setMetadata(userId, 'salesFlowData', salesResult.sessionData, ctx.traceId);
        }
        
        // Enviar respuesta
        await whatsappService.sendMessage(userId, salesResult.message);
        
        // Manejar transiciones
        if (salesResult.nextFlow === 'appointment') {
          sessionManager.setFlow(userId, 'appointment', { stage: 'start' }, ctx.traceId);
          return appointmentFlow.initiate(userId, ctx);
        } else if (salesResult.nextFlow === 'humanHandoff') {
          sessionManager.setFlow(userId, 'humanHandoff', { 
            stage: 'initial', 
            priority: salesResult.metadata?.priority 
          }, ctx.traceId);
          return humanHandoffFlow.initiate(userId, ctx);
        }
        
        return;

      default:
        logEvent('warn', 'conversation.unknown_flow', ctx, { 
          flowName: session.currentFlow 
        });
        sessionManager.clearFlow(userId, ctx.traceId);
        await whatsappService.markAsRead(messageId);
        return this.showMainMenu(userId, ctx);
    }
  }

  /**
   * Manejar selección de opción del menú
   */
  async handleMenuOption(userId, option, ctx) {
    const session = sessionManager.getSession(userId);

    // Mapeo de números a opciones (en caso que el usuario escriba números)
    const numberToOption = {
      '1': 'option_agenda',
      '2': 'option_quotation',
      '3': 'option_question',
    };

    // Si es un número, convertir a opción
    const mappedOption = numberToOption[option] || option;

    switch (mappedOption) {
      case 'option_agenda':
        logEvent('info', 'conversation.menu_selected', ctx, { 
          option: 'appointment',
          originalInput: option,
          mappedTo: mappedOption
        });
        const userPhone = sessionManager.getMetadata(userId, 'phone');
        logFlowStarted(ctx, 'appointment', 'initial');
        return appointmentFlow.initiate(userId, userPhone, null, ctx.traceId);

      case 'option_quotation':
        logEvent('info', 'conversation.menu_selected', ctx, { 
          option: 'quotation',
          originalInput: option,
          mappedTo: mappedOption
        });
        logFlowStarted(ctx, 'quotation', 'description');
        return quotationFlow.initiate(userId, null, ctx.traceId);

      case 'option_question':
        logEvent('info', 'conversation.menu_selected', ctx, { 
          option: 'assistant',
          originalInput: option,
          mappedTo: mappedOption
        });
        logFlowStarted(ctx, 'assistant', 'initial');
        return assistantFlow.initiate(userId, ctx.traceId);

      default:
        logEvent('warn', 'conversation.menu_option_invalid', ctx, { 
          option,
          mappedOption
        });
        await whatsappService.sendMessage(userId, '🤔 Mmm no entendí. Selecciona una de las opciones de arriba porfa');
        return this.showMainMenu(userId, ctx);
    }
  }

  /**
   * Enviar bienvenida personalizada
   * Carga perfil del cliente y sugiere retomar conversación si existe historial
   */
  async sendWelcome(userId, messageId, clientName, ctx) {
    try {
      logEvent('info', 'conversation.send_welcome', ctx, { clientName });
      
      // Obtener teléfono para buscar ClientProfile
      const userPhone = sessionManager.getMetadata(userId, 'phone');
      let greeting = `¡Hola ${clientName}! 👋`;
      let clientProfile = null;
      
      // Intentar cargar ClientProfile de Firebase
      if (userPhone) {
        ctx.startFirebaseOp();
        const fbProfileStartTime = Date.now();
        
        try {
          clientProfile = await firebaseService.getClientProfile(userPhone);
          ctx.recordLatency('firebase_get_profile', fbProfileStartTime);
          logFirebaseWrite(ctx, 'getClientProfile', true);
          
          if (clientProfile) {
            logEvent('info', 'conversation.client_profile_found', ctx, {
              phone: userPhone,
              interactionCount: clientProfile.interactionCount
            });
            
            // Personalizar saludo si es cliente recurrente
            if (clientProfile.interactionCount > 1) {
              greeting = `¡Bienvenido de vuelta, ${clientName}! 👋`;
              logEvent('info', 'conversation.returning_client', ctx, {
                interactionCount: clientProfile.interactionCount
              });
            }
            
            // Guardar perfil en metadata para disponibilidad en flujos
            sessionManager.setMetadata(userId, 'clientProfile', clientProfile, ctx.traceId);
          }
        } catch (error) {
          ctx.recordLatency('firebase_get_profile', fbProfileStartTime);
          logFirebaseWrite(ctx, 'getClientProfile', false, error.code || 'UNKNOWN');
          logEvent('warn', 'conversation.profile_load_failed', ctx, {
            error: error.message
          });
          // Continuar sin perfil (fallback)
        }
      }
      
      const welcomeText = `${greeting}\n\nSoy el asistente de Tech Tecnic. Transformamos ideas en experiencias digitales que generan resultados reales 🚀\n\n¿Qué necesitas?`;

      await whatsappService.markAsRead(messageId);
      console.log(`   ✅ Mensaje leído`);
      
      await whatsappService.sendMessage(userId, welcomeText);
      console.log(`   ✅ Texto de bienvenida enviado`);

      // Resumen breve y sugerencia de retomar si hay historial previo en Firebase
      if (userPhone) {
        ctx.startFirebaseOp();
        const fbHistoryStartTime = Date.now();
        
        try {
          const recentConvs = await firebaseService.getUserConversations(userPhone, 5);
          ctx.recordLatency('firebase_check_history', fbHistoryStartTime);
          logFirebaseWrite(ctx, 'getUserConversations', true);
          
          if (Array.isArray(recentConvs) && recentConvs.length > 0) {
            // Buscar el último mensaje del asistente
            const lastAssistant = [...recentConvs].reverse().find(c => (c?.role || '').toLowerCase() === 'assistant');
            const lastMsg = lastAssistant || recentConvs[recentConvs.length - 1];
            const preview = (lastMsg?.content || '').replace(/\s+/g, ' ').slice(0, 120);

            const summaryMsg = `🧠 *Resumen rápido:* "${preview}..."`;
            await whatsappService.sendMessage(userId, summaryMsg);

            const resumeMsg = `Si quieres retomar, escribe *continuar*.`;
            await whatsappService.sendMessage(userId, resumeMsg);

            sessionManager.setMetadata(userId, 'canResume', true);
            logEvent('info', 'conversation.history_preview_sent', ctx, {
              historyCount: recentConvs.length
            });
            console.log('   ✅ Resumen y sugerencia de retomar enviados');
          }
        } catch (error) {
          ctx.recordLatency('firebase_check_history', fbHistoryStartTime);
          logFirebaseWrite(ctx, 'getUserConversations', false, error.code || 'UNKNOWN');
          logEvent('warn', 'conversation.history_check_failed', ctx, {
            error: error.message
          });
          console.warn(`   ⚠️ No se pudo consultar historial previo: ${error.message}`);
        }
      }
      
      // Pequeño delay para asegurar que se procesa el mensaje anterior
      console.log(`   ⏳ Esperando 500ms antes de menú...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`   ✅ Delay completado`);
      
      await this.showMainMenu(userId, ctx);
    } catch (error) {
      logEvent('error', 'conversation.welcome_error', ctx, {
        error: error.message,
        stack: error.stack
      });
      console.error('Error en sendWelcome:', error);
      await whatsappService.sendMessage(userId, '❌ Ocurrió un error. Por favor intenta de nuevo.');
    }
  }

  /**
   * Mostrar menú principal
   */
  async showMainMenu(userId, ctx) {
    try {
      logEvent('info', 'conversation.show_menu', ctx, {});
      const menuText = '📋 Selecciona una opción:';
      const result = await whatsappService.sendInteractiveButtons(userId, menuText, MENU_BUTTONS);
      logEvent('info', 'conversation.menu_sent', ctx, {
        buttonCount: MENU_BUTTONS?.length || 0
      });
      return result;
    } catch (error) {
      logEvent('error', 'conversation.menu_error', ctx, {
        error: error.message,
        fallbackUsed: true
      });
      const fallbackMenu = `📌 *Selecciona una opción:*\n\n1️⃣ *Agendar Reunión* - Agenda una cita con nosotros\n\n2️⃣ *Solicitar Cotización* - Obtén una cotización personalizada\n\n3️⃣ *Hacer Consulta* - Haz una pregunta al asistente\n\n4️⃣ *Ver Portfolio* - Conoce nuestros proyectos\n\n(Responde con el número de la opción)`;
      await whatsappService.sendMessage(userId, fallbackMenu);
    }
  }

  /**
   * Enviar link de portfolio
   */
  async sendPortfolioLink(userId) {
    const message = '🎨 *Portfolio Tech Tecnic*\n\nMira algunos de nuestros proyectos exitosos:\nhttps://techtecnic.com/proyectos\n\n¿Necesitas algo similar? Estamos aquí para ayudarte.';
    await whatsappService.sendMessage(userId, message);
    return this.showMainMenu(userId);
  }

  /**
   * Cerrar sesión con despedida
   */
  async closeSession(userId, traceId) {
    logInfo('conversation.close_session', {}, traceId);
    const farewell = `¡Gracias por confiar en Tech Tecnic! 👋\n\nSi necesitas algo más, solo escribe *hola* para volver a comenzar.\n\n¡Que tengas un excelente día!`;
    sessionManager.clearFlow(userId, traceId);
    await whatsappService.sendMessage(userId, farewell);
  }

  /**
   * Validar si es un saludo
   */
  isGreeting(message) {
    return GREETINGS.some(greeting => message.includes(greeting));
  }

  /**
   * Obtener nombre del cliente
   */
  getClientName(senderInfo) {
    const fullName = senderInfo?.profile?.name || senderInfo?.wa_id || 'amigo';
    return fullName.split(' ')[0];
  }

  /**
   * Verificar si el texto coincide con lista de palabras clave
   */
  matchesKeywords(text, keywords) {
    if (!Array.isArray(keywords)) return false;
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Detectar servicio mencionado en el mensaje
   */
  detectService(text) {
    const services = KEYWORDS.services;
    
    for (const [serviceKey, keywords] of Object.entries(services)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return {
            key: serviceKey,
            name: this.getServiceDisplayName(serviceKey),
            keywords: keyword
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Obtener nombre display del servicio
   */
  getServiceDisplayName(serviceKey) {
    const names = {
      'desarrollo_web': 'Desarrollo Web',
      'ecommerce': 'E-commerce',
      'chatbot': 'Chatbot WhatsApp',
      'app_movil': 'App Móvil',
      'integraciones': 'Integraciones & APIs',
      'seo': 'SEO & Posicionamiento',
      'ia': 'Inteligencia Artificial',
      'mantenimiento': 'Mantenimiento Web'
    };
    return names[serviceKey] || serviceKey;
  }

  /**
   * Debug: obtener estado de sesión
   */
  getSessionDebug(userId) {
    return sessionManager.getSessionStatus(userId);
  }

  /**
   * Debug: obtener estadísticas globales
   */
  getGlobalStats() {
    return sessionManager.getStats();
  }
}

export default new ConversationManager();
