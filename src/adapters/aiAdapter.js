/**
 * Adaptador universal para servicios de IA
 * Permite fácilmente cambiar entre diferentes proveedores (OpenAI, Claude, etc)
 * 
 * Uso:
 * - aiAdapter.chat(prompt, input) - envía un mensaje simple
 * - aiAdapter.chatWithContext(messages, promptConfig) - envía mensajes con contexto
 */

import OpenAi from 'openai';
import config from '../config/env.js';
import { getPromptConfig } from '../config/aiPrompts.js';
import { getModelConfig } from '../config/aiModels.js';

const client = new OpenAi({
  apiKey: config.OPENAI_API_KEY,
});

/**
 * Enviar un mensaje simple a IA (con prompt predefinido)
 * @param {string} promptName - Nombre del prompt (ej: TECH_TECNIC_ASSISTANT)
 * @param {string} userMessage - Mensaje del usuario
 * @param {string} modelKey - Clave del modelo (ej: OPENAI)
 * @returns {Promise<string>} Respuesta de IA
 */
export const chat = async (promptName, userMessage, modelKey = 'OPENAI') => {
  try {
    const promptConfig = getPromptConfig(promptName);
    if (!promptConfig) {
      throw new Error(`Prompt no encontrado: ${promptName}`);
    }

    const modelConfig = getModelConfig(modelKey);

    const messages = [
      {
        role: 'system',
        content: promptConfig.system
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await client.chat.completions.create({
      model: modelConfig.model,
      messages,
      temperature: promptConfig.temperature || modelConfig.defaultTemperature,
      max_tokens: promptConfig.maxTokens || modelConfig.defaultMaxTokens,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error en aiAdapter.chat:', error);
    throw error;
  }
};

/**
 * Enviar mensajes con contexto (conversación)
 * @param {Array} messages - Array de mensajes [{role, content}]
 * @param {string} promptName - Nombre del prompt para sistema
 * @param {string} modelKey - Clave del modelo
 * @returns {Promise<string>} Respuesta de IA
 */
export const chatWithContext = async (
  messages,
  promptName = 'TECH_TECNIC_ASSISTANT',
  modelKey = 'OPENAI'
) => {
  try {
    const promptConfig = getPromptConfig(promptName);
    if (!promptConfig) {
      throw new Error(`Prompt no encontrado: ${promptName}`);
    }

    const modelConfig = getModelConfig(modelKey);

    // Asegurarse de que el primer mensaje sea system
    const fullMessages = [
      {
        role: 'system',
        content: promptConfig.system
      },
      ...messages
    ];

    const response = await client.chat.completions.create({
      model: modelConfig.model,
      messages: fullMessages,
      temperature: promptConfig.temperature || modelConfig.defaultTemperature,
      max_tokens: promptConfig.maxTokens || modelConfig.defaultMaxTokens,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error en aiAdapter.chatWithContext:', error);
    throw error;
  }
};

/**
 * Compatibilidad con código antiguo: aceptar string directamente
 * @deprecated Usar chat() o chatWithContext() en su lugar
 */
export const legacyChat = async (input) => {
  if (typeof input === 'string') {
    return chat('TECH_TECNIC_ASSISTANT', input);
  } else if (Array.isArray(input)) {
    return chatWithContext(input);
  }
  throw new Error('Input debe ser string o array de mensajes');
};

const aiAdapter = {
  chat,
  chatWithContext,
  legacyChat
};

export default aiAdapter;
