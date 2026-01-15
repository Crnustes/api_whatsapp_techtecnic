/**
 * Configuración de Quotation Engine para Tech Tecnic
 * Define precios, opciones y features por servicio de Desarrollo Web e IA
 * Precios en COP (pesos colombianos) - Pago único
 */

export const QUOTATION_CONFIG = {
  // Precios base por proyecto (pago único en COP)
  basePrices: {
    'Desarrollo Web': {
      emprendedor: 400000,
      profesional: 900000,
      avanzado: 1800000
    },
    'SEO & Posicionamiento': {
      emprendedor: 350000,
      profesional: 700000,
      avanzado: 1200000
    },
    'IA & Automatización': {
      emprendedor: 600000,
      profesional: 1200000,
      avanzado: 2500000
    },
    'Integraciones': {
      emprendedor: 400000,
      profesional: 800000,
      avanzado: 1500000
    },
    'Mantenimiento Web': {
      emprendedor: 250000,
      profesional: 500000,
      avanzado: 900000
    },
    'Apps Móviles': {
      emprendedor: 2000000,
      profesional: 4000000,
      avanzado: 8000000
    },
    'Chatbot WhatsApp con IA': {
      emprendedor: 800000,
      profesional: 1500000,
      avanzado: 3000000
    }
  },

  // Multiplicadores por urgencia/timeline
  durationMultipliers: {
    'Estándar (4-6 semanas)': 1.0,
    'Rápido (2-3 semanas)': 1.3,
    'Express (1 semana)': 1.6,
    'Flexible': 1.0
  },

  // Features por servicio y nivel
  featuresByComplexity: {
    'Desarrollo Web': {
      'Emprendedor': [
        'Landing page profesional (1-2 secciones)',
        'Dominio, hosting y SSL (1 año incluido)',
        'Diseño responsivo mobile-first',
        'Formulario de contacto + WhatsApp',
        'Optimización SEO básica',
        'Google Analytics configurado',
        '1 revisión incluida'
      ],
      'Profesional': [
        'Sitio web completo (3-5 secciones)',
        'SEO avanzado + analítica (GTM, GA4)',
        'Diseño personalizado premium',
        'Correos corporativos incluidos',
        'Integración con redes sociales',
        'Blog o noticias opcional',
        'Mantenimiento mensual opcional',
        '3 revisiones incluidas'
      ],
      'Avanzado': [
        'E-commerce completo (WooCommerce/React)',
        'Integraciones con IA y automatizaciones',
        'Optimización GEO + Core Web Vitals',
        'Panel de administración personalizado',
        'Capacitación post-entrega',
        'Soporte técnico 3 meses',
        'Migraciones y backups automáticos',
        'Revisiones ilimitadas en desarrollo'
      ]
    },
    'SEO & Posicionamiento': {
      'Emprendedor': [
        'Análisis de 15 keywords',
        'Optimización on-page',
        'Meta tags y estructura',
        'Reporte mensual básico'
      ],
      'Profesional': [
        'Análisis de 40 keywords',
        'SEO técnico completo',
        'Estrategia de contenidos',
        'Optimización velocidad',
        'Reportes semanales'
      ],
      'Avanzado': [
        'Estrategia SEO + GEO completa',
        'Auditoría técnica avanzada',
        'Link building',
        'Análisis competitivo',
        'Reportes personalizados',
        'Consultoría mensual'
      ]
    },
    'IA & Automatización': {
      'Emprendedor': [
        'Automatización simple (1-2 flujos)',
        'Chatbot básico',
        'Integración API básica',
        'Documentación incluida'
      ],
      'Profesional': [
        'Automatizaciones múltiples',
        'Chatbot IA con WhatsApp Business',
        'Integraciones CRM',
        'Dashboard de métricas',
        'Capacitación incluida'
      ],
      'Avanzado': [
        'Sistema IA completo personalizado',
        'Múltiples integraciones',
        'Machine Learning custom',
        'Escalabilidad empresarial',
        'Soporte técnico dedicado',
        'Reportes en tiempo real'
      ]
    },
    'Integraciones': {
      'Emprendedor': [
        '1-2 integraciones simples',
        'APIs estándar',
        'Documentación básica'
      ],
      'Profesional': [
        '3-5 integraciones',
        'CRM + herramientas marketing',
        'Sincronización datos',
        'Webhooks personalizados'
      ],
      'Avanzado': [
        'Integraciones complejas ilimitadas',
        'Arquitectura microservicios',
        'APIs custom',
        'Sistemas legacy',
        'Consultoría técnica'
      ]
    },
    'Mantenimiento Web': {
      'Emprendedor': [
        'Actualizaciones mensuales',
        'Backup semanal',
        'Monitoreo uptime',
        'Soporte por email'
      ],
      'Profesional': [
        'Actualizaciones semanales',
        'Backup diario',
        'Monitoreo 24/7',
        'Optimización performance',
        'Soporte prioritario'
      ],
      'Avanzado': [
        'Mantenimiento completo',
        'Actualizaciones inmediatas',
        'Backup en tiempo real',
        'Monitoreo avanzado',
        'Soporte técnico dedicado',
        'SLA garantizado'
      ]
    },
    'Apps Móviles': {
      'Emprendedor': [
        'App básica (1 plataforma)',
        'UI/UX funcional',
        'Backend básico',
        '2 revisiones'
      ],
      'Profesional': [
        'App completa (iOS + Android)',
        'Diseño premium',
        'Backend robusto',
        'Push notifications',
        'Analítica integrada',
        '5 revisiones'
      ],
      'Avanzado': [
        'App enterprise compleja',
        'Backend escalable',
        'Integraciones múltiples',
        'Diseño premium custom',
        'Testing QA completo',
        'Soporte post-launch',
        'Revisiones ilimitadas'
      ]
    },
    'Chatbot WhatsApp con IA': {
      'Emprendedor': [
        'Bot conversacional básico',
        'WhatsApp Business API',
        '3-5 flujos de conversación',
        'Integraciones simples',
        'Dashboard básico'
      ],
      'Profesional': [
        'Bot IA avanzado',
        'Múltiples flujos inteligentes',
        'Integración CRM + Sheets',
        'Detección de oportunidades',
        'Escalación automática',
        'Dashboard completo',
        'Capacitación incluida'
      ],
      'Avanzado': [
        'Sistema IA completo',
        'NLP personalizado',
        'Integraciones empresariales',
        'Memoria conversacional',
        'Analytics avanzado',
        'A/B testing',
        'Soporte dedicado',
        'Optimización continua'
      ]
    }
  },

  // Planes predefinidos (para mostrar en marketing/web)
  plans: {
    emprendedor: {
      name: 'Plan Emprendedor',
      ideal: 'Proyectos iniciales',
      includes: [
        'Landing page profesional',
        'Dominio, hosting y SSL (1 año)',
        'Diseño responsivo',
        'Formulario de contacto',
        'SEO básico',
        'Google Analytics',
        '1 revisión'
      ],
      price_cop: 400000
    },
    profesional: {
      name: 'Plan Profesional',
      ideal: 'Pymes y empresas',
      includes: [
        'Sitio web completo (3-5 secciones)',
        'SEO avanzado + analítica',
        'Diseño personalizado premium',
        'Correos corporativos',
        'Integración redes sociales',
        'Blog opcional',
        'Mantenimiento mensual opcional',
        '3 revisiones'
      ],
      price_cop: 900000
    },
    avanzado: {
      name: 'Plan Avanzado',
      ideal: 'E-commerce y aplicaciones',
      includes: [
        'E-commerce completo o App Web',
        'Integraciones IA y automatizaciones',
        'Optimización GEO + performance',
        'Panel administración',
        'Capacitación post-entrega',
        'Soporte 3 meses',
        'Migraciones y backups',
        'Revisiones ilimitadas'
      ],
      price_cop: 1800000
    },
    partner: {
      name: 'Plan Partner',
      ideal: 'Agencias y proyectos complejos',
      includes: [
        'Desarrollo white-label',
        'Proyectos escalables y complejos',
        'Confidencialidad y NDA',
        'Tarifas preferenciales',
        'Soporte dedicado',
        'Arquitectura empresarial',
        'Integraciones avanzadas',
        'Consultoría técnica incluida'
      ],
      price_cop: 'personalizado'
    }
  }
};
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
