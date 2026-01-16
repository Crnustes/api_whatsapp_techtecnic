/**
 * tenantMiddleware.js - Express middleware para resolver e inyectar tenant
 *
 * Uso:
 * app.use(tenantMiddleware);
 *
 * Efecto:
 * - Resuelve tenantId desde request
 * - Carga config con cache
 * - Inyecta en req.tenant = { tenantId, config }
 * - Todos los siguientes controllers/services tienen acceso a req.tenant
 */

import { resolveTenantAndLoadConfig } from '../services/tenantResolver.js';
import { readFileSync } from 'fs';

// ============================================================================
// CARGA INICIAL DE MAPEOS
// ============================================================================

let TENANTS_MAPPING = {};

/**
 * Cargar mapeo de números WhatsApp → tenantId desde tenants.json
 * Formato:
 * {
 *   "+34123456789": "tenant-001",
 *   "+34987654321": "tenant-002",
 *   ...
 * }
 */
function loadTenantsMapping() {
  try {
    const content = readFileSync('tenants.json', 'utf-8');
    TENANTS_MAPPING = JSON.parse(content);
    console.log(`✅ Mapeo de tenants cargado: ${Object.keys(TENANTS_MAPPING).length} números`);
  } catch (error) {
    console.warn(`⚠️  No se pudo cargar tenants.json: ${error.message}`);
    TENANTS_MAPPING = {};
  }
}

// Cargar al inicializar el middleware
loadTenantsMapping();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware de tenant
 *
 * Flujo:
 * 1. Resolver tenantId desde request (varias estrategias)
 * 2. Cargar config para ese tenant (con cache)
 * 3. Inyectar en req.tenant
 * 4. Continuar al siguiente handler
 *
 * Errores:
 * - Si falla validación: Error 400 + mensaje
 * - Si tenant no existe: Error 404 (si strategy !== 'auto')
 * - Si falla carga config: Error 500
 */
export function tenantMiddleware(req, res, next) {
  try {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📬 ${new Date().toISOString()} | ${req.method} ${req.path}`);
    
    // Opciones de resolución
    const options = {
      tenantsMapping: TENANTS_MAPPING,
      allowDefault: true,      // Permitir fallback a tenant 'default'
      strategy: 'auto',        // Intenta todas las estrategias
    };
    
    // Resolver tenant + cargar config
    const { tenantId, config } = resolveTenantAndLoadConfig(req, options);
    
    // Inyectar en request
    req.tenant = {
      tenantId,
      config,
      _resolved: new Date(),   // Para debugging
      _strategy: options.strategy,
    };
    
    // Log
    console.log(`✅ TENANT RESUELTO: ${tenantId}`);
    console.log(`   WhatsApp: ${config.whatsapp.phoneNumberId}`);
    console.log(`   Firebase: ${config.firebase.projectId}`);
    console.log(`   Features: ${config.enabledFlows.join(', ')}`);
    
    // Continuar
    next();
    
  } catch (error) {
    console.error(`❌ Error en tenantMiddleware: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Error resolviendo tenant',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// MIDDLEWARE DE VALIDACIÓN (OPCIONAL)
// ============================================================================

/**
 * Middleware para validar que tenant fue resuelto correctamente
 * Usar después de tenantMiddleware para verificar
 *
 * app.use(tenantMiddleware);
 * app.use(validateTenantResolved);
 * app.use(routes);
 */
export function validateTenantResolved(req, res, next) {
  if (!req.tenant || !req.tenant.tenantId || !req.tenant.config) {
    return res.status(500).json({
      success: false,
      error: 'Tenant no fue resuelto correctamente',
      timestamp: new Date().toISOString(),
    });
  }
  
  next();
}

// ============================================================================
// MIDDLEWARE DE LOGGING (OPCIONAL)
// ============================================================================

/**
 * Middleware para loggear tenant en cada request
 * Útil para debugging
 */
export function logTenantInfo(req, res, next) {
  if (req.tenant) {
    console.log(`[TENANT: ${req.tenant.tenantId}] ${req.method} ${req.path}`);
  }
  next();
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Recargar mapeo de tenants dinámicamente
 * Llamar si tenants.json fue modificado
 */
export function reloadTenantsMapping() {
  console.log(`🔄 Recargando mapeo de tenants...`);
  loadTenantsMapping();
}

/**
 * Obtener tenant actual desde request
 * Helper para usar en controllers/services
 */
export function getTenant(req) {
  if (!req.tenant) {
    throw new Error('Tenant no está disponible en request');
  }
  return req.tenant;
}

/**
 * Verificar que tenant tiene feature habilitada
 */
export function hasTenantFeature(req, featureName) {
  if (!req.tenant?.config?.features) {
    return false;
  }
  return req.tenant.config.features[featureName] === true;
}

// ============================================================================
// EXPORTES
// ============================================================================

export default {
  tenantMiddleware,
  validateTenantResolved,
  logTenantInfo,
  reloadTenantsMapping,
  getTenant,
  hasTenantFeature,
};
