/**
 * featureGating.js - Feature flag gating utilities
 *
 * Control de features por tenant
 * Uso: if (isFeatureEnabled(req, 'memoryPersistent')) { ... }
 */

/**
 * Verificar si un tenant tiene un feature habilitado
 * @param {object} req - Express request (debe tener req.tenant inyectado)
 * @param {string} featureName - Nombre del feature
 * @returns {boolean} true si está habilitado, false si no o si no existe
 */
export function isFeatureEnabled(req, featureName) {
  try {
    if (!req.tenant?.config?.features) {
      console.warn(`⚠️  No features found in request for feature: ${featureName}`);
      return false;
    }
    
    const enabled = req.tenant.config.features[featureName] === true;
    
    if (enabled) {
      console.log(`✅ Feature enabled for ${req.tenant.tenantId}: ${featureName}`);
    } else {
      console.log(`❌ Feature disabled for ${req.tenant.tenantId}: ${featureName}`);
    }
    
    return enabled;
  } catch (error) {
    console.error(`❌ Error checking feature gate: ${error.message}`);
    return false;
  }
}

/**
 * Verificar si un tenant tiene un feature, con fallback a valor por defecto
 * @param {object} req - Express request
 * @param {string} featureName - Nombre del feature
 * @param {boolean} defaultValue - Valor por defecto si no existe
 * @returns {boolean}
 */
export function isFeatureEnabledOr(req, featureName, defaultValue = false) {
  try {
    if (!req.tenant?.config?.features) {
      return defaultValue;
    }
    
    const value = req.tenant.config.features[featureName];
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Obtener lista de features habilitados para un tenant
 * @param {object} req - Express request
 * @returns {array} Lista de nombres de features habilitados
 */
export function getEnabledFeatures(req) {
  try {
    if (!req.tenant?.config?.features) {
      return [];
    }
    
    return Object.keys(req.tenant.config.features).filter(
      key => req.tenant.config.features[key] === true
    );
  } catch (error) {
    return [];
  }
}

/**
 * Obtener estado de todos los features para un tenant
 * @param {object} req - Express request
 * @returns {object} { featureName: boolean, ... }
 */
export function getAllFeatureStates(req) {
  try {
    if (!req.tenant?.config?.features) {
      return {};
    }
    
    return { ...req.tenant.config.features };
  } catch (error) {
    return {};
  }
}

/**
 * Gate de feature - ejecuta callback solo si feature está habilitado
 * @param {object} req - Express request
 * @param {string} featureName - Nombre del feature
 * @param {function} callback - Función a ejecutar si feature habilitado
 * @param {function} fallback - Función a ejecutar si no habilitado (opcional)
 * @returns {*} Resultado del callback o fallback
 *
 * Uso:
 * featureGate(req, 'memoryPersistent', 
 *   () => saveMemory(data),
 *   () => console.log('Memory persistence disabled')
 * );
 */
export function featureGate(req, featureName, callback, fallback = null) {
  try {
    if (isFeatureEnabled(req, featureName)) {
      return callback();
    } else if (fallback) {
      return fallback();
    }
  } catch (error) {
    console.error(`❌ Error in feature gate for ${featureName}: ${error.message}`);
    if (fallback) return fallback();
  }
  
  return null;
}

/**
 * Gate asincrónico
 * @param {object} req
 * @param {string} featureName
 * @param {async function} callback
 * @param {async function} fallback
 * @returns {Promise}
 *
 * Uso:
 * await featureGateAsync(req, 'quotationAI',
 *   async () => await generateAIQuotation(),
 *   async () => await generateBasicQuotation()
 * );
 */
export async function featureGateAsync(req, featureName, callback, fallback = null) {
  try {
    if (isFeatureEnabled(req, featureName)) {
      return await callback();
    } else if (fallback) {
      return await fallback();
    }
  } catch (error) {
    console.error(`❌ Error in async feature gate for ${featureName}: ${error.message}`);
    if (fallback) return await fallback();
  }
  
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  isFeatureEnabled,
  isFeatureEnabledOr,
  getEnabledFeatures,
  getAllFeatureStates,
  featureGate,
  featureGateAsync,
};
