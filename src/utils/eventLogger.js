/**
 * Enhanced Logger con logEvent()
 * Helper especializado para eventos de negocio con contexto rico
 * 
 * Uso:
 * logEvent('info', 'user.greeting', ctx, { greeting: 'hola' });
 * logEvent('error', 'flow.validation_failed', ctx, { reason: 'invalid_step' });
 */

import { logStructured } from './logger.js';

/**
 * Niveles de log
 */
export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * Categorías de eventos (para filtrado y alertas)
 */
export const EVENT_CATEGORIES = {
  WEBHOOK: 'webhook',
  CONVERSATION: 'conversation',
  FLOW: 'flow',
  SESSION: 'session',
  FIREBASE: 'firebase',
  SHEETS: 'sheets',
  OPENAI: 'openai',
  VALIDATION: 'validation',
  ERROR: 'error'
};

/**
 * Log de evento con contexto completo
 * 
 * @param {string} level - Nivel: DEBUG, INFO, WARN, ERROR
 * @param {string} eventName - Nombre del evento (formato: categoria.accion)
 * @param {TraceContext|string} contextOrTraceId - TraceContext o traceId string
 * @param {object} payload - Data adicional del evento
 */
export const logEvent = (level, eventName, contextOrTraceId, payload = {}) => {
  // Determinar si es TraceContext o string
  let traceId, enrichedPayload;
  
  if (typeof contextOrTraceId === 'string') {
    // Es un traceId simple (compatibilidad con código viejo)
    traceId = contextOrTraceId;
    enrichedPayload = payload;
  } else if (contextOrTraceId && typeof contextOrTraceId === 'object') {
    // Es un TraceContext
    traceId = contextOrTraceId.traceId;
    
    // Enriquecer payload con datos del contexto
    enrichedPayload = {
      userId: contextOrTraceId.userId,
      messageId: contextOrTraceId._context?.messageId,
      flow: contextOrTraceId._context?.flow,
      step: contextOrTraceId._context?.step,
      intent: contextOrTraceId._context?.intent,
      messageType: contextOrTraceId._context?.messageType,
      latencyMs: contextOrTraceId._context?.endTime 
        ? contextOrTraceId._context.endTime - contextOrTraceId._context.startTime
        : Date.now() - contextOrTraceId._context?.startTime,
      ...payload
    };
  } else {
    // Sin contexto (fallback)
    traceId = 'no-context';
    enrichedPayload = payload;
  }
  
  // Extraer categoría del eventName
  const [category, action] = eventName.split('.');
  enrichedPayload.category = category;
  enrichedPayload.action = action;
  
  // Log estructurado
  logStructured(level, eventName, enrichedPayload, traceId);
};

/**
 * Helpers especializados por nivel
 */
export const logDebug = (eventName, ctx, payload) => logEvent(LOG_LEVELS.DEBUG, eventName, ctx, payload);
export const logInfo = (eventName, ctx, payload) => logEvent(LOG_LEVELS.INFO, eventName, ctx, payload);
export const logWarn = (eventName, ctx, payload) => logEvent(LOG_LEVELS.WARN, eventName, ctx, payload);
export const logError = (eventName, ctx, payload) => logEvent(LOG_LEVELS.ERROR, eventName, ctx, payload);

/**
 * Helpers especializados por operación
 */

/**
 * Log de inicio de webhook
 */
export const logWebhookReceived = (ctx, messageType) => {
  ctx.setMessageType(messageType);
  logEvent(LOG_LEVELS.INFO, 'webhook.received', ctx, {
    messageType,
    source: 'whatsapp'
  });
};

/**
 * Log de webhook procesado
 */
export const logWebhookProcessed = (ctx, success = true) => {
  logEvent(
    success ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR,
    success ? 'webhook.processed' : 'webhook.failed',
    ctx,
    { success }
  );
};

/**
 * Log de inicio de flujo
 */
export const logFlowStarted = (ctx, flowName, initialStep = null) => {
  ctx.setFlow(flowName, initialStep);
  logEvent(LOG_LEVELS.INFO, 'flow.started', ctx, {
    flowName,
    initialStep
  });
};

/**
 * Log de cambio de step en flujo
 */
export const logFlowStepChanged = (ctx, fromStep, toStep) => {
  ctx.setFlow(ctx._context.flow, toStep);
  logEvent(LOG_LEVELS.INFO, 'flow.step_changed', ctx, {
    fromStep,
    toStep,
    flowName: ctx._context.flow
  });
};

/**
 * Log de flujo completado
 */
export const logFlowCompleted = (ctx, outcome = 'success') => {
  logEvent(LOG_LEVELS.INFO, 'flow.completed', ctx, {
    flowName: ctx._context.flow,
    finalStep: ctx._context.step,
    outcome
  });
};

/**
 * Log de error en flujo
 */
export const logFlowError = (ctx, errorType, errorMessage) => {
  logEvent(LOG_LEVELS.ERROR, 'flow.error', ctx, {
    flowName: ctx._context.flow,
    currentStep: ctx._context.step,
    errorType,
    errorMessage
  });
};

/**
 * Log de detección de intent
 */
export const logIntentDetected = (ctx, intent, confidence = null) => {
  ctx.setIntent(intent);
  logEvent(LOG_LEVELS.INFO, 'conversation.intent_detected', ctx, {
    intent,
    confidence
  });
};

/**
 * Log de escritura Firebase
 */
export const logFirebaseWrite = (ctx, operation, success, errorCode = null) => {
  if (success) {
    ctx.firebaseSuccess();
  } else {
    ctx.firebaseError(errorCode);
  }
  
  logEvent(
    success ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR,
    success ? 'firebase.write_success' : 'firebase.write_failed',
    ctx,
    {
      operation,
      success,
      errorCode,
      latencyMs: ctx._context.operations.firebase.latencyMs
    }
  );
};

/**
 * Log de escritura Google Sheets
 */
export const logSheetsWrite = (ctx, sheetName, success, errorCode = null) => {
  if (success) {
    ctx.sheetsSuccess();
  } else {
    ctx.sheetsError(errorCode);
  }
  
  logEvent(
    success ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR,
    success ? 'sheets.write_success' : 'sheets.write_failed',
    ctx,
    {
      sheetName,
      success,
      errorCode,
      latencyMs: ctx._context.operations.sheets.latencyMs
    }
  );
};

/**
 * Log de llamada OpenAI
 */
export const logOpenAICall = (ctx, promptType, success, tokenCount = null, errorCode = null) => {
  if (success) {
    ctx.openAISuccess(tokenCount);
  } else {
    ctx.openAIError(errorCode);
  }
  
  logEvent(
    success ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR,
    success ? 'openai.call_success' : 'openai.call_failed',
    ctx,
    {
      promptType,
      success,
      tokenCount,
      errorCode,
      latencyMs: ctx._context.operations.openai.latencyMs
    }
  );
};

/**
 * Log de validación fallida
 */
export const logValidationFailed = (ctx, validationType, errors) => {
  logEvent(LOG_LEVELS.WARN, 'validation.failed', ctx, {
    validationType,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

export default {
  logEvent,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logWebhookReceived,
  logWebhookProcessed,
  logFlowStarted,
  logFlowStepChanged,
  logFlowCompleted,
  logFlowError,
  logIntentDetected,
  logFirebaseWrite,
  logSheetsWrite,
  logOpenAICall,
  logValidationFailed,
  LOG_LEVELS,
  EVENT_CATEGORIES
};
