/**
 * Assistant Flow
 * Flujo para consultas generales usando IA
 * Mantiene contexto de conversación y ofrece escalado a agentes
 * 
 * Configuración en:
 * - src/config/aiPrompts.js (ASSISTANT_DETAILED)
 * - src/config/dataServices.js (CONVERSATION_FLOWS.assistant)
 */

import sessionManager from '../sessionManager.js';
import whatsappService from '../whatsappService.js';
import aiAdapter from '../../adapters/aiAdapter.js';
import humanHandoffFlow from './humanHandoffFlow.js';
import escalationService from '../escalationService.js';
import { CONVERSATION_FLOWS } from '../../config/dataServices.js';

const ASSISTANT_STEPS = {
  question: 'question',
  feedback: 'feedback'
};

const FEEDBACK_BUTTONS = [
  { type: 'reply', reply: { id: 'feedback_yes', title: 'Fue util' } },
  { type: 'reply', reply: { id: 'feedback_another', title: 'Otra pregunta' } },
  { type: 'reply', reply: { id: 'feedback_agent', title: 'Hablar agente' } },
];

const NEXT_STEP_BUTTONS = [
  { type: 'reply', reply: { id: 'next_appointment', title: 'Agendar llamada' } },
  { type: 'reply', reply: { id: 'next_portfolio', title: 'Ver portafolio' } },
  { type: 'reply', reply: { id: 'next_end', title: 'Terminar' } },
];

class AssistantFlow {
  /**
   * Iniciar flujo de asistente
   */
  async initiate(userId) {
    const config = CONVERSATION_FLOWS.assistant;
    
    sessionManager.setFlow(userId, 'assistant', {
      step: ASSISTANT_STEPS.question,
      data: {
        questionCount: 0,
        maxQuestions: config.maxQuestions
      }
    });

    await whatsappService.sendMessage(userId, config.initMessage);
  }

