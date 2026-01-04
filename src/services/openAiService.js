import OpenAi from 'openai';
import config from '../config/env.js';

const client = new OpenAi({
  apiKey: config.OPENAI_API_KEY,
});

/**
 * Servicio mejorado de OpenAI
 * Soporta:
 * 1. Mensaje simple (string) → respuesta rápida
 * 2. Array de mensajes → conversación con contexto
 */
const openAiService = async (input) => {
  try {
    // Determinar si es mensaje simple o array de mensajes
    let messages;

    if (typeof input === 'string') {
      // Mensaje simple - usar contexto predeterminado
      messages = [
        {
          role: 'system',
          content: `Eres el asistente de la agencia de desarrollo Tech Tecnic.

Características principales:
• Desarrollo Web (React, Next.js, Vue.js, Node.js)
• Aplicaciones Móviles (React Native, Flutter)
• Ecommerce (soluciones custom)
• Automatización de procesos
• Integraciones de sistemas

Instrucciones:
- Responde en WhatsApp (texto plano, sin markdown)
- Sé profesional pero accesible
- Máximo 3-4 líneas por respuesta
- Sé práctico y directo
- Si el usuario quiere información específica que no tienes, sugiere agendar una llamada
- Siempre ofrece opciones: agendar, ver portfolio, cotización, preguntas
- Nunca ofrezcas servicios que no son los nuestros`
        },
        {
          role: 'user',
          content: input
        }
      ];
    } else if (Array.isArray(input)) {
      // Array de mensajes - usar como está
      messages = input;
    } else {
      throw new Error('Input debe ser string o array de mensajes');
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300, // Limitar para WhatsApp
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error en OpenAI:', error);
    throw error;
  }
};

export default openAiService;