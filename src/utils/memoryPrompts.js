/**
 * Memory Update Prompts - Plantillas para que OpenAI genere actualizaciones de memoria
 * 
 * Objetivo: OpenAI SOLO devuelve JSON {summary, factsToSet, factsToUnset}
 * Sin conversación, sin explicaciones, JSON puro
 */

/**
 * SYSTEM PROMPT - Define el comportamiento del modelo
 */
export const MEMORY_SYSTEM_PROMPT = `Eres un asistente de CRM que extrae información clave de conversaciones con clientes.

Tu única responsabilidad es actualizar la memoria del cliente ANALIZANDO el histórico de conversación.

DEBES DEVOLVER JSON en este formato exacto (y SOLO JSON, nada más):
{
  "summary": "1-3 líneas describiendo quién es, qué quiere, en qué quedó",
  "factsToSet": {
    "nombre": "valor o null",
    "email": "valor o null",
    "empresa": "valor o null",
    "telefono": "valor o null",
    "servicio": "valor o null",
    "presupuesto": "bajo|medio|alto|sin_especificar o null",
    "urgencia": "baja|media|alta|critica|sin_especificar o null",
    "objetivo": "valor o null",
    "restricciones": "valor o null",
    "proximoPaso": "valor o null"
  },
  "factsToUnset": ["nombreField1", "nombreField2"] // campos que NO aplican
}

REGLAS CRÍTICAS:
1. El summary DEBE ser 1-3 líneas, nunca más
2. factsToSet SOLO contiene campos que se pueden CONFIRMAR desde la conversación
3. factsToUnset lista campos que ya NO aplican (el usuario dijo que no necesita eso)
4. Si no hay evidencia de algo, déjalo como null (no lo incluyas en factsToSet)
5. Solo usa enum values para presupuesto/urgencia/servicio
6. DEVUELVE SOLO JSON, sin markdown, sin explicación, sin nada más
7. Si no hay cambios, devuelve summary vacío y factsToSet vacío

EJEMPLOS DE ENUM VALUES:
- servicio: 'desarrollo_web', 'ecommerce', 'chatbot', 'app_movil', 'integraciones', 'seo', 'ia', 'mantenimiento'
- presupuesto: 'bajo', 'medio', 'alto', 'sin_especificar'
- urgencia: 'baja', 'media', 'alta', 'critica', 'sin_especificar'`;

/**
 * USER PROMPT - Estructura la información actual + último turno
 * 
 * Se genera dinámicamente con:
 * - Memoria actual (summary + facts)
 * - Últimos N turnos
 * - Nuevo mensaje del usuario
 */
