# API Reference

Servicios, flows, utilidades, tipos.

---

## Core Services

### conversationManager.js

```javascript
// Detectar intent y routear a flow correcto
await detectIntent(userId, message, req)
//  Retorna: 'appointmentFlow' | 'quotationFlow' | ...

// Procesar response según el flow actual
await handleFlowResponse(userId, message, req)
//  Retorna: { response, flowState, context }

// Obtener estado actual de conversación
await getConversationState(userId)
//  Retorna: { currentFlow, flowState, context, memory }
```

---

### sessionManager.js

```javascript
// Obtener sesión en RAM (rápido, temporal)
const session = await getSession(userId)
//  { flowState, context, startTime, tenantId }

// Actualizar sesión
await setSession(userId, { flowState, context })
//  Void (guarda en RAM)

// Limpiar sesión (logout)
await clearSession(userId)
//  Void

// Limpiar todas las sesiones (restart)
await clearAllSessions()
//  Void
```

---

### openAiService.js

```javascript
// Enviar mensaje a GPT y recibir respuesta
const response = await sendMessageOpenAI(userId, message, options)

// Opciones:
{
  systemPrompt: "Eres asistente...",
  temperature: 0.7,        // 0-2, default 0.7
  maxTokens: 500,          // Limite de respuesta
  model: "gpt-4"           // default gpt-4
}

// Retorna:
{
  response: "Texto de respuesta",
  tokens: { input: 50, output: 100 },
  model: "gpt-4",
  timestamp: 1705336800000
}
```

---

### firebaseService.js

```javascript
// Leer datos
const data = await getAsync('path/to/data')
//  Retorna el valor en esa ruta

// Escribir/actualizar
await updateAsync('path/to/data', { key: 'value' })
//  Void

// Obtener memory persistente
const memory = await getMemory(userId)
//  { conversationHistory, preferences, metadata }

// Guardar memory
await saveMemory(userId, memory)
//  Void

// Obtener todos los leads
const leads = await getLeads(score >= 70)
//  Array de leads
```

---

### whatsappService.js

```javascript
// Enviar mensaje WhatsApp
await sendWhatsAppMessage(userId, text)
//  { status: 'sent', messageId }

// Enviar imagen/archivo
await sendWhatsAppFile(userId, fileUrl, caption)
//  { status: 'sent', messageId }

// Marcar como leído
await markAsRead(messageId)
//  Void

// Obtener media URL
const url = await getMediaUrl(mediaId)
//  "https://..."
```

---

## Flows

### appointmentFlow.js

```javascript
// Iniciar flujo de cita
export async function start(userId, req) {
  // Retorna primer mensaje

export async function processResponse(userId, message, req) {
  // Procesa respuesta según estado
  // Estados: start  date  time  confirm  end
```

**Estados:**
1. start: Pregunta tipo de cita
2. date: Solicita fecha
3. 	ime: Solicita hora
4. confirm: Confirma detalles
5. end: Cita reservada

---

### quotationFlow.js

```javascript
export async function start(userId, req)
export async function processResponse(userId, message, req)
```

**Estados:**
1. start: ¿Tipo de proyecto?
2. scope: Detalles del alcance
3. 	imeline: ¿Para cuándo?
4. udget: ¿Presupuesto aproximado?
5. contact: Datos de contacto
6. end: Cotización enviada

---

### assistantFlow.js

```javascript
export async function start(userId, req)
export async function processResponse(userId, message, req)
```

Sin estado fijo. Usa OpenAI para responder preguntas generales.

---

### salesFlow.js

```javascript
export async function start(userId, req)
export async function processResponse(userId, message, req)
```

**Estados:**
1. discovery: Entender necesidad
2. qualify: Hacer preguntas clasificantes
3. pitch: Proponer soluciones
4. close: Agendar demo/cita

Calcula score automáticamente.

---

### humanHandoffFlow.js

```javascript
export async function start(userId, req)
export async function processResponse(userId, message, req)
```

Transfiere a agente humano. Almacena contexto para el agente.

---

## Utilities

### validators.js

