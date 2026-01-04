/**
 * Quotation Flow
 * Flujo para generar cotizaciones automáticas
 * Usa OpenAI + reglas de negocio para proporcionar 3 opciones de precio
 */

import sessionManager from '../sessionManager.js';
import whatsappService from '../whatsappService.js';
import openAiService from '../openAiService.js';
import googleSheetsService from '../googleSheetsService.js';
import quotationEngine from '../quotationEngine.js';

const QUOTATION_STEPS = {
  projectType: 'projectType',
  complexity: 'complexity',
  timeline: 'timeline',
  analysis: 'analysis',
  options: 'options',
  selection: 'selection'
};

const PROJECT_TYPES = [
  { type: 'reply', reply: { id: 'proj_web', title: 'Sitio Web' } },
  { type: 'reply', reply: { id: 'proj_ecommerce', title: 'Ecommerce' } },
  { type: 'reply', reply: { id: 'proj_mobile', title: 'App Movil' } },
];

const COMPLEXITY_OPTIONS = [
  { type: 'reply', reply: { id: 'complex_basic', title: 'Basico' } },
  { type: 'reply', reply: { id: 'complex_medium', title: 'Intermedio' } },
  { type: 'reply', reply: { id: 'complex_high', title: 'Complejo' } },
];

const TIMELINE_OPTIONS = [
  { type: 'reply', reply: { id: 'timeline_asap', title: 'Urgente' } },
  { type: 'reply', reply: { id: 'timeline_quick', title: 'Rapido' } },
  { type: 'reply', reply: { id: 'timeline_normal', title: 'Normal' } },
];

const OPTION_BUTTONS = [
  { type: 'reply', reply: { id: 'opt_1', title: 'Economica' } },
  { type: 'reply', reply: { id: 'opt_2', title: 'Recomendada' } },
  { type: 'reply', reply: { id: 'opt_3', title: 'Premium' } },
];

class QuotationFlow {
  /**
   * Iniciar flujo de cotización
   */
  async initiate(userId) {
    sessionManager.setFlow(userId, 'quotation', {
      step: QUOTATION_STEPS.projectType,
      data: {},
      email: null // Se pide después
    });

    const message = `💰 *Solicitar Cotización*\n\nTe ayudaremos a obtener una cotización personalizada basada en tus necesidades.\n\n¿Qué tipo de proyecto necesitas?`;
    await whatsappService.sendMessage(userId, message);
    await whatsappService.sendInteractiveButtons(userId, 'Selecciona el tipo:', PROJECT_TYPES);
  }

  /**
   * Continuar flujo
   */
  async continueFlow(userId, message) {
    const flowData = sessionManager.getFlowData(userId);
    const currentStep = flowData.step;

    if (message.type === 'interactive') {
      const option = message.interactive?.button_reply?.id;
      return this.processButtonInput(userId, currentStep, option);
    }

    if (message.type === 'text') {
      const input = message.text.body.trim();

      // Si está esperando descripción o email, procesar texto
      if (currentStep === QUOTATION_STEPS.analysis) {
        return this.handleDescription(userId, input);
      }

      if (currentStep === QUOTATION_STEPS.selection) {
        return this.handleEmail(userId, input);
      }
    }

    // Si llegó acá, reiniciar
    sessionManager.clearFlow(userId);
    await whatsappService.sendMessage(userId, 'Proceso completado.');
  }

  /**
   * Procesar entrada de botones
   */
  async processButtonInput(userId, currentStep, option) {
    switch (currentStep) {
      case QUOTATION_STEPS.projectType:
        return this.handleProjectType(userId, option);

      case QUOTATION_STEPS.complexity:
        return this.handleComplexity(userId, option);

      case QUOTATION_STEPS.timeline:
        return this.handleTimeline(userId, option);

      case QUOTATION_STEPS.selection:
        return this.handleOptionSelection(userId, option);

      default:
        return this.showProjectTypeMenu(userId);
    }
  }

