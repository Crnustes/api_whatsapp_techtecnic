/**
 * Sales Flow Configuration
 * Lead scoring rules, states, and qualification criteria
 */

export const SALES_CONFIG = {
  // Lead scoring rules (0-100 points)
  scoring: {
    intent: {
      high: { keywords: ['necesito', 'requiero', 'urgente', 'cuando pueden', 'precio'], points: 25 },
      medium: { keywords: ['interesado', 'me gustaría', 'quisiera', 'información'], points: 15 },
      low: { keywords: ['tal vez', 'estoy viendo', 'solo pregunto'], points: 5 }
    },
    
    urgency: {
      immediate: { keywords: ['hoy', 'ahora', 'ya', 'urgente', 'inmediato'], points: 20 },
      short: { keywords: ['esta semana', 'pronto', 'rápido', 'cuanto antes'], points: 15 },
      medium: { keywords: ['este mes', 'próximamente', 'en breve'], points: 10 },
      long: { keywords: ['futuro', 'más adelante', 'estoy evaluando'], points: 3 }
    },
    
    budget: {
      mentioned: { points: 15 }, // Si menciona presupuesto específico
      range: { points: 10 }, // Si da un rango
      concern: { keywords: ['cuánto cuesta', 'precio', 'cotización'], points: 8 }
    },
    
    authority: {
      decision_maker: { keywords: ['soy el dueño', 'gerente', 'director', 'ceo', 'decido yo'], points: 15 },
      influencer: { keywords: ['equipo', 'voy a consultar', 'departamento'], points: 8 },
      researcher: { keywords: ['estoy investigando', 'comparando', 'opciones'], points: 3 }
    },
    
    specificity: {
      detailed: { points: 12 }, // Necesidad muy específica y detallada
      general: { points: 6 }, // Necesidad general
      vague: { points: 2 } // Muy vaga
    },
    
    engagement: {
      responsive: { points: 5 }, // Responde rápido y con detalle
      asks_questions: { points: 8 }, // Hace preguntas relevantes
      shares_context: { points: 10 } // Comparte contexto de negocio
    }
  },
  
  // Lead states based on score
  states: {
    nurture: {
      range: [0, 30],
      label: 'Nurture',
      description: 'Lead frío - Necesita educación',
      actions: ['send_resources', 'educate', 'build_trust'],
      nextStep: 'follow_up_later'
    },
    qualify: {
      range: [31, 60],
      label: 'Qualify',
      description: 'Lead tibio - Recopilar información',
      actions: ['ask_questions', 'understand_needs', 'provide_value'],
      nextStep: 'continue_conversation'
    },
    schedule: {
      range: [61, 85],
      label: 'Schedule',
      description: 'Lead caliente - Agendar reunión',
      actions: ['propose_meeting', 'send_calendar', 'confirm_availability'],
      nextStep: 'transition_to_appointment'
    },
    handoff: {
      range: [86, 100],
      label: 'Handoff',
      description: 'Lead muy caliente - Atención humana inmediata',
      actions: ['notify_sales_team', 'immediate_response', 'priority_handling'],
      nextStep: 'transfer_to_human'
    }
  },
  
  // Qualification questions (minimal, strategic)
  questions: {
    nurture: [
      '¿Qué te gustaría lograr?',
      '¿Cuál es tu principal desafío?'
    ],
    qualify: [
      '¿Cuándo necesitas tener esto listo?',
      '¿Ya tienen un presupuesto asignado?',
      '¿Quién más participa en esta decisión?'
    ],
    schedule: [
      '¿Prefieres una llamada o videollamada?',
      '¿Qué día te viene mejor: mañana o pasado?'
    ]
  },
  
  // Messages by state (short & effective)
  messages: {
    nurture: {
      welcome: 'Entiendo. Déjame compartirte algo que puede ayudarte.',
      educate: 'Te explico rápidamente cómo funciona:',
      followUp: '¿Te gustaría que te envíe más información por email?'
    },
    qualify: {
      understanding: 'Perfecto, entiendo tu situación.',
      probing: 'Para ayudarte mejor, cuéntame:',
      value: 'Basado en eso, esto es lo que podemos hacer:'
    },
    schedule: {
      proposal: '¡Genial! Agendemos una reunión para revisar todo en detalle.',
      calendar: 'Tengo disponibilidad estos días:',
      confirm: '¿Te viene bien [DÍA] a las [HORA]?'
    },
    handoff: {
      urgent: '¡Perfecto! Veo que esto es prioritario.',
      connect: 'Te voy a conectar con [NOMBRE] de nuestro equipo ahora mismo.',
      immediate: 'Espera un momento mientras te transfiero...'
    }
  },
  
  // Triggers for state transitions
  triggers: {
    toSchedule: {
      keywords: ['reunión', 'llamada', 'videollamada', 'hablar', 'conversar'],
      minScore: 50
    },
    toHandoff: {
      keywords: ['urgente', 'ahora', 'ya', 'hablar con alguien'],
      minScore: 70
    }
  },
  
  // Limits & thresholds
  limits: {
    maxQuestionsPerState: 2, // Máximo 2 preguntas por estado
    minResponseLength: 10, // Mínimo 10 caracteres en respuestas
    scoreDecayPerMessage: 2, // Pierde 2 puntos si no responde bien
    scoreBoostForDetail: 5 // Gana 5 puntos por respuestas detalladas
  }
};

/**
 * Get lead state based on score
 */
export function getLeadState(score) {
  for (const [stateName, stateConfig] of Object.entries(SALES_CONFIG.states)) {
    const [min, max] = stateConfig.range;
    if (score >= min && score <= max) {
      return { name: stateName, ...stateConfig };
    }
  }
  return { name: 'nurture', ...SALES_CONFIG.states.nurture };
}

/**
 * Check if transition should occur
 */
export function shouldTransition(score, keywords, targetState) {
  const trigger = SALES_CONFIG.triggers[`to${targetState.charAt(0).toUpperCase() + targetState.slice(1)}`];
  if (!trigger) return false;
  
  const hasKeywords = trigger.keywords.some(kw => 
    keywords.toLowerCase().includes(kw)
  );
  const meetsScore = score >= trigger.minScore;
  
  return hasKeywords && meetsScore;
}
