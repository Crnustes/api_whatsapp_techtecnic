# 🚀 Implementación del Bot Mejorado - Guía Técnica

## Contenido

1. [Overview de Cambios](#overview)
2. [Estructura Nueva](#estructura)
3. [Instalación](#instalación)
4. [Configuración](#configuración)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Overview de Cambios

### Antes vs Después

**ANTES:**
- Lógica monolítica en `messageHandler.js`
- Estado guardado en memoria simple
- Un único flujo por usuario
- Prompts básicos sin contexto
- Sin validaciones robutas

**DESPUÉS:**
- Arquitectura modular y escalable
- Session Manager centralizado
- Múltiples flujos simultáneos
- Contexto conversacional completo
- Validaciones exhaustivas
- 3 opciones de cotización automáticas
- Escalado a agentes humanos
- Google Sheets mejorado (múltiples hojas)

---

## Estructura Nueva

```
src/
├── services/
│   ├── sessionManager.js              ⭐ NUEVO - Gestor de sesiones
│   ├── conversationManager.js         ⭐ NUEVO - Orquestador principal
│   ├── quotationEngine.js             ⭐ NUEVO - Motor de cotizaciones
│   ├── conversationFlows/
│   │   ├── appointmentFlow.js         ⭐ MEJORADO - Flujo de agendamiento
│   │   ├── quotationFlow.js           ⭐ NUEVO - Flujo de cotización
│   │   ├── assistantFlow.js           ⭐ NUEVO - Asistente IA mejorado
│   │   └── humanHandoffFlow.js        ⭐ NUEVO - Escalado a agentes
│   ├── messageHandler.js              ✏️ REFACTORIZADO - Ahora usa conversationManager
│   ├── openAiService.js               ✏️ MEJORADO - Soporta contexto
│   ├── googleSheetsService.js         ✏️ MEJORADO - Múltiples hojas
│   ├── whatsappService.js             ✔️ SIN CAMBIOS
│   └── httpRequest/
│       └── sendToWhatsApp.js          ✔️ SIN CAMBIOS
│
├── utils/
│   └── validators.js                  ⭐ NUEVO - Validaciones reutilizables
│
├── config/
│   └── env.js                         ✔️ SIN CAMBIOS
│
├── routes/
│   └── webhookRoutes.js               ✔️ SIN CAMBIOS
│
├── controllers/
│   └── webhookController.js           ✔️ SIN CAMBIOS
│
└── app.js                             ✔️ SIN CAMBIOS
```

---

## Instalación

### 1. Actualizar dependencias (opcional)

El proyecto actual ya tiene las dependencias necesarias. Si quieres agregar más:

```bash
npm install redis # Para caching en futuro
npm install nodemailer # Para emails
npm install uuid # Para IDs únicos
```

### 2. Sincronizar archivos

Los nuevos archivos ya están creados en el workspace:
- ✅ sessionManager.js
- ✅ conversationManager.js
- ✅ quotationEngine.js
- ✅ conversationFlows/ (4 archivos)
- ✅ utils/validators.js
- ✅ Archivos mejorados

### 3. Verificar estructura

```bash
ls -la src/services/
ls -la src/utils/
```

---

## Configuración

### 1. Variables de Entorno (.env)

Verificar que existan:

```env
PORT=3000
WEBHOOK_VERIFY_TOKEN=tu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=tu_numero_aqui
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_id_aqui
WHATSAPP_ACCESS_TOKEN=tu_token_aqui
OPENAI_API_KEY=tu_key_aqui
```

### 2. Google Sheets

La configuración está en `googleSheetsService.js`:

```javascript
SHEET_CONFIG = {
  spreadsheetId: "1EE1ai1QrBXI0SZ3DdvrZrrn3U6DkAD9ILKzTMWezSnM",
  sheets: {
    reservas: { ... },
    cotizaciones: { ... },
    conversaciones: { ... },
    escalados: { ... }
  }
}
```

**Asegurate de tener estas hojas en tu Google Sheets:**
- ✅ reservas (para agendamientos)
- ✅ cotizaciones (para cotizaciones generadas)
- ✅ conversaciones (para registro de interacciones)
- ✅ escalados (para tickets escalados a agentes)

### 3. Credenciales de Google

El archivo `credentials.json` debe estar en `src/credentials/`:

```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

---

## Testing

### 1. Test Local (sin deploy)

```bash
npm run dev
```

Prueba con tu teléfono:

```
1. Envía: "hola"
2. Verifica que aparezca el menú
3. Presiona: "📅 Agendar Reunión"
4. Completa el flujo
5. Verifica que se guarde en Google Sheets
```

### 2. Test de Flujos

```javascript
// En terminal, con el servidor corriendo:

// Simular agendamiento
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5491123456789",
            "type": "text",
            "text": {"body": "hola"}
          }],
          "contacts": [{
            "wa_id": "5491123456789",
            "profile": {"name": "Juan"}
          }]
        }
      }]
    }]
  }'
