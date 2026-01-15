/**
 * Configuración centralizada de servicios de datos
 * Define qué datos se guardan, dónde y cómo
 */

export const DATA_SERVICES = {
  // Servicio Google Sheets
  GOOGLE_SHEETS: {
    name: 'Google Sheets',
    type: 'spreadsheet',
    provider: 'google',
    spreadsheetId: '1EE1ai1QrBXI0SZ3DdvrZrrn3U6DkAD9ILKzTMWezSnM',
    sheets: {
      reservas: {
        name: 'reservas',
        range: 'reservas!A2:H',
        headers: ['Timestamp', 'Nombre', 'Email', 'Teléfono', 'Empresa', 'Servicio', 'Descripción', 'Estado']
      },
      cotizaciones: {
        name: 'cotizaciones',
        range: 'cotizaciones!A2:H',
        headers: ['Timestamp', 'Email', 'Cliente', 'Tipo_Proyecto', 'Complejidad', 'Opción', 'Monto', 'Estado']
      },
      conversaciones: {
        name: 'conversaciones',
        range: 'conversaciones!A2:F',
        headers: ['Timestamp', 'User_ID', 'Nombre', 'Interacción', 'Resumen', 'Estado']
      },
      escalados: {
        name: 'escalados',
        range: 'escalados!A2:F',
        headers: ['Timestamp', 'Nombre', 'Teléfono', 'Resumen', 'Calificación', 'Estado']
      }
    }
  }
};

// ========================================
// CONFIGURACIÓN DE FLUJOS Y DATOS
// ========================================

/**
 * Configuración de flujos conversacionales
 */
export const CONVERSATION_FLOWS = {
  welcome: {
    name: 'Bienvenida',
    greeting: '👋 ¡Hola! Bienvenido a Tech Tecnic. ¿En qué podemos ayudarte?',
    buttons: [
      { type: 'reply', reply: { id: 'option_agenda', title: 'Agendar Reunion' } },
      { type: 'reply', reply: { id: 'option_quotation', title: 'Cotizacion' } },
      { type: 'reply', reply: { id: 'option_question', title: 'Consulta' } },
    ]
  },
  assistant: {
    name: 'Asistente',
    maxQuestions: 3,
    initMessage: `❓ *Asistente Tech Tecnic*\n\n¿Qué pregunta tienes sobre nuestros servicios, tecnología o proyectos?\n\n📋 Puedes hacer hasta 3 preguntas, luego te conectaremos con un especialista.`
  },
  appointment: {
    name: 'Agendar Reunion',
    initMessage: '📅 *Agendar Reunión*\n\nTe ayudaremos a agendar una llamada con nuestro equipo. ¿Cuál es tu nombre?',
    serviceExamples: [
      'Sitio web corporativo',
      'Tienda online',
      'App móvil iOS/Android',
      'Sistema de gestión',
      'Landing page',
      'Rediseño de sitio',
      'Consultoría técnica'
    ]
  },
  quotation: {
    name: 'Solicitar Cotización',
    initMessage: `💰 *Solicitar Cotización*

Para brindarte la mejor recomendación personalizada, cuéntanos:

📝 ¿Qué proyecto tienes en mente? Describe:
• ¿Qué tipo de sitio/app necesitas?
• ¿Cuál es el objetivo principal?
• ¿Qué funcionalidades te gustaría incluir?
• ¿Tienes alguna referencia o ejemplo?

Si no estás seguro, escribe: *"no estoy seguro"* y te ayudaremos.`,
    plans: {
      emprendedor: {
        name: 'Plan Emprendedor',
        ideal: 'Lanzar tu presencia digital',
        includes: [
          'Landing page moderna (1-2 secciones)',
          'Dominio, hosting y SSL (1 año incluido)',
          'Diseño responsivo mobile-first',
          'Formulario de contacto + WhatsApp',
          'Optimización SEO básica',
          'Google Analytics configurado',
          '1 revisión incluida'
        ],
        price_cop: 400000
      },
      profesional: {
        name: 'Plan Profesional',
        ideal: 'Empresas que buscan destacar',
        includes: [
          'Sitio completo (3-5 secciones)',
          'SEO avanzado + analítica (GTM, GA4)',
          'Diseño personalizado premium',
          'Correos corporativos incluidos',
          'Integración con redes sociales',
          'Blog o noticias opcional',
          'Mantenimiento mensual opcional',
          '3 revisiones incluidas'
        ],
        price_cop: 900000
      },
      avanzado: {
        name: 'Plan Avanzado',
        ideal: 'E-commerce y aplicaciones web',
        includes: [
          'E-commerce completo (WooCommerce/React)',
          'Integraciones con IA y automatizaciones',
          'Optimización SEO + Core Web Vitals',
          'Panel de administración personalizado',
          'Capacitación post-entrega',
          'Soporte técnico 3 meses',
          'Migraciones y backups automáticos',
          'Revisiones ilimitadas en desarrollo'
        ],
        price_cop: 1800000
      },
      partner: {
        name: 'Plan Partner',
        ideal: 'Agencias y desarrollo white-label',
        includes: [
          'Desarrollo white-label (tu marca)',
          'Proyectos escalables y complejos',
          'Confidencialidad y NDA',
          'Tarifas preferenciales por volumen',
          'Soporte técnico dedicado',
          'Arquitectura empresarial',
          'Integraciones avanzadas',
          'Consultoría técnica incluida'
        ],
        price_cop: 'personalizado'
      }
    }
  }
};

/**
 * Palabras clave para reconocimiento de intención
 */
export const KEYWORDS = {
  greetings: ['hola', 'hello', 'hi', 'buenos', 'buenas', 'hey', 'ey', 'que onda'],
  escalation: ['asesor', 'humano', 'agente', 'persona', 'especialista'],
  menuOptions: ['1', '2', '3', '4']
};

/**
 * Obtener configuración de servicio de datos
 */
export const getDataServiceConfig = (serviceKey) => {
  return DATA_SERVICES[serviceKey];
};

/**
 * Servicio de datos activo por defecto
 */
export const DEFAULT_DATA_SERVICE = 'GOOGLE_SHEETS';

/**
 * Obtener la configuración de hoja específica
 */
export const getSheetConfig = (sheetName, serviceKey = DEFAULT_DATA_SERVICE) => {
  const service = DATA_SERVICES[serviceKey];
  return service?.sheets?.[sheetName];
};

export default DATA_SERVICES;
