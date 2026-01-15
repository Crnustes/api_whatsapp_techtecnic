# Tech Tecnic WhatsApp Bot 🚀

Bot automatizado de WhatsApp para Tech Tecnic que gestiona consultas de clientes, cotizaciones y asistencia inteligente con OpenAI.

**Tech Tecnic**: Transformamos ideas en experiencias digitales que generan resultados reales.

## Requisitos

- **Node.js** 18+ (probado en Node 22.x)
- **WhatsApp Business Cloud API** con token y verify token
- **Google Service Account** con acceso a Google Sheets
- **OpenAI API Key** (para asistente IA)

## Instalación

\\\ash
npm install
\\\

## Configuración

Crear archivo \.env\ en la raíz:

\\\env
WEBHOOK_VERIFY_TOKEN=tu_verify_token
API_TOKEN=tu_token_de_whatsapp
BUSINESS_PHONE_NUMBER_ID=tu_phone_id
OPENAI_API_KEY=tu_openai_key
GOOGLE_SHEET_ID=tu_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu_email
GOOGLE_PRIVATE_KEY=tu_private_key
PORT=3000
\\\

## Ejecución

**Desarrollo:**
\\\ash
npm run dev
\\\

**Producción:**
\\\ash
npm start
\\\

## Estructura del Proyecto

\\\
src/
 app.js                      # Entrada principal
 routes/webhookRoutes.js     # Rutas del webhook
 controllers/                # Controladores
 services/
    whatsappService.js      # Integración WhatsApp
    openAiService.js        # Integración OpenAI
    googleSheetsService.js  # Integración Google Sheets
    messageHandler.js       # Procesamiento de mensajes
    sessionManager.js       # Gestión de sesiones
    conversationFlows/      # Flujos de conversación
 config/                     # Configuraciones
 adapters/                   # Adaptadores
\\\

## Funcionalidades

-  Webhook de WhatsApp
-  Menú interactivo con opciones
-  Agendamiento de citas y registro en Google Sheets
-  Asistente inteligente con OpenAI
-  Gestión automática de sesiones
-  Manejo de flujos de conversación

## Despliegue

1. Configura todas las variables en \.env\
2. Coloca \credentials.json\ en \src/credentials/\
3. Ejecuta \
pm install\
4. Inicia con \
pm start\
5. Configura el webhook en WhatsApp Business con tu \WEBHOOK_VERIFY_TOKEN\

## Notas Importantes

-  No subas \.env\ ni \credentials.json\ al repositorio
- Verifica que el Google Sheet esté compartido con el service account
- OpenAI requiere créditos disponibles para funcionar
