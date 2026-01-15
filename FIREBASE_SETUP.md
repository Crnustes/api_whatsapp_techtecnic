# 🔥 Configuración de Firebase para Tech Tecnic Bot

Este documento explica cómo configurar Firebase Realtime Database para tener memoria persistente en el chatbot.

## ¿Por qué Firebase?

- ✅ **Serverless**: No necesitas servidor adicional
- ✅ **Gratis**: Plan gratuito generoso
- ✅ **Fácil**: Integración simple con Node.js
- ✅ **Rápido**: Base de datos en tiempo real
- ✅ **Escalable**: Crece con tu negocio

## Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto"
3. Nombre: `techtecnic-bot` (o el que prefieras)
4. Desactiva Google Analytics (opcional)
5. Click "Crear proyecto"

## Paso 2: Habilitar Realtime Database

1. En el menú lateral, click en **"Realtime Database"**
2. Click en **"Crear base de datos"**
3. Selecciona ubicación: **Estados Unidos (us-central1)** o más cercana
4. Modo de seguridad: **"Comenzar en modo de prueba"**
   - Cambiaremos las reglas después
5. Click "Habilitar"

## Paso 3: Configurar Reglas de Seguridad

En la pestaña "Reglas", reemplaza con:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "clientProfiles": {
      ".indexOn": ["phoneNumber", "lastInteractionDate"]
    },
    "conversations": {
      ".indexOn": ["phoneNumber", "createdAt"]
    },
    "opportunities": {
      ".indexOn": ["phoneNumber", "status"]
    }
  }
}
```

Click "Publicar"

## Paso 4: Crear Service Account

1. Click en el ⚙️ (configuración) → **"Configuración del proyecto"**
2. Pestaña **"Cuentas de servicio"**
3. Click en **"Generar nueva clave privada"**
4. Se descargará un archivo JSON → **Guárdalo en `src/credentials/firebase-credentials.json`**

⚠️ **IMPORTANTE**: Agrega esto a tu `.gitignore`:
```
src/credentials/firebase-credentials.json
```

## Paso 5: Configurar Variables de Entorno

### Opción A: Desarrollo Local (archivo .env)

Agrega al archivo `.env`:

```env
# Firebase Configuration (Local)
FIREBASE_SERVICE_ACCOUNT_PATH=./src/credentials/firebase-credentials.json
FIREBASE_DATABASE_URL=https://techtecnic-bot-default-rtdb.firebaseio.com
```

Reemplaza `techtecnic-bot` con el nombre de tu proyecto.

### Opción B: Producción (Railway/Heroku)

Extrae los valores del archivo JSON y configúralos como variables de entorno:

```env
# Firebase Configuration (Production)
FIREBASE_PROJECT_ID=techtecnic-bot
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@techtecnic-bot.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_COMPLETA_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://techtecnic-bot-default-rtdb.firebaseio.com
```

**⚠️ Importante para FIREBASE_PRIVATE_KEY:**
- Copia todo el contenido entre `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
- Incluye los `\n` (saltos de línea)
- En Railway/Heroku, pégalo como texto, conservando los saltos de línea

## Paso 6: Verificar Instalación

Reinicia el bot:

```bash
npm start
```

Deberías ver:
```
🔥 Inicializando Firebase...
✅ Firebase inicializado correctamente
Server is listening on port: 3000
```

## Estructura de Datos en Firebase

El bot creará automáticamente estas colecciones:

### 📁 clientProfiles/
Perfiles persistentes de clientes:
```json
{
  "+573001234567": {
    "phoneNumber": "+573001234567",
    "firstName": "Juan",
    "company": "Mi Empresa",
    "firstContactDate": "2026-01-15T10:30:00Z",
    "lastInteractionDate": "2026-01-15T10:35:00Z",
    "totalInteractions": 5,
    "status": "interested",
    "interestedServices": ["Desarrollo Web", "SEO"]
  }
}
```

### 📁 sessions/
Sesiones activas (temporal):
```json
{
  "+573001234567": {
    "currentFlow": "quotation",
    "flowData": {...},
    "conversationHistory": [...]
  }
}
```

### 📁 conversations/
Historial completo de conversaciones:
```json
{
  "conv_123": {
    "phoneNumber": "+573001234567",
    "sessionId": "uuid-123",
    "messages": [...],
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

### 📁 opportunities/
Oportunidades de venta detectadas:
```json
{
  "opp_456": {
    "phoneNumber": "+573001234567",
    "service": "Chatbot WhatsApp",
    "confidence": 0.85,
    "status": "pending"
  }
}
```

## Fallback a Memoria RAM

Si Firebase no está configurado, el bot funcionará normalmente pero:
- ⚠️ Los datos se perderán al reiniciar
- ⚠️ No habrá memoria entre sesiones
- ✅ Todo lo demás funcionará igual

Verás este mensaje:
```
⚠️ Firebase no configurado. Usando memoria RAM (datos se perderán al reiniciar)
```

## Costos

**Plan Spark (Gratuito):**
- ✅ 1 GB almacenamiento
- ✅ 10 GB/mes descarga
- ✅ 100 conexiones simultáneas

Para un chatbot típico, esto es suficiente para:
- 📊 ~10,000 perfiles de clientes
- 💬 ~50,000 conversaciones
- 🚀 ~500 usuarios activos/día

## Troubleshooting

### Error: "FIREBASE_PROJECT_ID no encontrado"
→ Verifica que las variables de entorno estén configuradas

### Error: "Permission denied"
→ Revisa las reglas de seguridad en Firebase Console

### Error: "Module not found: firebase-admin"
→ Ejecuta: `npm install firebase-admin`

## Siguiente Paso

Una vez configurado Firebase, el bot automáticamente:
1. ✅ Recordará clientes que vuelven
2. ✅ Mantendrá historial de conversaciones
3. ✅ Detectará oportunidades de venta
4. ✅ Permitirá análisis de datos

¿Necesitas ayuda? Revisa la [documentación de Firebase](https://firebase.google.com/docs/database)
