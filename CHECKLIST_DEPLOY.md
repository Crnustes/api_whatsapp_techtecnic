# ✅ Checklist de Verificación - Pre-Deploy

## Verificaciones Locales

### Código

- [ ] No hay `console.error()` sin manejo
- [ ] Imports están correctos (rutas relativas)
- [ ] No hay variables globales innecesarias
- [ ] Funciones tienen JSDoc comments
- [ ] Código formateado (2 espacios indentación)

### Archivos Nuevos Creados

- [ ] `src/services/sessionManager.js` ✅
- [ ] `src/services/conversationManager.js` ✅
- [ ] `src/services/quotationEngine.js` ✅
- [ ] `src/services/conversationFlows/appointmentFlow.js` ✅
- [ ] `src/services/conversationFlows/quotationFlow.js` ✅
- [ ] `src/services/conversationFlows/assistantFlow.js` ✅
- [ ] `src/services/conversationFlows/humanHandoffFlow.js` ✅
- [ ] `src/utils/validators.js` ✅
- [ ] `PLAN_MEJORAS.md` ✅
- [ ] `IMPLEMENTACION.md` ✅
- [ ] `ARQUITECTURA.md` ✅
- [ ] `CONVERSACIONES_EJEMPLOS.md` ✅

### Archivos Modificados

- [ ] `src/services/messageHandler.js` - Refactorizado ✅
- [ ] `src/services/openAiService.js` - Mejorado ✅
- [ ] `src/services/googleSheetsService.js` - Mejorado ✅

### Archivos Sin Cambios

- [ ] `src/services/whatsappService.js` - OK
- [ ] `src/controllers/webhookController.js` - OK
- [ ] `src/routes/webhookRoutes.js` - OK
- [ ] `src/app.js` - OK
- [ ] `package.json` - OK

---

## Pruebas Locales

### Servidor

```bash
npm run dev
```

- [ ] Servidor inicia sin errores
- [ ] Logs muestran puerto correcto (3000)
- [ ] No hay warnings en consola

### Webhook Verification

```bash
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=123"
```

- [ ] Devuelve `123` (el challenge)
- [ ] No hay errores

### Envío de Mensajes Simulado

```javascript
// Crear archivo test-bot.js
const axios = require('axios');

const payload = {
  entry: [{
    changes: [{
      value: {
        messages: [{
          from: "5491234567890",
          type: "text",
          text: { body: "hola" },
          id: "msg123"
        }],
        contacts: [{
          wa_id: "5491234567890",
          profile: { name: "Test User" }
        }]
      }
    }]
  }]
};

axios.post('http://localhost:3000/webhook', payload)
  .then(res => console.log('OK'))
  .catch(err => console.error(err));
```

- [ ] Script ejecuta sin errores
- [ ] Mensaje aparece en logs

### Google Sheets

- [ ] Credenciales en `src/credentials/credentials.json` son válidas
- [ ] Hojas existen: reservas, cotizaciones, conversaciones, escalados
- [ ] Email de servicio tiene permisos en la hoja

```bash
# Test de lectura
node -e "
import { getReservations } from './src/services/googleSheetsService.js';
getReservations().then(data => console.log(data));
"
```

- [ ] Devuelve datos sin errores

### OpenAI

- [ ] `OPENAI_API_KEY` está configurado
- [ ] Token válido

```bash
# Prueba simple
node -e "
import openAiService from './src/services/openAiService.js';
openAiService('¿Hola?').then(res => console.log(res));
"
```

- [ ] Devuelve respuesta sin errores

### Flujos Manuales

**Test 1: Agendamiento**
```
1. Envía: "hola"
2. Presiona: "📅 Agendar Reunión"
3. Completa: nombre → email → servicio → descripción → fecha
4. Verifica en Google Sheets → fila nueva en "reservas"
```

- [ ] Flujo completo sin errores
- [ ] Datos guardados correctamente

**Test 2: Cotización**
```
1. Envía: "hola"
2. Presiona: "💰 Solicitar Cotización"
3. Selecciona: tipo → complejidad → timeline → describe
4. Obtiene: 3 opciones de precio
5. Selecciona opción → proporciona email
6. Verifica en Google Sheets → fila nueva en "cotizaciones"
```

- [ ] Precios calculados correctamente
- [ ] Datos guardados

**Test 3: Consulta IA**
```
1. Envía: "hola"
2. Presiona: "❓ Hacer Consulta"
3. Pregunta: "¿Hacen apps?"
4. Recibe respuesta de IA
```

- [ ] Respuesta relevante
- [ ] Feedback buttons aparecen

**Test 4: Escalado**
```
1. Envía: "hola"
2. Envía: "necesito hablar con humano"
3. Bot dice: "conectando con especialista"
```

- [ ] Ticket creado en Google Sheets

---

## Variables de Entorno

