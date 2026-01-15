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
    greeting: '🍋 ¡Hola! Bienvenido a Lemon Digital. Somos una agencia de Marketing Digital que potencia tu negocio. ¿Qué necesitas?',
    buttons: [
      { type: 'reply', reply: { id: 'option_audit', title: '📊 Auditoría Gratis' } },
      { type: 'reply', reply: { id: 'option_quotation', title: '💰 Cotización' } },
      { type: 'reply', reply: { id: 'option_question', title: '❓ Consulta' } },
    ]
  },
  assistant: {
    name: 'Asistente',
    maxQuestions: 3,
    initMessage: `❓ *Asistente Lemon Digital*\n\n¿Qué pregunta tienes sobre Marketing Digital, SEO, contenidos, chatbots de IA, o nuestros servicios?\n\n📋 Puedes hacer hasta 3 preguntas, luego te conectaremos con un especialista.`
  },
  appointment: {
    name: 'Agendar Reunión',
    initMessage: '📅 *Agendar Auditoría de Marketing Digital*\n\nTe ayudaremos a agendar una llamada con nuestro equipo. ¿Cuál es tu nombre?',
    serviceExamples: [
      'Auditoría SEO',
      'Estrategia de Marketing Digital',
      'Campaña de Anuncios',
      'Posicionamiento Google',
      'Marketing de Contenidos',
      'Estrategia Lead Magnet',
      'Email Marketing',
      'Chatbot de IA 24/7'
    ]
  },
  quotation: {
    name: 'Solicitar Cotización',
    initMessage: `💰 *Cotización Personalizada de Lemon*

Para darte la mejor propuesta, cuéntanos:

📝 Sobre tu negocio:
• ¿Qué tipo de empresa eres? (e-commerce, B2B, servicios, etc)
• ¿Cuál es tu objetivo principal? (vender, generar leads, posicionarse)
• ¿Cuáles son tus canales actuales? (web, redes, email)
• ¿Cuál es tu presupuesto aproximado?

Si no estás seguro, escribe: *"ayuda"* y te guiaremos.`,
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
