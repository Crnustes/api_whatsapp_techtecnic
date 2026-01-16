# Features

Memoria persistente, idempotencia, feature flags, detección de oportunidades.

---

## Memoria Persistente

**Qué es:** Cliente menciona "necesito web", en próxima sesión el bot recuerda.

**Estructura:**
- **summary** (1-3 líneas): contexto actual
- **facts** (key-value): datos extraídos (nombre, servicio, presupuesto, etc)
- **recentTurns** (array): últimos 8 turnos usuario/bot

**Ubicación:** Firebase clientProfiles/{userId}/memory/

**Cómo funciona:**
```
1. Cargar memoria de Firebase
2. OpenAI incluye memory en prompt
3. Generar respuesta personalizada
4. Actualizar memoria (async, no bloquea)
   - OpenAI analiza conversación
   - Genera update: { summary, factsToSet, factsToUnset }
   - Guardar en Firebase
```

**Performance:** ~50ms lectura + ~800ms actualización (async)

**Costo:** ~.002 por actualización

---

## Idempotencia

**Problema:** WhatsApp puede enviar mismo mensaje 2+ veces por timeout.

**Solución:** Detectar si messageId ya fue procesado.

**Implementación:**
```
1. Recibir mensaje con messageId (de WhatsApp)
2. ¿Ya existe en processed_messages?
   - SÍ  retornar respuesta anterior (skip)
   - NO  procesar normalmente
3. Guardar messageId + respuesta en Firebase
4. Limpiar > 7 días automáticamente
```

**Firebase:** processed_messages/{messageId}/

**Testing:** Enviar mismo mensaje 2x vía WhatsApp  responde 1x sola

---

## Feature Flags

**Qué son:** Switches que habilitan/deshabilitan features **sin reiniciar**.

**Flags disponibles:**
```javascript
{
  "memoryEnabled": true,           // Memoria persistente
  "idempotenceEnabled": true,      // Detección duplicados
  "salesFlowEnabled": true,        // Lead scoring
  "appointmentEnabled": true,      // Agendar citas
  "quotationEnabled": true,        // Cotizaciones
  "opportunityDetection": true,    // Detectar chatbot-IA
  "dashboardEnabled": true         // Dashboards
}
```

**Configuración:** En src/tenants/{tenant}/config.json

**Cambios dinámicos:**
```bash
# 1. Editar config.json
nano src/tenants/techtecnic/config.json

# 2. Cambiar flag (ej: salesFlowEnabled: false)

# 3. Guardar (NO requiere reinicio)

# 4. Próximo mensaje usa nuevo valor
```

**Uso en código:**
```javascript
if (config.featureFlags.salesFlowEnabled) {
  score = await calculateLeadScore(userId, msg);
}
```

---

## Opportunity Detection

**Qué es:** Bot detecta automáticamente cuando cliente menciona chatbot IA.

**Triggers:** 
"chatbot", "bot", "automatización", "IA", "respuestas automáticas", etc

**Qué sucede:**
```
1. Detecta trigger en mensaje
2. +20 puntos lead score
3. Notifica admin vía WhatsApp
4. Actualiza memory
5. Respuesta personalizada destacando experiencia en chatbots
```

**Ejemplo:**
```
Usuario: "Necesito un chatbot con IA"
Bot: "¡Perfecto! Justamente somos especialistas en chatbots como este que
     estás usando. Podemos incluir: atención 24/7, memoria, lead scoring,
     multi-idioma, integración sistemas. ¿Agendamos videollamada?"
```

---

**Siguiente:** [03_SETUP_DEPLOYMENT.md](03_SETUP_DEPLOYMENT.md)
