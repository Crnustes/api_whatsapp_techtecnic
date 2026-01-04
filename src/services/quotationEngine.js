/**
 * Quotation Engine
 * Motor inteligente de cotizaciones
 * Genera 3 opciones de precio basadas en parámetros
 */

class QuotationEngine {
  constructor() {
    // Precios base por tipo de proyecto
    this.basePrices = {
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
    };

    // Multiplicadores por timeline
    this.timelineMultipliers = {
      'ASAP': 1.4,      // +40% por urgencia
      'Rápido': 1.2,    // +20%
      'Normal': 1.0,    // Sin ajuste
      'Flexible': 0.9   // -10% por más tiempo
    };

    // Features por complejidad y tipo
    this.featuresByComplexity = {
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
    };
  }

  /**
   * Generar 3 opciones de cotización
   */
  generateQuotations(params) {
    const {
      projectType,
      complexity,
      timeline,
      analysis
    } = params;

    // Obtener precio base
    const basePrice = this.basePrices[projectType]?.[complexity.toLowerCase()] || 5000;

    // Aplicar multiplicador de timeline
    const timelineMultiplier = this.timelineMultipliers[timeline] || 1.0;
    const adjustedPrice = basePrice * timelineMultiplier;

    // Generar 3 opciones
    const basic = {
      price: Math.round(adjustedPrice * 0.7),
      features: this.getFeatures(projectType, complexity, 'basic'),
      timeline: this.calculateTimeline(complexity, 'high'), // Más tiempo = menos caro
      description: 'Cumple lo esencial'
    };

    const recommended = {
      price: Math.round(adjustedPrice),
      features: this.getFeatures(projectType, complexity, 'recommended'),
      timeline: this.calculateTimeline(complexity, 'normal'),
      description: 'Lo que recomendamos'
    };

    const premium = {
      price: Math.round(adjustedPrice * 1.5),
      features: this.getFeatures(projectType, complexity, 'premium'),
      timeline: this.calculateTimeline(complexity, 'fast'),
      description: 'Máximas características'
    };

    return {
      basic,
      recommended,
      premium,
      analysis: analysis,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Obtener features según complejidad
   */
  getFeatures(projectType, complexity, option) {
    const features = this.featuresByComplexity[projectType]?.[complexity] || [];

    switch (option) {
      case 'basic':
        return features.slice(0, Math.ceil(features.length * 0.5));

      case 'recommended':
        return features.slice(0, Math.ceil(features.length * 0.8));

      case 'premium':
        return features;

      default:
        return features;
    }
  }

  /**
   * Calcular timeline en semanas
   */
  calculateTimeline(complexity, speed) {
    const baseTimeline = {
      'Básico': 2,
      'Medio': 4,
      'Alto': 8
    };

    const base = baseTimeline[complexity] || 4;

    switch (speed) {
      case 'fast':
        return Math.max(1, Math.ceil(base * 0.7));
      case 'normal':
        return base;
      case 'high':
        return Math.ceil(base * 1.5);
      default:
        return base;
    }
  }

  /**
   * Obtener recomendación basada en análisis
   */
  getRecommendation(projectType, complexity, budget) {
    // Lógica simple: si el presupuesto es bajo, recomendar básico
    // Si es medio, recomendar la opción recomendada
    // Si es alto, premium

    if (budget < 3000) return 'basic';
    if (budget < 10000) return 'recommended';
    return 'premium';
  }

  /**
   * Validar si es viable
   */
  isViable(projectType, complexity, timeline) {
    // Ciertas combinaciones no son viables
    // Por ej: App Móvil Alta Complejidad en ASAP no es realista

    if (projectType === 'App Móvil' && complexity === 'Alto' && timeline === 'ASAP') {
      return {
        viable: false,
        message: 'Una app móvil de alta complejidad no se puede completar en menos de 2 semanas. Te recomendamos extender el timeline.'
      };
    }

    return { viable: true };
  }
}

export default new QuotationEngine();