  /**
   * Manejar tipo de proyecto
   */
  async handleProjectType(userId, projectId) {
    const projectMap = {
      'proj_web': 'Sitio Web',
      'proj_ecommerce': 'Ecommerce',
      'proj_mobile': 'App Móvil',
      'proj_automation': 'Automatización',
      'proj_integration': 'Integración',
      'proj_other': 'Otro'
    };

    const projectName = projectMap[projectId] || 'No especificado';

    sessionManager.updateFlowData(userId, {
      step: QUOTATION_STEPS.complexity,
      projectType: projectName
    });

    const message = `✅ Seleccionaste: *${projectName}*\n\n¿Cuál es la complejidad del proyecto?`;
    await whatsappService.sendMessage(userId, message);
    await whatsappService.sendInteractiveButtons(userId, 'Nivel de complejidad:', COMPLEXITY_OPTIONS);
  }

  /**
   * Manejar complejidad
   */
  async handleComplexity(userId, complexityId) {
    const complexityMap = {
      'complex_basic': 'Básico',
      'complex_medium': 'Medio',
      'complex_high': 'Alto'
    };

    const complexityName = complexityMap[complexityId] || 'Medio';

    sessionManager.updateFlowData(userId, {
      step: QUOTATION_STEPS.timeline,
      complexity: complexityName
    });

    const message = `✅ Complejidad: *${complexityName}*\n\n¿Cuándo necesitas que esté listo?`;
    await whatsappService.sendMessage(userId, message);
    await whatsappService.sendInteractiveButtons(userId, 'Timeline:', TIMELINE_OPTIONS);
  }

  /**
   * Manejar timeline
   */
  async handleTimeline(userId, timelineId) {
    const timelineMap = {
      'timeline_asap': 'ASAP',
      'timeline_quick': 'Rápido',
      'timeline_normal': 'Normal',
      'timeline_flexible': 'Flexible'
    };

    const timelineName = timelineMap[timelineId] || 'Normal';

    sessionManager.updateFlowData(userId, {
      step: QUOTATION_STEPS.analysis,
      timeline: timelineName
    });

    const message = `✅ Timeline: *${timelineName}*\n\nAhora, cuéntanos más detalles sobre tu proyecto (funcionalidades principales, integraciones, etc.):`;
    await whatsappService.sendMessage(userId, message);
  }

  /**
   * Manejar descripción y generar cotización
   */
  async handleDescription(userId, description) {
    if (description.length < 20) {
      await whatsappService.sendMessage(userId, '❌ Por favor, proporciona más detalles (mínimo 20 caracteres).');
      return;
    }

    const flowData = sessionManager.getFlowData(userId);

    // Mostrar que estamos procesando
    await whatsappService.sendMessage(userId, '⏳ Analizando tu proyecto...');

    try {
      // Generar análisis con OpenAI
      const analysis = await this.analyzeProject(flowData, description);

      // Generar 3 opciones de cotización
      const quotations = await quotationEngine.generateQuotations({
        projectType: flowData.projectType,
        complexity: flowData.complexity,
        timeline: flowData.timeline,
        analysis: analysis
      });

      sessionManager.updateFlowData(userId, {
        step: QUOTATION_STEPS.options,
        description: description,
        analysis: analysis,
        quotations: quotations
      });

      return this.showQuotationOptions(userId, quotations);

    } catch (error) {
      console.error('Error generando cotización:', error);
      await whatsappService.sendMessage(userId, '❌ Hubo un error procesando tu solicitud. Por favor intenta nuevamente.');
      sessionManager.clearFlow(userId);
    }
  }

