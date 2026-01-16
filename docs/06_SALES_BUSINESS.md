# Sales & Business

Lead scoring, estados de oportunidad, playbooks, KPIs.

---

## Sales Flow

**Propósito:** Detectar leads calificados automáticamente, guiar conversación.

**Fases:**

| Fase | Bot hace | Usuario | Score al terminar |
|------|----------|---------|-------------------|
| **Discovery** | ¿Qué necesitas? | Describe necesidad | 0-20 |
| **Qualification** | ¿Presupuesto/timeline? | Proporciona datos | 20-50 |
| **Pitch** | Propone soluciones | Muestra interés | 50-75 |
| **Closing** | Agenda cita/demo | Confirma | 75+ |

---

## Lead Scoring (0-100)

**Fórmula:**

```
Score = (Presupuesto + Urgencia + Autoridad + Tamaño_Empresa) / 4

Presupuesto:
  <    = 0 pts
  -  = 25 pts
  - = 50 pts
  >    = 100 pts

Urgencia:
  Indefinido     = 0 pts
  3-6 meses      = 25 pts
  1-3 meses      = 50 pts
  < 1 mes        = 100 pts

Autoridad:
  No es responsable = 0 pts
  Influencia      = 25 pts
  Decisión final  = 100 pts

Tamaño:
  Freelancer      = 0 pts
  1-10 empleados  = 25 pts
  10-100          = 50 pts
  > 100           = 100 pts
```

**Ejemplo:**

Usuario: "Necesito app, , para en 2 meses, soy CEO"
- Presupuesto  = 50
- Urgencia 2 meses = 50
- Autoridad CEO = 100
- Tamaño desconocido = 25
- **Score = 56**  Lead cualificado

---

## Estados de Oportunidad

**4 Estados principales:**

```

   NUEVO     
  Score 0-30 

       
       

  CUALIFICADO        
  Score 30-70        
  Datos básicos OK   

       
       

  INTERESADO          
  Score 70-85         
  Mostró interés      
  Cita/Demo agendada  

       
       

  GANADO / PERDIDO       
  Score > 85 / < 30      
  Cierre transacción     

```

---

## Playbooks (Conversación)

**PLAYBOOK 1: Descubrimiento**

```
Bot: "¡Hola!  Nos alegra verte. ¿Qué te trae hoy?"

Usuario responde  Bot extrae:
   Tipo de necesidad (app/web/consultoría)
   Contexto (empresa, tamaño)
   Urgencia (timeline)

Bot: "Entendido. ¿Tienes presupuesto estimado?"

Usuario responde  Score sube de 020
```

**PLAYBOOK 2: Calificación**

```
Bot: "¿En cuánto tiempo lo necesitas?"
Bot: "¿Quién más está involucrado en la decisión?"
Bot: "¿Cuál es tu presupuesto estimado?"

Después de 3 preguntas  Score 2050

Si score >= 50:
  Bot: "Perfecto. Te conectamos con especialista."
  Notifica al equipo sales
Else:
  Bot: "Gracias por tu tiempo. Podemos ayudarte luego."
```

**PLAYBOOK 3: Demo/Propuesta**

```
Bot: "Te propongo una demo personalizada."
Bot: "¿Mañana a las 10 o 14 te va bien?"

Usuario elige  Crear evento
Bot: "Confirmado. Recibiras link en 1 hora."

Score sube 5075
```

---

## Opportunity Detection (Triggers)

**El bot detecta oportunidades cuando:**

| Trigger | Mensaje Usuario | Acción Bot |
|---------|-----------------|-----------|
| **Necesidad clara** | "Necesito una app" | Preguntar presupuesto |
| **Presupuesto alto** | "Tengo " | Score , escalate |
| **Urgencia corta** | "Para la próxima semana" | Score , prioritize |
| **Autoridad** | "Soy CEO/Director" | Score , asignar sales |
| **Repeated intent** | Usuario pregunta 3x veces | Escalate a human |
| **Complaint** | "No funciona", "problema" | Escalate to support |

---

## KPIs & Metrics

**Dashboard (Admin):**

```json
{
  "leads_total": 234,
  "leads_por_dia": 12,
  "score_promedio": 45,
  "tasa_conversion": 0.23,
  "tiempo_promedio_cualificacion": "4.2 min",
  "nps": 8.2,
  "costo_por_lead": 2.4,
  "revenue_generado": 89000
}
```

**Metas mensuales:**

- Leads nuevos: 200+
- Tasa conversión: > 20%
- Score promedio: > 50
- NPS: > 8
- Revenue: ,000+

**Por vendedor:**

```bash
curl http://localhost:3000/admin/dashboard/sales \
  -H "Authorization: Bearer "
```

Retorna por vendedor:
- Leads asignados
- Tasa cierre
- Ingresos
- Ranking

---

## Integración con Google Sheets

**Datos exportados automáticamente:**

Cada lead  Sheet "Sales_Leads"

| Fecha | Usuario | Nombre | Empresa | Presupuesto | Score | Estado | Vendedor |
|-------|---------|--------|---------|-------------|-------|--------|----------|
| 2024-01-15 | 573337151064 | Juan | Acme Inc |  | 68 | Cualificado | Carlos |

**Filtros disponibles:**

```
- Por Estado
- Por Score (> 70)
- Por Fecha
- Por Vendedor
```

---

## Ejemplo End-to-End

**Usuario:** Laura (573337151064)

**Conversación:**

```
Bot: Hola, ¿qué te trae?
Laura: Necesito app iOS para negocio

Bot: ¿Cuál es tu presupuesto?
Laura: Unos 
[Score: 50 - Presupuesto OK]

Bot: ¿Para cuándo lo necesitas?
Laura: En 2 meses
[Score: 60 - Timeline OK]

Bot: ¿Eres tú quien toma las decisiones?
Laura: Sí, soy dueña
[Score: 75 - Autoridad confirmada]

Bot: Perfecto. Te agendam cita con especialista?
Laura: Sí, cuándo
[Score: 85 - INTERESADO  Cita agendada]

Sistema: Notifica vendedor asignado
Firebase: Guarda en salesContacts/85/{userId}
Sheets: Exporta con estado INTERESADO
```

---

**Siguiente:** [07_REPORTS_DASHBOARDS.md](07_REPORTS_DASHBOARDS.md)
