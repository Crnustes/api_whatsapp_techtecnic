# Development Guide

Onboarding, crear flows, modificar prompts, agregar servicios.

---

## Onboarding (30 min)

**Paso 1: Setup (15 min)**

```bash
git clone <repo> && cd techtecnic
npm install
cp .env.example .env
# Pegar credenciales en .env
npm run dev
```

Verificar: curl http://localhost:3000/health  {"status":"ok"}

**Paso 2: Entender arquitectura (10 min)**

Leer: [01_ARCHITECTURE.md](01_ARCHITECTURE.md)

**Resumen:**
- Webhook recibe mensaje WhatsApp
- conversationManager detecta intención
- Flow específico procesa (appointment/quotation/assistant)
- OpenAI genera respuesta
- Guardar state + memory
- Enviar respuesta

**Paso 3: Primer cambio (5 min)**

Editar src/services/conversationFlows/assistantFlow.js:

```javascript
export async function start(userId, req) {
  return {
    response: "¡Hola! Bienvenido ",
    shouldEnd: false
  };
}
```

Enviar mensaje vía WhatsApp  debe aparecer nuevo mensaje.

---

## Crear Nuevo Flow

**1. Crear archivo:**

```bash
touch src/services/conversationFlows/miFlow.js
```

**2. Implementar estructura:**

```javascript
export async function start(userId, req) {
  return {
    response: "Mensaje inicial",
    shouldEnd: false,
    flowState: "step1"
  };
}

export async function processResponse(userId, message, req) {
  const state = req.session.flowState;
  
  if (state === "step1") {
    return {
      response: "Siguiente paso",
      flowState: "step2",
      context: { data: message }
    };
  }
  
  if (state === "step2") {
    return {
      response: "¡Listo!",
      shouldEnd: true
    };
  }
}
```

**3. Registrar en conversationManager.js:**

```javascript
import * as miFlow from './conversationFlows/miFlow.js';

// En detectIntent():
if (lowerMsg.includes('palabra_clave')) {
  return 'miFlow';
}

// En handleFlowResponse():
case 'miFlow':
  return await miFlow.processResponse(userId, msg, req);
```

**4. Probar:**

```bash
npm run dev
# Enviar: "palabra_clave"
```

---

## Modificar Prompts IA

**Ubicación:** src/config/aiPrompts.js

**Ejemplo:**

```javascript
export const prompts = {
  system: {
    assistant: Eres asistente de \.

Tu objetivo:
- Ayudar de forma amigable
- Hacer 1 pregunta a la vez
- Máximo 3 líneas por respuesta
- Usar emojis ocasionalmente

Servicios: \

Si no sabes algo, di "déjame verificar".
  }
};
```

**Usar en flow:**

```javascript
const response = await sendMessageOpenAI(userId, message, {
  systemPrompt: prompts.system.assistant
    .replace('\', 'Tech Tecnic')
    .replace('\', 'web, app, consultoría'),
  temperature: 0.7,
  maxTokens: 500
});
```

---

## Agregar Nuevo Service

**Ejemplo: Service de notificaciones**

```bash
touch src/services/notificationService.js
```

```javascript
export async function sendNotification(userId, message, type = 'info') {
  const emoji = { info: 'ℹ', success: '', error: '' }[type];
  const formatted = \\ \\;
  
  await sendWhatsAppMessage(userId, formatted);
  console.log(\[\] \: \\);
}

export async function notifyAdmin(message) {
  const ADMIN = '+573337151064';
  await sendWhatsAppMessage(ADMIN, \ \\);
}
```

**Usar en flow:**

```javascript
import { sendNotification } from '../notificationService.js';

if (appointmentConfirmed) {
  await sendNotification(userId, 'Cita confirmada', 'success');
  await notifyAdmin(\Nueva cita: \\);
}
```

---

## Estructura de Proyecto

```
src/
 routes/webhookRoutes.js
 controllers/webhookController.js
 services/
   conversationManager.js        Orquestador
   sessionManager.js             Estado (RAM)
   openAiService.js              OpenAI
   firebaseService.js            Database
   whatsappService.js            WhatsApp
   conversationFlows/
      appointmentFlow.js
      quotationFlow.js
      assistantFlow.js
      salesFlow.js
      humanHandoffFlow.js
 config/
   env.js
   firebase.js
   aiPrompts.js
   aiModels.js
   dataServices.js
 tenants/
    defaults/config.json
    techtecnic/config.json
```

---

## Best Practices

**Errores:**

```javascript
//  BIEN
try {
  const response = await sendMessageOpenAI(userId, msg);
  return response;
} catch (error) {
  console.error(\OpenAI failed: \\);
  return "Lo siento, ocurrió un error.";
}

//  MAL
const response = await sendMessageOpenAI(userId, msg);
return response;
```

**Validación:**

```javascript
//  BIEN
if (!userId || typeof message !== 'string') {
  throw new Error('Invalid inputs');
}

//  MAL
const lower = message.toLowerCase();  // Puede fallar si message es null
```

**Logs:**

```javascript
console.log(\[\] \ - State: \\);
```

---

## Debugging

**Logs en tiempo real:**

```bash
npm run dev
# Terminal muestra todos los logs

# O en producción:
pm2 logs techtecnic-bot
```

**Por TraceId:**

```bash
pm2 logs | grep "tr_abc123"
```

**Firebase Console:**

Ver datos en: https://console.firebase.google.com/project/techtecnic-bot/database

Rutas: clientProfiles/{userId}/memory, conversations/{userId}

---

**Siguiente:** [05_TESTING_OPERATIONS.md](05_TESTING_OPERATIONS.md)
