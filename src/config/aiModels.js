/**
 * Configuración de modelos y parámetros de IA
 * Centraliza la configuración para diferentes proveedores/modelos
 */

export const AI_MODELS = {
  // OpenAI
  OPENAI: {
    provider: 'openai',
    model: 'gpt-4o',
    defaultTemperature: 0.7,
    defaultMaxTokens: 300,
    costPer1kTokens: {
      input: 0.005,
      output: 0.015
    }
  },

  // Alternativa: GPT-4 Turbo (más barato, más rápido)
  OPENAI_TURBO: {
    provider: 'openai',
    model: 'gpt-4-turbo',
    defaultTemperature: 0.7,
    defaultMaxTokens: 300,
    costPer1kTokens: {
      input: 0.01,
      output: 0.03
    }
  },

  // Alternativa: GPT-3.5 (más económico)
  OPENAI_MINI: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    defaultTemperature: 0.7,
    defaultMaxTokens: 300,
    costPer1kTokens: {
      input: 0.0005,
      output: 0.0015
    }
  }
};

/**
 * Configuración de modelo por defecto
 */
export const DEFAULT_AI_MODEL = 'OPENAI';

/**
 * Obtener configuración de modelo
 */
export const getModelConfig = (modelKey = DEFAULT_AI_MODEL) => {
  return AI_MODELS[modelKey] || AI_MODELS[DEFAULT_AI_MODEL];
};

export default AI_MODELS;
