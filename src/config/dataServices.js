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
    greeting: '👋 ¡Hola! Soy el asistente de Tech Tecnic. Transformamos ideas en experiencias digitales que generan resultados reales 🚀\n\n¿Qué estás buscando hoy?',
    buttons: [
      { type: 'reply', reply: { id: 'option_audit', title: '🚀 Iniciar Proyecto' } },
      { type: 'reply', reply: { id: 'option_quotation', title: '💰 Cotización' } },
      { type: 'reply', reply: { id: 'option_question', title: '❓ Consulta' } },
    ]
  },
  assistant: {
    name: 'Asistente',
    maxQuestions: 3,
    initMessage: `¡Perfecto! 💬\n\nPregúntame lo que necesites sobre desarrollo web, IA, apps, SEO, o cualquier cosa técnica. Sin filtros, sin límites de temas.\n\nAdelante 👇`
  },
  appointment: {
    name: 'Agendar Reunión',
    initMessage: '� ¡Cool! Agendemos una llamada\n\nPara coordinar mejor, ¿cuál es tu nombre?',
    serviceExamples: [
      'Desarrollo Web',
      'E-commerce',
      'SEO & Posicionamiento',
      'Apps Móviles',
      'IA & Automatización',
      'Chatbot WhatsApp',
      'Integraciones',
      'Mantenimiento Web'
    ]
  },
  quotation: {
    name: 'Solicitar Cotización',
    initMessage: `💰 ¡Perfecto! Vamos a armar tu cotización\n\nCuéntame qué necesitas:\n\n• ¿Qué tipo de proyecto? (web, app, e-commerce, chatbot, etc)\n• ¿Qué problema quieres resolver?\n• ¿Tienes algo ya funcionando o es desde cero?\n• ¿Cuándo lo necesitas?\n\nEscríbeme todo lo que se te ocurra 👇`,
    plans: {
      inicio: {
        name: 'Plan Inicio',
        ideal: 'Nuevos negocios',
        includes: [
          'Auditoría Digital SEO',
          'Estrategia de 3 meses',
          '3 optimizaciones en web',
          'Reporte mensual',
          'Consulta inicial gratis',
          'Seguimiento básico'
        ],
        price_usd: 300
      },
      crece: {
        name: 'Plan Crece',
        ideal: 'Medianas empresas',
        includes: [
          'Auditoría Digital completa',
          'Estrategia SEO + SEM',
          'Gestión de Campañas Google Ads',
          'Marketing de Contenidos (4 posts)',
          'Reportes semanales',
          'Consulta mensual con especialista',
          'Optimización continua'
        ],
        price_usd: 800
      },
      domina: {
        name: 'Plan Domina',
        ideal: 'Empresas establecidas',
        includes: [
          'Estrategia Digital 360°',
          'SEO + SEM + Lead Magnet',
          'Campañas en redes sociales',
          'Marketing de Contenidos (12 posts)',
          'Email Marketing automatizado',
          'Consultoría mensual',
          'Reportes detallados',
          'Asesor dedicado'
        ],
        price_usd: 1500
      },
      partner: {
        name: 'Plan Partner',
        ideal: 'Agencias y proyectos complejos',
        includes: [
          'Soluciones personalizadas',
          'Múltiples estrategias simultáneas',
          'Equipo dedicado',
          'SLA garantizado',
          'Soporte 24/7',
          'Integraciones avanzadas',
          'Reportes custom',
          'Consultoría técnica incluida',
          'Precio personalizado'
        ],
        price_usd: 'personalizado'
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
  menuOptions: ['1', '2', '3', '4'],
  
  // Detección automática de servicios desde mensajes web
  services: {
    'desarrollo_web': ['desarrollo web', 'sitio web', 'página web', 'website'],
    'ecommerce': ['e-commerce', 'ecommerce', 'tienda online', 'tienda virtual'],
    'chatbot': ['chatbot', 'bot', 'asistente virtual', 'automatización whatsapp'],
    'app_movil': ['app móvil', 'aplicación móvil', 'app android', 'app ios'],
    'integraciones': ['integrar', 'integraciones', 'integración', 'conectar sistemas', 'api'],
    'seo': ['seo', 'posicionamiento', 'posicionamiento web', 'google'],
    'ia': ['inteligencia artificial', 'ia', 'machine learning', 'ai'],
    'mantenimiento': ['mantenimiento web', 'soporte web', 'actualización web']
  }
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
