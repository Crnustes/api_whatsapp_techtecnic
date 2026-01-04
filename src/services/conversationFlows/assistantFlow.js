/**
 * Assistant Flow
 * Flujo para consultas generales usando OpenAI
 * Mantiene contexto de conversación y ofrece escalado a agentes
 */

import sessionManager from '../sessionManager.js';
import whatsappService from '../whatsappService.js';
import openAiService from '../openAiService.js';

const ASSISTANT_STEPS = {
  question: 'question',
  feedback: 'feedback'
};

const FEEDBACK_BUTTONS = [
  { type: 'reply', reply: { id: 'feedback_yes', title: '👍 Sí, fue útil' } },
  { type: 'reply', reply: { id: 'feedback_another', title: '❓ Otra pregunta' } },
  { type: 'reply', reply: { id: 'feedback_agent', title: '👤 Hablar con agente' } },
];

class AssistantFlow {
  /**
   * Iniciar flujo de asistente
   */
  async initiate(userId) {
    sessionManager.setFlow(userId, 'assistant', {
      step: ASSISTANT_STEPS.question,
      data: {}
    });

    const message = `❓ *Asistente Tech Tecnic*\n\n¿Qué pregunta tienes sobre nuestros servicios, tecnología o proyectos?`;
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
      return this.processQuestion(userId, userInput);
    }

    if (message.type === 'interactive') {
      const option = message.interactive?.button_reply?.id;
      return this.processFeedback(userId, option);
    }
  }

  /**
   * Procesar pregunta del usuario
   */
  async processQuestion(userId, question) {
    if (question.length < 5) {
      await whatsappService.sendMessage(userId, '❌ Por favor, formula una pregunta más clara.');
      return;
    }

    // Mostrar que estamos procesando
    await whatsappService.sendMessage(userId, '⏳ Buscando la mejor respuesta...');

    try {
      // Obtener historial de conversación para contexto
      const history = sessionManager.getConversationContext(userId);

      // Generar respuesta con OpenAI
      const response = await this.getAssistantResponse(question, history);

      sessionManager.updateFlowData(userId, {
        step: ASSISTANT_STEPS.feedback,
        lastQuestion: question,
        lastResponse: response
      });

      // Enviar respuesta
      await whatsappService.sendMessage(userId, response);

      // Pedir feedback
      this.showFeedbackButtons(userId);

    } catch (error) {
      console.error('Error en asistente:', error);
      await whatsappService.sendMessage(userId, '❌ Tuve un problema procesando tu pregunta. Por favor, intenta nuevamente.');
    }
  }

  /**
   * Obtener respuesta de OpenAI con contexto
   */
  async getAssistantResponse(question, history) {
    // Construir mensajes con contexto
    const messages = [
      {
        role: 'system',
        content: `Eres el Asistente IA de Tech Tecnic, una agencia de desarrollo especializada en:
• Desarrollo Web (React, Next.js, Vue.js)
• Aplicaciones Móviles (React Native, Flutter)
• Ecommerce (Shopify, WooCommerce, soluciones custom)
• Automatización y APIs
• Integración de sistemas

Debes ser:
- Profesional pero accesible
- Conciso (máximo 3-4 líneas en WhatsApp)
- Práctico y directo
- Honesto sobre limitaciones
- Proactivo en sugerir soluciones

Si el usuario quiere información que no tienes, sugiere agendar una llamada.
Si necesita hablar con un especialista, ofrécelo siempre como opción.`
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: question
      }
    ];

    return await openAiService(messages);
  }

  /**
   * Mostrar botones de feedback
   */
  async showFeedbackButtons(userId) {
    const feedbackMessage = '¿Te fue útil la respuesta?';
    await whatsappService.sendInteractiveButtons(userId, feedbackMessage, FEEDBACK_BUTTONS);
  }

  /**
   * Procesar feedback del usuario
   */
  async processFeedback(userId, option) {
    const flowData = sessionManager.getFlowData(userId);

    switch (option) {
      case 'feedback_yes':
        await this.handlePositiveFeedback(userId);
        break;

      case 'feedback_another':
        await this.handleAnotherQuestion(userId);
        break;

      case 'feedback_agent':
        await this.handleEscalation(userId);
        break;

      default:
        sessionManager.clearFlow(userId);
        await whatsappService.sendMessage(userId, 'Proceso finalizado.');
    }
  }

  /**
   * Manejar feedback positivo
   */
  async handlePositiveFeedback(userId) {
    const message = `¡Excelente! 👌\n\n¿Te gustaría:\n1️⃣ Agendar una llamada con nuestro equipo\n2️⃣ Ver nuestro portafolio\n3️⃣ Terminar`;

    sessionManager.clearFlow(userId);
    await whatsappService.sendMessage(userId, message);

    // Aquí podrías mostrar opciones adicionales
    // pero por simplicidad terminamos el flujo
  }

  /**
   * Manejar otra pregunta
   */
  async handleAnotherQuestion(userId) {
    sessionManager.updateFlowData(userId, {
      step: ASSISTANT_STEPS.question
    });

    const message = '✅ Adelante, ¿cuál es tu siguiente pregunta?';
    await whatsappService.sendMessage(userId, message);
  }

  /**
   * Manejar escalado a agente humano
   */
  async handleEscalation(userId) {
    sessionManager.updateFlowData(userId, {
      step: 'humanHandoff'
    });

    const message = `👤 *Te transferimos con un especialista.*\n\nUn agente experto revisará tu pregunta y te responderá en breve. Esperamos unos segundos...`;
    await whatsappService.sendMessage(userId, message);

    sessionManager.clearFlow(userId);

    // Aquí irá la lógica de escalado (en humanHandoffFlow)
    // Importar y llamar cuando esté implementado
  }
}

export default new AssistantFlow();
