import config from '../config/env.js';
import messageHandler from '../services/messageHandler.js';

class WebhookController {
  async handleIncoming(req, res) {
    try {
      const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
      const senderInfo = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0];
      
      if (message && senderInfo) {
        console.log(`📩 Mensaje recibido de ${senderInfo.wa_id}:`, message.type);
        await messageHandler.handleIncomingMessage(message, senderInfo);
      } else {
        console.log('⚠️ Mensaje o senderInfo incompleto');
      }
      
      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Error en handleIncoming:', error);
      res.sendStatus(200); // Siempre responder 200 a WhatsApp
    }
  }

  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔐 Verificación webhook:', { mode, token: token ? '***' : 'none' });

    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      console.log('✅ Webhook verificado exitosamente!');
    } else {
      console.log('❌ Token webhook inválido');
      res.sendStatus(403);
    }
  }
}

export default new WebhookController();