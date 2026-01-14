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
    } else if (message.type === 'interactive') {
      const buttonId = message.interactive?.button_reply?.id;
      console.log(`   Botón: ${buttonId}`);
    }

    // Obtener nombre del cliente
    const clientName = this.getClientName(senderInfo);
    sessionManager.setMetadata(userId, 'clientName', clientName);

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
        await whatsappService.sendMessage(userId, 'Por favor, selecciona una opción válida (1, 2, 3 o 4)');
        return this.showMainMenu(userId);
    }
  }

  /**
   * Enviar bienvenida personalizada
   */
  async sendWelcome(userId, messageId, clientName) {
    try {
      console.log(`   👋 Enviando bienvenida para ${clientName}`);
      const welcomeText = `¡Hola ${clientName}! 👋\n\nBienvenido a Tech Tecnic, tu agencia de desarrollo web, móvil y automatización.\n\n¿En qué podemos ayudarte hoy?`;

      await whatsappService.markAsRead(messageId);
      console.log(`   ✅ Mensaje leído`);
      
      await whatsappService.sendMessage(userId, welcomeText);
      console.log(`   ✅ Texto de bienvenida enviado`);
      
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
    const message = '🎨 *Portfolio Tech Tecnic*\n\nMira algunos de nuestros proyectos:\nhttps://techtecnic.com/portafolio\n\n¿Necesitas algo específico? Estamos aquí para ayudarte.';
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
