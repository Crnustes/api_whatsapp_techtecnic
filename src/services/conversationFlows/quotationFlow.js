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
  { type: 'reply', reply: { id: 'cotiz_yes', title: '✅ Sí, contáctame' } },
  { type: 'reply', reply: { id: 'cotiz_no', title: '❌ Ahora no' } },
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
      await whatsappService.sendMessage(userId, '🤔 Mmm dame más detalles porfa. ¿Qué necesitas exactamente?');
      return;
    }

    // Mostrar mensaje de análisis
    await whatsappService.sendMessage(userId, '🤖 Analizando tu proyecto...\n\nDame un sec ⏳');

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
    const systemPrompt = `Eres un asesor de desarrollo web e IA experto en la agencia Tech Tecnic.

Basándote en la descripción del cliente, debes:
1. Analizar qué necesita (web, app, e-commerce, chatbot, etc)
2. Recomendar el servicio más adecuado de estos 7:
   - Desarrollo Web: sitios modernos y escalables
   - SEO & Posicionamiento: visibilidad en Google
   - IA & Automatización: chatbots, automatizaciones
   - Integraciones: APIs, CRM, sistemas conectados
   - Mantenimiento Web: soporte continuo
   - Apps Móviles: iOS + Android
   - Chatbot WhatsApp con IA: automatización 24/7

3. Explicar POR QUÉ ese servicio es el mejor para su proyecto
4. Mencionar que tenemos planes: Emprendedor, Profesional y Avanzado
5. Listar 3-5 características clave que se incluirían

Responde SOLO en formato JSON:
{
  "planKey": "emprendedor|profesional|avanzado|partner",
  "analysis": "Explicación de por qué este plan es ideal (2-3 frases, tono juvenil)",
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

🔧 *Lo que te armaríamos:*
${features}

✨ *Incluye:*
${plan.includes.slice(0, 5).map(i => `• ${i}`).join('\n')}

¿Quieres que te contactemos para afinar detalles y hablarte del presupuesto?`;

    await whatsappService.sendMessage(userId, message);
    await whatsappService.sendInteractiveButtons(
      userId,
      '¿Te interesa? 👇',
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
🎉 ¡Listo!

Gracias ${clientName || ''}, ya registramos tu solicitud para el *${plan.name}*.

📞 ${userPhone}

👨‍💻 Un especialista de Tech Tecnic te contactará en las próximas 24 horas para:
• Afinar los detalles del proyecto
• Darte un presupuesto detallado
• Resolver todas tus dudas

¿Necesitas algo más? 💬
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