  /**
   * Continuar flujo
   */
  async continueFlow(userId, message) {
    const flowData = sessionManager.getFlowData(userId);
    const currentStep = flowData.step;

    if (message.type === 'text') {
      const userInput = message.text.body.trim();
      // Si estamos en nextAction y recibe texto, ignorar
      if (currentStep === 'nextAction') {
        return;
      }
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
    const flowData = sessionManager.getFlowData(userId);
    const config = CONVERSATION_FLOWS.assistant;
    
    if (question.length < 5) {
      await whatsappService.sendMessage(userId, '❌ Por favor, formula una pregunta más clara.');
      return;
    }

    // Incrementar contador de preguntas
    flowData.questionCount = (flowData.questionCount || 0) + 1;
    sessionManager.updateFlowData(userId, flowData);

    // Mostrar que estamos procesando
    await whatsappService.sendMessage(userId, '⏳ Buscando la mejor respuesta...');

    try {
      // Obtener historial de conversación para contexto
      const history = sessionManager.getConversationContext(userId);

      // Generar respuesta con IA (ASSISTANT_DETAILED)
      const response = await aiAdapter.chatWithContext(
        history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        'ASSISTANT_DETAILED'
      );

      sessionManager.updateFlowData(userId, {
        step: ASSISTANT_STEPS.feedback,
        lastQuestion: question,
        lastResponse: response
      });

      // Enviar respuesta
      await whatsappService.sendMessage(userId, response);

      // Pedir feedback y verificar límite de preguntas
      this.showFeedbackButtons(userId);

    } catch (error) {
      console.error('Error en asistente:', error);
      await whatsappService.sendMessage(userId, '❌ Tuve un problema procesando tu pregunta. Por favor, intenta nuevamente.');
    }
  }

  /**
   * Mostrar botones de feedback
   */
  async showFeedbackButtons(userId) {
    const flowData = sessionManager.getFlowData(userId);
    const remainingQuestions = flowData.maxQuestions - flowData.questionCount;
    
    // Si no hay más preguntas disponibles, solo mostrar opción de escalada
    if (remainingQuestions <= 0) {
      // Registrar escalación automática por límite de preguntas
      if (escalationService.shouldEscalate(userId)) {
        try {
          console.log(`\n🚀 Registrando escalación automática (límite de preguntas) para usuario ${userId}...`);
          await escalationService.createEscalation(userId, 'Alta');
          console.log(`✅ Escalación registrada en Google Sheets`);
        } catch (error) {
          console.error(`❌ Error registrando escalación:`, error.message);
        }
      }

      const escalationMessage = `Has alcanzado el límite de 3 preguntas.\n\n👨‍💻 Conectándote con un especialista de Tech Tecnic que podrá ayudarte mejor...`;
      await whatsappService.sendMessage(userId, escalationMessage);
      sessionManager.clearFlow(userId);
      return humanHandoffFlow.initiate(userId);
    }

    // Si hay preguntas disponibles, mostrar opciones normales
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

      case 'next_appointment':
        await this.handleNextAppointment(userId);
        break;

      case 'next_portfolio':
        await this.handleNextPortfolio(userId);
        break;

      case 'next_end':
        await this.handleNextEnd(userId);
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
    const message = `¡Excelente! 👌\n\n¿Te gustaría hacer algo más?`;

    sessionManager.updateFlowData(userId, {
      step: 'nextAction'
    });

    await whatsappService.sendMessage(userId, message);
    await whatsappService.sendInteractiveButtons(userId, 'Elige una opción:', NEXT_STEP_BUTTONS);
  }

  /**
   * Manejar siguiente acción: agendar llamada
   */
  async handleNextAppointment(userId) {
    const appointmentFlow = (await import('./appointmentFlow.js')).default;
    sessionManager.clearFlow(userId);
    await appointmentFlow.initiate(userId);
  }

  /**
   * Manejar siguiente acción: ver portafolio
   */
  async handleNextPortfolio(userId) {
    const conversationManager = (await import('../conversationManager.js')).default;
    sessionManager.clearFlow(userId);
    await conversationManager.sendPortfolioLink(userId);
  }

  /**
   * Manejar siguiente acción: terminar
   */
  async handleNextEnd(userId) {
    const conversationManager = (await import('../conversationManager.js')).default;
    sessionManager.clearFlow(userId);
    await conversationManager.closeSession(userId);
  }

  /**
   * Manejar otra pregunta
   */
  async handleAnotherQuestion(userId) {
    const flowData = sessionManager.getFlowData(userId);
    const remainingQuestions = flowData.maxQuestions - flowData.questionCount;

    // Verificar si hay preguntas disponibles
    if (remainingQuestions <= 0) {
      console.log(`⚠️ Usuario ${userId} alcanzó límite de preguntas`);
      
      // Registrar escalación automática por límite de preguntas
      if (escalationService.shouldEscalate(userId)) {
        try {
          console.log(`\n🚀 Registrando escalación automática (límite alcanzado) para usuario ${userId}...`);
          await escalationService.createEscalation(userId, 'Alta');
          console.log(`✅ Escalación registrada en Google Sheets`);
        } catch (error) {
          console.error(`❌ Error registrando escalación:`, error.message);
        }
      }

      const escalationMessage = `Has alcanzado el límite de 3 preguntas.\n\n👨‍💻 Conectándote con un especialista de Tech Tecnic que podrá ayudarte mejor...`;
      await whatsappService.sendMessage(userId, escalationMessage);
      sessionManager.clearFlow(userId);
      return humanHandoffFlow.initiate(userId);
    }

    // Permitir siguiente pregunta
    sessionManager.updateFlowData(userId, {
      step: ASSISTANT_STEPS.question
    });

    let message = '✅ Adelante, ¿cuál es tu siguiente pregunta?';
    if (remainingQuestions === 1) {
      message += '\n\n(⚠️ Esta es tu última pregunta disponible)';
    } else {
      message += `\n\n(Preguntas restantes: ${remainingQuestions - 1})`;
    }
    
    await whatsappService.sendMessage(userId, message);
  }

  /**
   * Manejar escalado a agente humano
   */
  async handleEscalation(userId) {
    sessionManager.updateFlowData(userId, {
      step: 'humanHandoff'
    });

    // Verificar si debe registrarse una escalación
    if (escalationService.shouldEscalate(userId)) {
      try {
        console.log(`\n🚀 Registrando escalación para usuario ${userId}...`);
        await escalationService.createEscalation(userId, 'Media');
        console.log(`✅ Escalación registrada en Google Sheets`);
      } catch (error) {
        console.error(`❌ Error registrando escalación:`, error.message);
        // No interrumpir el flujo si falla el registro
      }
    }

    const message = `👤 *Te transferimos con un especialista.*\n\nUn agente experto revisará tu pregunta y te responderá en breve. Esperamos unos segundos...`;
    await whatsappService.sendMessage(userId, message);

    sessionManager.clearFlow(userId);

    // Llamar al flujo de transferencia humana
    await humanHandoffFlow.initiate(userId);
  }
}

export default new AssistantFlow();
