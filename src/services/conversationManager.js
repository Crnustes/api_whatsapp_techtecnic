/**
 * Conversation Manager
 * Orquesta los diferentes flujos conversacionales
 * Punto central de ruteo de mensajes
 */

import appointmentFlow from './conversationFlows/appointmentFlow.js';
import quotationFlow from './conversationFlows/quotationFlow.js';
import assistantFlow from './conversationFlows/assistantFlow.js';
import humanHandoffFlow from './conversationFlows/humanHandoffFlow.js';
import sessionManager from './sessionManager.js';
import whatsappService from './whatsappService.js';

const MENU_BUTTONS = [
  { type: 'reply', reply: { id: 'option_agenda', title: '📅 Agendar Reunión' } },
  { type: 'reply', reply: { id: 'option_quotation', title: '💰 Solicitar Cotización' } },
  { type: 'reply', reply: { id: 'option_question', title: '❓ Hacer Consulta' } },
  { type: 'reply', reply: { id: 'option_portfolio', title: '🎨 Ver Portfolio' } },
];

const GREETINGS = ['hola', 'hello', 'hi', 'buenos', 'buenas', 'hey', 'ey', 'que onda'];

class ConversationManager {
  /**
   * Procesar mensaje entrante
   */
  async handleIncomingMessage(message, senderInfo) {
    const userId = message.from;
    const session = sessionManager.getSession(userId);

    console.log(`\n👤 Usuario: ${userId}`);
    console.log(`   Flujo actual: ${session.currentFlow || 'ninguno'}`);

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

      if (text.includes('humano') || text.includes('agente') || text.includes('persona')) {
        // Usuario quiere hablar con un agente
        console.log(`   🎯 Solicitud de agente → escalando`);
        await whatsappService.markAsRead(messageId);
        return humanHandoffFlow.initiate(userId);
      }

      // Mensaje de texto sin contexto → enviar menú
      console.log(`   🎯 Mensaje sin contexto → mostrando menú`);
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

    switch (option) {
      case 'option_agenda':
        return appointmentFlow.initiate(userId);

      case 'option_quotation':
        return quotationFlow.initiate(userId);

      case 'option_question':
        return assistantFlow.initiate(userId);

      case 'option_portfolio':
        return this.sendPortfolioLink(userId);

      default:
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
      await whatsappService.sendMessage(userId, 'Opciones: 1. Agendar reunión, 2. Cotización, 3. Consulta, 4. Portfolio');
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
