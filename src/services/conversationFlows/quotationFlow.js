/**
 * Quotation Flow - Mejorado con IA
 * Flujo inteligente de cotizaciones sin mostrar precios aún
 * Usa IA para analizar necesidades y recomendar el mejor plan
 * 
 * Configuración en: src/config/dataServices.js (CONVERSATION_FLOWS.quotation)
 */

import sessionManager from '../sessionManager.js';
import whatsappService from '../whatsappService.js';
import aiAdapter from '../../adapters/aiAdapter.js';
import googleSheetsService from '../googleSheetsService.js';
import { CONVERSATION_FLOWS } from '../../config/dataServices.js';

const QUOTATION_STEPS = {
  description: 'description',
  confirmation: 'confirmation'
};

const CONFIRM_BUTTONS = [
  { type: 'reply', reply: { id: 'cotiz_yes', title: 'Si, contactar' } },
  { type: 'reply', reply: { id: 'cotiz_no', title: 'Cancelar' } },
];

// Obtener planes de configuración
const PLANS = CONVERSATION_FLOWS.quotation.plans;

class QuotationFlow {
  /**
   * Iniciar flujo de cotización
   */
  async initiate(userId) {
    const config = CONVERSATION_FLOWS.quotation;
    
    sessionManager.setFlow(userId, 'quotation', {
      step: QUOTATION_STEPS.description,
      data: {}
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
      case QUOTATION_STEPS.description:
        return this.handleDescription(userId, input);

      default:
        sessionManager.clearFlow(userId);
        await whatsappService.sendMessage(userId, 'Cotización completada.');
    }
  }

  /**
   * Procesar entrada de botones
   */
  async processButtonInput(userId, currentStep, option) {
    switch (currentStep) {
      case QUOTATION_STEPS.confirmation:
        return this.handleConfirmation(userId, option);

      default:
        await whatsappService.sendMessage(userId, 'Por favor escribe tu respuesta.');
    }
  }

  /**
   * Manejar descripción del proyecto
   */
  async handleDescription(userId, description) {
    if (description.length < 10) {
      await whatsappService.sendMessage(userId, '❌ Por favor, proporciona más detalles sobre tu proyecto (mínimo 10 caracteres).');
      return;
    }

    // Mostrar mensaje de análisis
    await whatsappService.sendMessage(userId, '🤖 Analizando tu proyecto con IA...\n\nUn momento por favor...');

    // Analizar con OpenAI
    const recommendation = await this.analyzeProjectWithAI(description);

    if (!recommendation) {
      await whatsappService.sendMessage(userId, '❌ Hubo un error en el análisis. Por favor, intenta nuevamente.');
      return;
    }

    // Guardar datos
    sessionManager.updateFlowData(userId, {
      step: QUOTATION_STEPS.confirmation,
      description: description,
      recommendedPlan: recommendation.planKey,
      analysis: recommendation.analysis,
      features: recommendation.features
    });

    // Mostrar recomendación
    await this.showRecommendation(userId, recommendation);
  }

  /**
   * Analizar proyecto con OpenAI
   */
  async analyzeProjectWithAI(projectDescription) {
    const systemPrompt = `Eres un asesor técnico experto en desarrollo web y móvil de Tech Tecnic.

Basándote en la descripción del proyecto del cliente, debes:
1. Analizar qué tipo de solución necesita
2. Recomendar el plan más adecuado de estos 4:
   - emprendedor: Landing page, sitio básico (1-2 secciones)
   - profesional: Sitio completo (3-5 secciones), SEO, blog
   - avanzado: E-commerce, integraciones IA, apps complejas
   - partner: Agencias, white-label, proyectos enterprise

3. Explicar POR QUÉ ese plan es el mejor para su proyecto
4. Listar 3-5 características clave que se incluirían

Responde SOLO en formato JSON:
{
  "planKey": "emprendedor|profesional|avanzado|partner",
  "analysis": "Explicación de por qué este plan es ideal (2-3 frases)",
  "features": ["característica 1", "característica 2", "característica 3"]
}

NO menciones precios. Solo enfócate en la solución técnica ideal.`;

    const userPrompt = `Proyecto del cliente:\n\n${projectDescription}`;

    try {
      const response = await aiAdapter.chat(
        'QUOTATION_GENERATOR',
        userPrompt
      );

      if (!response) return null;

      // Extraer JSON de la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validar que el plan existe
      if (!PLANS[parsed.planKey]) {
        parsed.planKey = 'profesional'; // Default
      }

      return parsed;
    } catch (error) {
      console.error('Error analyzing with IA:', error);
      return null;
    }
  }

  /**
   * Mostrar recomendación personalizada
   */
  async showRecommendation(userId, recommendation) {
    const plan = PLANS[recommendation.planKey];
    const features = recommendation.features.map(f => `✓ ${f}`).join('\n');

    const message = `✨ *Recomendación Personalizada*

🎯 *${plan.name}*
Ideal para: ${plan.ideal}

📋 *Por qué este plan:*
${recommendation.analysis}

🔧 *Características clave para tu proyecto:*
${features}

💡 *Lo que incluye este plan:*
${plan.includes.slice(0, 5).map(i => `• ${i}`).join('\n')}

¿Te gustaría que un especialista te contacte para discutir los detalles y presupuesto?`;

    await whatsappService.sendMessage(userId, message);
    await whatsappService.sendInteractiveButtons(
      userId,
      'Confirma tu interes:',
      CONFIRM_BUTTONS
    );
  }

  /**
   * Manejar confirmación
   */
  async handleConfirmation(userId, option) {
    const flowData = sessionManager.getFlowData(userId);
    const conversationManager = (await import('../conversationManager.js')).default;

    if (option === 'cotiz_no') {
      sessionManager.clearFlow(userId);
      await conversationManager.closeSession(userId);
      return;
    }

    if (option === 'cotiz_yes') {
      const clientName = sessionManager.getMetadata(userId, 'clientName');
      const userPhone = sessionManager.getMetadata(userId, 'phone');
      const plan = PLANS[flowData.recommendedPlan];

      // Guardar en Google Sheets
      // [Timestamp, Email, Cliente, Tipo_Proyecto, Complejidad, Opción, Monto, Estado]
      const quotationData = [
        new Date().toISOString(),
        '', // Email (lo pediremos después si es necesario)
        clientName || 'Cliente WhatsApp',
        flowData.description.substring(0, 100), // Descripción corta
        flowData.recommendedPlan,
        plan.name,
        plan.price_cop,
        'pendiente'
      ];

      try {
        await googleSheetsService(quotationData, 'cotizaciones');

        const confirmMessage = `
🎉 *¡Solicitud Recibida!*

Gracias ${clientName || ''}, hemos registrado tu interés en nuestro *${plan.name}*.

📞 Teléfono: ${userPhone}

👨‍💻 Un especialista de Tech Tecnic te contactará en las próximas 24 horas para:
• Discutir los detalles de tu proyecto
• Ajustar la propuesta a tus necesidades exactas
• Presentarte un presupuesto personalizado

¿Hay algo más en lo que podamos ayudarte?
        `.trim();

        sessionManager.clearFlow(userId);
        await whatsappService.sendMessage(userId, confirmMessage);

      } catch (error) {
        console.error('Error guardando cotización:', error);
        await whatsappService.sendMessage(userId, '❌ Hubo un error. Por favor, intenta nuevamente.');
      }
    }
  }
}

export default new QuotationFlow();
