/**
 * Quotation Flow - Mejorado con OpenAI
 * Flujo inteligente de cotizaciones sin mostrar precios aún
 * Usa OpenAI para analizar necesidades y recomendar el mejor plan
 */

import sessionManager from '../sessionManager.js';
import whatsappService from '../whatsappService.js';
import openAiService from '../openAiService.js';
import googleSheetsService from '../googleSheetsService.js';

const QUOTATION_STEPS = {
  description: 'description',
  confirmation: 'confirmation'
};

const CONFIRM_BUTTONS = [
  { type: 'reply', reply: { id: 'cotiz_yes', title: 'Si, contactar' } },
  { type: 'reply', reply: { id: 'cotiz_no', title: 'Cancelar' } },
];

// Planes disponibles con descripciones (sin precios)
const PLANS = {
  emprendedor: {
    name: 'Plan Emprendedor',
    ideal: 'Lanzar tu presencia digital',
    includes: [
      'Landing page moderna (1-2 secciones)',
      'Dominio, hosting y SSL (1 año incluido)',
      'Diseño responsivo mobile-first',
      'Formulario de contacto + WhatsApp',
      'Optimización SEO básica',
      'Google Analytics configurado',
      '1 revisión incluida'
    ],
    price_cop: 400000
  },
  profesional: {
    name: 'Plan Profesional',
    ideal: 'Empresas que buscan destacar',
    includes: [
      'Sitio completo (3-5 secciones)',
      'SEO avanzado + analítica (GTM, GA4)',
      'Diseño personalizado premium',
      'Correos corporativos incluidos',
      'Integración con redes sociales',
      'Blog o noticias opcional',
      'Mantenimiento mensual opcional',
      '3 revisiones incluidas'
    ],
    price_cop: 900000
  },
  avanzado: {
    name: 'Plan Avanzado',
    ideal: 'E-commerce y aplicaciones web',
    includes: [
      'E-commerce completo (WooCommerce/React)',
      'Integraciones con IA y automatizaciones',
      'Optimización SEO + Core Web Vitals',
      'Panel de administración personalizado',
      'Capacitación post-entrega',
      'Soporte técnico 3 meses',
      'Migraciones y backups automáticos',
      'Revisiones ilimitadas en desarrollo'
    ],
    price_cop: 1800000
  },
  partner: {
    name: 'Plan Partner',
    ideal: 'Agencias y desarrollo white-label',
    includes: [
      'Desarrollo white-label (tu marca)',
      'Proyectos escalables y complejos',
      'Confidencialidad y NDA',
      'Tarifas preferenciales por volumen',
      'Soporte técnico dedicado',
      'Arquitectura empresarial',
      'Integraciones avanzadas',
      'Consultoría técnica incluida'
    ],
    price_cop: 'personalizado'
  }
};

class QuotationFlow {
  /**
   * Iniciar flujo de cotización
   */
  async initiate(userId) {
    sessionManager.setFlow(userId, 'quotation', {
      step: QUOTATION_STEPS.description,
      data: {}
    });

    const message = `💰 *Solicitar Cotización*

Para brindarte la mejor recomendación personalizada, cuéntanos:

📝 ¿Qué proyecto tienes en mente? Describe:
• ¿Qué tipo de sitio/app necesitas?
• ¿Cuál es el objetivo principal?
• ¿Qué funcionalidades te gustaría incluir?
• ¿Tienes alguna referencia o ejemplo?

Si no estás seguro, escribe: *"no estoy seguro"* y te ayudaremos.`;

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
      const response = await openAiService.getChatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        { model: 'gpt-4o', temperature: 0.7, max_tokens: 500 }
      );

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      // Extraer JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validar que el plan existe
      if (!PLANS[parsed.planKey]) {
        parsed.planKey = 'profesional'; // Default
      }

      return parsed;
    } catch (error) {
      console.error('Error analyzing with OpenAI:', error);
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

    if (option === 'cotiz_no') {
      sessionManager.clearFlow(userId);
      await whatsappService.sendMessage(userId, '👌 Entendido. Si cambias de opinión, estaremos aquí para ayudarte.');
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
