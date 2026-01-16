/**
 * Chatbot Opportunity Service
 * Detecta automáticamente cuándo un cliente es candidato para chatbot
 * y sugiere el servicio de forma contextual
 */

import whatsappService from './whatsappService.js';
import sessionManager from './sessionManager.js';
import { isFeatureEnabled } from '../utils/featureGating.js';

class ChatbotOpportunityService {
  /**
   * Palabras clave que indican oportunidad de chatbot
   */
  CHATBOT_TRIGGERS = {
    volume: ['mucho', 'muchos', 'cantidad', 'volumen', 'miles', 'cientos', 'constantemente', 'siempre'],
    availability: ['24/7', 'disponibilidad', 'siempre disponible', 'cualquier hora', 'nunca descanso', 'todo el tiempo'],
    response: ['responder', 'contestar', 'atrasar', 'rezagado', 'no da abasto', 'no puedo', 'equipo pequeño'],
    automation: ['automatizar', 'automático', 'automatización', 'procesos', 'repetitivo', 'respuestas iguales'],
    leads: ['leads', 'clientes potenciales', 'prospectos', 'captación', 'generar contactos', 'contactos automáticos'],
    customer_service: ['soporte', 'atención', 'cliente', 'consultas', 'preguntas frecuentes', 'FAQ', 'ayuda'],
    scale: ['crecer', 'escalable', 'expansión', 'más negocio', 'más clientes', 'aumentar']
  };

  /**
   * Detectar si la conversación tiene triggers de chatbot
   * GATED: opportunityDetection controla si esta detección está activa
   */
  detectChatbotOpportunity(conversationHistory, req = null) {
    // GATING: Verificar si opportunityDetection está habilitado
    if (req && !isFeatureEnabled(req, 'opportunityDetection')) {
      return null; // Feature deshabilitado, no detectar
    }

    if (!conversationHistory || conversationHistory.length === 0) {
      return null;
    }

    // Obtener últimos 5 mensajes del usuario
    const userMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .slice(-5)
      .map(msg => msg.content.toLowerCase());

    const fullText = userMessages.join(' ');

    // Contar triggers encontrados
    const triggersFound = {};
    let totalTriggers = 0;

    Object.entries(this.CHATBOT_TRIGGERS).forEach(([category, keywords]) => {
      const found = keywords.filter(keyword => fullText.includes(keyword));
      if (found.length > 0) {
        triggersFound[category] = found;
        totalTriggers += found.length;
      }
    });

    // Si hay al menos 2 triggers, es una oportunidad
    if (totalTriggers >= 2) {
      return {
        detected: true,
        confidence: Math.min(totalTriggers * 20, 100),
        triggers: triggersFound,
        category: this.determinePrimaryCategory(triggersFound),
        feature_enabled: true
      };
    }

    return null;
  }

  /**
   * Determinar categoría principal de la oportunidad
   */
  determinePrimaryCategory(triggersFound) {
    const categoryScores = {};
    Object.entries(triggersFound).forEach(([category, keywords]) => {
      categoryScores[category] = keywords.length;
    });

    const primary = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)[0];

