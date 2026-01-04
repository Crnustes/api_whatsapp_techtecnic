/**
 * Message Handler
 * LEGACY - Ahora usa conversationManager.js
 * Este archivo se mantiene para compatibilidad
 */

import conversationManager from './conversationManager.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    // Delegar al nuevo conversationManager
    return conversationManager.handleIncomingMessage(message, senderInfo);
  }
}

export default new MessageHandler();