/**
 * Session Manager v2 - Con soporte Firebase + fallback memoria
 * Maneja estado conversacional con persistencia en Firebase
 * Si Firebase no está disponible, usa memoria RAM (fallback)
 */

import * as firebaseService from './firebaseService.js';
import { isFirebaseAvailable } from './firebaseService.js';

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
        metadata: {}
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
  setFlow(userId, flowType, initialData = {}) {
    const session = this.getSession(userId);
    session.currentFlow = flowType;
    session.flowData = initialData;
    session.lastActivity = Date.now();
    
    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session).catch(err => {
        console.warn('Aviso: No se pudo guardar flujo en Firebase:', err.message);
      });
    }
    
    return session;
  }

  /**
   * Actualizar datos del flujo actual
   */
  updateFlowData(userId, updates) {
    const session = this.getSession(userId);
    session.flowData = {
      ...session.flowData,
      ...updates
    };
    session.lastActivity = Date.now();

    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session).catch(err => {
        console.warn('Aviso: No se pudo actualizar flujo en Firebase:', err.message);
      });
    }

    return session.flowData;
  }

  /**
   * Añadir mensaje al historial de conversación
   */
  addToHistory(userId, role, content, metadata = {}) {
    const session = this.getSession(userId);
    session.conversationHistory.push({
      timestamp: new Date().toISOString(),
      role,
      content,
      metadata
    });

    // Limitar historial a últimos 50 mensajes
    if (session.conversationHistory.length > 50) {
      session.conversationHistory.shift();
    }

    session.lastActivity = Date.now();

    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session).catch(err => {
        console.warn('Aviso: No se pudo guardar historial en Firebase:', err.message);
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
  clearFlow(userId) {
    const session = this.getSession(userId);
    session.currentFlow = null;
    session.flowData = {};
    session.lastActivity = Date.now();

    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session).catch(err => {
        console.warn('Aviso: No se pudo limpiar flujo en Firebase:', err.message);
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
          this.sessions.delete(userId);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Guardar metadatos de la sesión
   */
  setMetadata(userId, key, value) {
    const session = this.getSession(userId);
    session.metadata[key] = value;
    session.lastActivity = Date.now();

    // Guardar en Firebase
    if (this.useFirebase) {
      firebaseService.saveSession(userId, session).catch(err => {
        console.warn('Aviso: No se pudo guardar metadata en Firebase:', err.message);
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
