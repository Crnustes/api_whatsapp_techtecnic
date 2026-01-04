# ⚙️ Manual de Configuración Rápida

Para que funcione inmediatamente.

---

## 1. Variables de Entorno (.env)

Copia esto a tu `.env`:

```env
PORT=3000
WEBHOOK_VERIFY_TOKEN=mi_token_super_secreto_aqui

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=tu_numero_aqui
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_id_aqui
WHATSAPP_ACCESS_TOKEN=EAA...tu_token_aqui

# OpenAI
OPENAI_API_KEY=sk-...tu_clave_aqui
```

**Dónde obtener cada valor:**

### WEBHOOK_VERIFY_TOKEN
```
Invéntate uno seguro, ej:
webhook_tech_tecnic_2024_super_seguro
```

### WhatsApp API
```
1. Ir a: https://developers.facebook.com/
2. Crear app tipo "Business"
3. En WhatsApp → Primeros Pasos
4. Copiar: WABA ID, Phone Number ID, Token
```

### OpenAI API
```
1. Ir a: https://platform.openai.com/
2. Account → API keys
3. Crear nueva key
4. Copiar valor (empieza con sk-)
```

---

## 2. Credenciales de Google (credentials.json)

Ubicación: `src/credentials/credentials.json`

```json
{
  "type": "service_account",
  "project_id": "tu_proyecto",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...@...-...-...iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**Cómo obtenerlo:**

```
1. Google Cloud Console → Proyecto
2. IAM & Admin → Service Accounts
3. Crear service account
4. Crear key → JSON
5. Descargar
6. Poner en src/credentials/credentials.json
7. Compartir Google Sheets con ese email
```

---

## 3. Google Sheets Setup

### Crear hojas

En tu Google Sheets, crear 4 hojas con estos nombres:
- `reservas`
- `cotizaciones`
- `conversaciones`
- `escalados`

### Headers para cada hoja

**reservas!A1:H1**
```
Timestamp | Nombre | Email | Teléfono | Empresa | Servicio | Descripción | Estado
```

**cotizaciones!A1:H1**
```
Timestamp | Email | Cliente | Tipo_Proyecto | Complejidad | Opción | Monto | Estado
```

**conversaciones!A1:F1**
```
Timestamp | User_ID | Nombre | Interacción | Resumen | Estado
```

**escalados!A1:E1**
```
Timestamp | User_ID | Cliente | Problema | Estado
```

### Copiar ID del Spreadsheet

En la URL de Google Sheets:
```
https://docs.google.com/spreadsheets/d/[ESTE_ID_AQUI]/edit

Copiar esa ID y ponerla en: googleSheetsService.js
const spreadsheetId = "...aqui..."
```

---

## 4. Configuración de Webhook en WhatsApp

### URL del Webhook

En WhatsApp Cloud API → Configuración → Webhooks:

```
URL: https://tu-dominio.com/webhook
Token: mi_token_super_secreto_aqui (el mismo de .env)
```

### Campos a suscribirse

```
messages
message_status
read_receipts
```

---

## 5. Personalización de Prompts (Opcional)

En `src/services/openAiService.js`, cambiar el prompt de sistema:

```javascript
role: 'system',
content: `Eres el asistente de [TU_EMPRESA].
Somos especialistas en [TUS_SERVICIOS].
...`
```

En `src/services/conversationFlows/quotationFlow.js`, ajustar precios:

```javascript
this.basePrices = {
  'Sitio Web': {
    basic: 1500,      // Tu precio
    medium: 3500,
    high: 7000
  },
  // ... más tipos
}
```

---

## 6. Verificación Rápida

### Paso 1: Webhook
```bash
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=mi_token_super_secreto_aqui&hub.challenge=test123"
```

Esperado: `test123`

### Paso 2: Google Sheets
```bash
npm run dev
# En logs debe decir que se conecta sin error
```

### Paso 3: OpenAI
```javascript
// En app.js test
import openAiService from './src/services/openAiService.js';
openAiService('hola').then(console.log)
```

Esperado: respuesta de OpenAI

---

## 7. Iniciar Servidor

```bash
npm run dev
```

Esperado:
```
Server is listening on port: 3000
```

---

## 8. Enviar Mensaje de Prueba

Desde tu teléfono (con WhatsApp Business):

```
Envía: "hola"
```

Esperado:
```
Bot responde con bienvenida + menú
```

---

## Configuración por Plataforma

### Heroku

```bash
# Crear app
heroku create tu-app-name

# Configurar variables
heroku config:set PORT=3000
heroku config:set WEBHOOK_VERIFY_TOKEN=mi_token
heroku config:set WHATSAPP_PHONE_NUMBER_ID=...
# ... resto

# Ver credenciales
heroku config:view

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

### Railway

```bash
# Conectar repo GitHub
# Agregar variables en Settings → Variables
# Deploy automático
```

### Render / Fly.io / Replit

```bash
# Seguir docs específicas de cada plataforma
# Configurar variables de entorno
# Deploy
```

---

## Monitorear en Vivo

```bash
# Ver todos los logs
npm run dev

# Buscar errores específicos
npm run dev 2>&1 | grep -i "error"

# Ver Google Sheets desde terminal
# (Depende de setup de CLI)
```

---

## Problemas Comunes

### "Webhook not validating"
```
Solución: Verifica que WEBHOOK_VERIFY_TOKEN sea correcto
En .env debe ser igual al configurado en WhatsApp
```

### "Google Sheets permission denied"
```
Solución: Compartir spreadsheet con el email del service account
Email: algo-...@...iam.gserviceaccount.com
```

### "OpenAI API error"
```
Solución: Verifica que OPENAI_API_KEY esté correcto
Prueba en: https://platform.openai.com/account/api-keys
```

### "Mensaje no llega"
```
Solución: 
1. Verificar WHATSAPP_PHONE_NUMBER_ID correcto
2. Verificar WHATSAPP_ACCESS_TOKEN válido
3. Verificar que tu número está agregado al test
```

---

## Checklist Final

- [ ] .env configurado con valores reales
- [ ] credentials.json en `src/credentials/`
- [ ] Google Sheets con 4 hojas
- [ ] Headers en cada hoja
- [ ] Compartir Google Sheets con service account email
- [ ] Webhook URL configurada en WhatsApp
- [ ] Servidor inicia sin errores (`npm run dev`)
- [ ] Webhook validation funciona (curl test)
- [ ] Mensaje de prueba recibido

**Si todo está verde → ¡Listo para usar!** ✅

---

## Próximas Acciones

1. Prueba local completa
2. Deploy a producción
3. Monitorear primeras 24h
4. Recopilar feedback
5. Iterar mejoras

---

**¿Necesitas ayuda?**

Consulta:
- IMPLEMENTACION.md → Troubleshooting
- ARQUITECTURA.md → Entender componentes
- CONVERSACIONES_EJEMPLOS.md → Ver flujos

---

**¡Configuración completada!** 🎉
