/**
 * tenantResolver.js - Resolución de tenant desde request + cache
 *
 * Estrategias de resolución (en orden):
 * 1. HEADER: X-Tenant-ID header
 * 2. SUBDOMAIN: subdomain de URL (subdomain.techtecnic.com)
 * 3. PATH: /tenant/:tenantId/webhook
 * 4. PHONE: Mapeo de número WhatsApp → tenantId (tenants.json)
 * 5. QUERY: ?tenant=tenantId parameter
 *
 * Cache: In-memory con TTL de 60 minutos (~95% hit rate esperado)
 */

import { loadTenantConfig } from '../config/tenantConfig.js';

// ============================================================================
// CACHE EN MEMORIA
// ============================================================================

const TENANT_CACHE_TTL_MINUTES = 60;
const TENANT_CACHE_TTL_MS = TENANT_CACHE_TTL_MINUTES * 60 * 1000;

const cache = new Map(); // { tenantId → { config, timestamp } }

/**
 * Obtener config del cache
 * @param {string} tenantId
 * @returns {object|null} config si existe y no expiró, null si no existe o expiró
 */
export function getCachedTenantConfig(tenantId) {
  if (!cache.has(tenantId)) {
    return null;
  }
  
  const { config, timestamp } = cache.get(tenantId);
  const age = Date.now() - timestamp;
  
  if (age > TENANT_CACHE_TTL_MS) {
    console.log(`⏰ Cache expirado para tenant ${tenantId} (${(age / 1000).toFixed(0)}s)`);
    cache.delete(tenantId);
    return null;
  }
  
  return config;
}

/**
 * Guardar config en cache
 * @param {string} tenantId
 * @param {object} config
 */
export function setCachedTenantConfig(tenantId, config) {
  cache.set(tenantId, {
    config,
    timestamp: Date.now(),
  });
  console.log(`💾 Tenant ${tenantId} cacheado (TTL: ${TENANT_CACHE_TTL_MINUTES}min)`);
}

/**
 * Limpiar cache para un tenant específico
 * @param {string} tenantId - Si no se proporciona, limpia TODO
 */
export function clearTenantCache(tenantId) {
  if (tenantId) {
    cache.delete(tenantId);
    console.log(`🧹 Cache limpiado para tenant ${tenantId}`);
  } else {
    cache.clear();
    console.log(`🧹 Cache limpiado completamente (${cache.size} entradas antes)`);
  }
}

/**
 * Obtener stats del cache
 * @returns {object} { size, entries }
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([tenantId, { timestamp }]) => ({
      tenantId,
      age: Date.now() - timestamp,
    })),
  };
}

// ============================================================================
// ESTRATEGIAS DE RESOLUCIÓN
// ============================================================================

/**
 * 1. HEADER: X-Tenant-ID header
 */
export function resolveTenantFromHeader(req) {
  const tenantId = req.headers['x-tenant-id'];
  if (tenantId) {
    console.log(`✅ Tenant resuelto desde HEADER: ${tenantId}`);
    return tenantId;
  }
  return null;
}

/**
 * 2. SUBDOMAIN: subdomain de URL
 * Ej: tenant-001.techtecnic.com → "tenant-001"
 */
export function resolveTenantFromSubdomain(req) {
  const host = req.get('host');
  if (!host) return null;
  
  const parts = host.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain !== 'www' && !subdomain.includes('localhost')) {
      console.log(`✅ Tenant resuelto desde SUBDOMAIN: ${subdomain}`);
      return subdomain;
    }
  }
  
  return null;
}

/**
 * 3. PATH: /tenant/:tenantId/webhook
 */
