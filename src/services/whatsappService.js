import sendToWhatsApp from './httpRequest/sendToWhatsApp.js';

class WhatsAppService {
  async sendMessage(to, body, messageId) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      text: { body },
    };
    await sendToWhatsApp(data);
  }

  async markAsRead(messageId) {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };
    try {
      await sendToWhatsApp(data);
    } catch (error) {
      // Si es 401/403 por token inválido, no romper el flujo principal
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        console.warn('markAsRead skipped (auth issue). Revisa API_TOKEN / permisos de WhatsApp.');
        return;
      }
      throw error;
    }
  }

  async sendInteractiveButtons(to, bodyText, buttons) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons },
      },
    };
    await sendToWhatsApp(data);
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    const mediaObject = {};
    switch (type) {
      case 'image':
        mediaObject.image = { link: mediaUrl, caption: caption || '' };
        break;
      case 'audio':
        mediaObject.audio = { link: mediaUrl };
        break;
      case 'video':
        mediaObject.video = { link: mediaUrl, caption: caption || '' };
        break;
      case 'document':
        mediaObject.document = { link: mediaUrl, caption, filename: 'Servicios Tech Tecnic' };
        break;
      default:
        throw new Error('No hay soporte para este tipo de medio');
    }

    const data = {
      messaging_product: 'whatsapp',
      to,
      type,
      ...mediaObject,
    };
    await sendToWhatsApp(data);
  }
}

export default new WhatsAppService();