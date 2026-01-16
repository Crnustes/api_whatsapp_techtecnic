# Arquitectura

Flujo de mensajes, multi-tenant, estado, memoria, integraciones.

---

## Flujo Básico

```
WhatsApp  webhookController  conversationManager  Flow  OpenAI  Response
                                                          
         Validar                                   sessionManager (estado)
         TraceId                                   firebaseService (memoria)
         Verificar duplicados
```

---

## Stack

- **Node.js 18+** + Express
- **OpenAI GPT-4** (IA)
- **Firebase Realtime** (datos)
- **WhatsApp Business API** (mensajes)
- **Google Sheets** (exports)

---

## Multi-Tenant

Carpeta por cliente en src/tenants/:

```
techtecnic/config.json         Servicios, prompts, flags
cliente_a/config.json
cliente_b/config.json
```

**Se resuelve automáticamente** desde phoneNumberId de WhatsApp.

**Por tenant se configura:**
- Servicios disponibles
- Prompts IA
- Feature flags (memory, sales, quotation, etc)
- Horas de negocio
- Integraciones

---

## Sesión (RAM)

```javascript
{
  userId: "573331234567",
  currentFlow: "appointment",
  flowState: "awaiting_date",
  context: { servicio: "web" },
  traceId: "tr_abc123",
  lastInteraction: "2026-01-15T10:30:00Z"
}
```

**Gestiona:** estado de conversación, datos temporales

**Duración:** sesión viva en RAM mientras está activo

---

## Memoria (Firebase)

```javascript
{
  summary: "Cliente interesado en web, presupuesto medio",
  facts: {
    nombre: "Juan",
    servicio: "desarrollo_web",
    presupuesto: "medio"
  },
  recentTurns: [
    { user: "msg", assistant: "resp", timestamp: "..." },
    ...máximo 8 turnos (FIFO)
  ]
}
```

**Ubicación:** clientProfiles/{userId}/memory/

**Se actualiza:** automáticamente después de cada respuesta (async)

**Usado por:** OpenAI para generar respuestas personalizadas

---

## Flows

Máquinas de estado por tipo de conversación:

| Flow | Estados | Propósito |
|------|---------|----------|
| **appointment** | initial  service  date  confirm  done | Agendar citas |
| **quotation** | initial  service  reqs  generating  done | Cotizaciones |
| **assistant** | (sin estados, responde directo) | Consultas IA |
| **sales** | (calcula score + escala) | Lead scoring |
| **humanHandoff** | (notifica admin) | Escalación humano |

---

## Integraciones

**WhatsApp:** Recibe mensajes, envía respuestas (API oficial)

**OpenAI:** Genera respuestas inteligentes con context/memory

**Firebase:** Guarda memory, sesiones, historial, processed_messages

**Google Sheets:** Exporta clientes, leads (opcional)

---

## Trazabilidad (TraceId)

Cada mensaje tiene ID único: 	r_1705321800000_a3b2c1d4e

**En logs:** [TRACE tr_...] mensaje procesado

**En Firebase:** conversations/{userId}/{traceId}/

**Permite:** debuggear end-to-end cualquier problema

---

**Siguiente:** [02_FEATURES.md](02_FEATURES.md)
