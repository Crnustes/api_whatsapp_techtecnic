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
import sessionManager from './sessionManager.js';
import whatsappService from './whatsappService.js';
import * as firebaseService from './firebaseService.js';
import { CONVERSATION_FLOWS, KEYWORDS } from '../config/dataServices.js';

const MENU_BUTTONS = CONVERSATION_FLOWS.welcome.buttons;
const GREETINGS = KEYWORDS.greetings;

class ConversationManager {
  /**
   * Procesar mensaje entrante
   */
  async handleIncomingMessage(message, senderInfo) {
    const userId = message.from;
    const userPhone = senderInfo?.wa_id || userId; // Capturar teléfono de WhatsApp
    const session = sessionManager.getSession(userId);

    console.log(`\n👤 Usuario: ${userId} (Tel: ${userPhone})`);
    console.log(`   Flujo actual: ${session.currentFlow || 'ninguno'}`);

    // Guardar teléfono en metadata
    sessionManager.setMetadata(userId, 'phone', userPhone);

    // Guardar en historial
    if (message.type === 'text') {
      const text = message.text.body;
      console.log(`   Mensaje: "${text}"`);
      sessionManager.addToHistory(userId, 'user', text);

      // Persistir conversación en Firebase (usuario)
      if (firebaseService && firebaseService.isFirebaseAvailable) {
        try {
          const phone = sessionManager.getMetadata(userId, 'phone') || userPhone;
          await firebaseService.saveConversation({
            phoneNumber: phone,
            role: 'user',
            content: text,
            userId,
          });
        } catch (err) {
          console.warn('   ⚠️ No se pudo guardar conversación (user):', err?.message || err);
        }
      }
    } else if (message.type === 'interactive') {
      const buttonId = message.interactive?.button_reply?.id;
      console.log(`   Botón: ${buttonId}`);
    }

    // Obtener nombre del cliente
    const clientName = this.getClientName(senderInfo);
    sessionManager.setMetadata(userId, 'clientName', clientName);

    // Actualizar perfil del cliente en Firebase (incrementa interacción y guarda nombre)
    try {
      if (userPhone) {
        await firebaseService.saveClientProfile(userPhone, { firstName: clientName });
      }
    } catch (err) {
      console.warn('   ⚠️ No se pudo actualizar ClientProfile:', err?.message || err);
    }

    // Manejar según tipo de flujo actual
    if (session.currentFlow) {
      console.log(`   → Continuando flujo: ${session.currentFlow}`);
      return this.continueFlow(userId, message, session);
    }

    // Si no hay flujo activo, procesar como nuevo mensaje
    console.log(`   → Procesando como nuevo mensaje`);
    return this.handleNewMessage(userId, message, clientName);
  }

