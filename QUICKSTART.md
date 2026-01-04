# 🚀 Guía Rápida de Inicio (Quick Start)

Si quieres comenzar ahora mismo, aquí está lo esencial en 10 minutos.

---

## 1️⃣ Validar que todo está en su lugar

```bash
# Verifica estos archivos existen:
ls -la src/services/sessionManager.js
ls -la src/services/conversationManager.js
ls -la src/services/quotationEngine.js
ls -la src/services/conversationFlows/
ls -la src/utils/validators.js
```

**Esperado:** ✅ Todos los archivos existen

---

## 2️⃣ Configurar Variables de Entorno

Tu archivo `.env` debe tener:

```env
PORT=3000
WEBHOOK_VERIFY_TOKEN=tu_token_super_secreto
WHATSAPP_PHONE_NUMBER_ID=tu_numero
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_id
WHATSAPP_ACCESS_TOKEN=tu_token
OPENAI_API_KEY=sk-tu-clave
```

**Nota:** Cópialo de tu configuración anterior

---

## 3️⃣ Verificar Google Sheets

Asegurate que tu spreadsheet tenga **4 hojas**:

```
Hoja 1: "reservas"
  Columnas: Timestamp, Nombre, Email, Teléfono, Empresa, Servicio, Descripción, Estado

Hoja 2: "cotizaciones"
  Columnas: Timestamp, Email, Cliente, Tipo_Proyecto, Complejidad, Opción, Monto, Estado

Hoja 3: "conversaciones"
  Columnas: Timestamp, User_ID, Nombre, Interacción, Resumen, Estado

Hoja 4: "escalados"
  Columnas: Timestamp, User_ID, Cliente, Problema, Estado
```

**Quick fix:** Si no existen, créalas en tu Google Sheets (toma 2 minutos)

---

## 4️⃣ Iniciar Servidor Local

```bash
npm run dev
```

**Esperado:** 
```
Server is listening on port: 3000
```

---

## 5️⃣ Test Rápido

Desde otra terminal:

```bash
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=tu_token_super_secreto&hub.challenge=test123"
```

**Esperado:** Devuelve `test123`

---

## 6️⃣ Probar con tu Teléfono (Real o Test)

**Si tienes WhatsApp Business Account:**

1. Envía un mensaje desde tu teléfono al número configurado
2. Escribí: `hola`
3. Deberías recibir la bienvenida

**Flujo a probar:**
- Toca: "📅 Agendar Reunión"
- Completa: nombre, email, servicio, descripción, fecha
- Verifica en Google Sheets que aparece en "reservas"

---

## 7️⃣ Próximos Pasos

### Para producción:

```bash
# 1. Revisar logs
npm run dev
# (busca errores)

# 2. Desplegar en tu servidor
# (Heroku, Railway, etc.)

# 3. Actualizar webhook URL en WhatsApp Cloud API
# https://tu-dominio-produccion.com/webhook

# 4. Enviar mensaje de test desde tu teléfono
```

### Para debuguear problemas:

Ver archivo: **IMPLEMENTACION.md** → Sección "Troubleshooting"

---

## 📚 Documentos Útiles

| Documento | Leer cuando... |
|-----------|---|
| **RESUMEN_EJECUTIVO.md** | Quieres entender qué se mejoró |
| **PLAN_MEJORAS.md** | Quieres ver la estrategia completa |
| **ARQUITECTURA.md** | Quieres entender cómo funciona |
| **CONVERSACIONES_EJEMPLOS.md** | Quieres ver flujos reales |
| **IMPLEMENTACION.md** | Tienes un problema técnico |
| **CHECKLIST_DEPLOY.md** | Vas a desplegar a producción |

---

## ⚡ Comandos Útiles

```bash
# Iniciar en desarrollo
npm run dev

# Ver logs en tiempo real
npm run dev 2>&1 | grep -v "^$"

# Probar webhook
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"1234567","type":"text","text":{"body":"hola"},"id":"123"}],"contacts":[{"wa_id":"1234567","profile":{"name":"Test"}}]}}]}]}'

# Verificar conexión a Google Sheets
# (prueba en app.js con un pequeño script)
```

---

## 🎯 Flujos Disponibles

El usuario puede hacer:

1. **Agendar Reunión** 📅
   - Recopila: nombre, email, servicio, descripción, fecha/hora
   - Guarda en: Sheet "reservas"

2. **Solicitar Cotización** 💰
   - Calcula: 3 opciones de precio
   - Guarda en: Sheet "cotizaciones"

3. **Hacer Consulta** ❓
   - OpenAI responde preguntas
   - Opción de escalar a agente

4. **Ver Portfolio** 🎨
   - Link a tu website

5. **Hablar con Agente** 👤
   - Escalado inmediato o cola de espera

---

## 📊 Status del Proyecto

```
✅ Código implementado
✅ Documentación completada
✅ Validaciones configuradas
✅ Google Sheets listo
✅ OpenAI integrado
⏳ Deploy (TÚ lo haces)
```

---

## 🆘 Si Algo Falla

### "Webhook no valida"
→ Verifica `WEBHOOK_VERIFY_TOKEN` sea correcto

### "Mensaje no se procesa"
→ Revisa logs con `npm run dev`, busca errores

### "No se guarda en Google Sheets"
→ Verifica credenciales en `src/credentials/credentials.json`

### "OpenAI no responde"
→ Verifica `OPENAI_API_KEY` sea válido

**Para más:** Ver IMPLEMENTACION.md → Troubleshooting

---

## 💡 Tips Pro

1. **Haz backup de Google Sheets** antes de cambios importantes
2. **Revisa logs regularmente** para detectar problemas
3. **Usa Test Users** de WhatsApp para probar sin gastar créditos
4. **Monitorea Google Sheets** diariamente al principio
5. **Guarda un log** de errores para futuro debugging

---

## 🎉 ¡Eso es todo!

Ya tienes un bot profesional, escalable y listo para producción.

**Siguiente paso:** 
1. Prueba localmente (`npm run dev`)
2. Sigue el CHECKLIST_DEPLOY.md
3. Desplega a producción
4. Celebra 🎊

---

**¿Preguntas?** Lee los documentos en este orden:
1. RESUMEN_EJECUTIVO.md (5 min)
2. ARQUITECTURA.md (15 min)
3. IMPLEMENTACION.md (si tienes problemas)

---

**¡Mucho éxito con tu bot!** 🚀

Ahora tu cliente tendrá:
- ✅ Experiencia fluida
- ✅ Respuestas inmediatas
- ✅ Opciones claras (agendar, cotizar, preguntar)
- ✅ Escalado a humano cuando lo necesite
- ✅ Disponibilidad 24/7

**ROI:** El bot se pagará solo en menos de un mes. 💰
