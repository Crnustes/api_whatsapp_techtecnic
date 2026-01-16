/**
 * tenantConfig.js - Contrato universal de configuración multi-tenant
 *
 * Define:
 * 1. Schema de configuración permitida
 * 2. Configuración por defecto (fallback)
 * 3. Validación
 * 4. Merge (defaults + tenant overrides)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// SCHEMA DE CONFIGURACIÓN
// ============================================================================

export const TENANT_CONFIG_SCHEMA = {
  // Identificadores
  tenantId: 'string',           // "tenant-001", "company-a", etc
  name: 'string',               // "Company Name"
  
  // WhatsApp Business
  whatsapp: {
    businessAccountId: 'string',
    phoneNumberId: 'string',
    apiToken: 'string',
    webhookToken: 'string',
  },
  
  // OpenAI API
  openai: {
    apiKey: 'string',
    model: 'string',            // "gpt-4", "gpt-3.5-turbo"
    temperature: 'number',      // 0-1
    maxTokens: 'number',        // 500-2000
  },
  
  // Firebase
  firebase: {
    projectId: 'string',
    databaseURL: 'string',
    credentialsPath: 'string',  // Ruta a JSON key
  },
  
  // Google Sheets (opcional)
  googleSheets: {
    enabled: 'boolean',
    spreadsheetId: 'string',
    credentialsPath: 'string',
  },
  
  // Comportamiento del bot
  bot: {
    language: 'string',         // "es", "en", etc
    timezone: 'string',         // "Europe/Madrid"
    responseTime: 'number',     // ms delay artificial
    maxRetries: 'number',       // reintentos ante error
    enableTracing: 'boolean',   // logging con traceId
    enableMemory: 'boolean',    // persistencia de contexto
  },
  
  // Flows permitidos por este tenant
  enabledFlows: 'array',        // ["appointment", "quotation", "assistant", ...]
  
  // Customización de mensajes
  messages: {
    welcome: 'string',
    errorGeneric: 'string',
    errorRateLimit: 'string',
    handoffReason: 'string',
  },
  
  // Features por tenant (Feature Flags)
  features: {
    quotationEngine: 'boolean',
    appointmentBooking: 'boolean',
    googleSheetIntegration: 'boolean',
    memorySystem: 'boolean',
    memoryPersistent: 'boolean',      // ← Persistencia de memoria entre sesiones
    quotationAI: 'boolean',           // ← Cotización asistida por IA
    opportunityDetection: 'boolean',  // ← Detección automática de oportunidades
    salesAgent: 'boolean',            // ← Agente de ventas automático
    dashboard: 'boolean',             // ← Dashboard de admin
  },
  
  // Limites
  limits: {
    messagesPerHour: 'number',
    maxConversationLength: 'number',
    quotationExpiryDays: 'number',
  },
  
  // Escalamiento (human handoff)
  escalation: {
    enabledTeams: 'array',      // ["sales", "support", ...]
    defaultTeam: 'string',      // Por defecto
    routingRules: 'object',     // { "urgent": "vip_team", ... }
  },
};

// ============================================================================
// CONFIGURACIÓN POR DEFECTO (FALLBACK)
// ============================================================================

export const DEFAULT_TENANT_CONFIG = {
  tenantId: 'default',
  name: 'Default Tenant',
  
  whatsapp: {
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiToken: process.env.WHATSAPP_API_TOKEN || '',
    webhookToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
  },
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
    credentialsPath: process.env.FIREBASE_CREDENTIALS_PATH || 'src/credentials/techtecnic-bot-firebase-adminsdk-fbsvc-302d95c214.json',
  },
  
  googleSheets: {
    enabled: false,
    spreadsheetId: process.env.GOOGLE_SHEETS_ID || null,
    credentialsPath: process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || null,
  },
  
  bot: {
    language: 'es',
    timezone: 'Europe/Madrid',
    responseTime: 0,
    maxRetries: 3,
    enableTracing: true,
    enableMemory: true,
  },
  
  enabledFlows: ['appointment', 'quotation', 'assistant', 'humanHandoff'],
  
  messages: {
    welcome: '¡Hola! Soy Tech Tecnic Bot. ¿Cómo te puedo ayudar?',
    errorGeneric: 'Disculpa, hubo un error. Reintentar en unos segundos.',
    errorRateLimit: 'Estoy recibiendo muchos mensajes. Intenta en 1 minuto.',
    handoffReason: 'Te estoy conectando con un agente. Aguarda un momento.',
  },
  
  features: {
    quotationEngine: true,
    appointmentBooking: true,
    googleSheetIntegration: false,
    memorySystem: true,
    memoryPersistent: false,
    quotationAI: false,
    opportunityDetection: false,
    salesAgent: false,
    dashboard: false,
  },
  
  limits: {
    messagesPerHour: 100,
    maxConversationLength: 500,
    quotationExpiryDays: 7,
  },
  
  escalation: {
    enabledTeams: ['sales', 'support'],
    defaultTeam: 'sales',
    routingRules: {
      'urgent': 'vip_team',
      'complaint': 'support',
    },
  },
};

// ============================================================================
// VALIDACIÓN
// ============================================================================

/**
 * Validar que config cumple requisitos mínimos
 * @param {object} config
 * @throws {Error} si validación falla
 */
