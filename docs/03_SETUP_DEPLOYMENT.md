# Setup & Deployment

Instalación local, Firebase, multi-tenant, deployment a producción.

---

## Setup Local

```bash
git clone <repo>
cd techtecnic
npm install

cp .env.example .env
# Editar .env con credenciales

npm run dev
# Accesible en http://localhost:3000
```

---

## Variables de Entorno (.env)

```
WHATSAPP_TOKEN=EAA...
WHATSAPP_PHONE_NUMBER_ID=123456789
WEBHOOK_VERIFY_TOKEN=mi_token_secreto

OPENAI_API_KEY=sk-...

FIREBASE_DATABASE_URL=https://techtecnic-bot.firebaseio.com

PORT=3000
NODE_ENV=production
```

---

## Firebase

**Estructura de datos:**

```
clientProfiles/
 {userId}/
   name, phone, email
   memory/ (summary, facts, recentTurns)
   metadata/ (leadScore, leadState, tags)

conversations/
 {userId}/{traceId}/
    message, response, timestamp
    ...

processed_messages/
 {messageId}/
    timestamp, response, processed
    ...
```

**Subir credentials.json:**

```bash
# Descargar del proyecto Firebase
# Ir a: Project Settings  Service Accounts  Generate new key

# Colocar en: src/credentials/firebase-adminsdk.json
# NO subir a Git (está en .gitignore)
```

---

## Multi-Tenant

**Crear nuevo tenant:**

```bash
mkdir src/tenants/nuevo_cliente
cp src/tenants/defaults/config.json src/tenants/nuevo_cliente/
nano src/tenants/nuevo_cliente/config.json
```

**Configurar:**

```json
{
  "tenantId": "nuevo_cliente",
  "name": "Nuevo Cliente S.A.S.",
  "phone": "+573339876543",
  
  "services": {
    "available": ["desarrollo_web", "desarrollo_app"]
  },
  
  "featureFlags": {
    "memoryEnabled": true,
    "salesFlowEnabled": true,
    "appointmentEnabled": true,
    "quotationEnabled": false
  },
  
  "aiConfig": {
    "model": "gpt-4-turbo-preview",
    "temperature": 0.7,
    "maxTokens": 800
  }
}
```

**Validar:**

```bash
node validate-tenant-config.js nuevo_cliente
```

---

## Deployment

### Railway / Heroku

```bash
# Railway
railway login
railway init
# Configurar variables en dashboard
git push railway main

# Heroku
heroku login
heroku create app-name
heroku config:set WHATSAPP_TOKEN=...
git push heroku main
```

### VPS (Ubuntu)

```bash
# 1. Instalar Node
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clonar
cd /var/www
git clone <repo>
cd techtecnic
npm install

# 3. Configurar .env
nano .env

# 4. Copiar credentials
scp credentials.json user@server:/var/www/techtecnic/src/credentials/

# 5. Iniciar con PM2
npm install -g pm2
pm2 start server.js --name techtecnic-bot
pm2 save
pm2 startup

# 6. Nginx (opcional)
sudo apt-get install nginx
# Configurar proxy a localhost:3000
```

---

## Webhook WhatsApp

1. Ir a **Meta for Developers  Your App  WhatsApp  Configuration**
2. **Callback URL:** https://tu-dominio.com/webhook
3. **Verify Token:** (tu WEBHOOK_VERIFY_TOKEN)
4. **Subscribe to:** messages
5. Click **Verify and Save**

---

## Healthcheck

```bash
curl https://tu-dominio.com/health
# Respuesta: { "status": "ok", "timestamp": "...", "uptime": 3600 }
```

---

## Troubleshooting

**Bot no responde:**
```bash
pm2 status
pm2 logs techtecnic-bot
# Verificar .env, webhook, Firebase credentials
```

**OpenAI rate limit:**
Reducir 	emperature o maxTokens en config

**Firebase connection failed:**
Verificar FIREBASE_DATABASE_URL y credentials.json

---

**Siguiente:** [04_DEVELOPMENT_GUIDE.md](04_DEVELOPMENT_GUIDE.md)
