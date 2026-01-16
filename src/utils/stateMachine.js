/**
 * State Machine - Flow Transitions
 * Define transiciones válidas para cada flow
 * Garantiza que el estado avance de forma predecible
 */

/**
 * Definición de State Machines por Flow
 * 
 * Estructura:
 * {
 *   flowName: {
 *     initial: 'step_inicial',
 *     states: {
 *       step_name: {
 *         on: {
 *           EVENT_NAME: 'next_step'
 *         },
 *         canTransitionTo: ['next_step', 'another_step']
 *       }
 *     },
 *     final: ['completed', 'cancelled']
 *   }
 * }
 */

export const STATE_MACHINES = {
  /**
   * APPOINTMENT FLOW
   * Flujo: null → date → time → confirmation → completed
   */
  appointment: {
    initial: 'date',
    states: {
      date: {
        description: 'Usuario selecciona fecha',
        canTransitionTo: ['time', 'cancelled'],
        requiredPayload: [],
        on: {
          DATE_SELECTED: 'time',
          CANCEL: 'cancelled'
        }
      },
      time: {
        description: 'Usuario selecciona hora',
        canTransitionTo: ['confirmation', 'date', 'cancelled'],
        requiredPayload: ['selectedDate'],
        on: {
          TIME_SELECTED: 'confirmation',
          BACK_TO_DATE: 'date',
          CANCEL: 'cancelled'
        }
      },
      confirmation: {
        description: 'Usuario confirma cita',
        canTransitionTo: ['completed', 'time', 'cancelled'],
        requiredPayload: ['selectedDate', 'selectedTime'],
        on: {
          CONFIRM: 'completed',
          BACK_TO_TIME: 'time',
          CANCEL: 'cancelled'
        }
      },
      completed: {
        description: 'Cita guardada en Google Sheets',
        canTransitionTo: [],
        requiredPayload: ['selectedDate', 'selectedTime', 'savedToSheets'],
        on: {}
      },
      cancelled: {
        description: 'Usuario canceló el proceso',
        canTransitionTo: [],
        requiredPayload: [],
        on: {}
      }
    },
    final: ['completed', 'cancelled']
  },

  /**
   * QUOTATION FLOW
   * Flujo: null → description → analysis → confirmation → completed
   */
  quotation: {
    initial: 'description',
    states: {
      description: {
        description: 'Usuario describe su proyecto',
        canTransitionTo: ['analysis', 'cancelled'],
        requiredPayload: [],
        on: {
          DESCRIPTION_PROVIDED: 'analysis',
          CANCEL: 'cancelled'
        }
      },
      analysis: {
        description: 'OpenAI analiza y genera cotización',
        canTransitionTo: ['confirmation', 'description', 'cancelled'],
        requiredPayload: ['description'],
        on: {
          ANALYSIS_COMPLETE: 'confirmation',
          BACK_TO_DESCRIPTION: 'description',
          CANCEL: 'cancelled'
        }
      },
      confirmation: {
        description: 'Usuario confirma interés',
        canTransitionTo: ['completed', 'analysis', 'cancelled'],
        requiredPayload: ['description', 'analyzedData'],
        on: {
          CONFIRM: 'completed',
          BACK_TO_ANALYSIS: 'analysis',
          CANCEL: 'cancelled'
        }
      },
      completed: {
        description: 'Cotización guardada en Firebase + Sheets',
        canTransitionTo: [],
        requiredPayload: ['description', 'analyzedData', 'savedToSheets'],
        on: {}
      },
      cancelled: {
        description: 'Usuario canceló el proceso',
        canTransitionTo: [],
        requiredPayload: [],
        on: {}
      }
    },
    final: ['completed', 'cancelled']
  },

  /**
   * ASSISTANT FLOW
   * Flujo: null → active → completed
   * (Flow más simple, sin steps intermedios)
   */
  assistant: {
    initial: 'active',
    states: {
      active: {
        description: 'Asistente responde preguntas con OpenAI',
        canTransitionTo: ['completed', 'cancelled'],
        requiredPayload: [],
        on: {
          QUESTION_ANSWERED: 'active', // Puede permanecer en active
          END_CONVERSATION: 'completed',
          CANCEL: 'cancelled'
        }
      },
      completed: {
        description: 'Conversación finalizada',
        canTransitionTo: [],
        requiredPayload: [],
        on: {}
      },
      cancelled: {
        description: 'Usuario canceló',
        canTransitionTo: [],
        requiredPayload: [],
        on: {}
      }
    },
    final: ['completed', 'cancelled']
  },

  /**
   * HUMAN HANDOFF FLOW
   * Flujo: null → reason → confirmation → escalated
   */
  humanHandoff: {
    initial: 'reason',
    states: {
      reason: {
        description: 'Usuario explica por qué necesita agente humano',
        canTransitionTo: ['confirmation', 'cancelled'],
        requiredPayload: [],
        on: {
          REASON_PROVIDED: 'confirmation',
          CANCEL: 'cancelled'
        }
      },
      confirmation: {
        description: 'Usuario confirma escalación',
        canTransitionTo: ['escalated', 'reason', 'cancelled'],
        requiredPayload: ['reason'],
        on: {
          CONFIRM: 'escalated',
          BACK_TO_REASON: 'reason',
          CANCEL: 'cancelled'
        }
      },
      escalated: {
        description: 'Caso escalado a Google Sheets',
        canTransitionTo: [],
        requiredPayload: ['reason', 'savedToSheets'],
        on: {}
      },
      cancelled: {
        description: 'Usuario canceló',
        canTransitionTo: [],
        requiredPayload: [],
        on: {}
      }
    },
    final: ['escalated', 'cancelled']
  }
};

