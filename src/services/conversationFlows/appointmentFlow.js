/**
 * Appointment Flow
 * Flujo completo para agendar reuniones
 * Recopila: nombre, email, teléfono, servicio, descripción, fecha/hora
 */

import sessionManager from '../sessionManager.js';
import whatsappService from '../whatsappService.js';
import googleSheetsService from '../googleSheetsService.js';
import { validateEmail, normalizePhone, formatDateTime } from '../../utils/validators.js';

const APPOINTMENT_STEPS = {
  name: 'name',
  email: 'email',
  service: 'service',
  description: 'description',
  datetime: 'datetime',
  confirmation: 'confirmation'
};

// Servicio se solicita como texto libre con ejemplos
const SERVICE_EXAMPLES = [
  'Sitio web corporativo',
  'Tienda online',
  'App móvil iOS/Android',
  'Sistema de gestión',
  'Landing page',
  'Rediseño de sitio',
  'Consultoría técnica'
];

const CONFIRM_BUTTONS = [
  { type: 'reply', reply: { id: 'confirm_yes', title: 'Sí, confirmar' } },
  { type: 'reply', reply: { id: 'confirm_no', title: 'Cancelar' } },
];

class AppointmentFlow {
  /**
   * Iniciar flujo de agendamiento
   */
  async initiate(userId, userPhone = '') {
    sessionManager.setFlow(userId, 'appointment', {
      step: APPOINTMENT_STEPS.name,
      data: {
        phone: userPhone || userId // Usar teléfono de WhatsApp automáticamente
      }
    });

    const message = '📅 *Agendar Reunión*\n\nTe ayudaremos a agendar una llamada con nuestro equipo. ¿Cuál es tu nombre?';
    await whatsappService.sendMessage(userId, message);
  }

  /**
   * Continuar flujo
   */
  async continueFlow(userId, message) {
    const flowData = sessionManager.getFlowData(userId);
    const currentStep = flowData.step;

    if (message.type === 'text') {
      const userInput = message.text.body.trim();
      return this.processTextInput(userId, currentStep, userInput);
    }

    if (message.type === 'interactive') {
      const option = message.interactive?.button_reply?.id;
      return this.processButtonInput(userId, currentStep, option);
    }
  }

  /**
   * Procesar entrada de texto
   */
  async processTextInput(userId, currentStep, input) {
    switch (currentStep) {
      case APPOINTMENT_STEPS.name:
        return this.handleName(userId, input);

      case APPOINTMENT_STEPS.email:
        return this.handleEmail(userId, input);

      case APPOINTMENT_STEPS.service:
        return this.handleServiceText(userId, input);

      case APPOINTMENT_STEPS.description:
        return this.handleDescription(userId, input);

      case APPOINTMENT_STEPS.datetime:
        return this.handleDatetime(userId, input);

      default:
        sessionManager.clearFlow(userId);
        await whatsappService.sendMessage(userId, 'Proceso completado. Gracias por tu interés.');
    }
  }

  /**
   * Procesar entrada de botones
   */
  async processButtonInput(userId, currentStep, option) {
    switch (currentStep) {
      case APPOINTMENT_STEPS.confirmation:
        return this.handleConfirmation(userId, option);

      default:
        await whatsappService.sendMessage(userId, 'Por favor escribe tu respuesta.');
    }
  }

  /**
   * Manejar nombre
   */
  async handleName(userId, name) {
    if (name.length < 2) {
      await whatsappService.sendMessage(userId, '❌ Por favor, ingresa un nombre válido.');
      return;
    }

    sessionManager.updateFlowData(userId, {
      step: APPOINTMENT_STEPS.email,
      name: name
    });

    const message = `¡Gracias ${name}! 👌\n\nAhora, ¿cuál es tu correo electrónico?`;
    await whatsappService.sendMessage(userId, message);
  }

  /**
   * Manejar email
   */
  async handleEmail(userId, email) {
    if (!validateEmail(email)) {
      await whatsappService.sendMessage(userId, '❌ Por favor, ingresa un email válido (ej: correo@ejemplo.com)');
      return;
    }

    sessionManager.updateFlowData(userId, {
      step: APPOINTMENT_STEPS.service,
      email: email
    });

    await this.askForService(userId);
  }

  /**
   * Solicitar servicio como texto libre
   */
  async askForService(userId) {
    const examples = SERVICE_EXAMPLES.slice(0, 4).join('\n• ');
    const message = `🎯 *¿Qué servicio necesitas?*\n\nEscribe qué necesitas, por ejemplo:\n• ${examples}\n\nSi no estás seguro, escribe: *"no estoy seguro"*`;
    await whatsappService.sendMessage(userId, message);
  }

