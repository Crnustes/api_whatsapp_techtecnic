import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import openAiService from './openAiService.js';

const GREETINGS = ['hola', 'hello', 'hi', 'buenas tardes'];

const MENU_BUTTONS = [
  { type: 'reply', reply: { id: 'option_1', title: 'Agendar llamada' } },
  { type: 'reply', reply: { id: 'option_2', title: 'Hacer consulta' } },
  { type: 'reply', reply: { id: 'option_3', title: 'Ver portafolio' } },
];

const ASSISTANT_FEEDBACK_BUTTONS = [
  { type: 'reply', reply: { id: 'option_yes', title: 'Sí' } },
  { type: 'reply', reply: { id: 'option_6', title: 'Hacer otra pregunta' } },
  { type: 'reply', reply: { id: 'option_no', title: 'No' } },
];

class MessageHandler {

  constructor() {
    this.appointmentState = {};
    this.assistantState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(message.from, message.id, senderInfo);
        await this.sendWelcomeMenu(message.from);
      } else if (incomingMessage === 'media') {
        await this.sendMedia(message.from);
      } else if (this.appointmentState[message.from]) {
        await this.handleAppointmentFlow(message.from, incomingMessage);
      } else if (this.assistantState[message.from]) {
        await this.handleAssistantFlow(message.from, incomingMessage);
      } else {
        await this.handleMenuOption(message.from, incomingMessage);
      }
      await whatsappService.markAsRead(message.id);
    } else if (message?.type === 'interactive') {
      const option = message?.interactive?.button_reply?.id?.toLowerCase();
      await this.handleMenuOption(message.from, option);
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message) {
    return GREETINGS.includes(message);
  }

  getSenderName(senderInfo) {
    const fullName = senderInfo.profile?.name || senderInfo.wa_id || 'amigo';
    return fullName.split(' ')[0];
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `Hola ${name}, somos Tech Tecnic (agencia de desarrollo). ¿En qué podemos ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una opción";
    await whatsappService.sendInteractiveButtons(to, menuMessage, MENU_BUTTONS);
  }

  async handleMenuOption(to, option) {
    const normalized = this.normalizeOption(option);

    let response;
    switch (normalized) {
      case 'option_1':
        this.appointmentState[to] = { step: 'name' };
        response = "Genial, ¿cuál es tu nombre?";
        break;
      case 'option_2':
        this.assistantState[to] = { step: 'question' };
        response = "Cuéntame tu consulta o duda y te respondo al instante.";
        break;
      case 'option_3': 
        response = 'Aquí puedes ver algunos proyectos: https://techtecnic.com/portafolio';
        break;
      default: 
        response = "No entendí tu selección. Elige una de las opciones del menú.";
    }
    await whatsappService.sendMessage(to, response);
  }

  normalizeOption(option) {
    if (!option) return option;
    const opt = option.toLowerCase();
    if (opt.startsWith('option_')) return opt;
    if (opt === 'agendar llamada') return 'option_1';
    if (opt === 'hacer consulta') return 'option_2';
    if (opt === 'ver portafolio') return 'option_3';
    return opt;
  }

  async sendMedia(to) {
    const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf';
    const caption = '¡Esto es un PDF!';
    const type = 'document';

    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  completeAppointment(to) {
    const appointment = this.appointmentState[to];
    delete this.appointmentState[to];

    const userData = [ 
    to,
      appointment.name,
      appointment.company,
      appointment.projectType,
      appointment.requirement,
      new Date().toISOString()
    ]
    
    appendToSheet(userData);

    return `Gracias ${appointment.name}. Registramos tu solicitud para ${appointment.company || 'tu empresa'} sobre ${appointment.projectType}. En breve te contactaremos respecto a: "${appointment.requirement}".`; 
  }

  async handleAppointmentFlow(to, message) {
    const state = this.appointmentState[to];
    let response;

    switch (state.step) {
      case 'name':
        state.name = message;
        state.step = 'company';
        response = "¿Cuál es el nombre de tu empresa o marca?";
        break;
      case 'company':
        state.company = message;
        state.step = 'projectType';
        response = '¿Qué tipo de proyecto necesitas? (web, móvil, ecommerce, automatización, otro)';
        break;
      case 'projectType':
        state.projectType = message;
        state.step = 'requirement';
        response = 'Cuéntanos brevemente el alcance o necesidad principal:';
        break;
      case 'requirement':
        state.requirement = message;
        response = this.completeAppointment(to);
        break;
    }
    await whatsappService.sendMessage(to, response);
  }

  async handleAssistantFlow(to, message) {
    const state = this.assistantState[to];
    if (!state) return;

    let response;
    const menuMessage = "La respuesta fue de tu ayuda?";

    if (state.step === 'question') {
      response = await openAiService(message);
    }

    delete this.assistantState[to];
    if (response) {
      await whatsappService.sendMessage(to, response);
    }
    await whatsappService.sendInteractiveButtons(to, menuMessage, ASSISTANT_FEEDBACK_BUTTONS);
  }

}

export default new MessageHandler();