export function generateMemoryUpdatePrompt(currentMemory, newUserMessage, recentTurns) {
  const factsSummary = Object.entries(currentMemory.facts || {})
    .filter(([k, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join('\n');

  const turnsText = (recentTurns || [])
    .map(t => {
      const role = t.role === 'user' ? 'CLIENTE' : 'ASISTENTE';
      return `${role}: ${t.content}`;
    })
    .join('\n');

  return `MEMORIA ACTUAL DEL CLIENTE:
${currentMemory.summary ? `Resumen: ${currentMemory.summary}` : 'Resumen: (vacío)'}

Datos confirmados:
${factsSummary || '  (ninguno)'}

HISTÓRICO DE CONVERSACIÓN:
${turnsText || '(primera interacción)'}

NUEVO MENSAJE DEL CLIENTE:
${newUserMessage}

---
ACTUALIZA LA MEMORIA: Devuelve SOLO JSON, sin markdown ni explicación.`;
}

/**
 * SPECIALIZED PROMPTS - Casos específicos
 */

/**
 * Prompt para extender contexto sin enviar todo el histórico
 * (Cuando la conversación es muy larga)
 */
export function generateMemoryRefreshPrompt(currentMemory, conversationSummary, latestMessage) {
  return `MEMORIA ACTUAL:
${currentMemory.summary || '(sin resumen)'}

RESUMEN DE CONVERSACIÓN:
${conversationSummary}

ÚLTIMO MENSAJE:
${latestMessage}

Actualiza SOLO si hay nueva información. Devuelve JSON puro.`;
}

/**
 * Prompt para detectar cambios en intención/objetivo
 */
export function generateIntentChangePrompt(currentMemory, previousObjective, currentObjective) {
  return `CLIENTE: ${Object.values(currentMemory.facts).filter(v => v).join(', ') || 'sin datos'}

OBJETIVO ANTERIOR: ${previousObjective}
NUEVO OBJETIVO DETECTADO: ${currentObjective}

¿Ha cambiado el objetivo o necesidad del cliente? Actualiza la memoria.
Devuelve JSON puro.`;
}

/**
 * Prompt para re-confirmación de datos
 * (Cuando los datos son antiguos)
 */
export function generateDataRefreshPrompt(currentMemory, daysOld) {
  const factsText = Object.entries(currentMemory.facts || {})
    .filter(([k, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join('\n');

  return `La memoria tiene ${daysOld} días sin actualizar:
${factsText}

Si hay cambios en la conversación reciente, actualiza.
Si los datos siguen siendo válidos, devuelve factsToSet vacío.

Devuelve SOLO JSON.`;
}

/**
 * PARSE HELPERS - Funciones para validar respuestas
 */

/**
 * Validar que el JSON tiene estructura correcta
 */
export function validateMemoryUpdateJSON(json) {
  const errors = [];

  if (!json.summary || typeof json.summary !== 'string') {
    errors.push('summary debe ser string');
  }
  if (json.summary.split('\n').length > 5) {
    errors.push('summary debe ser 1-5 líneas');
  }

  if (!json.factsToSet || typeof json.factsToSet !== 'object') {
    errors.push('factsToSet debe ser objeto');
  }

  if (!Array.isArray(json.factsToUnset)) {
    errors.push('factsToUnset debe ser array');
  }

  // Validar enum values
  const validEnums = {
    servicio: ['desarrollo_web', 'ecommerce', 'chatbot', 'app_movil', 'integraciones', 'seo', 'ia', 'mantenimiento'],
    presupuesto: ['bajo', 'medio', 'alto', 'sin_especificar'],
    urgencia: ['baja', 'media', 'alta', 'critica', 'sin_especificar']
  };

  for (const [key, allowed] of Object.entries(validEnums)) {
    if (json.factsToSet[key] && !allowed.includes(json.factsToSet[key])) {
      errors.push(`${key} inválido. Valores permitidos: ${allowed.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`JSON inválido:\n  - ${errors.join('\n  - ')}`);
  }

  return true;
}

/**
 * Limpiar respuesta de OpenAI (remover markdown, caracteres extra)
 */
export function cleanOpenAIResponse(response) {
  // Remover markdown code blocks
  let cleaned = response
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  // Remover BOM o caracteres unicode extraños
  cleaned = cleaned.replace(/^\uFEFF/, '');

  return cleaned;
}

/**
 * Extraer JSON de respuesta (en caso que incluya texto)
 */
export function extractJSON(response) {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }
  return jsonMatch[0];
}

/**
 * CONSTRUCTION HELPERS - Herramientas para construir prompts
 */

/**
 * Formatear turno para prompt
 */
export function formatTurnForPrompt(turn) {
  const role = turn.role === 'user' ? 'CLIENTE' : 'ASISTENTE';
  const time = turn.timestamp 
    ? new Date(turn.timestamp).toLocaleTimeString()
    : 'N/A';
  
  return `[${time}] ${role}: ${turn.content}`;
}

/**
 * Crear contexto mini para prompt (cuando queremos ser breve)
 */
export function createMinimalContext(memory, latestTurn) {
  return `
RESUMEN: ${memory.summary || '(sin resumen)'}
DATOS: ${Object.entries(memory.facts)
  .filter(([k, v]) => v !== null && v !== undefined)
  .map(([k, v]) => `${k}:${v}`)
  .join(', ') || '(ninguno)'}

ÚLTIMO: ${latestTurn?.content || '(sin mensaje)'}
  `.trim();
}

/**
 * Crear prompt de sistema ADAPTADO para contexto
 */
export function generateAdaptedSystemPrompt(level = 'normal') {
  const basePrompt = MEMORY_SYSTEM_PROMPT;

  const levels = {
    strict: basePrompt + '\n\nIMPORTANTE: Sé MÁS CONSERVADOR. Solo incluye facts que estén 100% confirmados.',
    normal: basePrompt,
    liberal: basePrompt + '\n\nPuedes inferir información basada en contexto. Incluye educated guesses.'
  };

  return levels[level] || basePrompt;
}

/**
 * LOG HELPERS - Para debugging
 */

export function logPromptUsage(promptType, memorySize, turnsCount) {
  return {
    type: promptType,
    timestamp: new Date().toISOString(),
    stats: {
      memorySize,
      turnsCount
    }
  };
}

/**
 * Ejemplo de respuesta esperada
 */
export const EXAMPLE_RESPONSE = {
  summary: 'Juan es dueño de una tienda online. Busca chatbot con IA para atención al cliente. Presupuesto $5k, urgencia media. Próximo paso: demostración.',
  factsToSet: {
    nombre: 'Juan García',
    email: 'juan@tienda.com',
    empresa: 'TiendaOnline SAS',
    servicio: 'chatbot',
    presupuesto: 'medio',
    urgencia: 'media',
    proximoPaso: 'Agendar demostración para mañana'
  },
  factsToUnset: ['restricciones']
};

/**
 * Ejemplo de respuesta sin cambios
 */
export const EXAMPLE_NO_CHANGE = {
  summary: '',
  factsToSet: {},
  factsToUnset: []
};
