# Tech Tecnic WhatsApp Bot

Bot inteligente multi-tenant que detecta oportunidades de venta, agenda citas, y escala a agentes humanos automáticamente.

---

##  Documentación

| Documento | Propósito | Para quién |
|-----------|-----------|-----------|
| [01_ARCHITECTURE.md](docs/01_ARCHITECTURE.md) | Cómo funciona el sistema | Arquitectos, leads técnicos |
| [02_FEATURES.md](docs/02_FEATURES.md) | Capacidades principales (memoria, idempotencia, flags) | Devs, PMs |
| [03_SETUP_DEPLOYMENT.md](docs/03_SETUP_DEPLOYMENT.md) | Instalación local y deployment | Devs, DevOps |
| [04_DEVELOPMENT_GUIDE.md](docs/04_DEVELOPMENT_GUIDE.md) | Crear flows, servicios, modificar prompts | Developers |
| [05_TESTING_OPERATIONS.md](docs/05_TESTING_OPERATIONS.md) | Test, checklists, monitoreo | QA, Devs, Ops |
| [06_SALES_BUSINESS.md](docs/06_SALES_BUSINESS.md) | Lead scoring, playbooks, KPIs | Sales, Product |
| [07_REPORTS_DASHBOARDS.md](docs/07_REPORTS_DASHBOARDS.md) | Exportar datos, dashboards | Analytics, Sales |
| [08_API_REFERENCE.md](docs/08_API_REFERENCE.md) | Servicios, flows, utilidades | Developers |

---

##  Inicio Rápido

`ash
# 1. Clonar y instalar
git clone <repo> && cd techtecnic
npm install

# 2. Configurar
cp .env.example .env
# Editar .env con credenciales (Firebase, OpenAI, WhatsApp)

# 3. Ejecutar
npm run dev

# 4. Verificar
curl http://localhost:3000/health
`

---

##  Stack

- **Runtime:** Node.js + Express
- **IA:** OpenAI GPT-4
- **Mensajería:** WhatsApp Business API
- **Database:** Firebase Realtime
- **Sheets:** Google Sheets (reports)
- **Infrastructure:** Railway, Heroku, VPS

---

##  Capacidades Principales

 **Detección de Oportunidades**
- Lead scoring automático (0-100)
- Identifica ingresos potenciales

 **Agenda Inteligente**
- Reserva citas directamente
- Integrada con calendarios

 **Soporte 24/7**
- Responde preguntas comunes
- Escala a agentes si es necesario

 **Multi-Tenant**
- Múltiples clientes en 1 instancia
- Datos aislados por tenant

 **Persistencia**
- Memory de conversaciones
- Preferencias de usuario

 **Idempotencia**
- No duplica respuestas
- Manejo de retransmisiones

---

##  Configuración Rápida

`ash
# Variables esenciales en .env:

# OpenAI
OPENAI_KEY=sk-...
OPENAI_MODEL=gpt-4

# Firebase
FIREBASE_URL=https://...
FIREBASE_KEY=...

# WhatsApp
WHATSAPP_TOKEN=...
WHATSAPP_WEBHOOK_SECRET=...
WHATSAPP_PHONE_ID=...

# Modo multi-tenant
TENANT_MODE=true
DEFAULT_TENANT=techtecnic
`

---

##  Flujo Básico

`
Usuario envía mensaje WhatsApp
  
Webhook recibe
  
conversationManager detecta intención
  
Routea a Flow (appointment/quotation/sales/etc)
  
Flow procesa + OpenAI genera respuesta
  
Guarda memory + state
  
Envía respuesta WhatsApp
`

---

##  KPIs & Monitoreo

Dashboard: http://localhost:3000/dashboard

- Leads nuevos por día
- Tasa de conversión
- Score promedio
- Revenue generado
- NPS

---

##  Desarrollo

**Crear nuevo flow:**
1. Crear src/services/conversationFlows/tuFlow.js
2. Implementar start() y processResponse()
3. Registrar en conversationManager.js

Ver: [04_DEVELOPMENT_GUIDE.md](docs/04_DEVELOPMENT_GUIDE.md)

**Testing:**
`ash
npm test
npm test -- --watch
`

**Logs en vivo:**
`ash
npm run dev
# o
pm2 logs techtecnic-bot
`

---

##  Deployment

**Railway (recomendado):**
`ash
railway link
railway up
`

**Heroku:**
`ash
heroku login
git push heroku main
`

**VPS (nginx + pm2):**
Ver: [03_SETUP_DEPLOYMENT.md](docs/03_SETUP_DEPLOYMENT.md#deployment)

---

##  Multi-Tenant

`ash
# Crear nuevo tenant
curl -X POST http://localhost:3000/admin/tenants \
  -d '{"name":"acme","config":{...}}'

# Usar tenant específico
# Cliente incluye header: X-Tenant: acme
`

---

##  Troubleshooting

**"WhatsApp webhook no responde"**
- Verificar WHATSAPP_WEBHOOK_SECRET
- Verificar URL pública es accesible
- 
pm run dev está corriendo

**"OpenAI timeout"**
- Verificar OPENAI_KEY válida
- Revisar: pm2 logs | grep "OpenAI"

**"Firebase connection error"**
- Verificar FIREBASE_URL y credenciales
- Revisar reglas de Firebase (públicas en dev)

---

##  Recursos

- **Arquitectura:** [01_ARCHITECTURE.md](docs/01_ARCHITECTURE.md)
- **Features:** [02_FEATURES.md](docs/02_FEATURES.md)
- **Setup:** [03_SETUP_DEPLOYMENT.md](docs/03_SETUP_DEPLOYMENT.md)
- **Dev:** [04_DEVELOPMENT_GUIDE.md](docs/04_DEVELOPMENT_GUIDE.md)
- **Testing:** [05_TESTING_OPERATIONS.md](docs/05_TESTING_OPERATIONS.md)
- **Sales:** [06_SALES_BUSINESS.md](docs/06_SALES_BUSINESS.md)
- **Reports:** [07_REPORTS_DASHBOARDS.md](docs/07_REPORTS_DASHBOARDS.md)
- **API:** [08_API_REFERENCE.md](docs/08_API_REFERENCE.md)

---

##  License

Propietario - Tech Tecnic 2024

##  Equipo

- Arquitectura: Lead técnico
- Sales: Equipo comercial
- DevOps: Infraestructura