- [ ] `PORT` - Configurado (3000 recomendado)
- [ ] `WEBHOOK_VERIFY_TOKEN` - Único y seguro
- [ ] `WHATSAPP_PHONE_NUMBER_ID` - Válido
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` - Válido
- [ ] `WHATSAPP_ACCESS_TOKEN` - Válido
- [ ] `OPENAI_API_KEY` - Válido

---

## Google Sheets - Hojas Requeridas

### Hoja: reservas

| Columna | Descripción |
|---------|-------------|
| A | Timestamp |
| B | Nombre |
| C | Email |
| D | Teléfono |
| E | Empresa |
| F | Servicio |
| G | Descripción |
| H | Estado |

- [ ] Headers en fila 1
- [ ] Rango A2:H configurado

### Hoja: cotizaciones

| Columna | Descripción |
|---------|-------------|
| A | Timestamp |
| B | Email |
| C | Cliente |
| D | Tipo_Proyecto |
| E | Complejidad |
| F | Opción (basic/recommended/premium) |
| G | Monto |
| H | Estado |

- [ ] Headers en fila 1
- [ ] Rango A2:H configurado

### Hoja: conversaciones

| Columna | Descripción |
|---------|-------------|
| A | Timestamp |
| B | User_ID |
| C | Nombre |
| D | Interacción |
| E | Resumen |
| F | Estado |

- [ ] Headers en fila 1
- [ ] Rango A2:F configurado

### Hoja: escalados

| Columna | Descripción |
|---------|-------------|
| A | Timestamp |
| B | User_ID |
| C | Cliente |
| D | Problema |
| E | Estado |

- [ ] Headers en fila 1
- [ ] Rango A2:E configurado

---

## Seguridad

- [ ] Token de webhook no está en código
- [ ] API keys no están en repositorio
- [ ] `.env` está en `.gitignore`
- [ ] Validaciones previenen inyecciones SQL/XSS
- [ ] Rate limiting configurado (aunque básico)
- [ ] Mensajes de error no revelan info sensible

---

## Performance

- [ ] Sesiones se limpian después de 30 min
- [ ] Historial conversacional limitado a 50 mensajes
- [ ] Google Sheets responde en < 5 segundos
- [ ] OpenAI responde en < 10 segundos
- [ ] Tokens max_tokens = 300 (apropiado para WhatsApp)

---

## Documentación

- [ ] README.md actualizado (si aplica)
- [ ] PLAN_MEJORAS.md completado
- [ ] IMPLEMENTACION.md con instrucciones claras
- [ ] ARQUITECTURA.md con diagramas
- [ ] CONVERSACIONES_EJEMPLOS.md con flujos
- [ ] Este checklist completado

---

## Deploy Checklist

### Antes de Desplegar

- [ ] Commit todos los cambios
- [ ] Revisar git log (commits descriptivos)
- [ ] Crear rama `release/v2.0.0` (opcional)
- [ ] Backup de Google Sheets
- [ ] Notificar a equipo

### Deployment

**En Heroku:**
```bash
heroku config:set PORT=3000
heroku config:set WEBHOOK_VERIFY_TOKEN=...
# ... resto de variables
git push heroku main
```

- [ ] Deploy exitoso
- [ ] Logs sin errores
- [ ] Webhook URL actualizada en WhatsApp Cloud API

**En otra plataforma:**
```bash
# Railway / Render / etc.
# Seguir instrucciones específicas
```

### Post-Deploy

- [ ] Webhook verification funciona
- [ ] Enviar mensaje de prueba
- [ ] Verificar Google Sheets (nuevo registro)
- [ ] Flujos funcionan correctamente
- [ ] No hay memory leaks (revisar logs)

---

## Rollback

Si algo falla:

```bash
# Volver a versión anterior
git revert HEAD
npm run dev
git push heroku main

# O redeploy de rama anterior
git push heroku release/v1.0.0:main
```

---

## Monitoreo Post-Deploy

**Primeros días:**
- [ ] Revisar logs cada hora
- [ ] Monitorear uso de API (OpenAI, WhatsApp)
- [ ] Revisar Google Sheets diariamente
- [ ] Verificar sesiones activas

**Continuamente:**
- [ ] Errores en logs → fix inmediato
- [ ] Performance degradándose → optimizar
- [ ] Usuarios reportan issues → debuggear
- [ ] Backups de Google Sheets (semanales)

---

## Métricas a Trackear

Después del deploy, monitorear:

```javascript
// Agregar al app.js o middleware
const metrics = {
  totalMessages: 0,
  totalFlows: 0,
  activeSessions: 0,
  errors: 0,
  avgResponseTime: 0
};

// Log cada hora
setInterval(() => {
  console.log('METRICS:', metrics);
}, 60 * 60 * 1000);
```

- [ ] Mensajes por día
- [ ] Tasa de error
- [ ] Sesiones activas
- [ ] Flujos completados

---

## Signos de Alerta

Después del deploy, observar:

🚨 **Crítico:**
- Webhook no valida
- Google Sheets retorna error
- OpenAI siempre falla
- Memory leak (uso creciente)

⚠️ **Importante:**
- Muchos errores de validación
- Sesiones no se limpian
- Response time > 10s
- Usuarios no pueden completar flujos

✅ **OK:**
- Algunos errores ocasionales
- Response time < 5s
- Usuarios pueden completar flujos
- Datos se guardan correctamente

---

## Pruebas Posteriores al Deploy

Después de 24 horas en producción:

- [ ] Al menos 10 mensajes procesados
- [ ] Al menos 1 agendamiento completado
- [ ] Google Sheets con registros
- [ ] Cero crashes
- [ ] Logs sin errores críticos

---

**Estado:** ⏳ PENDIENTE DE REVIEW

**Checklist completado por:** _________________

**Fecha:** _________________

**Notas:** 

```
[Agregar cualquier nota especial]
```

---

**¡Listo para desplegar!** 🚀
