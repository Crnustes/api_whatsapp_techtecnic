/**
 * Validators
 * Funciones de validación reutilizables
 */

/**
 * Validar email
 */
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Normalizar número de teléfono
 */
export function normalizePhone(phone) {
  // Remover espacios, guiones, paréntesis
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Si no comienza con +, asumir código de país
  if (!cleaned.startsWith('+')) {
    return `+57${cleaned}`; // Colombia por defecto
  }
  
  return cleaned;
}

/**
 * Validar teléfono
 */
export function validatePhone(phone) {
  const normalized = normalizePhone(phone);
  // Debe tener entre 10 y 15 dígitos
  const digitsOnly = normalized.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Parsear fecha en formato DD/MM/YYYY
 */
export function parseDate(dateStr) {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.trim().match(regex);
  
  if (!match) return null;
  
  const [, day, month, year] = match;
  const date = new Date(year, month - 1, day);
  
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Parsear fecha y hora en formato DD/MM/YYYY HH:MM
 */
export function parseDateTime(dateTimeStr) {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})$/;
  const match = dateTimeStr.trim().match(regex);
  
  if (!match) return null;
  
  const [, day, month, year, hours, minutes] = match;
  const date = new Date(year, month - 1, day, hours, minutes);
  
  if (isNaN(date.getTime())) return null;
  
  // Validar que sea fecha futura
  if (date <= new Date()) {
    return null;
  }
  
  return date;
}

/**
 * Formatear fecha y hora a string legible
 */
export function formatDateTime(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Validar nombre
 */
export function validateName(name) {
  return name.length >= 2 && name.length <= 100;
}

/**
 * Sanitizar texto (prevenir inyecciones)
 */
export function sanitizeText(text) {
  return text
    .trim()
    .substring(0, 1000) // Limitar longitud
    .replace(/[<>]/g, ''); // Remover símbolos peligrosos
}

/**
 * Validar complejidad
 */
export function validateComplexity(complexity) {
  const valid = ['Básico', 'Medio', 'Alto'];
  return valid.includes(complexity);
}

/**
 * Validar timeline
 */
export function validateTimeline(timeline) {
  const valid = ['ASAP', 'Rápido', 'Normal', 'Flexible'];
  return valid.includes(timeline);
}

/**
 * Validar tipo de proyecto
 */
export function validateProjectType(type) {
  const valid = [
    'Sitio Web',
    'Ecommerce',
    'App Móvil',
    'Automatización',
    'Integración',
    'Otro'
  ];
  return valid.includes(type);
}

/**
 * Detectar intención en texto
 */
export function detectIntention(text) {
  const lower = text.toLowerCase();
  
  const intentions = {
    greeting: ['hola', 'buenos', 'hi', 'hey', 'buenas'],
    help: ['ayuda', 'help', 'soporte', 'problema', 'error', 'necesito'],
    quotation: ['cotización', 'presupuesto', 'precio', 'cuanto cuesta'],
    appointment: ['agendar', 'reunión', 'cita', 'llamada', 'llamada'],
    portfolio: ['portfolio', 'proyectos', 'ejemplos', 'casos'],
    human_agent: ['humano', 'persona', 'agente', 'hablar con']
  };
  
  for (const [intention, keywords] of Object.entries(intentions)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return intention;
    }
  }
  
  return 'unknown';
}

/**
 * Validar que campos requeridos estén presentes
 */
export function validateRequired(obj, fields) {
  const missing = [];
  
  for (const field of fields) {
    if (!obj[field] || obj[field].toString().trim() === '') {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Limitar tasa de mensajes (simple rate limiting)
 */
export function isRateLimited(userId, maxMessagesPerMinute = 10) {
  // Esto es un placeholder - en producción usar Redis
  // Por ahora retornar false (no limitado)
  return false;
}
