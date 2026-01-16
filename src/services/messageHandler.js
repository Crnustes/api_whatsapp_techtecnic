/**
 * Message Handler
 * LEGACY - Ahora usa conversationManager.js
 * Este archivo se mantiene para compatibilidad
 */

import conversationManager from './conversationManager.js';
import { logEvent } from '../utils/eventLogger.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo, ctx) {
    try {
      logEvent('info', 'messageHandler.processing', ctx, {
        messageType: message.type
      });
      
      // Delegar al nuevo conversationManager
      const result = await conversationManager.handleIncomingMessage(message, senderInfo, ctx);
      
      logEvent('info', 'messageHandler.processed', ctx, {});
      return result;
    } catch (error) {
      logEvent('error', 'messageHandler.error', ctx, {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

export default new MessageHandler();