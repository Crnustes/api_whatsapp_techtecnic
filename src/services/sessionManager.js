/**
 * Session Manager v2 - Con soporte Firebase + fallback memoria
 * Maneja estado conversacional con persistencia en Firebase
 * Si Firebase no está disponible, usa memoria RAM (fallback)
 * Incluye soporte para idempotencia por messageId
 */

import crypto from 'crypto';
import * as firebaseService from './firebaseService.js';
import { isFirebaseAvailable } from './firebaseService.js';
import { logInfo, logWarn, logDebug } from '../utils/logger.js';

/**
 * Generar hash de mensaje si no hay messageId disponible
 * Basado en: from + timestamp + body (primeros 100 chars)
 */
function generateMessageHash(from, timestamp, body) {
  const content = `${from}:${timestamp}:${(body || '').substring(0, 100)}`;
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Obtener messageId válido (usa WhatsApp ID o genera hash)
 */
function getMessageId(whatsappMessageId, from, timestamp, body) {
  if (whatsappMessageId && whatsappMessageId.trim()) {
    return whatsappMessageId;
  }
  // Fallback: generar hash
  return `hash_${generateMessageHash(from, timestamp, body)}`;
}

class SessionManager {
  constructor() {
    this.sessions = new Map(); // Cache en memoria
    this.SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutos
    this.INACTIVITY_WARNING_TIME = 5 * 60 * 1000; // 5 minutos
    this.useFirebase = isFirebaseAvailable();
    
    if (this.useFirebase) {
      console.log('✅ SessionManager usando Firebase para persistencia');
    } else {
      console.log('⚠️ SessionManager usando RAM (sin persistencia)');
    }
    
    this.startCleanupInterval();
  }

  /**
   * Verificar si un mensaje ya fue procesado (idempotencia)
   * @returns {boolean} true si es duplicado, false si es nuevo
   */
  isDuplicateMessage(userId, messageId) {
    const session = this.getSession(userId);
    return session.lastProcessedMessageId === messageId;
  }

  /**
   * Guardar messageId procesado para verificar duplicados
   */
  recordProcessedMessage(userId, messageId, traceId = null) {
    const session = this.getSession(userId);
    session.lastProcessedMessageId = messageId;
    session.lastProcessedAt = Date.now();
    session.lastActivity = Date.now();

    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session, traceId).catch(err => {
        logWarn('session.idempotence_record_failed', { 
          error: err.message, 
          messageId 
        }, traceId);
      });
    }
  }

  /**
   * Obtener último messageId procesado (para debugging)
   */
  getLastProcessedMessage(userId) {
    const session = this.getSession(userId);
    return {
      messageId: session.lastProcessedMessageId,
      processedAt: session.lastProcessedAt
    };
  }

  /**
   * Obtener o crear sesión
   */
  getSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        userId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        inactivityWarningShown: false,
        currentFlow: null,
        flowData: {},
        conversationHistory: [],
        metadata: {},
        lastProcessedMessageId: null,
        lastProcessedAt: null
      });
      
      // Guardar en Firebase si está disponible
      if (this.useFirebase) {
        const session = this.sessions.get(userId);
        firebaseService.saveSession(userId, session).catch(err => {
          console.warn('Aviso: No se pudo guardar sesión en Firebase:', err.message);
        });
      }
    }

    const session = this.sessions.get(userId);
    session.lastActivity = Date.now();
    session.inactivityWarningShown = false;
    return session;
  }

  /**
   * Obtener datos del flujo actual
   */
  getFlowData(userId) {
    const session = this.getSession(userId);
    return session.flowData;
  }

  /**
   * Establecer flujo actual y datos iniciales
   */
  setFlow(userId, flowType, initialData = {}, traceId = null) {
    const session = this.getSession(userId);
    session.currentFlow = flowType;
    session.flowData = initialData;
    session.lastActivity = Date.now();
    
    logInfo('session.flow_set', { userId, flowType }, traceId);
    
    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session, traceId).catch(err => {
        logWarn('session.firebase_save_failed', { error: err.message }, traceId);
      });
    }
    
    return session;
  }

  /**
   * Actualizar datos del flujo actual
   */
  updateFlowData(userId, updates, traceId = null) {
    const session = this.getSession(userId);
    session.flowData = {
      ...session.flowData,
      ...updates
    };
    session.lastActivity = Date.now();

    logDebug('session.flow_data_updated', { userId, flowDataKeys: Object.keys(updates) }, traceId);

    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session, traceId).catch(err => {
        logWarn('session.firebase_update_failed', { error: err.message }, traceId);
      });
    }

    return session.flowData;
  }

  /**
   * Añadir mensaje al historial de conversación
   */
  addToHistory(userId, role, content, metadata = {}, traceId = null) {
    const session = this.getSession(userId);
    session.conversationHistory.push({
      timestamp: new Date().toISOString(),
      role,
      content,
      metadata,
      traceId
    });

    // Limitar historial a últimos 50 mensajes
    if (session.conversationHistory.length > 50) {
      session.conversationHistory.shift();
    }

    session.lastActivity = Date.now();

    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session, traceId).catch(err => {
        logWarn('session.history_save_failed', { error: err.message }, traceId);
      });
    }
  }

  /**
   * Obtener historial de conversación (últimos N mensajes)
   */
  getHistory(userId, lastN = 10) {
    const session = this.getSession(userId);
    return session.conversationHistory.slice(-lastN);
  }

  /**
   * Obtener contexto para OpenAI (sistema + historial)
   */
  getConversationContext(userId) {
    return this.getHistory(userId, 8);
  }

  /**
   * Limpiar flujo (pero mantener sesión)
   */
  clearFlow(userId, traceId = null) {
    const session = this.getSession(userId);
    const previousFlow = session.currentFlow;
    session.currentFlow = null;
    session.flowData = {};
    session.lastActivity = Date.now();

    logInfo('session.flow_cleared', { userId, previousFlow }, traceId);

    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session, traceId).catch(err => {
        logWarn('session.clear_flow_failed', { error: err.message }, traceId);
      });
    }
  }

  /**
   * Terminar sesión completamente
   */
  endSession(userId) {
    this.sessions.delete(userId);

    if (this.useFirebase) {
      firebaseService.deleteSession(userId).catch(err => {
        console.warn('Aviso: No se pudo eliminar sesión de Firebase:', err.message);
      });
    }
  }

  /**
   * Obtener estado actual de la sesión
   */
  getSessionStatus(userId) {
    const session = this.getSession(userId);
    return {
      userId,
      currentFlow: session.currentFlow,
      flowStage: session.flowData.step,
      messageCount: session.conversationHistory.length,
      duration: Date.now() - session.createdAt,
      lastActivity: Date.now() - session.lastActivity
    };
  }

  /**
   * Limpiar sesiones expiradas
   */
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [userId, session] of this.sessions.entries()) {
        if (now - session.lastActivity > this.SESSION_TIMEOUT) {
          console.log(`🧹 Limpiando sesión inactiva: ${userId}`);
          // Limpiar también de Firebase
          if (this.useFirebase) {
            firebaseService.deleteSession(userId).catch(err => {
              console.warn(`Aviso: No se pudo limpiar ${userId} de Firebase:`, err.message);
            });
          }
          this.sessions.delete(userId);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Guardar metadatos de la sesión
   */
  setMetadata(userId, key, value, traceId = null) {
    const session = this.getSession(userId);
    session.metadata[key] = value;
    session.lastActivity = Date.now();

    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session, traceId).catch(err => {
        logWarn('session.metadata_save_failed', { error: err.message, key }, traceId);
      });
    }
  }

  /**
   * Obtener metadatos
   */
  getMetadata(userId, key) {
    const session = this.getSession(userId);
    return key ? session.metadata[key] : session.metadata;
  }

  /**
   * Verificar inactividad y retornar estado
   */
  checkInactivity(userId) {
    const session = this.getSession(userId);
    const now = Date.now();
    const inactiveTime = now - session.lastActivity;

    if (inactiveTime > this.SESSION_TIMEOUT) {
      return 'expired';
    }

    if (inactiveTime > this.INACTIVITY_WARNING_TIME && !session.inactivityWarningShown) {
      return 'warning';
    }

    return null;
  }

  /**
   * Marcar que se mostró aviso de inactividad
   */
  markInactivityWarningShown(userId) {
    const session = this.getSession(userId);
    session.inactivityWarningShown = true;
  }

  /**
   * Estadísticas globales (para debugging)
   */
  getStats() {
    const stats = {
      totalSessions: this.sessions.size,
      firebaseEnabled: this.useFirebase,
      sessions: []
    };

    for (const [userId, session] of this.sessions.entries()) {
      stats.sessions.push({
        userId,
        flow: session.currentFlow,
        messages: session.conversationHistory.length,
        created: new Date(session.createdAt).toISOString()
      });
    }

    return stats;
  }
}

export default new SessionManager();

// Exportar utilidades de idempotencia para usar en webhookController
export { getMessageId, generateMessageHash };