/**
 * Validar que una transición es válida
 * @param {string} flow - Nombre del flow (appointment, quotation, etc)
 * @param {string} currentStep - Step actual (puede ser null si es inicio)
 * @param {string} nextStep - Step objetivo
 * @throws {Error} Si la transición no es válida
 * @returns {boolean} true si es válida
 */
export function assertValidTransition(flow, currentStep, nextStep) {
  // Validar que el flow existe
  if (!STATE_MACHINES[flow]) {
    throw new Error(
      `❌ Flow inválido: "${flow}". ` +
      `Flows válidos: ${Object.keys(STATE_MACHINES).join(', ')}`
    );
  }

  const machine = STATE_MACHINES[flow];

  // Caso especial: iniciar flow (currentStep es null)
  if (currentStep === null) {
    if (nextStep !== machine.initial) {
      throw new Error(
        `❌ Transición inválida: Iniciar flow "${flow}"\n` +
        `   Expected: step="${machine.initial}"\n` +
        `   Got: step="${nextStep}"\n` +
        `   Hint: Al iniciar un flow, debe comenzar en el step inicial`
      );
    }
    return true;
  }

  // Validar que currentStep existe en el machine
  if (!machine.states[currentStep]) {
    throw new Error(
      `❌ Step actual inválido: "${currentStep}" no existe en flow "${flow}"\n` +
      `   Steps válidos: ${Object.keys(machine.states).join(', ')}`
    );
  }

  // Validar que nextStep existe en el machine
  if (!machine.states[nextStep]) {
    throw new Error(
      `❌ Step objetivo inválido: "${nextStep}" no existe en flow "${flow}"\n` +
      `   Steps válidos: ${Object.keys(machine.states).join(', ')}`
    );
  }

  // Validar que la transición está permitida
  const currentState = machine.states[currentStep];
  const allowedTransitions = currentState.canTransitionTo;

  if (!allowedTransitions.includes(nextStep)) {
    throw new Error(
      `❌ Transición prohibida: "${flow}.${currentStep}" → "${nextStep}"\n` +
      `   Current: ${currentStep}\n` +
      `   Allowed: ${allowedTransitions.join(', ')}\n` +
      `   Attempted: ${nextStep}\n` +
      `   Hint: ${currentState.description}`
    );
  }

  return true;
}

/**
 * Validar que el payload tiene los campos requeridos para el step
 * @param {string} flow - Nombre del flow
 * @param {string} step - Step a validar
 * @param {object} payload - Payload actual
 * @throws {Error} Si faltan campos requeridos
 * @returns {boolean} true si es válido
 */