  /**
   * Manejar servicio como texto libre
   */
  async handleServiceText(userId, serviceText) {
    if (serviceText.length < 3) {
      await whatsappService.sendMessage(userId, '❌ Por favor, describe brevemente el servicio que necesitas (mínimo 3 caracteres).');
      return;
    }

    sessionManager.updateFlowData(userId, {
      step: APPOINTMENT_STEPS.description,
      service: serviceText
    });

    const message = `Perfecto, servicio: *${serviceText}* ✅\n\nAhora cuéntanos con más detalle qué necesitas o qué problema buscas resolver:`;
    await whatsappService.sendMessage(userId, message);
  }

  /**
   * Manejar descripción del proyecto
   */
  async handleDescription(userId, description) {
    if (description.length < 10) {
      await whatsappService.sendMessage(userId, '❌ Por favor, proporciona más detalles sobre tu proyecto (mínimo 10 caracteres).');
      return;
    }

    sessionManager.updateFlowData(userId, {
      step: APPOINTMENT_STEPS.datetime,
      description: description
    });

    const message = `📝 Perfecto.\n\n🗓️ *Selecciona una fecha y hora disponible:*\n\nPor favor, escribe en formato: DD/MM/YYYY HH:MM\n\nEjemplo: 15/01/2025 14:30`;
    await whatsappService.sendMessage(userId, message);
  }

  /**
   * Manejar fecha y hora
   */
  async handleDatetime(userId, datetimeStr) {
    const datetime = this.parseDateTime(datetimeStr);

    if (!datetime) {
      await whatsappService.sendMessage(userId, '❌ Formato inválido. Usa: DD/MM/YYYY HH:MM\n\nEjemplo: 15/01/2025 14:30');
      return;
    }

    sessionManager.updateFlowData(userId, {
      step: APPOINTMENT_STEPS.confirmation,
      datetime: datetime
    });

    return this.showConfirmation(userId);
  }

  /**
   * Mostrar resumen y confirmación
   */
  async showConfirmation(userId) {
    const flowData = sessionManager.getFlowData(userId);

    const summary = `
✅ *Resumen de tu Cita:*

👤 *Nombre:* ${flowData.name}
📧 *Email:* ${flowData.email}
🎯 *Servicio:* ${flowData.service}
📝 *Descripción:* ${flowData.description}
🗓️ *Fecha/Hora:* ${flowData.datetime}

¿Es correcto?
    `.trim();

    await whatsappService.sendMessage(userId, summary);
    await whatsappService.sendInteractiveButtons(
      userId,
      'Confirma tu cita:',
      CONFIRM_BUTTONS
    );
  }

  /**
   * Manejar confirmación final
   */
  async handleConfirmation(userId, option) {
    const flowData = sessionManager.getFlowData(userId);
    const conversationManager = (await import('../conversationManager.js')).default;

    if (option === 'confirm_no') {
      sessionManager.clearFlow(userId);
      await conversationManager.closeSession(userId);
      return;
    }

    if (option === 'confirm_yes') {
      // Guardar en Google Sheets con estructura correcta
      // [Timestamp, Nombre, Email, Teléfono, Empresa, Servicio, Descripción, Estado]
      const appointmentData = [
        new Date().toISOString(),
        flowData.name,
        flowData.email,
        flowData.phone || userId, // Teléfono de WhatsApp
        '', // Empresa (vacío por ahora)
        flowData.service,
        flowData.description,
        'pendiente'
      ];

      try {
        await googleSheetsService(appointmentData, 'reservas');

        const confirmMessage = `
🎉 *¡Cita Confirmada!*

Gracias ${flowData.name}, hemos registrado tu solicitud.

📧 Te enviaremos un email de confirmación a: ${flowData.email}

📞 En breve nuestro equipo te contactará.

¿Hay algo más en lo que podamos ayudarte?
        `.trim();

        sessionManager.clearFlow(userId);
        await whatsappService.sendMessage(userId, confirmMessage);

      } catch (error) {
        console.error('Error guardando cita:', error);
        await whatsappService.sendMessage(userId, '❌ Hubo un error. Por favor, intenta nuevamente.');
      }
    }
  }

  /**
   * Parsear fecha y hora
   */
  parseDateTime(input) {
    // Formato: DD/MM/YYYY HH:MM
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})$/;
    const match = input.trim().match(regex);

    if (!match) return null;

    const [, day, month, year, hours, minutes] = match;
    const date = new Date(year, month - 1, day, hours, minutes);

    if (isNaN(date.getTime())) return null;

    // Validar que la fecha sea futura
    if (date <= new Date()) {
      return null;
    }

    return date.toISOString();
  }
}

export default new AppointmentFlow();
