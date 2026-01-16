/**
 * Trace Context - Sistema de trazabilidad end-to-end
 * Crea y mantiene contexto de trace para un request completo
 * 
 * Uso:
 * const ctx = createTraceContext(userId, messageId);
 * ctx.setFlow('quotation', 'description');
 * ctx.setIntent('request_quotation');
 * ctx.recordLatency('firebase_write', startTime);
 * ctx.log('info', 'webhook.processed');
 */

import crypto from 'crypto';
import { logStructured } from './logger.js';

/**
 * Crear contexto de trace para un request
 * @param {string} userId - ID del usuario (número WhatsApp)
 * @param {string} messageId - ID del mensaje de WhatsApp
 * @param {object} metadata - Metadata adicional
 * @returns {TraceContext} Contexto de trace
 */
export const createTraceContext = (userId, messageId, metadata = {}) => {
  const traceId = crypto.randomUUID();
  const startTime = Date.now();
  
  const context = {
    // Identificadores
    traceId,
    userId,
    messageId,
    
    // Timestamps
    startTime,
    endTime: null,
    
    // Estado conversacional
    flow: null,
    step: null,
    intent: null,
    messageType: null,
    
    // Métricas de operaciones
    operations: {
      firebase: { attempted: false, success: false, latencyMs: null, errorCode: null },
      sheets: { attempted: false, success: false, latencyMs: null, errorCode: null },
      openai: { attempted: false, success: false, latencyMs: null, tokenCount: null, errorCode: null }
    },
    
    // Metadata adicional
    metadata: {
      ...metadata,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    
    // Eventos registrados
    events: []
  };
  
  return new TraceContext(context);
};

/**
 * Clase TraceContext - Encapsula lógica de trace
 */
class TraceContext {
  constructor(context) {
    this._context = context;
  }
  
  /**
   * Obtener traceId
   */
  get traceId() {
    return this._context.traceId;
  }
  
  /**
   * Obtener userId
   */
  get userId() {
    return this._context.userId;
  }
  
  /**
   * Establecer flow y step actual
   */
  setFlow(flowName, stepName = null) {
    this._context.flow = flowName;
    this._context.step = stepName;
    return this;
  }
  
  /**
   * Establecer intent detectado
   */
  setIntent(intent) {
    this._context.intent = intent;
    return this;
  }
  
  /**
   * Establecer tipo de mensaje
   */
  setMessageType(type) {
    this._context.messageType = type;
    return this;
  }
  
  /**
   * Agregar metadata
   */
  addMetadata(key, value) {
    this._context.metadata[key] = value;
    return this;
  }
  
  /**
   * Registrar inicio de operación Firebase
   */
  startFirebaseOp() {
    this._context.operations.firebase.attempted = true;
    this._context.operations.firebase._startTime = Date.now();
    return this;
  }
  
  /**
   * Registrar éxito de operación Firebase
   */
  firebaseSuccess() {
    const op = this._context.operations.firebase;
    op.success = true;
    if (op._startTime) {
      op.latencyMs = Date.now() - op._startTime;
      delete op._startTime;
    }
    return this;
  }
  
  /**
   * Registrar error de operación Firebase
   */
  firebaseError(errorCode) {
    const op = this._context.operations.firebase;
    op.success = false;
    op.errorCode = errorCode;
    if (op._startTime) {
      op.latencyMs = Date.now() - op._startTime;
      delete op._startTime;
    }
    return this;
  }
  
  /**
   * Registrar inicio de operación Sheets
   */
  startSheetsOp() {
    this._context.operations.sheets.attempted = true;
    this._context.operations.sheets._startTime = Date.now();
    return this;
  }
  
  /**
   * Registrar éxito de operación Sheets
   */
  sheetsSuccess() {
    const op = this._context.operations.sheets;
    op.success = true;
    if (op._startTime) {
      op.latencyMs = Date.now() - op._startTime;
      delete op._startTime;
    }
    return this;
  }
  
  /**
   * Registrar error de operación Sheets
   */
  sheetsError(errorCode) {
    const op = this._context.operations.sheets;
    op.success = false;
    op.errorCode = errorCode;
    if (op._startTime) {
      op.latencyMs = Date.now() - op._startTime;
      delete op._startTime;
    }
    return this;
  }
  
  /**
   * Registrar inicio de operación OpenAI
   */
  startOpenAIOp() {
    this._context.operations.openai.attempted = true;
    this._context.operations.openai._startTime = Date.now();
    return this;
  }
  
  /**
   * Registrar éxito de operación OpenAI
   */
  openAISuccess(tokenCount = null) {
    const op = this._context.operations.openai;
    op.success = true;
    op.tokenCount = tokenCount;
    if (op._startTime) {
      op.latencyMs = Date.now() - op._startTime;
      delete op._startTime;
    }
    return this;
  }
  
  /**
   * Registrar error de operación OpenAI
   */
  openAIError(errorCode) {
    const op = this._context.operations.openai;
    op.success = false;
    op.errorCode = errorCode;
    if (op._startTime) {
      op.latencyMs = Date.now() - op._startTime;
      delete op._startTime;
    }
    return this;
  }
  
  /**
   * Registrar latencia de operación custom
   */
  recordLatency(operation, startTimeMs) {
    const latency = Date.now() - startTimeMs;
    this._context.metadata[`${operation}_latency_ms`] = latency;
    return this;
  }
  
  /**
   * Loggear evento con contexto completo
   */
  log(level, eventName, additionalData = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      eventName
    };
    
    // Agregar al historial de eventos
    this._context.events.push(event);
    
    // Construir payload completo
    const payload = {
      // Identificadores
      traceId: this._context.traceId,
      userId: this._context.userId,
      messageId: this._context.messageId,
      
      // Estado
      flow: this._context.flow,
      step: this._context.step,
      intent: this._context.intent,
      messageType: this._context.messageType,
      
      // Métricas
      latencyMs: this._context.endTime 
        ? this._context.endTime - this._context.startTime 
        : Date.now() - this._context.startTime,
      
      // Operaciones
      firebaseWriteOk: this._context.operations.firebase.success,
      firebaseLatencyMs: this._context.operations.firebase.latencyMs,
      firebaseErrorCode: this._context.operations.firebase.errorCode,
      
      sheetsWriteOk: this._context.operations.sheets.success,
      sheetsLatencyMs: this._context.operations.sheets.latencyMs,
      sheetsErrorCode: this._context.operations.sheets.errorCode,
      
      openaiOk: this._context.operations.openai.success,
      openaiLatencyMs: this._context.operations.openai.latencyMs,
      openaiTokens: this._context.operations.openai.tokenCount,
      openaiErrorCode: this._context.operations.openai.errorCode,
      
      // Data adicional
      ...additionalData,
      
      // Metadata
      ...this._context.metadata
    };
    
    // Log estructurado
    logStructured(level, eventName, payload, this._context.traceId);
    
    return this;
  }
  
  /**
   * Finalizar trace
   */
  end() {
    this._context.endTime = Date.now();
    const totalLatency = this._context.endTime - this._context.startTime;
    
    this.log('info', 'trace.complete', {
      totalLatencyMs: totalLatency,
      eventsCount: this._context.events.length,
      opsAttempted: {
        firebase: this._context.operations.firebase.attempted,
        sheets: this._context.operations.sheets.attempted,
        openai: this._context.operations.openai.attempted
      }
    });
    
    return this;
  }
  
  /**
   * Obtener contexto completo (para debugging)
   */
  toJSON() {
    return {
      ...this._context,
      currentLatencyMs: Date.now() - this._context.startTime
    };
  }
  
  /**
   * Obtener solo traceId (para compatibilidad con código existente)
   */
  toString() {
    return this._context.traceId;
  }
}

export default { createTraceContext };
