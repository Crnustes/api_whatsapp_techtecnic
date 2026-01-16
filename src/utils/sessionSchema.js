/**
 * Session Schema & Validators
 * Define la estructura canónica del estado de sesión
 * y proporciona validadores para garantizar consistencia
 */

/**
 * Esquema canónico de Session
 * Single Source of Truth del estado del usuario
 */
export const SESSION_SCHEMA = {
  userId: {
    type: 'string',
    required: true,
    description: 'Identificador único del usuario (phone number con código de país)'
  },
  currentFlow: {
    type: 'string',
    required: true,
    nullable: true,
    enum: ['appointment', 'quotation', 'assistant', 'humanHandoff', null],
    description: 'Flujo conversacional activo, null si no hay flujo'
  },
  flowData: {
    type: 'object',
    required: true,
    schema: {
      step: {
        type: 'string',
        required: false,
        nullable: true,
        description: 'Step actual del flow (validado por state machine)'
      },
      payload: {
        type: 'object',
        required: true,
        default: {},
        description: 'Datos recolectados en el flow (nombre, email, servicio, etc)'
      },
      startedAt: {
        type: 'number',
        required: false,
        nullable: true,
        description: 'Timestamp cuando inició el flow'
      },
      lastTransition: {
        type: 'number',
        required: false,
        nullable: true,
        description: 'Timestamp de la última transición de step'
      }
    }
  },
  conversationHistory: {
    type: 'array',
    required: true,
    default: [],
    description: 'Historial de mensajes (user/assistant)'
  },
  metadata: {
    type: 'object',
    required: true,
    default: {},
    description: 'Metadata adicional (phone, clientName, clientProfile, etc)'
  },
  lastUserMessageId: {
    type: 'string',
    required: false,
    nullable: true,
    description: 'ID del último mensaje procesado (para idempotencia)'
  },
  lastProcessedAt: {
    type: 'number',
    required: false,
    nullable: true,
    description: 'Timestamp del último procesamiento'
  }
};

/**
 * Crear sesión vacía con valores por defecto
 */
export function createEmptySession(userId) {
  return {
    userId,
    currentFlow: null,
    flowData: {
      step: null,
      payload: {},
      startedAt: null,
      lastTransition: null
    },
    conversationHistory: [],
    metadata: {},
    lastUserMessageId: null,
    lastProcessedAt: null
  };
}

/**
 * Validar estructura de sesión
 * @throws {Error} Si la sesión es inválida
 */
export function validateSession(session) {
  const errors = [];

  // Validar userId
  if (!session.userId || typeof session.userId !== 'string') {
    errors.push('userId es requerido y debe ser string');
  }

  // Validar currentFlow
  const validFlows = ['appointment', 'quotation', 'assistant', 'humanHandoff', null];
  if (!validFlows.includes(session.currentFlow)) {
    errors.push(`currentFlow debe ser uno de: ${validFlows.join(', ')}`);
  }

  // Validar flowData
  if (!session.flowData || typeof session.flowData !== 'object') {
    errors.push('flowData es requerido y debe ser object');
  } else {
    // Si hay flow activo, debe haber step
    if (session.currentFlow && !session.flowData.step) {
      errors.push('flowData.step es requerido cuando currentFlow no es null');
    }

    // payload debe ser objeto
    if (!session.flowData.payload || typeof session.flowData.payload !== 'object') {
      errors.push('flowData.payload es requerido y debe ser object');
    }
  }

  // Validar conversationHistory
  if (!Array.isArray(session.conversationHistory)) {
    errors.push('conversationHistory debe ser array');
  }

  // Validar metadata
  if (!session.metadata || typeof session.metadata !== 'object') {
    errors.push('metadata es requerido y debe ser object');
  }

  if (errors.length > 0) {
    throw new Error(`Sesión inválida:\n  - ${errors.join('\n  - ')}`);
  }

  return true;
}

/**
 * Validar consistencia entre currentFlow y flowData
 * @throws {Error} Si hay inconsistencias
 */