export function assertValidPayload(flow, step, payload) {
  if (!STATE_MACHINES[flow]) {
    throw new Error(`Flow inválido: "${flow}"`);
  }

  const machine = STATE_MACHINES[flow];
  
  if (!machine.states[step]) {
    throw new Error(`Step inválido: "${step}" en flow "${flow}"`);
  }

  const state = machine.states[step];
  const required = state.requiredPayload || [];
  const missing = [];

  for (const field of required) {
    if (!(field in payload) || payload[field] === undefined || payload[field] === null) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ Payload incompleto para "${flow}.${step}"\n` +
      `   Required: ${required.join(', ')}\n` +
      `   Missing: ${missing.join(', ')}\n` +
      `   Current payload keys: ${Object.keys(payload).join(', ')}`
    );
  }

  return true;
}

/**
 * Verificar si un step es final (no puede transicionar a otro)
 */
export function isFinalStep(flow, step) {
  if (!STATE_MACHINES[flow]) return false;
  const machine = STATE_MACHINES[flow];
  return machine.final.includes(step);
}

/**
 * Obtener step inicial de un flow
 */
export function getInitialStep(flow) {
  if (!STATE_MACHINES[flow]) {
    throw new Error(`Flow inválido: "${flow}"`);
  }
  return STATE_MACHINES[flow].initial;
}

/**
 * Obtener transiciones permitidas desde un step
 */
export function getAllowedTransitions(flow, currentStep) {
  if (!STATE_MACHINES[flow]) {
    throw new Error(`Flow inválido: "${flow}"`);
  }

  const machine = STATE_MACHINES[flow];

  // Si no hay step actual, solo puede ir al inicial
  if (currentStep === null) {
    return [machine.initial];
  }

  if (!machine.states[currentStep]) {
    throw new Error(`Step inválido: "${currentStep}" en flow "${flow}"`);
  }

  return machine.states[currentStep].canTransitionTo;
}

/**
 * Obtener metadata de un step
 */
export function getStepMetadata(flow, step) {
  if (!STATE_MACHINES[flow]) {
    throw new Error(`Flow inválido: "${flow}"`);
  }

  const machine = STATE_MACHINES[flow];
  
  if (!machine.states[step]) {
    throw new Error(`Step inválido: "${step}" en flow "${flow}"`);
  }

  const state = machine.states[step];
  
  return {
    step,
    description: state.description,
    canTransitionTo: state.canTransitionTo,
    requiredPayload: state.requiredPayload,
    isFinal: machine.final.includes(step)
  };
}

/**
 * Validar transición completa (step + payload)
 * Combina assertValidTransition + assertValidPayload
 */
export function validateTransition(flow, currentStep, nextStep, nextPayload) {
  // 1. Validar que la transición es válida
  assertValidTransition(flow, currentStep, nextStep);

  // 2. Validar que el payload es válido para el nextStep
  assertValidPayload(flow, nextStep, nextPayload);

  return true;
}

/**
 * Generar diagrama ASCII del state machine (para debugging)
 */
export function printStateMachine(flow) {
  if (!STATE_MACHINES[flow]) {
    return `Flow "${flow}" no encontrado`;
  }

  const machine = STATE_MACHINES[flow];
  let diagram = `\n📊 STATE MACHINE: ${flow.toUpperCase()}\n`;
  diagram += `${'='.repeat(50)}\n\n`;
  diagram += `Initial: ${machine.initial}\n`;
  diagram += `Final: ${machine.final.join(', ')}\n\n`;

  for (const [stepName, state] of Object.entries(machine.states)) {
    const isFinal = machine.final.includes(stepName);
    const marker = stepName === machine.initial ? '🟢' : (isFinal ? '🔴' : '🔵');
    
    diagram += `${marker} ${stepName}\n`;
    diagram += `   ${state.description}\n`;
    
    if (state.requiredPayload.length > 0) {
      diagram += `   Required: ${state.requiredPayload.join(', ')}\n`;
    }
    
    if (state.canTransitionTo.length > 0) {
      diagram += `   Can go to: ${state.canTransitionTo.join(', ')}\n`;
    }
    
    diagram += '\n';
  }

  return diagram;
}

/**
 * Exportar todos los flows disponibles
 */
export function getAvailableFlows() {
  return Object.keys(STATE_MACHINES);
}
