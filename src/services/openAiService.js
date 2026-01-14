/**
 * Servicio de OpenAI (compatibilidad)
 * Usa aiAdapter internamente para mantener compatibilidad con código existente
 * 
 * Migraciones:
 * - openAiService(string) → aiAdapter.chat('TECH_TECNIC_ASSISTANT', string)
 * - openAiService([messages]) → aiAdapter.chatWithContext([messages])
 */

import aiAdapter from '../adapters/aiAdapter.js';

const openAiService = async (input) => {
  // Usar la función legacy que maneja ambos casos
  return aiAdapter.legacyChat(input);
};

export default openAiService;