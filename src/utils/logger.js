/**
 * Logger Estructurado con TraceId
 * Sistema de logging consistente para auditoría y debugging
 * 
 * Características:
 * - TraceId único por request (UUID v4)
 * - Logs estructurados en JSON
 * - Niveles: DEBUG, INFO, WARN, ERROR
 * - Timestamp automático ISO 8601
 * - Opcional: habilitar pretty-print para desarrollo
 */

import crypto from 'crypto';

// Configuración
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
const PRETTY_LOGS = process.env.PRETTY_LOGS === 'true';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

/**
 * Generar TraceId único (UUID v4)
 * @returns {string} UUID v4
 */
export const generateTraceId = () => {
  return crypto.randomUUID();
};

/**
 * Obtener nivel numérico
 */
const getLevel = (level) => {
  return LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
};

/**
 * Verificar si debe loggear según nivel configurado
 */
const shouldLog = (level) => {
  return getLevel(level) >= getLevel(LOG_LEVEL);
};

/**
 * Log estructurado
 * @param {string} level - Nivel: DEBUG, INFO, WARN, ERROR
 * @param {string} event - Nombre del evento (ej: 'webhook.incoming', 'flow.initiated')
 * @param {object} data - Datos adicionales del evento
 * @param {string} traceId - TraceId único del request
 */
export const logStructured = (level, event, data = {}, traceId = null) => {
  if (!shouldLog(level)) return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    event,
    traceId: traceId || 'no-trace',
    ...data
  };

  const output = PRETTY_LOGS ? JSON.stringify(logEntry, null, 2) : JSON.stringify(logEntry);

  // Usar console apropiado según nivel
  switch (level.toUpperCase()) {
    case 'ERROR':
      console.error(output);
      break;
    case 'WARN':
      console.warn(output);
      break;
    case 'DEBUG':
      console.debug(output);
      break;
    default:
      console.log(output);
  }
};

/**
 * Wrappers convenientes
 */
export const logDebug = (event, data, traceId) => logStructured('DEBUG', event, data, traceId);
export const logInfo = (event, data, traceId) => logStructured('INFO', event, data, traceId);
export const logWarn = (event, data, traceId) => logStructured('WARN', event, data, traceId);
export const logError = (event, data, traceId) => logStructured('ERROR', event, data, traceId);

/**
 * Log de inicio de flujo
 */
export const logFlowStart = (flowName, userId, traceId, metadata = {}) => {
  logInfo('flow.started', {
    flowName,
    userId,
    ...metadata
  }, traceId);
};

/**
 * Log de completado de flujo
 */
export const logFlowComplete = (flowName, userId, traceId, result = {}) => {
  logInfo('flow.completed', {
    flowName,
    userId,
    result
  }, traceId);
};

/**
 * Log de error en flujo
 */
export const logFlowError = (flowName, userId, traceId, error) => {
  logError('flow.error', {
    flowName,
    userId,
    error: error.message,
    stack: error.stack
  }, traceId);
};

/**
 * Log de operación Firebase
 */
export const logFirebaseOp = (operation, success, traceId, metadata = {}) => {
  const level = success ? 'INFO' : 'WARN';
  const event = success ? 'firebase.success' : 'firebase.failure';
  
  logStructured(level, event, {
    operation,
    success,
    ...metadata
  }, traceId);
};

/**
 * Log de respuesta OpenAI
 */
export const logAIResponse = (promptName, tokenCount, traceId, metadata = {}) => {
  logInfo('ai.response', {
    promptName,
    tokenCount,
    ...metadata
  }, traceId);
};

/**
 * Logger heredado (para compatibilidad con código existente)
 * Convierte console.log con emojis a logs estructurados
 */
export class LegacyLogger {
  static wrap(traceId = null) {
    return {
      log: (msg, data = {}) => {
        // Extraer emoji si existe
        const emojiMatch = msg.match(/^([\u{1F300}-\u{1F9FF}])/u);
        const emoji = emojiMatch ? emojiMatch[0] : '';
        const cleanMsg = msg.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '');
        
        logInfo('legacy.log', { message: cleanMsg, emoji, ...data }, traceId);
      },
      warn: (msg, data = {}) => {
        const cleanMsg = msg.replace(/^⚠️\s*/, '');
        logWarn('legacy.warn', { message: cleanMsg, ...data }, traceId);
      },
      error: (msg, data = {}) => {
        const cleanMsg = msg.replace(/^❌\s*/, '');
        logError('legacy.error', { message: cleanMsg, ...data }, traceId);
      }
    };
  }
}

export default {
  generateTraceId,
  logStructured,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logFlowStart,
  logFlowComplete,
  logFlowError,
  logFirebaseOp,
  logAIResponse,
  LegacyLogger
};
