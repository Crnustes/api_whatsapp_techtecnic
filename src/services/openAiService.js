import OpenAi from 'openai';
import config from '../config/env.js';

const client = new OpenAi({
  apiKey: config.OPENAI_API_KEY,
});

const openAiService = async (message) => {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Eres el asistente de la agencia de desarrollo Tech Tecnic. Responde en texto plano y breve, estilo WhatsApp, sin saludos ni charla extra. No inicies conversación; solo contesta a la pregunta o petición del usuario sobre servicios de desarrollo (web, móvil, ecommerce, automatización, integraciones, soporte). Sé claro, práctico y conciso.'
        },
        { role: 'user', content: message }
      ],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error communicating with OpenAI:', error);
    throw error;
  }
};

export default openAiService;