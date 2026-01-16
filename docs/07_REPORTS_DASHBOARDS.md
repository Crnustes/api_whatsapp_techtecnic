# Reports & Dashboards

Exportar datos, Google Sheets, dashboards, métricas.

---

## Export System

**Datos disponibles para exportar:**

- Conversaciones (todos los mensajes + timestamps)
- Leads (scores, estados, contactos)
- Oportunidades (sales pipeline)
- Memory (preferencias, historial usuario)
- Sesiones (logs de interacción)

**API de export:**

```bash
# CSV de conversaciones
curl http://localhost:3000/admin/export/conversations \
  -H "Authorization: Bearer " \
  -o conversations.csv

# JSON de leads
curl http://localhost:3000/admin/export/leads \
  -H "Authorization: Bearer " \
  -o leads.json

# PDF de reportes
curl http://localhost:3000/admin/export/report/monthly \
  -H "Authorization: Bearer " \
  -o report.pdf
```

---

## Google Sheets Integration

**Hojas automáticas:**

1. **Conversations**
   - Columns: Timestamp, Usuario, Mensaje, Respuesta, Flow, Duration
   - Auto-actualiza cada 30 min
   - Retención: últimos 1000 mensajes

2. **Leads**
   - Columns: Fecha, Usuario, Nombre, Empresa, Presupuesto, Score, Estado, Vendedor
   - Auto-actualiza cada 10 min
   - Filtrable por Estado y Score

3. **Oportunidades**
   - Columns: ID, Fecha creación, Usuario, Monto, Probabilidad, Proxima acción
   - Pipeline visual
   - Auto-cierre si no hay actividad en 30 días

4. **Performance**
   - Métricas diarias: leads, conversiones, ingresos
   - Gráficos de tendencias
   - Comparativa mes a mes

**Setup:**

```bash
# En .env:
GOOGLE_SHEET_ID="1a2b3c..."
GOOGLE_SHEETS_ENABLED=true

# Script corre cada 10-30 min
```

---

## Dashboard Admin

**URL:** http://localhost:3000/dashboard

**Secciones:**

**1. Overview**
- Leads hoy: 5
- Conversiones hoy: 1
- Ingresos hoy: ,400
- NPS: 8.2/10

**2. Pipeline Sales**
- NUEVO: 12 leads (0-30 score)
- CUALIFICADO: 34 leads (30-70)
- INTERESADO: 8 leads (70+)
- GANADO: 3 leads ()

**3. Top Conversaciones**
- Usuario | Mensajes | Duration | Score
- 573337151064 | 23 | 4.5 min | 82
- 573401234567 | 12 | 2.1 min | 45

**4. Performance por Vendedor**
- Carlos: 8 leads, 3 cierres, 
- María: 6 leads, 2 cierres, 
- Juan: 10 leads, 1 cierre, 

**5. Sistemas & Alertas**
- WhatsApp:  Connected
- OpenAI:  OK
- Firebase:  Synced
- Últimas 24h sin errores críticos

---

## Dashboard Cliente

**URL compartida (sin autenticación completa):**

```
https://techtecnic-bot.com/client/573337151064
```

**Información del cliente:**

- Últimas conversaciones (últimas 10)
- Score actual
- Estado oportunidad
- Cita próxima
- Contacto de vendedor

**Ejemplo:**

```
Cliente: Juan Pérez
Empresa: Innovatech
Estado: INTERESADO (Score: 78)

Conversaciones:
- 2024-01-15 09:30 - Presentó necesidad
- 2024-01-15 10:15 - Presupuesto 
- 2024-01-15 10:45 - Cita agendada

Próxima acción:
- Cita con especialista
- Martes 16, 14:00
- Contacto: Carlos (+57 3001234567)
```

---

## Datos Disponibles (Estructura)

**Conversation:**

```json
{
  "id": "conv_xyz789",
  "userId": "573337151064",
  "timestamp": 1705336800000,
  "messages": [
    {
      "role": "user",
      "content": "Hola",
      "timestamp": 1705336800000
    },
    {
      "role": "assistant",
      "content": "¡Hola! ¿Cómo estás?",
      "timestamp": 1705336805000,
      "tokens": { "input": 50, "output": 25 }
    }
  ],
  "flow": "assistantFlow",
  "duration": 125000,
  "endReason": "user_ended"
}
```

**Lead:**

```json
{
  "id": "lead_abc123",
  "userId": "573337151064",
  "name": "Juan Pérez",
  "company": "Innovatech",
  "budget": 15000,
  "score": 78,
  "state": "qualified",
  "stage": "proposal",
  "createdAt": 1705336800000,
  "updatedAt": 1705400000000,
  "assignedTo": "carlos@techtecnic.com",
  "tags": ["urgent", "high-value"]
}
```

---

## Reportes Automáticos

**Reporte Diario (enviado a 8:00 AM):**

```
Resumen 2024-01-15

Leads nuevos: 7
Conversiones: 2
Ingresos: ,500
Ticket promedio: ,250

Top flow: appointmentFlow (45% conversaciones)
NPS: 8.4/10

Alertas:
- WhatsApp: 2 mensajes rechazados
- OpenAI: 3 timeouts (todas resueltas)
```

**Reporte Semanal (lunes 8:00 AM):**

- Resumen de leads por vendedor
- Pipeline analysis
- Proyección de ingresos
- Tendencias semana anterior

**Reporte Mensual (1º del mes):**

- KPIs vs. metas
- Análisis de conversión
- Revenue total
- Casos de uso top

**Envío:**

```bash
# Emails configurados en .env
REPORT_EMAILS="sales@techtecnic.com,admin@techtecnic.com"
```

---

## Filtros & Búsqueda

**En Dashboard:**

```
Filtros aplicables:
- Período (hoy, semana, mes, custom)
- Estado (nuevo, cualificado, interesado, ganado)
- Score (30-70, 70+, etc)
- Vendedor
- Flow
- Empresa (si está disponible)

Búsqueda:
- Por usuario WhatsApp
- Por nombre
- Por empresa
- Por traceID
```

---

## Exportar Custom

**Endpoint flexible:**

```bash
curl -X POST http://localhost:3000/admin/export/custom \
  -H "Authorization: Bearer " \
  -d '{
    "format": "csv",
    "data": "leads",
    "filters": {
      "score": {"min": 70},
      "state": "qualified",
      "createdAfter": "2024-01-01"
    },
    "fields": ["name", "company", "budget", "score", "vendedor"]
  }' \
  -o custom_export.csv
```

---

**Siguiente:** [08_API_REFERENCE.md](08_API_REFERENCE.md)
