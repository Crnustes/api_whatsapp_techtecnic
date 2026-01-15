/**
 * Configuración de Quotation Engine para Lemon Digital
 * Define precios, opciones y features por servicio de Marketing Digital
 * 
 * Ubicación para cambiar: Este archivo
 */

export const QUOTATION_CONFIG = {
  // Precios base mensuales por servicio de Lemon
  basePrices: {
    'Auditoría SEO': {
      basico: 300,
      medio: 500,
      alto: 800
    },
    'Diseño Web': {
      basico: 600,
      medio: 1200,
      alto: 2000
    },
    'SEO + SEM': {
      basico: 500,
      medio: 1000,
      alto: 1800
    },
    'Marketing Contenidos': {
      basico: 400,
      medio: 800,
      alto: 1500
    },
    'Lead Magnet + Email': {
      basico: 400,
      medio: 800,
      alto: 1200
    },
    'Chatbots de IA': {
      basico: 350,
      medio: 750,
      alto: 1500
    },
    'Estrategia 360': {
      basico: 800,
      medio: 1500,
      alto: 3000
    }
  },

  // Multiplicadores por timeline/duración
  durationMultipliers: {
    '3 meses': 1.0,      // Base
    '6 meses': 0.95,     // -5% descuento
    '12 meses': 0.85,    // -15% descuento
    'Flexible': 1.0      // Sin ajuste
  },

  // Features por servicio y nivel
  featuresByComplexity: {
    'Auditoría SEO': {
      'Básica': [
        'Análisis de 20 keywords',
        'Reporte competencia',
        'Optimización on-page básica',
        '1 reporte'
      ],
      'Media': [
        'Análisis de 50 keywords',
        'Análisis técnico SEO',
        'Reporte competencia avanzado',
        'Auditoría backlinks',
        '2 reportes'
      ],
      'Alta': [
        'Análisis SEO completo',
        'Auditoría técnica avanzada',
        'Análisis competitivo 360°',
        'Plan acción detallado',
        'Consultoría monthly',
        'Reportes semanales'
      ]
    },
    'Diseño Web': {
      'Básica': [
        'Landing page moderna',
        'Diseño responsivo',
        'Optimización conversión',
        '3 revisiones'
      ],
      'Media': [
        'Sitio web completo (5-10 págs)',
        'Diseño personalizado',
        'SEO on-page',
        'Blog integrado',
        '5 revisiones'
      ],
      'Alta': [
        'Sitio web escalable',
        'Diseño premium',
        'CMS integrado',
        'E-commerce básico',
        'Integraciones custom',
        'SEO avanzado',
        'Revisiones ilimitadas',
        'Soporte 3 meses'
      ]
    },
    'SEO + SEM': {
      'Básica': [
        'Gestión 10 keywords',
        'Campañas Google Ads básicas',
        'Budget: $500/mes',
        'Reporte mensual'
      ],
      'Media': [
        'Gestión 30 keywords',
        'SEO + Ads en Google',
        'Redes Sociales (2 plataformas)',
        'Budget: $1000-2000/mes',
        'Reportes semanales'
      ],
      'Alta': [
        'Estrategia SEO completa',
        'Campañas SEM en múltiples canales',
        'Redes Sociales gestión completa',
        'Retargeting avanzado',
        'Budget: $2000+/mes',
        'Optimización continua',
        'Asesor dedicado'
      ]
    },
    'Marketing Contenidos': {
      'Básica': [
        '4 artículos al mes',
        'SEO optimizado',
        'Investigación keywords',
        'Publicación en blog'
      ],
      'Media': [
        '8 artículos al mes',
        'SEO avanzado',
        'Infografías',
        'Video scripts',
        'Distribución en redes'
      ],
      'Alta': [
        '12+ artículos al mes',
        'Estrategia de contenidos',
        'Videos producidos',
        'Podcasts',
        'Ebooks',
        'Distribución multicanal',
        'Asesor dedicado'
      ]
    },
    'Lead Magnet + Email': {
      'Básica': [
        '1 Lead Magnet diseñado',
        'Landing page',
        '5 emails automatizados',
        'Reporte básico'
      ],
      'Media': [
        '2-3 Lead Magnets',
        'Funnels completos',
        'Secuencia 15 emails',
        'Segmentación audience',
        'Reportes detallados'
      ],
      'Alta': [
        'Estrategia Lead Gen 360°',
        'Múltiples Lead Magnets',
        'Funnels avanzados',
        '30+ emails secuencia',
        'Integraciones CRM',
        'Optimización continua',
        'Consultoría monthly'
      ]
    },
    'Chatbots de IA': {
      'Básica': [
        'Chatbot básico WhatsApp/Web',
        'Respuestas predefinidas',
        'Captura de leads simple',
        'Horarios limitados',
        'Reporte básico'
      ],
      'Media': [
        'Chatbot IA conversacional',
        'Multi-canal (WhatsApp, Web, Email)',
        'Integración CRM',
        'Disponibilidad 24/7',
        'Escalado a agentes',
        'Reportes detallados',
        'Mantenimiento incluido'
      ],
      'Alta': [
        'Chatbot IA avanzado',
        'Múltiples canales',
        'Integración con sistemas (ERP, CRM)',
        'Análisis de sentimiento',
        'Personalización por usuario',
        'Capacidad de venta automatizada',
        'Asesor dedicado',
        'SLA 99.9%'
      ]
    },
    'Estrategia 360': {
      'Básica': [
        'Auditoría Digital',
        'Plan estratégico 3 meses',
        '2 canales activados',
        'Reportes mensuales'
      ],
      'Media': [
        'Estrategia Digital completa',
        '3-4 canales simultaneos',
        'Content + Ads + Email',
        'Lead Magnet incluido',
        'Reportes semanales'
      ],
      'Alta': [
        'Estrategia 360° integral',
        'Todos los canales',
        'Equipo dedicado',
        'Tecnología avanzada',
        'Optimización AI',
        'Reportes daily',
        'SLA garantizado'
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
 * Obtener multiplicadores de duración
 */
export const getDurationMultipliers = () => {
  return QUOTATION_CONFIG.durationMultipliers;
};

/**
 * Obtener features por tipo y complejidad
 */
export const getFeatures = (serviceType, complexity) => {
  return QUOTATION_CONFIG.featuresByComplexity[serviceType]?.[complexity] || [];
};

export default QUOTATION_CONFIG;
