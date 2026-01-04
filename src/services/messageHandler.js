/**
 * Message Handler
 * LEGACY - Ahora usa conversationManager.js
 * Este archivo se mantiene para compatibilidad
 */

import conversationManager from './conversationManager.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    try {
      console.log(`\n📨 Procesando mensaje de ${senderInfo?.wa_id}`);
      console.log(`   Tipo: ${message.type}`);
      
      // Delegar al nuevo conversationManager
      const result = await conversationManager.handleIncomingMessage(message, senderInfo);
      
      console.log(`   ✅ Mensaje procesado`);
      return result;
    } catch (error) {
      console.error(`   ❌ Error procesando mensaje:`, error.message);
      throw error;
    }
  }
}

export default new MessageHandler();