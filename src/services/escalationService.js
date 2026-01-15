/**
 * Escalation Service
 * Detecta y registra escalaciones en Google Sheets
 * 
 * Condiciones de escalación:
 * - Más de 3 interacciones (mensajes) en la conversación
 * - Usuario está haciendo preguntas sobre proyectos/servicios a la IA
 */

import sessionManager from './sessionManager.js';
import googleSheetsService from './googleSheetsService.js';
import { getAuthClient, addRowToSheet } from './googleSheetsService.js';

class EscalationService {
  /**
   * Verificar si se debe crear una escalación
   * Retorna true si se deben cumplir las condiciones
   */
  shouldEscalate(userId) {
    const session = sessionManager.getSession(userId);
    const interactionCount = session.conversationHistory.length;

    console.log(`📊 Verificando escalación para ${userId}:`);
    console.log(`   - Interacciones: ${interactionCount}`);
    console.log(`   - Flujo actual: ${session.currentFlow}`);

    // Condición 1: Más de 3 interacciones
    if (interactionCount <= 3) {
      console.log(`   ❌ No hay suficientes interacciones (necesita >3, tiene ${interactionCount})`);
      return false;
    }

    // Condición 2: Usuario está en flujo de asistente (preguntas sobre proyectos)
    if (session.currentFlow !== 'assistant') {
      console.log(`   ❌ No está en flujo de asistente (está en: ${session.currentFlow})`);
      return false;
    }

    console.log(`   ✅ Cumple condiciones de escalación`);
    return true;
  }

  /**
   * Generar resumen de la conversación
   */
  generateSummary(userId) {
    const session = sessionManager.getSession(userId);
    const history = session.conversationHistory;

    if (history.length === 0) return 'Sin conversación';

    // Tomar las últimas 3-4 interacciones del usuario para hacer un resumen
    const userMessages = history
      .filter(msg => msg.role === 'user')
      .slice(-3)
      .map(msg => msg.content)
      .join(' | ');

    // Limitar a 150 caracteres
    const summary = userMessages.length > 150 
      ? userMessages.substring(0, 150) + '...'
      : userMessages;

    return summary;
  }

  /**
   * Crear escalación en Google Sheets
   */
  async createEscalation(userId, rating = 'Media') {
    try {
      const session = sessionManager.getSession(userId);
      const clientName = sessionManager.getMetadata(userId, 'clientName') || 'Cliente';
      const phone = sessionManager.getMetadata(userId, 'phone') || 'N/A';
      const summary = this.generateSummary(userId);

      const timestamp = new Date().toISOString();

      // Preparar datos para Google Sheets
      const escalationData = [
        timestamp,                  // Timestamp
        clientName,                 // Nombre
        phone,                      // Teléfono
        summary,                    // Resumen
        rating,                     // Calificación
        'Pendiente'                 // Estado
      ];

      console.log(`\n📤 Registrando escalación en Google Sheets:`);
      console.log(`   - Nombre: ${clientName}`);
      console.log(`   - Teléfono: ${phone}`);
      console.log(`   - Resumen: ${summary}`);
      console.log(`   - Calificación: ${rating}`);

      // Usar la función de googleSheetsService para agregar a la hoja de escalados
      const auth = await getAuthClient();
      await addRowToSheet(auth, 'escalados', escalationData);

      console.log(`   ✅ Escalación registrada exitosamente`);
      return true;
    } catch (error) {
      console.error('❌ Error registrando escalación:', error.message);
      throw error;
    }
  }

  /**
   * Obtener la última escalación registrada
   */
  async getLastEscalation() {
    try {
      const auth = await getAuthClient();
      // Esta es una función que podría existir en googleSheetsService
      // Por ahora retornamos null
      return null;
    } catch (error) {
      console.error('Error obteniendo última escalación:', error);
      return null;
    }
  }
}

export default new EscalationService();