    return primary ? primary[0] : 'general';
  }

  /**
   * Generar sugerencia contextual de chatbot
   */
  generateChatbotSuggestion(opportunity) {
    const suggestions = {
      volume: {
        title: '🤖 *¿Muchas consultas constantemente?*',
        message: `Veo que manejas un alto volumen de consultas. Un *Chatbot de IA* puede:
• Responder 24/7 sin pausas
• Atender múltiples clientes simultáneamente  
• Reducir carga de tu equipo en 80%

¿Te gustaría una demo?`
      },
      availability: {
        title: '🤖 *Necesitas disponibilidad 24/7*',
        message: `Tu negocio necesita respuestas fuera de horario. Con un *Chatbot de IA*:
• Tus clientes obtienen respuestas inmediatas
• Generan leads incluso cuando duermes
• No pierdes oportunidades por horarios

¿Hablamos de esto?`
      },
      response: {
        title: '🤖 *Tu equipo está saturado*',
        message: `Parece que les cuesta dar abasto. Un *Chatbot de IA* puede:
• Automatizar respuestas comunes
• Escalar a agentes solo lo importante
• Dar más tiempo a tu equipo para vender

¿Quieres una propuesta?`
      },
      automation: {
        title: '🤖 *Procesos repetitivos*',
        message: `Detecté que hay procesos que se repiten. Un *Chatbot de IA*:
• Automatiza consultas recurrentes
• Integra con tus sistemas
• Reduce trabajo manual 90%

¿Te interesa?`
      },
      leads: {
        title: '🤖 *Generación de leads*',
        message: `Para generar más leads automáticamente, combinamos:
• Chatbot capturando info 24/7
• Lead Magnet estratégico
• Email automatizado de seguimiento

Esto multiplica tus contactos. ¿Hablamos?`
      },
      customer_service: {
        title: '🤖 *Mejora tu atención*',
        message: `Un *Chatbot de IA* mejora tu servicio:
• Responde preguntas frecuentes al instante
• Escala a especialista si es necesario
• Mejora satisfacción de clientes

¿Quieres probarlo?`
      },
      scale: {
        title: '🤖 *Crece sin limitar capacidad*',
        message: `Para escalar sin aumentar costos, un *Chatbot de IA*:
• Maneja clientes ilimitados
• No requiere más personal
• Crece con tu negocio

¿Vemos cómo funciona?`
      },
      general: {
        title: '🤖 *Automatización de atención*',
        message: `Podría beneficiarte un *Chatbot de IA* que:
• Automatiza respuestas comunes
• Genera leads 24/7
• Mejora experiencia del cliente

¿Quieres una propuesta personalizada?`
      }
    };

    return suggestions[opportunity.category] || suggestions.general;
  }

  /**
   * Enviar sugerencia de chatbot al usuario
   */
  async sendChatbotSuggestion(userId, opportunity) {
    try {
      const suggestion = this.generateChatbotSuggestion(opportunity);

      console.log(`\n🤖 Sugerencia de Chatbot detectada para ${userId}`);
      console.log(`   Categoría: ${opportunity.category}`);
      console.log(`   Confianza: ${opportunity.confidence}%`);

      // Enviar mensaje de sugerencia
      await whatsappService.sendMessage(userId, suggestion.message);

      // Guardar en metadata de sesión
      sessionManager.setMetadata(userId, 'chatbot_opportunity', {
        detected: true,
        category: opportunity.category,
        confidence: opportunity.confidence,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error enviando sugerencia de chatbot:', error);
      return false;
    }
  }

  /**
   * Verificar si ya se sugirió chatbot en esta sesión
   */
  alreadySuggested(userId) {
    const metadata = sessionManager.getMetadata(userId, 'chatbot_suggestion_sent');
    return !!metadata;
  }

  /**
   * Marcar que se envió sugerencia
   */
  markSuggestionSent(userId) {
    sessionManager.setMetadata(userId, 'chatbot_suggestion_sent', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generar resumen de oportunidad para equipo de ventas
   */
  generateLeadSummary(userId, opportunity) {
    const session = sessionManager.getSession(userId);
    const clientName = sessionManager.getMetadata(userId, 'clientName') || 'Cliente';
    const phone = sessionManager.getMetadata(userId, 'phone') || 'N/A';

    return {
      cliente: clientName,
      telefono: phone,
      tipo_oportunidad: opportunity.category,
      confianza: opportunity.confidence + '%',
      triggers_detectados: Object.entries(opportunity.triggers)
        .map(([cat, keywords]) => `${cat}: ${keywords.join(', ')}`)
        .join(' | '),
      mensajes_usuario: session.conversationHistory
        .filter(msg => msg.role === 'user')
        .slice(-3)
        .map(msg => msg.content)
        .join(' | '),
      fecha_deteccion: new Date().toISOString(),
      siguiente_paso: 'Contactar con propuesta de Chatbot de IA'
    };
  }
}

export default new ChatbotOpportunityService();