export function validateTenantConfig(config) {
  const errors = [];
  
  // Requeridos
  if (!config.tenantId) {
    errors.push('tenantId es requerido');
  }
  
  if (!config.whatsapp?.apiToken) {
    errors.push('whatsapp.apiToken es requerido');
  }
  
  if (!config.openai?.apiKey) {
    errors.push('openai.apiKey es requerido');
  }
  
  if (!config.firebase?.credentialsPath) {
    errors.push('firebase.credentialsPath es requerido');
  }
  
  // Validaciones de tipo
  if (config.openai?.temperature && (config.openai.temperature < 0 || config.openai.temperature > 1)) {
    errors.push('openai.temperature debe estar entre 0 y 1');
  }
  
  if (config.limits?.quotationExpiryDays && config.limits.quotationExpiryDays < 1) {
    errors.push('limits.quotationExpiryDays debe ser >= 1');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuración inválida para tenant ${config.tenantId}:\n${errors.join('\n')}`);
  }
  
  return true;
}

// ============================================================================
// MERGE (Defaults + Tenant Overrides)
// ============================================================================

/**
 * Mergear configuración: defaults + tenant overrides
 * Los overrides prevalecen, pero preservan estructura anidada
 * @param {object} defaults
 * @param {object} tenantOverrides
 * @returns {object} config merged
 */
export function mergeTenantConfig(defaults, tenantOverrides) {
  const deepMerge = (target, source) => {
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = deepMerge(target[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  };
  
  return deepMerge(defaults, tenantOverrides || {});
}

// ============================================================================
// CARGA DE CONFIGURACIÓN
// ============================================================================

/**
 * Cargar config desde archivo JSON
 * @param {string} filePath - Ruta al archivo config.json
 * @returns {object} config
 */
export function loadTenantConfigFromFile(filePath) {
  try {
    const absolutePath = resolve(filePath);
    const content = readFileSync(absolutePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Error cargando tenant config desde ${filePath}: ${error.message}`);
  }
}

/**
 * Cargar config tenant:
 * 1. Intenta cargar de archivo (src/tenants/{tenantId}/config.json)
 * 2. Mergea con defaults
 * 3. Valida
 * 4. Retorna config completa
 *
 * @param {string} tenantId
 * @returns {object} config merged + validated
 */
export function loadTenantConfig(tenantId) {
  let tenantOverrides = {};
  
  if (tenantId && tenantId !== 'default') {
    try {
      const configPath = `src/tenants/${tenantId}/config.json`;
      tenantOverrides = loadTenantConfigFromFile(configPath);
    } catch (error) {
      console.warn(`⚠️  No se encontró config para tenant ${tenantId}, usando defaults`);
    }
  }
  
  const config = mergeTenantConfig(DEFAULT_TENANT_CONFIG, { tenantId, ...tenantOverrides });
  validateTenantConfig(config);
  
  return config;
}

// ============================================================================
// EXPORTES POR DEFECTO
// ============================================================================

export default {
  TENANT_CONFIG_SCHEMA,
  DEFAULT_TENANT_CONFIG,
  validateTenantConfig,
  mergeTenantConfig,
  loadTenantConfigFromFile,
  loadTenantConfig,
};