  /**
   * Manejar mensaje nuevo (sin flujo activo)
   */
  async handleNewMessage(userId, message, clientName) {
    const messageId = message.id;

    if (message.type === 'text') {
      const text = message.text.body.toLowerCase().trim();
      console.log(`   → Mensaje de texto: "${text}"`);

      // Retomar conversación previa
      if (text.includes('continuar') || text.includes('retomar')) {
        console.log('   🎯 Solicitud de retomar conversación');
        await whatsappService.markAsRead(messageId);
        const userPhone = sessionManager.getMetadata(userId, 'phone');

        let loaded = 0;
        if (userPhone) {
          try {
            const history = await firebaseService.getUserConversations(userPhone, 8);
            if (Array.isArray(history) && history.length > 0) {
              for (const msg of history) {
                const role = msg?.role || 'user';
                const content = msg?.content || '';
                sessionManager.addToHistory(userId, role, content, { source: 'firebase' });
                loaded++;
              }
            }
          } catch (error) {
            console.warn(`   ⚠️ No se pudo cargar historial: ${error.message}`);
          }
        }

        const resumeText = loaded > 0
          ? '👌 Listo, retomamos donde lo dejamos. ¿Qué te gustaría preguntar?'
          : 'No encontré conversación previa, igual te escucho. ¿Qué te gustaría preguntar?';
        await whatsappService.sendMessage(userId, resumeText);

        return assistantFlow.initiate(userId);
      }

      if (this.isGreeting(text)) {
        // Bienvenida personalizada
        console.log(`   🎯 Es un saludo → enviando bienvenida`);
        return this.sendWelcome(userId, messageId, clientName);
      }

      // Detectar solicitud de asesor/agente
      if (this.matchesKeywords(text, KEYWORDS.escalation)) {
        console.log(`   🎯 Solicitud de asesor → escalando a humanHandoffFlow`);
        sessionManager.clearFlow(userId);
        await whatsappService.markAsRead(messageId);
        return humanHandoffFlow.initiate(userId);
      }

      // Verificar si es una selección de número (1, 2, 3, 4)
      if (KEYWORDS.menuOptions.includes(text)) {
        console.log(`   🎯 Selección de menú por número: ${text}`);
        await whatsappService.markAsRead(messageId);
        return this.handleMenuOption(userId, text);
      }

      // Mensaje de texto sin contexto → solo mostrar menú si es realmente un nuevo usuario
      // No reenviar múltiples veces a usuarios que ya han interactuado
      console.log(`   🎯 Mensaje sin contexto`);
      const session = sessionManager.getSession(userId);
      
      // Si el usuario tiene historial pero no flujo activo, probablemente canceló algo
      if (session.conversationHistory.length > 0) {
        console.log(`   → Usuario con historial pero sin flujo → ofreciendo reiniciar`);
        await whatsappService.markAsRead(messageId);
        const restartMessage = `Parece que tu sesión anterior se cerró.\n\nEscribe *hola* para comenzar de nuevo. 👋`;
        await whatsappService.sendMessage(userId, restartMessage);
        return;
      }

      // Nuevo usuario sin historial → mostrar menú
      console.log(`   → Nuevo usuario → mostrando menú`);
      await whatsappService.markAsRead(messageId);
      return this.showMainMenu(userId);
    }

    if (message.type === 'interactive') {
      // Usuario seleccionó botón del menú
      const option = message.interactive?.button_reply?.id?.toLowerCase();
      console.log(`   🎯 Botón seleccionado: ${option}`);
      await whatsappService.markAsRead(messageId);
      return this.handleMenuOption(userId, option);
    }
  }

  /**
   * Continuar flujo activo
   */
  async continueFlow(userId, message, session) {
    const messageId = message.id;

    // Si es un saludo mientras hay flujo activo, reiniciar
    if (message.type === 'text') {
      const text = message.text.body.toLowerCase().trim();
      if (this.isGreeting(text)) {
        console.log(`   ✳️ Saludo detectado en flujo ${session.currentFlow}`);
        sessionManager.clearFlow(userId);
        await whatsappService.markAsRead(messageId);
        const clientName = sessionManager.getMetadata(userId, 'clientName') || 'amigo';
        console.log(`   → Reiniciando flujo y mostrando bienvenida`);
        return this.sendWelcome(userId, messageId, clientName);
      }
    }

    console.log(`   → Delegando a flujo específico: ${session.currentFlow}`);

    switch (session.currentFlow) {
      case 'appointment':
        await whatsappService.markAsRead(messageId);
        return appointmentFlow.continueFlow(userId, message);

      case 'quotation':
        await whatsappService.markAsRead(messageId);
        return quotationFlow.continueFlow(userId, message);

      case 'assistant':
        await whatsappService.markAsRead(messageId);
        return assistantFlow.continueFlow(userId, message);

      case 'humanHandoff':
        await whatsappService.markAsRead(messageId);
        return humanHandoffFlow.continueFlow(userId, message);

      default:
        console.log(`   ⚠️ Flujo desconocido: ${session.currentFlow}`);
        sessionManager.clearFlow(userId);
        await whatsappService.markAsRead(messageId);
        return this.showMainMenu(userId);
    }
  }

