/**
 * Configuración de Quotation Engine
 * Define precios, opciones y features por proyecto
 * 
 * Ubicación para cambiar: Este archivo
 */

export const QUOTATION_CONFIG = {
  // Precios base por tipo de proyecto
  basePrices: {
    'Sitio Web': {
      basic: 1500,
      medium: 3500,
      high: 7000
    },
    'Ecommerce': {
      basic: 3000,
      medium: 8000,
      high: 15000
    },
    'App Móvil': {
      basic: 5000,
      medium: 12000,
      high: 25000
    },
    'Automatización': {
      basic: 2000,
      medium: 5000,
      high: 12000
    },
    'Integración': {
      basic: 1000,
      medium: 3000,
      high: 8000
    },
    'Otro': {
      basic: 2000,
      medium: 5000,
      high: 10000
    }
  },

  // Multiplicadores por timeline
  timelineMultipliers: {
    'ASAP': 1.4,        // +40% por urgencia
    'Rápido': 1.2,      // +20%
    'Normal': 1.0,      // Sin ajuste
    'Flexible': 0.9     // -10% por más tiempo
  },

  // Features por complejidad y tipo
  featuresByComplexity: {
    'Sitio Web': {
      'Básico': [
        'Hasta 5 páginas',
        'Responsive',
        'Formulario de contacto',
        'Hosting 1 año'
      ],
      'Medio': [
        'Hasta 10 páginas',
        'Responsive',
        'CMS básico',
        'Blog integrado',
        'SEO básico',
        'Hosting 1 año'
      ],
      'Alto': [
        'Sitio escalable',
        'CMS completo',
        'Sistema de usuarios',
        'Blog avanzado',
        'SEO avanzado',
        'Integraciones múltiples',
        'Soporte 3 meses',
        'Hosting 1 año'
      ]
    },
    'Ecommerce': {
      'Básico': [
        'Hasta 100 productos',
        'Carrito básico',
        'Pago con tarjeta',
        'Gestión de inventario simple'
      ],
      'Medio': [
        'Hasta 1000 productos',
        'Carrito avanzado',
        'Múltiples métodos de pago',
        'Gestión completa',
        'Reportes básicos',
        'Email marketing integrado'
      ],
      'Alto': [
        'Productos ilimitados',
        'Carrito inteligente',
        'Pagos múltiples',
        'BI completo',
        'Automatización',
        'Integraciones (ERP, CRM)',
        'Soporte 6 meses',
        'Consultoría estratégica'
      ]
    },
    'App Móvil': {
      'Básico': [
        'Plataforma única',
        'Hasta 5 pantallas',
        'API integrada',
        'Push notifications'
      ],
      'Medio': [
        'iOS + Android',
        'Hasta 15 pantallas',
        'Geolocalización',
        'Offline mode',
        'Analytics',
        'Social login'
      ],
      'Alto': [
        'iOS + Android',
        'Escalable',
        'Características avanzadas',
        'Pagos integrados',
        'IA/ML básico',
        'Soporte 6 meses',
        'Mantenimiento incluido'
      ]
    },
    'Automatización': {
      'Básico': [
        'Hasta 3 procesos',
        'Automación básica',
        'Notificaciones'
      ],
      'Medio': [
        'Hasta 10 procesos',
        'Lógica compleja',
        'Integraciones',
        'Reportes'
      ],
      'Alto': [
        'Procesos ilimitados',
        'IA integrada',
        'Múltiples integraciones',
        'Dashboard avanzado',
        'Soporte prioritario'
      ]
    }
  }
};

/**
 * Obtener configuración de precio base
 */
export const getBasePrices = () => {
  return QUOTATION_CONFIG.basePrices;
};

/**
 * Obtener multiplicadores de timeline
 */
export const getTimelineMultipliers = () => {
  return QUOTATION_CONFIG.timelineMultipliers;
};

/**
 * Obtener features por tipo y complejidad
 */
export const getFeatures = (projectType, complexity) => {
  return QUOTATION_CONFIG.featuresByComplexity[projectType]?.[complexity] || [];
};

export default QUOTATION_CONFIG;
