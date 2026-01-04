/**
 * Session Manager
 * Maneja el estado conversacional de cada usuario
 * Soporta múltiples flujos simultáneos
 */

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutos de inactividad
    this.INACTIVITY_WARNING_TIME = 5 * 60 * 1000; // 5 minutos para aviso de inactividad
    this.startCleanupInterval();
  }

  /**
   * Obtener o crear sesión para un usuario
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
    }

    const session = this.sessions.get(userId);
    session.lastActivity = Date.now();
    session.inactivityWarningShown = false; // Reset cuando hay actividad
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
    return session.flowData;
  }

  /**
   * Añadir mensaje al historial de conversación
   */
  addToHistory(userId, role, content, metadata = {}) {
    const session = this.getSession(userId);
    session.conversationHistory.push({
      timestamp: new Date().toISOString(),
      role, // 'user' | 'assistant'
      content,
      metadata
    });

    // Limitar historial a últimos 50 mensajes
    if (session.conversationHistory.length > 50) {
      session.conversationHistory.shift();
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
   * Limpiar sesión actual (terminar flujo)
   */
  clearFlow(userId) {
    const session = this.getSession(userId);
    session.currentFlow = null;
    session.flowData = {};
  }

  /**
   * Terminar sesión completamente
   */
  endSession(userId) {
    this.sessions.delete(userId);
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
          console.log(`Sesión expirada para usuario: ${userId}`);
          this.sessions.delete(userId);
        }
      }
    }, 5 * 60 * 1000); // Limpiar cada 5 minutos
  }

  /**
   * Guardar metadatos de la sesión
   */
  setMetadata(userId, key, value) {
    const session = this.getSession(userId);
    session.metadata[key] = value;
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
   * Retorna: null si activa, 'warning' si necesita aviso, 'expired' si expirada
   */
  checkInactivity(userId) {
    const session = this.getSession(userId);
    const now = Date.now();
    const inactiveTime = now - session.lastActivity;

    // Si ha pasado el timeout completo, la sesión expiró
    if (inactiveTime > this.SESSION_TIMEOUT) {
      return 'expired';
    }

    // Si ha pasado 5 minutos y no se mostró el aviso
    if (inactiveTime > this.INACTIVITY_WARNING_TIME && !session.inactivityWarningShown) {
      return 'warning';
    }

    return null; // Sesión activa
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
