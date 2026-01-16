import config from '../config/env.js';
import messageHandler from '../services/messageHandler.js';
import sessionManager, { getMessageId } from '../services/sessionManager.js';
import { createTraceContext } from '../utils/traceContext.js';
import { logWebhookReceived, logWebhookProcessed, logEvent } from '../utils/eventLogger.js';

class WebhookController {
  async handleIncoming(req, res) {
    const webhookStartTime = Date.now();
    let ctx = null;
    
    try {
      const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
      const senderInfo = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0];
      
      if (message && senderInfo) {
        // Obtener messageId (usa WhatsApp ID o genera hash como fallback)
        const messageId = getMessageId(
          message.id,
          message.from,
          message.timestamp,
          message.text?.body || ''
        );
        
        // Crear contexto de trace con datos del webhook
        ctx = createTraceContext(message.from, messageId, {
          phone: senderInfo.wa_id,
          profileName: senderInfo.profile?.name,
          webhookTimestamp: req.body.entry?.[0]?.changes[0]?.value?.messages?.[0]?.timestamp
        });
        
        // Log de webhook recibido
        logWebhookReceived(ctx, message.type);
        
        // ✅ IDEMPOTENCIA: Verificar si mensaje ya fue procesado
        if (sessionManager.isDuplicateMessage(message.from, messageId)) {
          logEvent('warn', 'webhook.duplicate_message', ctx, {
            messageId,
            userId: message.from,
            lastProcessed: sessionManager.getLastProcessedMessage(message.from)
          });
          
          ctx.log('warn', 'webhook.duplicate_detected', {
            messageId,
            action: 'skip_processing'
          });
          
          ctx.recordLatency('webhook_total', webhookStartTime);
          ctx.end();
          
          // Responder 200 para que WhatsApp no reintente
          return res.sendStatus(200);
        }
        
        // ✅ Registrar este messageId como procesado
        sessionManager.recordProcessedMessage(message.from, messageId, ctx.traceId);
        logEvent('info', 'webhook.idempotence_check_passed', ctx, {
          messageId,
          userId: message.from
        });
        
        // Procesar mensaje con contexto
        await messageHandler.handleIncomingMessage(message, senderInfo, ctx);
        
        // Log de webhook procesado exitosamente
        ctx.recordLatency('webhook_total', webhookStartTime);
        logWebhookProcessed(ctx, true);
        ctx.end();
      } else {
        // Webhook incompleto - crear contexto mínimo
        ctx = createTraceContext('unknown', 'no-message-id', {
          hasMessage: !!message,
          hasSenderInfo: !!senderInfo,
          rawBody: JSON.stringify(req.body).substring(0, 200)
        });
        
        ctx.log('warn', 'webhook.incomplete', {
          reason: !message ? 'no_message' : 'no_sender_info'
        });
      }
      
      res.sendStatus(200);
    } catch (error) {
      // Error en procesamiento
      if (ctx) {
        ctx.log('error', 'webhook.processing_error', {
          error: error.message,
          stack: error.stack,
          latencyMs: Date.now() - webhookStartTime
        });
        logWebhookProcessed(ctx, false);
        ctx.end();
      } else {
        // Error antes de crear contexto
        console.error('❌ Fatal webhook error:', error);
      }
      
      res.sendStatus(200); // Siempre responder 200 a WhatsApp
    }
  }

  verifyWebhook(req, res) {
    // Contexto simple para verificación
    const ctx = createTraceContext('webhook-verify', 'verify', {
      mode: req.query['hub.mode'],
      hasToken: !!req.query['hub.verify_token']
    });
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    ctx.log('info', 'webhook.verify_attempt', {
      mode,
      tokenMatch: token === config.WEBHOOK_VERIFY_TOKEN
    });

    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      ctx.log('info', 'webhook.verify_success', {});
    } else {
      ctx.log('warn', 'webhook.verify_failed', {
        reason: mode !== 'subscribe' ? 'invalid_mode' : 'invalid_token'
      });
      res.sendStatus(403);
    }
    
    ctx.end();
  }
}

export default new WebhookController();