export function validateFlowConsistency(session) {
  const errors = [];

  // Regla 1: Si currentFlow es null, flowData debe estar limpio
  if (session.currentFlow === null) {
    if (session.flowData.step !== null) {
      errors.push('currentFlow es null pero flowData.step no es null');
    }
    if (Object.keys(session.flowData.payload).length > 0) {
      errors.push('currentFlow es null pero flowData.payload no está vacío');
    }
  }

  // Regla 2: Si currentFlow no es null, debe haber step
  if (session.currentFlow !== null && !session.flowData.step) {
    errors.push(`currentFlow="${session.currentFlow}" pero flowData.step es null`);
  }

  // Regla 3: Si hay step, debe haber currentFlow
  if (session.flowData.step && !session.currentFlow) {
    errors.push(`flowData.step="${session.flowData.step}" pero currentFlow es null`);
  }

  if (errors.length > 0) {
    throw new Error(`Inconsistencia de estado:\n  - ${errors.join('\n  - ')}`);
  }

  return true;
}

/**
 * Validar payload según flow y step
 * Reglas específicas por flow
 */
export function validatePayload(flow, step, payload) {
  const errors = [];

  if (flow === 'appointment') {
    if (step === 'time' && !payload.selectedDate) {
      errors.push('appointment.time requiere payload.selectedDate');
    }
    if (step === 'confirmation' && (!payload.selectedDate || !payload.selectedTime)) {
      errors.push('appointment.confirmation requiere payload.selectedDate y payload.selectedTime');
    }
  }

  if (flow === 'quotation') {
    if (step === 'analysis' && !payload.description) {
      errors.push('quotation.analysis requiere payload.description');
    }
    if (step === 'confirmation' && !payload.analyzedData) {
      errors.push('quotation.confirmation requiere payload.analyzedData (resultado de OpenAI)');
    }
  }

  if (flow === 'humanHandoff') {
    if (step === 'confirmation' && !payload.reason) {
      errors.push('humanHandoff.confirmation requiere payload.reason');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Payload inválido para ${flow}.${step}:\n  - ${errors.join('\n  - ')}`);
  }

  return true;
}

/**
 * Detectar duplicados por messageId (idempotencia)
 */
export function isDuplicateMessage(session, messageId) {
  if (!messageId) return false;
  return session.lastUserMessageId === messageId;
}

/**
 * Sanitizar session antes de guardar en Firebase
 * Remueve campos undefined/null innecesarios
 */
export function sanitizeSession(session) {
  return {
    userId: session.userId,
    currentFlow: session.currentFlow || null,
    flowData: {
      step: session.flowData?.step || null,
      payload: session.flowData?.payload || {},
      startedAt: session.flowData?.startedAt || null,
      lastTransition: session.flowData?.lastTransition || null
    },
    // No guardar history completo (usar Firebase conversations)
    metadata: session.metadata || {},
    lastUserMessageId: session.lastUserMessageId || null,
    lastProcessedAt: session.lastProcessedAt || Date.now()
  };
}

/**
 * Comparar dos estados de sesión (útil para debugging)
 */
export function diffSessions(oldSession, newSession) {
  const changes = [];

  if (oldSession.currentFlow !== newSession.currentFlow) {
    changes.push({
      field: 'currentFlow',
      old: oldSession.currentFlow,
      new: newSession.currentFlow
    });
  }

  if (oldSession.flowData?.step !== newSession.flowData?.step) {
    changes.push({
      field: 'flowData.step',
      old: oldSession.flowData?.step,
      new: newSession.flowData?.step
    });
  }

  const oldPayloadKeys = Object.keys(oldSession.flowData?.payload || {});
  const newPayloadKeys = Object.keys(newSession.flowData?.payload || {});
  
  if (JSON.stringify(oldPayloadKeys.sort()) !== JSON.stringify(newPayloadKeys.sort())) {
    changes.push({
      field: 'flowData.payload (keys)',
      old: oldPayloadKeys,
      new: newPayloadKeys
    });
  }

  if (oldSession.lastUserMessageId !== newSession.lastUserMessageId) {
    changes.push({
      field: 'lastUserMessageId',
      old: oldSession.lastUserMessageId,
      new: newSession.lastUserMessageId
    });
  }

  return changes;
}

/**
 * Utilidad: verificar si session tiene flow activo
 */
export function hasActiveFlow(session) {
  return session.currentFlow !== null && session.flowData.step !== null;
}

/**
 * Utilidad: obtener estado resumido (para logs)
 */
export function getSessionSummary(session) {
  return {
    userId: session.userId,
    currentFlow: session.currentFlow,
    step: session.flowData?.step,
    payloadKeys: Object.keys(session.flowData?.payload || {}),
    historyLength: session.conversationHistory?.length || 0,
    lastMessageId: session.lastUserMessageId,
    lastProcessedAt: session.lastProcessedAt
  };
}
