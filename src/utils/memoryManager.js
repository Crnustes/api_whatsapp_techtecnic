/**
 * Memory Manager - Gestiona resúmenes y facts del cliente
 * 
 * Estructura de memoria persistente:
 * - summary: texto 1-5 líneas (quién es, qué quiere, en qué quedó)
 * - facts: objeto con datos confirmados {nombre, email, empresa, servicio, presupuesto, urgencia}
 * - recentTurns: últimos 4-8 turnos (cargados de Firebase)
 * - updatedAt: timestamp de última actualización
 */

import * as firebaseService from '../services/firebaseService.js';
import { logEvent } from './eventLogger.js';

/**
 * ESTRUCTURAS DE DATOS
 */

export const MEMORY_STRUCTURE = {
  summary: {
    type: 'string',
    maxLength: 500,
    description: '1-5 líneas: quién es el cliente, qué busca, en qué quedó'
  },
  facts: {
    type: 'object',
    schema: {
      nombre: { type: 'string', required: false },
      email: { type: 'string', required: false },
      empresa: { type: 'string', required: false },
      telefono: { type: 'string', required: false },
      servicio: { type: 'string', enum: ['desarrollo_web', 'ecommerce', 'chatbot', 'app_movil', 'integraciones', 'seo', 'ia', 'mantenimiento'], required: false },
      presupuesto: { type: 'string', enum: ['bajo', 'medio', 'alto', 'sin_especificar'], required: false },
      urgencia: { type: 'string', enum: ['baja', 'media', 'alta', 'critica', 'sin_especificar'], required: false },
      objetivo: { type: 'string', required: false },
      restricciones: { type: 'string', required: false },
      proximoPaso: { type: 'string', required: false }
    }
  },
  recentTurns: {
    type: 'array',
    maxItems: 8,
    items: {
      role: { type: 'string', enum: ['user', 'assistant'] },
      content: { type: 'string' },
      timestamp: { type: 'number' }
    }
  },
  updatedAt: {
    type: 'number',
    description: 'Timestamp de última actualización'
  }
};

/**
 * Memory Object - Estructura canónica
 */
export function createEmptyMemory() {
  return {
    summary: '',
    facts: {
      nombre: null,
      email: null,
      empresa: null,
      telefono: null,
      servicio: null,
      presupuesto: null,
      urgencia: null,
      objetivo: null,
      restricciones: null,
      proximoPaso: null
    },
    recentTurns: [],
    updatedAt: null
  };
}

/**
 * Validar estructura de memoria
 */
export function validateMemory(memory) {
  const errors = [];

  if (typeof memory.summary !== 'string') {
    errors.push('summary debe ser string');
  }
  if (memory.summary.length > 500) {
    errors.push('summary no puede exceder 500 caracteres');
  }

  if (!memory.facts || typeof memory.facts !== 'object') {
    errors.push('facts debe ser object');
  }

  if (!Array.isArray(memory.recentTurns)) {
    errors.push('recentTurns debe ser array');
  }
  if (memory.recentTurns.length > 8) {
    errors.push('recentTurns no puede exceder 8 turnos');
  }

  if (errors.length > 0) {
    throw new Error(`Memoria inválida:\n  - ${errors.join('\n  - ')}`);
  }

  return true;
}

/**
 * Cargar memoria desde Firebase
 * @param {string} userId
 * @returns {object} Memory object
 */
export async function loadMemory(userId, traceId = null) {
  try {
    if (!firebaseService.isFirebaseAvailable) {
      logEvent('debug', 'memory.firebase_unavailable', { traceId }, { userId });
      return createEmptyMemory();
    }

    // Intentar cargar de clientProfiles (memoria persistente)
    const clientProfile = await firebaseService.getClientProfile(userId);
    
    if (clientProfile?.memory) {
      logEvent('debug', 'memory.loaded_from_profile', { traceId }, {
        userId,
        hasSummary: !!clientProfile.memory.summary,
        factsCount: Object.keys(clientProfile.memory.facts || {}).filter(k => clientProfile.memory.facts[k]).length
      });
      
      return {
        summary: clientProfile.memory.summary || '',
        facts: clientProfile.memory.facts || {},
        recentTurns: [], // Se cargarán de conversations si es necesario
        updatedAt: clientProfile.memory.updatedAt || null
      };
    }

    return createEmptyMemory();
  } catch (error) {
    logEvent('warn', 'memory.load_failed', { traceId }, {
      error: error.message
    });
    return createEmptyMemory();
  }
}

/**
 * Guardar memoria en Firebase
 * @param {string} userId
 * @param {object} memory
 * @param {string} traceId
 */
export async function saveMemory(userId, memory, traceId = null) {
  try {
    validateMemory(memory);

    if (!firebaseService.isFirebaseAvailable) {
      logEvent('warn', 'memory.firebase_unavailable_for_save', { traceId }, { userId });
      return false;
    }

    // Guardar en clientProfiles/userId/memory
    const memoryToSave = {
      summary: memory.summary,
      facts: memory.facts,
      updatedAt: Date.now()
    };

    await firebaseService.saveClientProfile(userId, {
      memory: memoryToSave
    }, traceId);

    logEvent('info', 'memory.saved', { traceId }, {
      userId,
      summaryLength: memory.summary.length,
      factsUpdated: Object.keys(memory.facts).filter(k => memory.facts[k]).length
    });

    return true;
  } catch (error) {
    logEvent('error', 'memory.save_failed', { traceId }, {
      error: error.message
    });
    return false;
  }
}