  /**
   * Manejar selección de opción del menú
   */
  async handleMenuOption(userId, option) {
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
        console.log(`   Usuario seleccionó: Agendar Reunion`);
        const userPhone = sessionManager.getMetadata(userId, 'phone');
        return appointmentFlow.initiate(userId, userPhone);

      case 'option_quotation':
        console.log(`   Usuario seleccionó: Solicitar Cotizacion`);
        return quotationFlow.initiate(userId);

      case 'option_question':
        console.log(`   Usuario seleccionó: Hacer Consulta`);
        return assistantFlow.initiate(userId);

      default:
        console.log(`   ⚠️ Opción no reconocida: "${option}"`);
        await whatsappService.sendMessage(userId, '🤔 Mmm no entendí. Selecciona una de las opciones de arriba porfa');
        return this.showMainMenu(userId);
    }
  }

  /**
   * Enviar bienvenida personalizada
   * Carga perfil del cliente y sugiere retomar conversación si existe historial
   */
  async sendWelcome(userId, messageId, clientName) {
    try {
      console.log(`   👋 Enviando bienvenida para ${clientName}`);
      
      // Obtener teléfono para buscar ClientProfile
      const userPhone = sessionManager.getMetadata(userId, 'phone');
      let greeting = `¡Hola ${clientName}! 👋`;
      let clientProfile = null;
      
      // Intentar cargar ClientProfile de Firebase
      if (userPhone) {
        try {
          clientProfile = await firebaseService.getClientProfile(userPhone);
          
          if (clientProfile) {
            console.log(`   📊 ClientProfile encontrado para ${userPhone}`);
            console.log(`      Nombre: ${clientProfile.name}, Interacciones: ${clientProfile.interactionCount}`);
            
            // Personalizar saludo si es cliente recurrente
            if (clientProfile.interactionCount > 1) {
              greeting = `¡Bienvenido de vuelta, ${clientName}! 👋`;
              console.log(`   ✨ Cliente recurrente detectado (${clientProfile.interactionCount} interacciones)`);
            }
            
            // Guardar perfil en metadata para disponibilidad en flujos
            sessionManager.setMetadata(userId, 'clientProfile', clientProfile);
          }
        } catch (error) {
          console.warn(`   ⚠️ No se pudo cargar ClientProfile: ${error.message}`);
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
        try {
          const recentConvs = await firebaseService.getUserConversations(userPhone, 5);
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
            console.log('   ✅ Resumen y sugerencia de retomar enviados');
          }
        } catch (error) {
          console.warn(`   ⚠️ No se pudo consultar historial previo: ${error.message}`);
        }
      }
      
      // Pequeño delay para asegurar que se procesa el mensaje anterior
      console.log(`   ⏳ Esperando 500ms antes de menú...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`   ✅ Delay completado`);
      
      await this.showMainMenu(userId);
    } catch (error) {
      console.error('Error en sendWelcome:', error);
      await whatsappService.sendMessage(userId, '❌ Ocurrió un error. Por favor intenta de nuevo.');
    }
  }

  /**
   * Mostrar menú principal
   */
  async showMainMenu(userId) {
    try {
      console.log(`   📋 Enviando menú principal a ${userId}`);
      const menuText = '📌 Selecciona una opción:';
      const result = await whatsappService.sendInteractiveButtons(userId, menuText, MENU_BUTTONS);
      console.log(`   ✅ Menú enviado exitosamente`);
      return result;
    } catch (error) {
      console.error(`   ❌ Error mostrando menú:`, error.message);
      console.log(`   → Enviando menú fallback (texto)`);
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
  async closeSession(userId) {
    const farewell = `¡Gracias por confiar en Tech Tecnic! 👋\n\nSi necesitas algo más, solo escribe *hola* para volver a comenzar.\n\n¡Que tengas un excelente día!`;
    sessionManager.clearFlow(userId);
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