export function resolveTenantFromPath(req) {
  const match = req.path.match(/\/tenant\/([a-zA-Z0-9\-_]+)\//);
  if (match && match[1]) {
    const tenantId = match[1];
    console.log(`✅ Tenant resuelto desde PATH: ${tenantId}`);
    return tenantId;
  }
  return null;
}

/**
 * 4. PHONE: Mapeo de número WhatsApp → tenantId
 * Lee desde tenants.json: { "+34123456789": "tenant-001", ... }
 *
 * En WhatsApp Business API, el número está en req.body.entry[0].changes[0].value.metadata.phone_number_id
 * O en headers como X-WhatsApp-Number
 */
export function resolveTenantFromPhone(req, tenantsMapping) {
  // Intenta obtener número desde múltiples fuentes
  let phoneNumber = null;
  
  // Desde header
  phoneNumber = req.headers['x-whatsapp-number'];
  
  // Desde body (webhook format)
  if (!phoneNumber && req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id) {
    phoneNumber = req.body.entry[0].changes[0].value.metadata.phone_number_id;
  }
  
  // Desde query param
  if (!phoneNumber && req.query?.phone) {
    phoneNumber = req.query.phone;
  }
  
  if (phoneNumber && tenantsMapping && tenantsMapping[phoneNumber]) {
    const tenantId = tenantsMapping[phoneNumber];
    console.log(`✅ Tenant resuelto desde PHONE ${phoneNumber}: ${tenantId}`);
    return tenantId;
  }
  
  return null;
}

/**
 * 5. QUERY: ?tenant=tenantId parameter
 */
export function resolveTenantFromQuery(req) {
  const tenantId = req.query?.tenant;
  if (tenantId) {
    console.log(`✅ Tenant resuelto desde QUERY: ${tenantId}`);
    return tenantId;
  }
  return null;
}

// ============================================================================
// RESOLUCIÓN PRINCIPAL
// ============================================================================

/**
 * Resolver tenantId desde request
 * Intenta estrategias en orden:
 * 1. Header
 * 2. Subdomain
 * 3. Path
 * 4. Phone (si tenantsMapping proporcionado)
 * 5. Query
 * 6. Fallback a "default"
 *
 * @param {object} req - Express request
 * @param {object} options - { tenantsMapping, allowDefault, strategy }
 * @returns {string} tenantId
 */
export function resolveTenant(req, options = {}) {
  const {
    tenantsMapping = null,  // Mapeo phone → tenantId
    allowDefault = true,    // Permitir fallback a 'default'
    strategy = 'auto',      // 'auto' = intenta todas, o específica como 'phone'
  } = options;
  
  console.log(`\n🔍 Resolviendo tenant para ${req.method} ${req.path}`);
  
  let tenantId = null;
  
  if (strategy === 'auto' || strategy === 'header') {
    tenantId = resolveTenantFromHeader(req);
  }
  
  if (!tenantId && (strategy === 'auto' || strategy === 'subdomain')) {
    tenantId = resolveTenantFromSubdomain(req);
  }
  
  if (!tenantId && (strategy === 'auto' || strategy === 'path')) {
    tenantId = resolveTenantFromPath(req);
  }
  
  if (!tenantId && (strategy === 'auto' || strategy === 'phone')) {
    tenantId = resolveTenantFromPhone(req, tenantsMapping);
  }
  
  if (!tenantId && (strategy === 'auto' || strategy === 'query')) {
    tenantId = resolveTenantFromQuery(req);
  }
  
  // Fallback
  if (!tenantId) {
    if (allowDefault) {
      tenantId = 'default';
      console.log(`⚠️  Usando tenant DEFAULT (no se pudo resolver específico)`);
    } else {
      throw new Error('No se pudo resolver tenantId y allowDefault=false');
    }
  }
  
  return tenantId;
}

/**
 * Cargar config de un tenant con cache
 * 1. Intenta obtener del cache
 * 2. Si miss, carga desde archivo/DB
 * 3. Cachea resultado
 * 4. Retorna
 *
 * @param {string} tenantId
 * @returns {object} config
 */
export function loadTenantConfigWithCache(tenantId) {
  // 1. Intentar cache
  const cached = getCachedTenantConfig(tenantId);
  if (cached) {
    console.log(`✨ Cache hit para tenant ${tenantId}`);
    return cached;
  }
  
  // 2. Cargar desde filesystem/DB
  console.log(`📥 Cargando config para tenant ${tenantId} (cache miss)`);
  const config = loadTenantConfig(tenantId);
  
  // 3. Cachear
  setCachedTenantConfig(tenantId, config);
  
  return config;
}

// ============================================================================
// MÉTODO DE CONVENIENCIA (Usar en middleware)
// ============================================================================

/**
 * Resolver tenant + cargar config en un paso
 * Esto es lo que usará tenantMiddleware
 *
 * @param {object} req
 * @param {object} options
 * @returns {object} { tenantId, config }
 */
export function resolveTenantAndLoadConfig(req, options = {}) {
  const tenantId = resolveTenant(req, options);
  const config = loadTenantConfigWithCache(tenantId);
  return { tenantId, config };
}

// ============================================================================
// EXPORTES
// ============================================================================

export default {
  // Cache
  getCachedTenantConfig,
  setCachedTenantConfig,
  clearTenantCache,
  getCacheStats,
  
  // Resolución
  resolveTenantFromHeader,
  resolveTenantFromSubdomain,
  resolveTenantFromPath,
  resolveTenantFromPhone,
  resolveTenantFromQuery,
  resolveTenant,
  
  // Config loading
  loadTenantConfigWithCache,
  resolveTenantAndLoadConfig,
};