/**
 * Cargar recent turns (últimos 4-8 mensajes)
 * @param {string} userId
 * @param {number} limit - Cuántos turnos cargar (default 6)
 */
export async function loadRecentTurns(userId, limit = 6, traceId = null) {
  try {
    if (!firebaseService.isFirebaseAvailable) {
      return [];
    }

    const userPhone = await firebaseService.getClientProfile(userId).then(p => p?.phoneNumber);
    if (!userPhone) {
      return [];
    }

    const conversations = await firebaseService.getUserConversations(userPhone, limit);
    
    if (!Array.isArray(conversations)) {
      return [];
    }

    const turns = conversations.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || '',
      timestamp: msg.timestamp || Date.now()
    }));

    logEvent('debug', 'memory.recent_turns_loaded', { traceId }, {
      userId,
      turnsLoaded: turns.length
    });

    return turns;
  } catch (error) {
    logEvent('warn', 'memory.recent_turns_load_failed', { traceId }, {
      error: error.message
    });
    return [];
  }
}

/**
 * Obtener contexto completo para OpenAI
 * Combina: summary + facts + recent turns
 */
export async function getMemoryContext(userId, traceId = null) {
  const memory = await loadMemory(userId, traceId);
  const recentTurns = await loadRecentTurns(userId, 6, traceId);
  
  memory.recentTurns = recentTurns;

  return memory;
}

/**
 * Parsear respuesta de OpenAI (debe ser JSON)
 * Esperado: { summary: string, factsToSet: object, factsToUnset: array }
 */
export function parseMemoryUpdate(openaiResponse) {
  try {
    // Buscar JSON en la respuesta
    const jsonMatch = openaiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      summary: parsed.summary || '',
      factsToSet: parsed.factsToSet || {},
      factsToUnset: parsed.factsToUnset || [],
      raw: parsed
    };
  } catch (error) {
    logEvent('error', 'memory.parse_update_failed', {}, {
      error: error.message
    });
    throw error;
  }
}

/**
 * Aplicar actualizaciones a la memoria
 * @param {object} memory - Memoria actual
 * @param {object} update - { summary, factsToSet, factsToUnset }
 * @returns {object} Memoria actualizada
 */
export function applyMemoryUpdate(memory, update) {
  const updated = { ...memory };

  // Actualizar summary
  if (update.summary && update.summary.trim()) {
    updated.summary = update.summary;
  }

  // Establecer facts
  if (update.factsToSet && typeof update.factsToSet === 'object') {
    updated.facts = {
      ...updated.facts,
      ...update.factsToSet
    };
  }

  // Desestablecer facts (poner null)
  if (Array.isArray(update.factsToUnset)) {
    for (const key of update.factsToUnset) {
      updated.facts[key] = null;
    }
  }

  updated.updatedAt = Date.now();

  return updated;
}

/**
 * Extraer contexto para prompt (mini resumen para OpenAI)
 * Se envía al modelo para que genere la actualización
 */
export function formatMemoryForPrompt(memory) {
  const factsSummary = Object.entries(memory.facts)
    .filter(([k, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const recentText = memory.recentTurns
    .map(t => `${t.role === 'user' ? '👤' : '🤖'}: ${t.content}`)
    .join('\n');

  return `
CONTEXTO ACTUAL:
${memory.summary ? `Resumen: ${memory.summary}` : 'Sin resumen'}

${factsSummary ? `Datos confirmados:\n${factsSummary}` : 'Sin datos confirmados'}

Últimos turnos:
${recentText || 'Sin conversación reciente'}
`;
}

/**
 * Comparar memorias (para debugging/auditoría)
 */
export function diffMemories(oldMemory, newMemory) {
  const changes = [];

  if (oldMemory.summary !== newMemory.summary) {
    changes.push({
      field: 'summary',
      old: oldMemory.summary.substring(0, 50),
      new: newMemory.summary.substring(0, 50)
    });
  }

  const oldFacts = JSON.stringify(oldMemory.facts);
  const newFacts = JSON.stringify(newMemory.facts);
  
  if (oldFacts !== newFacts) {
    changes.push({
      field: 'facts',
      changed: Object.keys(newMemory.facts).filter(
        k => JSON.stringify(oldMemory.facts[k]) !== JSON.stringify(newMemory.facts[k])
      )
    });
  }

  return changes;
}

/**
 * Resumen de memoria para logging
 */
export function getMemorySummary(memory) {
  return {
    summaryLength: memory.summary.length,
    factsSet: Object.keys(memory.facts).filter(k => memory.facts[k] !== null).length,
    recentTurns: memory.recentTurns.length,
    lastUpdated: memory.updatedAt ? new Date(memory.updatedAt).toISOString() : 'nunca'
  };
}

/**
 * Limpiar memoria (para debugging)
 */
export function clearMemory(userId, traceId = null) {
  logEvent('warn', 'memory.cleared', { traceId }, { userId });
  return createEmptyMemory();
}

/**
 * Validar que facts tiene datos útiles
 */
export function hasMinimalFacts(facts) {
  const required = Object.keys(facts).filter(k => facts[k] !== null);
  return required.length >= 1; // Al menos 1 fact
}

/**
 * Extraer mention de facts para prompt
 * Ej: "nombre: Juan, email: juan@x.com"
 */
export function formatFactsForMention(facts) {
  return Object.entries(facts)
    .filter(([k, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ') || '(sin datos confirmados)';
}
