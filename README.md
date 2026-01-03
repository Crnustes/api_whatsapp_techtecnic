# Tech Tecnic WhatsApp Bot

Automated WhatsApp webhook for Tech Tecnic agency: greets leads, offers quick menu (agendar llamada, consulta con asistente, ver portafolio), registra datos en Google Sheets, y permite consultas vía asistente (OpenAI).

## Requisitos
- Node.js 18+ (se probó con Node 22.x)
- Una app de WhatsApp Business Cloud (número, token, verify token, versión de API)
- Credenciales de Google Service Account con acceso de editor a la hoja
- Cuenta de OpenAI con API key (si usas el asistente)

## Instalación
```bash
npm install
```

## Variables de entorno (.env)
Crea un archivo `.env` en la raíz (ya está en .gitignore). Ejemplo:
```
WEBHOOK_VERIFY_TOKEN=tu_verify_token
API_TOKEN=tu_token_de_whatsapp
BUSINESS_PHONE=tu_numero_id
API_VERSION=v22.0
BASE_URL=https://graph.facebook.com
OPENAI_API_KEY=tu_api_key_openai
PORT=3000
```

## Credenciales de Google Sheets
Coloca `credentials.json` en `src/credentials/credentials.json` y comparte la hoja con el service account.
- ID de la hoja está en `googleSheetsService.js`
- La pestaña se llama `reservas` y usa rango `A2:F`

## Scripts
- `npm run start` → inicia con nodemon (dev)

## Flujo principal
- Saludo + menú:
  - Agendar llamada → captura nombre, empresa, tipo de proyecto, requerimiento y guarda en Google Sheets
  - Hacer consulta → responde con asistente (OpenAI)
  - Ver portafolio → envía enlace
- Marca mensajes como leídos y responde según estado/conversación.

## Notas
- No subas `.env` ni `src/credentials/credentials.json` al repo.
- Si OpenAI da 429 por cuota, desactiva temporalmente la opción de consulta o maneja el error con mensaje fijo.

## Estructura
```
src/
  app.js
  config/env.js
  controllers/webhookController.js
  routers/
  services/
    messageHandler.js
    whatsappService.js
    openAiService.js
    googleSheetsService.js
    httpRequest/sendToWhatsApp.js
```

## Despliegue rápido
1) Configura `.env` y `credentials.json`
2) `npm install`
3) `npm run start`
4) Verifica el webhook con `WEBHOOK_VERIFY_TOKEN`

## Licencia
MIT
