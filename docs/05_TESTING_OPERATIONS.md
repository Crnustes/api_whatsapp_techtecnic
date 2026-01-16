# Testing & Operations

Comandos de test, checklists, validación operativa.

---

## Suites de Test

**Ejecutar todos:**

```bash
npm test
```

**Tests por área:**

```bash
npm test -- src/services/openAiService.test.js
npm test -- src/services/conversationManager.test.js
npm test -- src/services/sessionManager.test.js
```

---

## Validar Idempotencia

**Problema:** Mismo mensaje 2x = 2 respuestas (debe ser 1)

**Test:**

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Enviar mismo webhook 2 veces
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "573337151064",
          "id": "wamid_123",
          "text": {"body": "Hola"}
        }]
      }
    }]
  }]
}
EOF

# Repetir mismo curl con mismo "id": "wamid_123"
```

**Validación:**
- Primera vez: WhatsApp recibe respuesta
- Segunda vez: Nada (idempotencia activa)

Ver logs: [IDEMPOTENT] Duplicate wamid_123 - skipped

---

## Validar Feature Flags

**Setup:**

```bash
# Editar .env
FEATURE_FLAG_APPOINTMENT=true
FEATURE_FLAG_QUOTATION=false
FEATURE_FLAG_SALES=true
```

**Test:**

```javascript
// src/services/conversationManager.js
import { isFeatureEnabled } from './flagService.js';

if (msg.includes('cita')) {
  if (!isFeatureEnabled('appointment')) {
    return "Las citas no están disponibles";
  }
  // Procesar cita
}
```

**Verificar dinámicamente:**

```bash
curl http://localhost:3000/admin/flags
# Retorna: { appointment: true, quotation: false, ... }
```

---

## Sales Flow

**Checklist de conversación:**

```
[ ] Usuario pregunta por servicio
[ ] Bot detecta oportunidad (lead scoring)
[ ] Bot hace preguntas calificantes (3-4)
[ ] Genera lead con score 0-100
[ ] Guarda en salesContacts/{score}
[ ] Notifica equipo si score > 70
```

**Test:**

```bash
# Simular conversación
Mensaje 1: "Necesito una app"
Bot debe: "¿Qué tipo de app? ¿iOS/Android/Web?"

Mensaje 2: "Algo para ecommerce"
Bot debe: "¿Presupuesto aproximado?"

Mensaje 3: ""
Bot debe: Generar lead, guardar, notificar

Ver Firebase: salesContacts/70  contiene nuevo lead
```

---

## Memory (Persistencia)

**Ver memoria de usuario:**

```bash
curl http://localhost:3000/admin/memory/573337151064
```

**Respuesta esperada:**

```json
{
  "conversationHistory": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "Hola! ¿Cómo estás?" }
  ],
  "preferences": {
    "language": "es",
    "timezone": "America/Bogota"
  },
  "lastUpdate": 1699564800000
}
```

**Limpiar memoria:**

```bash
curl -X DELETE http://localhost:3000/admin/memory/573337151064
```

---

## Integration (Servicios externos)

**OpenAI:**

```bash
# Verificar conexión
curl http://localhost:3000/admin/health/openai

# Retorna: { status: "ok", model: "gpt-4" }
```

**Firebase:**

```bash
# Leer datos
firebase database:get / --project techtecnic-bot

# Escribir test
firebase database:set /test/sample '{"test":true}' --project techtecnic-bot
```

**WhatsApp:**

```bash
# Enviar mensaje de prueba
curl -X POST http://localhost:3000/test-message \
  -H "Content-Type: application/json" \
  -d '{"to":"573337151064","text":"Test"}'
```

---

## TraceID Tracking

**Cada request tiene TraceID único para debug:**

```bash
# Logs con TraceID
npm run dev | grep "tr_abc123"
```

**Flujo completo de un mensaje:**

```
[tr_xyz789] Webhook recibido
[tr_xyz789] conversationManager.start()
[tr_xyz789] sessionManager.getSession(userId)
[tr_xyz789] appointmentFlow.processResponse()
[tr_xyz789] openAiService.sendMessage()
[tr_xyz789] firebaseService.save(memory)
[tr_xyz789] whatsappService.sendMessage()
[tr_xyz789]  DONE (234ms)
```

---

## Checklist Pre-Deploy

**Code:**
- [ ] 
pm test pasa 100%
- [ ] 
pm run lint sin errores
- [ ] Todos los .env configurados
- [ ] No hay console.log() en production

**Firebase:**
- [ ] Rules actualizadas
- [ ] Multi-tenant testado (crear tenant, usar, eliminar)
- [ ] Backup automatizado activo

**WhatsApp:**
- [ ] Webhook URL válida
- [ ] Certificate verificado
- [ ] Test message llega correctamente
- [ ] Health check responde

**Performance:**
- [ ] Response time < 2s
- [ ] Memory usage < 200MB
- [ ] No memory leaks (verificar con PM2)

**Monitoring:**
- [ ] PM2 logging activo
- [ ] Sentry/alertas configuradas
- [ ] Dashboard accessible

---

## Monitoreo En Vivo

**Top comandos:**

```bash
# Ver procesos
pm2 list

# Ver logs en vivo
pm2 logs techtecnic-bot

# Ver métricas
pm2 monit

# Reiniciar con cero downtime
pm2 reload techtecnic-bot

# Ver errors
pm2 logs techtecnic-bot --err
```

---

**Siguiente:** [06_SALES_BUSINESS.md](06_SALES_BUSINESS.md)
