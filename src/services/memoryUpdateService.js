/**
 * Memory Update Service - Integración end-to-end
 * 
 * Orquesta: load memoria → send to OpenAI → parse → apply → save
 * Diseñado para BAJA LATENCIA (puede ser async/background)
 */

import * as openAiService from '../services/openAiService.js';
import * as memoryManager from './memoryManager.js';
import * as memoryPrompts from './memoryPrompts.js';
import { logEvent } from './eventLogger.js';

/**
 * Actualizar memoria al final de cada interacción
 * 
 * FLUJO:
 * 1. Cargar memoria actual + recent turns
 * 2. Armar prompt con new message
 * 3. Llamar OpenAI (async)
 * 4. Parsear respuesta
 * 5. Aplicar cambios
 * 6. Guardar en Firebase (async)
 * 7. Loguear cambios
 */
export async function updateMemoryAsync(userId, userMessage, recentTurns = [], traceId = null) {
  const startTime = Date.now();

  try {
    logEvent('debug', 'memory.update_started', { traceId }, { userId });

    // 1. Cargar memoria
    const currentMemory = await memoryManager.loadMemory(userId, traceId);

    // 2. Generar prompt
    const prompt = memoryPrompts.generateMemoryUpdatePrompt(
      currentMemory,
      userMessage,
      recentTurns
    );

    const systemPrompt = memoryPrompts.MEMORY_SYSTEM_PROMPT;

    logEvent('debug', 'memory.openai_call_start', { traceId }, {
      userId,
      promptLength: prompt.length
    });

    // 3. Llamar OpenAI
    const response = await openAiService.generateCompletion(
      prompt,
      {
        system: systemPrompt,
        temperature: 0.3, // Más determinístico
        maxTokens: 500,
        format: 'json' // Si soporta JSON mode
      },
      traceId
    );

    logEvent('debug', 'memory.openai_response_received', { traceId }, {
      responseLength: response.length
    });

    // 4. Parsear respuesta
    const cleaned = memoryPrompts.cleanOpenAIResponse(response);
    const extracted = memoryPrompts.extractJSON(cleaned);
    const update = JSON.parse(extracted);

    memoryPrompts.validateMemoryUpdateJSON(update);

    // 5. Aplicar cambios
    const newMemory = memoryManager.applyMemoryUpdate(currentMemory, update);

    // 6. Comparar (para auditoría)
    const changes = memoryManager.diffMemories(currentMemory, newMemory);

    // 7. Guardar (async, no esperar)
    memoryManager.saveMemory(userId, newMemory, traceId).catch(err => {
      logEvent('error', 'memory.save_background_failed', { traceId }, {
        error: err.message
      });
    });

    const latency = Date.now() - startTime;

    logEvent('info', 'memory.updated', { traceId }, {
      userId,
      latency,
      changesCount: changes.length,
      summaryUpdated: changes.some(c => c.field === 'summary'),
      factsUpdated: changes.some(c => c.field === 'facts')
    });

    return {
      success: true,
      newMemory,
      changes,
      latency
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    logEvent('error', 'memory.update_failed', { traceId }, {
      userId,
      error: error.message,
      latency
    });

    // No fallar la conversación por error en memoria
    return {
      success: false,
      error: error.message,
      latency
    };
  }
}

/**
 * Versión síncrona (para testing o emergencias)
 * Retorna Promise pero usado en context sincrónico
 */
export async function updateMemorySync(userId, userMessage, recentTurns = [], traceId = null) {
  try {
    const result = await updateMemoryAsync(userId, userMessage, recentTurns, traceId);
    return result;
  } catch (error) {
    logEvent('error', 'memory.sync_update_failed', { traceId }, {
      error: error.message
    });
    throw error;
  }
}

/**
 * Ejecutar actualización en background (fire-and-forget)
 * Ideal para no impactar latencia
 */
export function updateMemoryBackground(userId, userMessage, recentTurns = [], traceId = null) {
  // No retornar promise, fire and forget
  updateMemoryAsync(userId, userMessage, recentTurns, traceId).catch(err => {
    logEvent('error', 'memory.background_update_failed', {}, {
      userId,
      error: err.message
    });
  });
  
  // Retornar inmediatamente
  logEvent('debug', 'memory.update_queued_background', { traceId }, { userId });
  return { queued: true, traceId };
}

/**
 * Actualizar memoria + incluirla en próximo prompt a OpenAI
 * 
 * FLUJO INTEGRADO:
 * 1. updateMemoryAsync (obtiene new memory)
 * 2. Construir contexto con new memory
 * 3. Usar en generación de respuesta siguiente
 */
export async function updateMemoryAndGetContext(userId, userMessage, recentTurns = [], traceId = null) {
  try {
    // Actualizar
    const updateResult = await updateMemoryAsync(userId, userMessage, recentTurns, traceId);

    if (!updateResult.success) {
      // Si no se pudo actualizar, cargar lo que hay
      const currentMemory = await memoryManager.loadMemory(userId, traceId);
      return memoryManager.formatMemoryForPrompt(currentMemory);
    }

    // Retornar formatted context con nueva memoria
    return memoryManager.formatMemoryForPrompt(updateResult.newMemory);
  } catch (error) {
    logEvent('warn', 'memory.context_fallback', { traceId }, {
      error: error.message
    });

    // Fallback: cargar memoria existente
    const memory = await memoryManager.loadMemory(userId, traceId);
    return memoryManager.formatMemoryForPrompt(memory);
  }
}

/**
 * UTILIDADES
 */

/**
 * Batch: actualizar memoria para múltiples usuarios
 */
export async function updateMemoryBatch(updates, traceId = null) {
  const results = [];

  for (const update of updates) {
    const result = await updateMemoryAsync(
      update.userId,
      update.userMessage,
      update.recentTurns || [],
      traceId
    );
    results.push({
      userId: update.userId,
      ...result
    });
  }

  return results;
}

/**
 * Refresh: re-leer memoria desde Firebase (después de delay)
 */
export async function refreshMemory(userId, delayMs = 100, traceId = null) {
  return new Promise(resolve => {
    setTimeout(async () => {
      const memory = await memoryManager.loadMemory(userId, traceId);
      logEvent('debug', 'memory.refreshed', { traceId }, {
        userId,
        summary: memory.summary.substring(0, 50)
      });
      resolve(memory);
    }, delayMs);
  });
}

/**
 * Obtener estadísticas de memoria
 */
export async function getMemoryStats(userId, traceId = null) {
  try {
    const memory = await memoryManager.loadMemory(userId, traceId);
    
    return {
      userId,
      hasSummary: memory.summary.length > 0,
      summaryLength: memory.summary.length,
      factsCount: Object.values(memory.facts).filter(v => v !== null).length,
      factsSet: Object.keys(memory.facts).filter(k => memory.facts[k] !== null),
      lastUpdated: memory.updatedAt ? new Date(memory.updatedAt).toISOString() : 'never',
      isStale: memory.updatedAt && Date.now() - memory.updatedAt > 24 * 60 * 60 * 1000 // > 24h
    };
  } catch (error) {
    logEvent('error', 'memory.stats_failed', { traceId }, {
      error: error.message
    });
    return null;
  }
}

/**
 * Migración: Actualizar memoria a novo schema (para clientes antiguos)
 */
export async function migrateMemory(userId, legacyData, traceId = null) {
  try {
    const newMemory = memoryManager.createEmptyMemory();

    // Copiar lo que se pueda
    if (legacyData.summary) {
      newMemory.summary = legacyData.summary;
    }

    if (legacyData.facts) {
      newMemory.facts = { ...newMemory.facts, ...legacyData.facts };
    }

    if (legacyData.lastInteraction) {
      newMemory.updatedAt = legacyData.lastInteraction;
    }

    await memoryManager.saveMemory(userId, newMemory, traceId);

    logEvent('info', 'memory.migrated', { traceId }, { userId });
    return newMemory;
  } catch (error) {
    logEvent('error', 'memory.migration_failed', { traceId }, {
      error: error.message
    });
    throw error;
  }
}

/**
 * Limpiar memoria (para reset/testing)
 */
export async function clearMemoryForUser(userId, traceId = null) {
  try {
    const emptyMemory = memoryManager.createEmptyMemory();
    await memoryManager.saveMemory(userId, emptyMemory, traceId);

    logEvent('warn', 'memory.cleared_manual', { traceId }, { userId });
    return true;
  } catch (error) {
    logEvent('error', 'memory.clear_failed', { traceId }, {
      error: error.message
    });
    return false;
  }
}

/**
 * Exportar memoria para backup/análisis
 */
export async function exportMemory(userId, format = 'json', traceId = null) {
  try {
    const memory = await memoryManager.loadMemory(userId, traceId);
    const stats = await getMemoryStats(userId, traceId);

    const exported = {
      timestamp: new Date().toISOString(),
      userId,
      memory,
      stats,
      format
    };

    if (format === 'csv') {
      return JSON.stringify(exported).replace(/"/g, '""').split('\n').join(',');
    }

    return exported;
  } catch (error) {
    logEvent('error', 'memory.export_failed', { traceId }, {
      error: error.message
    });
    throw error;
  }
}
