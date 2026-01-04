# 🏗️ Arquitectura del Bot - Guía Detallada

## Tabla de Contenidos

1. [Diagrama de Flujo General](#diagrama-general)
2. [Componentes Clave](#componentes-clave)
3. [Flujo de Mensajes](#flujo-de-mensajes)
4. [Gestión de Estado](#gestión-de-estado)
5. [Integraciones](#integraciones)
6. [Base de Datos](#base-de-datos)

---

## Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│                       WHATSAPP USER                             │
│                      (Cliente envia)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │   WhatsApp Cloud API     │
            │   (Webhook endpoint)     │
            └──────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   webhookController.js       │
        │  (Parse & validate message)  │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │   messageHandler.js          │
        │  (Route to conversationMgr)  │
        └──────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────────┐
    │     conversationManager.js               │
    │  (Orquestador Principal)                 │
    │  • Detecta intención                     │
    │  • Maneja flujos activos                 │
    │  • Crea sesiones                         │
    └──────────┬───────────────────────────────┘
               │
               ├─────────────────────┬───────────────────┬─────────────────┐
               │                     │                   │                 │
               ▼                     ▼                   ▼                 ▼
     ┌──────────────────┐  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
     │ appointmentFlow  │  │ quotationFlow    │ │ assistantFlow    │ │ humanHandoffFlow │
     │                  │  │                  │ │                  │ │                  │
     │ • Recopila datos │  │ • Análisis       │ │ • Pregunta+IA    │ │ • Escalado a     │
     │ • Validaciones   │  │ • 3 opciones     │ │ • Contexto       │ │   agentes        │
     │ • Calendario     │  │ • Cálculo auto   │ │ • Feedback       │ │ • Cola de espera │
     │ • Confirmación   │  │   de precio      │ │                  │ │                  │
     └────────┬─────────┘  └──────┬───────────┘ └────────┬─────────┘ └────────┬─────────┘
              │                    │                     │                    │
              └────────────────────┼─────────────────────┼────────────────────┘
                                   │
                    ┌──────────────┴─────────────────┐
                    │                                │
                    ▼                                ▼
        ┌──────────────────────────┐    ┌──────────────────────────┐
        │  sessionManager.js       │    │  quotationEngine.js      │
        │  • Almacena estado       │    │  • Calcula precios       │
        │  • Historial conversación│    │  • Genera features       │
        │  • Metadata usuario      │    │  • Validaciones complejas│
        └──────────────────────────┘    └──────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │  openAiService.js        │
        │  • Procesa consultas     │
        │  • Análisis de proyecto  │
        │  • Con contexto histórico│
        └────────┬─────────────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │   OpenAI API (GPT-4o)    │
        │   (Respuestas inteligentes)
        └──────────────────────────┘

        ┌──────────────────────────┐
        │ whatsappService.js       │
        │  • Envía mensajes        │
        │  • Botones interactivos  │
        │  • Media                 │
        └────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │   WhatsApp Cloud API         │
    │   (Envía respuesta)          │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │   WHATSAPP USER              │
    │   (Recibe respuesta)         │
    └──────────────────────────────┘

        ┌──────────────────────────┐
        │ googleSheetsService.js   │
        │  • Guarda datos          │
        │  • Múltiples hojas       │
        │  • Citas, cotizaciones   │
        └────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │   Google Sheets              │
    │   (Persistencia de datos)    │
    └──────────────────────────────┘
```

---

## Componentes Clave

### 1. **conversationManager.js** (Orquestador Principal)

**Responsabilidades:**
- Punto de entrada para todos los mensajes
- Detectar intención del usuario
- Enrutar a flujo apropiado
- Mostrar menú principal

**Métodos principales:**
```javascript
handleIncomingMessage(message, senderInfo)  // Entry point
handleNewMessage(userId, message)            // Nuevo mensaje
continueFlow(userId, message, session)       // Continúa flujo activo
handleMenuOption(userId, option)             // Procesa botones
```

**Ejemplo de flujo:**
```
Usuario envía "hola"
    ↓
conversationManager.handleIncomingMessage()
    ↓
Detecta que es saludo
    ↓
Envía bienvenida + menú
```

---

### 2. **sessionManager.js** (Gestor de Estado)

**Responsabilidades:**
- Mantener estado de usuario
- Historial conversacional
- Timeout automático
- Metadata

**Estructura de sesión:**
```javascript
{
  userId: "5491234567",
  createdAt: 1704283500000,
  lastActivity: 1704283600000,
  currentFlow: "appointment",
  flowData: {
    step: "email",
    name: "Juan García",
    email: "juan@empresa.com"
  },
  conversationHistory: [
    { timestamp, role, content, metadata }
  ],
  metadata: {
    clientName: "Juan"
  }
}
```

**Timeout automático:**
- Después de 30 min inactivo → sesión eliminada
- Limpia historial a último 50 mensajes
- Evita memory leaks

---

### 3. **appointmentFlow.js** (Agendamiento)

**Pasos del flujo:**
```
1. name (validación de nombre)
2. email (validación de email)
3. service (selector de servicios)
4. description (validación de descripción)
5. datetime (parsing de fecha/hora)
6. confirmation (resumen + confirmación)
```

**Validaciones:**
- Email: formato válido
- Nombre: mínimo 2 caracteres
- Descripción: mínimo 10 caracteres
- Fecha: formato DD/MM/YYYY HH:MM, debe ser futura

**Datos guardados:**
```
Timestamp, Nombre, Email, Teléfono, Empresa, Servicio, Descripción, Estado
```

---

### 4. **quotationFlow.js** (Cotización)

**Pasos del flujo:**
```
1. projectType (selector)
2. complexity (Básico/Medio/Alto)
3. timeline (ASAP/Rápido/Normal/Flexible)
4. analysis (descripción + OpenAI)
5. options (mostrar 3 opciones)
6. selection (usuario elige opción)
7. email (guardar cotización)
```

**Generar 3 opciones:**
- Económica (70% precio base)
- Recomendada (100% precio base)
- Premium (150% precio base)

**Cálculo de precio:**
```javascript
basePrice = pricesByType[projectType][complexity]
adjusted = basePrice * timelineMultiplier
options = {
  basic: adjusted * 0.7,
  recommended: adjusted,
  premium: adjusted * 1.5
}
```

---

### 5. **assistantFlow.js** (Asistente IA)

**Pasos:**
```
1. question (usuario pregunta)
2. OpenAI procesa con contexto
3. feedback (¿fue útil?)
4. Si no: escalado a agente
   Si sí: opción de agendar
   Otra pregunta: volver a 1
```

**Contexto para OpenAI:**
- Últimos 8 mensajes
- Sistema prompt sobre servicios
- Información de empresa

---

### 6. **humanHandoffFlow.js** (Escalado)

**Pasos:**
```
1. Usuario solicita agente
2. Crear ticket con info
3. Buscar agente disponible
4. Si disponible: asignar inmediatamente
5. Si no: meter en cola de espera
```

**Información del ticket:**
- Timestamp
- Nombre cliente
- Descripción del problema
- Historial conversacional

---

### 7. **quotationEngine.js** (Motor de Cotización)

**Datos configurables:**
```javascript
basePrices = {
  'Sitio Web': { basic: 1500, medium: 3500, high: 7000 },
  'Ecommerce': { basic: 3000, medium: 8000, high: 15000 },
  'App Móvil': { basic: 5000, medium: 12000, high: 25000 },
  // ... más tipos
}

timelineMultipliers = {
  'ASAP': 1.4,      // +40% urgencia
  'Rápido': 1.2,    // +20%
  'Normal': 1.0,    // sin cambio
  'Flexible': 0.9   // -10%
}
```

**Features por tipo:**
- Estructura de árbol configurable
- Diferentes features según complejidad
- Validación de viabilidad

---

## Flujo de Mensajes

### Flujo Completo de un Mensaje

```
1. WhatsApp API → webhookController
   └─ Validar token
   └─ Parsear JSON
   
2. webhookController → messageHandler
   └─ Extraer sender info
   └─ Parsear tipo de mensaje
   
3. messageHandler → conversationManager
   └─ Llamar handleIncomingMessage()
   
4. conversationManager:
   ├─ getSession(userId)
   ├─ addToHistory(userId, 'user', text)
   └─ Si hay flujo activo:
       └─ continueFlow()
       └─ Delegar a flujo específico
   └─ Si no hay flujo:
       ├─ Detectar intención
       └─ handleMenuOption() o initiate nuevo flujo
   
5. Flujo específico (e.g., appointmentFlow)
   ├─ Procesar entrada según currentStep
   ├─ Validar datos
   ├─ updateFlowData()
   ├─ whatsappService.sendMessage()
   └─ sessionManager actualiza estado
   
6. whatsappService
   ├─ Construir payload WhatsApp
   └─ POST a /messages endpoint
   
7. OpenAI (si aplica)
   ├─ Enviar mensajes + contexto
   └─ Procesar respuesta
   
8. Google Sheets (cuando flujo termina)
   ├─ Preparar datos
   └─ appendToSheet(data, sheetKey)
```

### Flujo de Decisión: Nuevo Mensaje

```
mensaje llega
    ↓
¿Es saludo?
├─ Sí → Mostrar bienvenida + menú
└─ No ↓
    ¿Usuario tiene sesión activa con flujo?
    ├─ Sí → continueFlow()
    └─ No ↓
        ¿Es solicitud de agente humano?
        ├─ Sí → escalad a humanHandoffFlow
        └─ No ↓
            Mostrar menú principal
```

---

## Gestión de Estado

### Ciclo de Vida de una Sesión

```
User sends first message
    ↓
Session created (30 min TTL)
    ↓
Flow initiated (e.g., appointment)
    ├─ flowData inicializado
    ├─ conversationHistory comienza
    └─ metadata establecida
    
While user in flow:
    ├─ Each message updates lastActivity
    ├─ Validate input
    ├─ Update flowData
    ├─ Add to conversationHistory
    └─ Send response
    
User completes flow:
    ├─ Save to Google Sheets
    ├─ Clear flowData
    └─ Session remains (para contexto futuro)
    
After 30 min inactivity:
    ├─ Session deleted
    └─ Next message = new session
```

### Estado Conversacional

Cada sesión mantiene:

**conversationHistory:**
```javascript
[
  {
    timestamp: "2025-01-03T14:30:00Z",
    role: "user",           // o "assistant"
    content: "Hola",
    metadata: {}
  },
  // ...
]
```

**flowData:**
```javascript
{
  step: "email",           // Paso actual
  name: "Juan",            // Datos recopilados
  email: "juan@empresa.com",
  // Varía según flujo
}
```

**metadata:**
```javascript
{
  clientName: "Juan",
  language: "es",
  // Custom por caso
}
```

---

## Integraciones

### OpenAI Integration

**Casos de uso:**
1. **Consultas generales** - IA responde preguntas
2. **Análisis de proyecto** - Para generar cotizaciones
3. **Personalización** - Ajustar tono según contexto

**Optimización:**
- Cache de contexto (últimos 8 mensajes)
- Timeout de 10 segundos
- Max tokens: 300 (para WhatsApp)
- Temperature: 0.7 (balance creativo/consistente)

---

### WhatsApp Integration

**Métodos disponibles:**

```javascript
// Texto simple
sendMessage(to, body)

// Botones interactivos
sendInteractiveButtons(to, bodyText, buttons)

// Media
sendMediaMessage(to, type, mediaUrl, caption)

// Marcar como leído
markAsRead(messageId)
```

**Formato de botones:**
```javascript
[
  {
    type: 'reply',
    reply: {
      id: 'unique_id',
      title: 'Button text'
    }
  }
]
```

---

### Google Sheets Integration

**Hojas configuradas:**

| Hoja | Uso | Columnas |
|------|-----|---------|
| reservas | Agendamientos | Timestamp, Nombre, Email, Teléfono, Empresa, Servicio, Descripción, Estado |
| cotizaciones | Cotizaciones generadas | Timestamp, Email, Cliente, Tipo_Proyecto, Complejidad, Opción, Monto, Estado |
| conversaciones | Registro de interacciones | Timestamp, User_ID, Nombre, Interacción, Resumen, Estado |
| escalados | Tickets escalados | Timestamp, User_ID, Cliente, Problema, Estado |

**Acceso:**
```javascript
// Guardar
await googleSheetsService(data, 'reservas')
await googleSheetsService(data, 'cotizaciones')

// Leer
const reservas = await getReservations()
const cotizaciones = await getQuotations()
```

---

## Base de Datos

### Estructura de Google Sheets

**reservas!**
```
A: Timestamp | B: Nombre | C: Email | D: Teléfono | E: Empresa | F: Servicio | G: Descripción | H: Estado
```

**cotizaciones!**
```
A: Timestamp | B: Email | C: Cliente | D: Tipo_Proyecto | E: Complejidad | F: Opción | G: Monto | H: Estado
```

**conversaciones!**
```
A: Timestamp | B: User_ID | C: Nombre | D: Interacción | E: Resumen | F: Estado
```

**escalados!**
```
A: Timestamp | B: User_ID | C: Cliente | D: Problema | E: Estado
```

### Índices Implícitos

Por ahora, Google Sheets maneja:
- Búsqueda lineal por Timestamp
- Filtros manuales por Estado

**Mejoras futuras:**
- Migrar a Firestore o MongoDB
- Crear índices por email, user_id
- Agregar TTL en datos antiguos

---

## Validaciones

### Validadores Disponibles (utils/validators.js)

```javascript
validateEmail(email)              // Formato email
validatePhone(phone)              // E.164 format
validateName(name)                // 2-100 chars
validateComplexity(complexity)    // Básico/Medio/Alto
validateTimeline(timeline)        // ASAP/Rápido/Normal/Flexible
validateProjectType(type)         // Tipos definidos
detectIntention(text)             // Detectar qué quiere el usuario
```

### Reglas de Validación

| Campo | Regla | Error |
|-------|-------|-------|
| Name | 2-100 chars | "Por favor, ingresa un nombre válido" |
| Email | Formato válido | "Por favor, ingresa un email válido" |
| Descripción | 10-1000 chars | "Proporciona más detalles" |
| DateTime | DD/MM/YYYY HH:MM, futuro | "Formato inválido. Usa DD/MM/YYYY HH:MM" |
| Teléfono | 10-15 dígitos | "Por favor, ingresa un teléfono válido" |

---

## Errores Comunes y Manejo

### Error: Mensaje no se procesa

**Causas posibles:**
- Webhook token inválido
- Formato JSON incorrecto
- Sesión expirada

**Manejo:**
```javascript
try {
  handleIncomingMessage()
} catch (error) {
  console.error(error)
  sendMessage(to, "❌ Hubo un error. Intenta nuevamente.")
}
```

### Error: No se guarda en Google Sheets

**Causas posibles:**
- Credenciales inválidas
- Hoja no existe
- Permisos insuficientes

**Debugging:**
```javascript
console.log('Data:', data)
console.log('Sheet:', sheetKey)
console.log('Error:', error.message)
```

---

**Última actualización:** Enero 3, 2026
**Version:** 2.0.0