```

### 3. Verificar Estado de Sesiones

Los logs mostrarán:

```
Session created: userId
Conversation history: [...]
Flow data: {...}
```

---

## Deployment

### 1. Preparar para Producción

```bash
# Verificar que no hay errores
npm run dev

# Revisar logs
tail -f logs/app.log
```

### 2. Actualizar Variables de Entorno

```bash
# En tu plataforma (Heroku, Vercel, etc.)
PORT=3000
WEBHOOK_VERIFY_TOKEN=token_seguro_aqui
# ... resto de variables
```

### 3. Deploy

```bash
# Heroku
git push heroku main

# Vercel / Railway / etc.
# Seguir instrucciones de tu plataforma
```

### 4. Verificar Webhook

```bash
curl -X GET "https://tu-dominio.com/webhook?hub.mode=subscribe&hub.verify_token=tu_token&hub.challenge=test"
```

Debe devolver: `test`

---

## Troubleshooting

### Problema: "No se guarda en Google Sheets"

**Solución:**
1. Verificar credenciales en `src/credentials/credentials.json`
2. Verificar que el email de Google Sheets tiene permisos
3. Revisar el ID del spreadsheet en `googleSheetsService.js`
4. Comprobar logs: `npm run dev`

### Problema: "OpenAI devuelve error"

**Solución:**
1. Verificar que `OPENAI_API_KEY` está correcto
2. Verificar límite de tokens usado
3. Aumentar timeout en openAiService

### Problema: "Mensajes no se envían"

**Solución:**
1. Verificar token de WhatsApp
2. Verificar número de teléfono
3. Revisar límites de rate limiting
4. Comprobar números de teléfono en formato E.164 (+5491234567)

### Problema: "Sesiones se pierden"

**Solución:**
1. Aumentar `SESSION_TIMEOUT` en sessionManager.js
2. Implementar Redis para persistencia
3. Guardar sesiones en BD

---

## Monitoreo y Métricas

### Monitorear Sesiones

```javascript
// En cualquier momento:
import conversationManager from './services/conversationManager.js';

console.log(conversationManager.getGlobalStats());
// Output:
// {
//   totalSessions: 5,
//   sessions: [
//     { userId, flow, messages, created }
//   ]
// }
```

### Monitorear Google Sheets

```javascript
import { getReservations, getQuotations } from './services/googleSheetsService.js';

const reservas = await getReservations();
const cotizaciones = await getQuotations();
```

---

## Próximos Pasos

### Fase 2 - Mejoras Inmediatas

- [ ] Implementar Redis para state persistence
- [ ] Agregar email confirmation
- [ ] Crear dashboard de admin
- [ ] Integrar con calendario (Google Calendar)
- [ ] Añadir soporte multi-idioma

### Fase 3 - Características Avanzadas

- [ ] IA entrenada con contexto de la empresa
- [ ] Análisis de sentimiento
- [ ] Cotizaciones basadas en ML
- [ ] Chatbot multi-canal (Instagram, Facebook)
- [ ] Sistema de pagos integrado

### Fase 4 - Enterprise

- [ ] CRM integrado
- [ ] BI Dashboard
- [ ] Analytics avanzado
- [ ] Gestión de agentes escalable
- [ ] Integraciones ERP/CRM

---

## Soporte

Para preguntas o problemas:

1. Revisar logs: `npm run dev`
2. Verificar Google Sheets (datos se guardan?)
3. Probar con curl
4. Revisar documentación de APIs (WhatsApp, OpenAI)

---

**Última actualización:** Enero 3, 2026
**Versión:** 2.0.0
