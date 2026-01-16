/**
 * Dashboard Service
 * Recopila métricas del bot para visualización
 */

import * as firebaseService from './firebaseService.js';
import sessionManager from './sessionManager.js';

/**
 * Obtener métricas operacionales (Tech Tecnic Admin)
 */
export async function getAdminMetrics(tenantId = 'techtecnic') {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      tenantId,
      
      // Sesiones activas
      sessions: {
        active: sessionManager.getActiveSessions ? sessionManager.getActiveSessions() : 0,
        total: 0
      },
      
      // Conversaciones (últimas 24h)
      conversations: {
        total: 0,
        byFlow: {
          appointment: 0,
          quotation: 0,
          assistant: 0,
          sales: 0,
          humanHandoff: 0
        }
      },
      
      // Leads (últimas 24h)
      leads: {
        total: 0,
        byState: {
          nurture: 0,
          qualify: 0,
          schedule: 0,
          handoff: 0
        },
        averageScore: 0
      },
      
      // Citas agendadas
      appointments: {
        today: 0,
        thisWeek: 0,
        pending: 0
      },
      
      // Cotizaciones
      quotations: {
        today: 0,
        thisWeek: 0,
        accepted: 0,
        pending: 0
      },
      
      // Escalaciones
      handoffs: {
        today: 0,
        pending: 0,
        byPriority: {
          alta: 0,
          media: 0,
          baja: 0
        }
      },
      
      // Performance
      performance: {
        avgResponseTime: 0,
        messagesPerHour: 0,
        aiUsage: 0
      }
    };
    
    // Obtener datos de Firebase si está disponible
    if (firebaseService.isFirebaseAvailable) {
      try {
        // Conversaciones últimas 24h
        const conversations = await firebaseService.getRecentConversations(tenantId, 24);
        if (conversations && Array.isArray(conversations)) {
          metrics.conversations.total = conversations.length;
        }
        
        // Leads recientes
        const leads = await firebaseService.getRecentLeads?.(tenantId, 24);
        if (leads && Array.isArray(leads)) {
          metrics.leads.total = leads.length;
          
          // Calcular distribución por estado
          leads.forEach(lead => {
            const state = lead.state || 'nurture';
            if (metrics.leads.byState[state] !== undefined) {
              metrics.leads.byState[state]++;
            }
          });
          
          // Calcular score promedio
          const scores = leads.filter(l => l.score).map(l => l.score);
          if (scores.length > 0) {
            metrics.leads.averageScore = Math.round(
              scores.reduce((sum, s) => sum + s, 0) / scores.length
            );
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching Firebase data:', error.message);
      }
    }
    
    return metrics;
    
  } catch (error) {
    console.error('[Dashboard] Error getting admin metrics:', error);
    throw error;
  }
}

/**
 * Obtener métricas de cliente específico
 */
export async function getClientMetrics(phoneNumber, tenantId = 'techtecnic') {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      phoneNumber,
      tenantId,
      
      // Información del cliente
      client: {
        name: '',
        phone: phoneNumber,
        firstContact: null,
        lastContact: null,
        totalInteractions: 0
      },
      
      // Conversaciones
      conversations: {
        total: 0,
        lastMessages: []
      },
      
      // Citas
      appointments: {
        total: 0,
        upcoming: [],
        completed: []
      },
      
      // Cotizaciones
      quotations: {
        total: 0,
        pending: [],
        accepted: []
      },
      
      // Lead info
      lead: {
        score: 0,
        state: 'unknown',
        interests: []
      }
    };
    
    // Obtener datos de Firebase
    if (firebaseService.isFirebaseAvailable) {
      try {
        // Perfil del cliente
        const profile = await firebaseService.getClientProfile?.(phoneNumber);
        if (profile) {
          metrics.client.name = profile.firstName || 'Cliente';
          metrics.client.firstContact = profile.createdAt;
          metrics.client.lastContact = profile.lastInteraction;
          metrics.client.totalInteractions = profile.interactionCount || 0;
        }
        
        // Conversaciones
        const conversations = await firebaseService.getUserConversations(phoneNumber, 10);
        if (conversations && Array.isArray(conversations)) {
          metrics.conversations.total = conversations.length;
          metrics.conversations.lastMessages = conversations.slice(0, 5).map(conv => ({
            role: conv.role,
            content: conv.content?.substring(0, 100),
            timestamp: conv.timestamp
          }));
        }
        
        // Citas (desde Google Sheets si está disponible)
        // Cotizaciones (desde Google Sheets si está disponible)
        
      } catch (error) {
        console.error('[Dashboard] Error fetching client data:', error.message);
      }
    }
    
    return metrics;
    
  } catch (error) {
    console.error('[Dashboard] Error getting client metrics:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de servicios
 */
export async function getServiceStats(tenantId = 'techtecnic') {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      services: [
        { key: 'desarrollo_web', name: 'Desarrollo Web', requests: 0, conversions: 0 },
        { key: 'chatbot', name: 'Chatbots & Automatización', requests: 0, conversions: 0 },
        { key: 'integraciones', name: 'Integraciones & APIs', requests: 0, conversions: 0 },
        { key: 'ecommerce', name: 'E-commerce', requests: 0, conversions: 0 },
        { key: 'apps_moviles', name: 'Apps Móviles', requests: 0, conversions: 0 }
      ]
    };
    
    // Aquí podrías obtener datos reales de Firebase
    // Por ahora retorna estructura base
    
    return stats;
    
  } catch (error) {
    console.error('[Dashboard] Error getting service stats:', error);
    throw error;
  }
}

export default {
  getAdminMetrics,
  getClientMetrics,
  getServiceStats
};