```javascript
// Validar teléfono
isValidPhoneNumber(phone)
//  Boolean

// Validar email
isValidEmail(email)
//  Boolean

// Extraer entidades
extractEntities(text)
//  { email, phone, date, amount, ... }

// Normalizar teléfono
normalizePhone(phone, country = 'CO')
//  '+573337151064'
```

---

## Configuration

### aiPrompts.js

```javascript
export const prompts = {
  system: {
    assistant: "Prompt para assistant...",
    sales: "Prompt para sales...",
    // ...
  },
  tools: {
    summarize: "Resumen breve de...",
    analyze: "Analiza esto..."
  }
}
```

---

### aiModels.js

```javascript
export const models = {
  default: "gpt-4",
  fast: "gpt-3.5-turbo",
  vision: "gpt-4-vision"
}

export const config = {
  temperature: 0.7,
  maxTokens: 500,
  topP: 0.9
}
```

---

### env.js

```javascript
// Centraliza variables de entorno
export const config = {
  OPENAI_KEY,
  FIREBASE_URL,
  WHATSAPP_TOKEN,
  WHATSAPP_WEBHOOK_SECRET,
  TENANT_MODE,
  // ...
}

// Usa:
import { config } from './config/env.js'
const apiKey = config.OPENAI_KEY
```

---

## Types & Interfaces

**Conversation:**

```javascript
{
  id: string
  userId: string
  flow: 'appointmentFlow' | 'quotationFlow' | ...
  flowState: string
  messages: Message[]
  context: Record<string, any>
  createdAt: number
  updatedAt: number
}
```

**Message:**

```javascript
{
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  metadata?: {
    tokens?: { input: number, output: number }
    source?: 'whatsapp' | 'api'
  }
}
```

**Lead:**

```javascript
{
  id: string
  userId: string
  name: string
  company: string
  budget: number
  score: 0-100
  state: 'new' | 'qualified' | 'interested' | 'won' | 'lost'
  stage: string
  createdAt: number
  updatedAt: number
  assignedTo: string
  tags: string[]
}
```

**Memory:**

```javascript
{
  userId: string
  conversationHistory: Message[]
  preferences: {
    language: string
    timezone: string
    notifications: boolean
  }
  metadata: Record<string, any>
  lastUpdate: number
}
```

---

## Error Handling

**Códigos comunes:**

```
400 - Bad Request (campos faltantes/inválidos)
401 - Unauthorized (token inválido)
403 - Forbidden (no tiene permiso)
404 - Not Found (recurso no existe)
429 - Too Many Requests (rate limit)
500 - Server Error
503 - Service Unavailable (OpenAI down, etc)
```

**Respuesta de error:**

```json
{
  "error": "Invalid input",
  "code": "INVALID_REQUEST",
  "traceId": "tr_xyz789"
}
```

---

## Rate Limits

- Mensajes: 100/min por usuario
- API admin: 1000/hora
- OpenAI: Basado en plan (default: 90k tokens/min)

---

## Webhooks

**WhatsApp Webhook:**

```
POST /webhook
Headers: X-Hub-Signature: sha256=...

Body:
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "573337151064",
          "id": "wamid_123",
          "text": { "body": "Hola" }
        }],
        "statuses": [{
          "id": "wamid_123",
          "status": "delivered"
        }]
      }
    }]
  }]
}
```

---

## Ejemplo: Crear Custom Flow

```javascript
// src/services/conversationFlows/customFlow.js

export async function start(userId, req) {
  return {
    response: "Bienvenido a custom flow",
    shouldEnd: false,
    flowState: "step1"
  };
}

export async function processResponse(userId, message, req) {
  const state = req.session.flowState;
  
  if (state === "step1") {
    const response = await sendMessageOpenAI(
      userId,
      message,
      { systemPrompt: "Eres ayudante" }
    );
    return {
      response: response.response,
      flowState: "step2"
    };
  }
  
  return { response: "Listo", shouldEnd: true };
}
```

Luego registrar en conversationManager.js.

---

**Documentación completa.**

Ver: [01_ARCHITECTURE.md](01_ARCHITECTURE.md) para entender el flujo general.