  /**
   * Mostrar opciones de cotización
   */
  async showQuotationOptions(userId, quotations) {
    const message = `
🎯 *Opciones de Cotización:*

━━━━━━━━━━━━━━━━━━━━━━

💰 *OPCIÓN ECONÓMICA*
Precio: $${quotations.basic.price.toLocaleString()}
Características:
${quotations.basic.features.map(f => `• ${f}`).join('\n')}
Tiempo: ${quotations.basic.timeline} semanas

━━━━━━━━━━━━━━━━━━━━━━

⭐ *OPCIÓN RECOMENDADA*
Precio: $${quotations.recommended.price.toLocaleString()}
Características:
${quotations.recommended.features.map(f => `• ${f}`).join('\n')}
Tiempo: ${quotations.recommended.timeline} semanas

━━━━━━━━━━━━━━━━━━━━━━

👑 *OPCIÓN PREMIUM*
Precio: $${quotations.premium.price.toLocaleString()}
Características:
${quotations.premium.features.map(f => `• ${f}`).join('\n')}
Tiempo: ${quotations.premium.timeline} semanas

━━━━━━━━━━━━━━━━━━━━━━

¿Cuál te interesa?
    `.trim();

    await whatsappService.sendMessage(userId, message);
    await whatsappService.sendInteractiveButtons(userId, 'Elige una opción:', OPTION_BUTTONS);

    sessionManager.updateFlowData(userId, {
      step: QUOTATION_STEPS.selection
    });
  }

  /**
   * Manejar selección de opción
   */
  async handleOptionSelection(userId, optionId) {
    const optionMap = {
      'opt_1': 'basic',
      'opt_2': 'recommended',
      'opt_3': 'premium'
    };

    const selectedOption = optionMap[optionId];
    const flowData = sessionManager.getFlowData(userId);
    const quotation = flowData.quotations[selectedOption];

    sessionManager.updateFlowData(userId, {
      selectedOption: selectedOption,
      selectedPrice: quotation.price
    });

    const message = `✅ Excelente elección.\n\n📧 Para completar, ¿cuál es tu correo electrónico?`;
    await whatsappService.sendMessage(userId, message);
  }

  /**
   * Manejar email y guardar cotización
   */
  async handleEmail(userId, email) {
    if (!this.validateEmail(email)) {
      await whatsappService.sendMessage(userId, '❌ Por favor, ingresa un email válido.');
      return;
    }

    const flowData = sessionManager.getFlowData(userId);
    const quotation = flowData.quotations[flowData.selectedOption];

    // Guardar en Google Sheets
    const quotationData = [
      new Date().toISOString(),
      email,
      'Cliente',
      flowData.projectType,
      flowData.complexity,
      flowData.selectedOption,
      quotation.price,
      'enviada'
    ];

    try {
      await googleSheetsService(quotationData, 'cotizaciones');

      const confirmMessage = `
🎉 *¡Cotización Enviada!*

Gracias por confiar en Tech Tecnic.

📧 Hemos enviado los detalles a: ${email}

💡 Próximos pasos:
1. Revisa tu email con toda la información
2. Si tienes dudas, respondemos al instante
3. ¿Listo para comenzar? Agenda una llamada con nuestro equipo

¿Deseas agendar una reunión ahora?
      `.trim();

      sessionManager.clearFlow(userId);
      await whatsappService.sendMessage(userId, confirmMessage);

    } catch (error) {
      console.error('Error guardando cotización:', error);
      await whatsappService.sendMessage(userId, '❌ Hubo un error. Por favor intenta nuevamente.');
    }
  }

  /**
   * Analizar proyecto con OpenAI
   */
  async analyzeProject(flowData, description) {
    const prompt = `
Tu rol es analizar brevemente un proyecto de desarrollo y proporcionar insights.

Datos del proyecto:
- Tipo: ${flowData.projectType}
- Complejidad: ${flowData.complexity}
- Timeline: ${flowData.timeline}
- Descripción: ${description}

Proporciona un análisis de 2-3 líneas sobre:
1. Viabilidad del proyecto
2. Desafíos principales
3. Recomendación técnica

Sé conciso y práctico.
    `.trim();

    try {
      return await openAiService(prompt);
    } catch (error) {
      console.error('Error analizando proyecto:', error);
      return 'Análisis no disponible temporalmente.';
    }
  }

  /**
   * Validar email
   */
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Mostrar menú de tipos de proyecto
   */
  async showProjectTypeMenu(userId) {
    const message = '¿Qué tipo de proyecto necesitas?';
    await whatsappService.sendInteractiveButtons(userId, message, PROJECT_TYPES);
  }
}

export default new QuotationFlow();
