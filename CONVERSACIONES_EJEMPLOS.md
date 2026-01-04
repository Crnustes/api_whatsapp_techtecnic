# 📱 Ejemplos de Conversaciones - Bot Mejorado

## Flujo 1: Agendamiento de Reunión

```
Usuario: Hola

Bot: ¡Hola Juan! 👋

Bienvenido a Tech Tecnic, tu agencia de desarrollo web, móvil y automatización.

¿En qué podemos ayudarte hoy?

[📅 Agendar Reunión] [💰 Solicitar Cotización] [❓ Hacer Consulta] [🎨 Ver Portfolio]

---

Usuario: (toca) 📅 Agendar Reunión

Bot: 📅 *Agendar Reunión*

Te ayudaremos a agendar una llamada con nuestro equipo. ¿Cuál es tu nombre?

---

Usuario: Juan García

Bot: ¡Gracias Juan! 👌

Ahora, ¿cuál es tu correo electrónico?

---

Usuario: juan@empresa.com

Bot: 📧 Email guardado.

¿Qué servicio te interesa?

[🌐 Desarrollo Web] [📱 App Móvil] [🛒 Ecommerce] [⚙️ Automatización] [✨ Otro]

---

Usuario: (toca) 🛒 Ecommerce

Bot: ✅ Seleccionaste: *Ecommerce*

Ahora, cuéntanos brevemente sobre tu proyecto o necesidad:

---

Usuario: Necesito una tienda online para vender ropa, con carrito, pagos y gestión de inventario

Bot: 📝 Perfecto.

🗓️ *Selecciona una fecha y hora disponible:*

Por favor, escribe en formato: DD/MM/YYYY HH:MM

Ejemplo: 15/01/2025 14:30

---

Usuario: 15/01/2025 14:30

Bot: ✅ *Resumen de tu Cita:*

👤 *Nombre:* Juan García
📧 *Email:* juan@empresa.com
🎯 *Servicio:* Ecommerce
📝 *Descripción:* Necesito una tienda online para vender ropa, con carrito, pagos y gestión de inventario
🗓️ *Fecha/Hora:* 15/01/2025 14:30

¿Es correcto?

[Sí, confirmar] [Cancelar]

---

Usuario: (toca) Sí, confirmar

Bot: 🎉 *¡Cita Confirmada!*

Gracias Juan, hemos registrado tu solicitud.

📧 Te enviaremos un email de confirmación a: juan@empresa.com

📞 En breve nuestro equipo te contactará.

¿Hay algo más en lo que podamos ayudarte?

---

Usuario: No, gracias

Bot: 👋 ¡Hasta pronto, Juan!

Si necesitas algo más, estamos aquí. 😊
```

---

## Flujo 2: Cotización Automática

```
Usuario: (toca) 💰 Solicitar Cotización

Bot: 💰 *Solicitar Cotización*

Te ayudaremos a obtener una cotización personalizada basada en tus necesidades.

¿Qué tipo de proyecto necesitas?

[🌐 Sitio Web] [🛒 Ecommerce] [📱 App Móvil] [⚙️ Automatización] [🔗 Integración] [✨ Otro]

---

Usuario: (toca) 📱 App Móvil

Bot: ✅ Seleccionaste: *App Móvil*

¿Cuál es la complejidad del proyecto?

[1️⃣ Básico (Simple)] [2️⃣ Medio (Moderado)] [3️⃣ Alto (Complejo)]

---

Usuario: (toca) 2️⃣ Medio (Moderado)

Bot: ✅ Complejidad: *Medio*

¿Cuándo necesitas que esté listo?

[⚡ ASAP (< 2 semanas)] [🚀 Rápido (2-4 semanas)] [📅 Normal (1-2 meses)] [😌 Flexible (> 2 meses)]

---

Usuario: (toca) 🚀 Rápido (2-4 semanas)

Bot: ✅ Timeline: *Rápido*

Ahora, cuéntanos más detalles sobre tu proyecto (funcionalidades principales, integraciones, etc.):

---

Usuario: App de delivery con geolocalización, carrito, pagos integrados y notificaciones push

Bot: ⏳ Analizando tu proyecto...

[unos segundos después]

🎯 *Opciones de Cotización:*

━━━━━━━━━━━━━━━━━━━━━━

💰 *OPCIÓN ECONÓMICA*
Precio: $8,000
Características:
• Plataforma única
• Hasta 5 pantallas
• API integrada
• Push notifications
Tiempo: 6 semanas

━━━━━━━━━━━━━━━━━━━━━━

⭐ *OPCIÓN RECOMENDADA*
Precio: $14,400
Características:
• iOS + Android
• Hasta 15 pantallas
• Geolocalización
• Offline mode
• Analytics
• Social login
Tiempo: 4 semanas

━━━━━━━━━━━━━━━━━━━━━━

👑 *OPCIÓN PREMIUM*
Precio: $21,600
Características:
• iOS + Android
• Escalable
• Características avanzadas
• Pagos integrados
• IA/ML básico
• Soporte 6 meses
• Mantenimiento incluido
Tiempo: 3 semanas

━━━━━━━━━━━━━━━━━━━━━━

¿Cuál te interesa?

[💰 Opción Económica] [⭐ Opción Recomendada] [👑 Opción Premium]

---

Usuario: (toca) ⭐ Opción Recomendada

Bot: ✅ Excelente elección.

📧 Para completar, ¿cuál es tu correo electrónico?

---

Usuario: contacto@delivery.co

Bot: 🎉 *¡Cotización Enviada!*

Gracias por confiar en Tech Tecnic.

📧 Hemos enviado los detalles a: contacto@delivery.co

💡 Próximos pasos:
1. Revisa tu email con toda la información
2. Si tienes dudas, respondemos al instante
3. ¿Listo para comenzar? Agenda una llamada con nuestro equipo

¿Deseas agendar una reunión ahora?

[📅 Sí] [Después] [Ver Portfolio]
```

---

## Flujo 3: Consulta con Asistente IA

```
Usuario: (toca) ❓ Hacer Consulta

Bot: ❓ *Asistente Tech Tecnic*

¿Qué pregunta tienes sobre nuestros servicios, tecnología o proyectos?

---

Usuario: ¿Cuál es la mejor tecnología para una app de e-learning?

Bot: ⏳ Buscando la mejor respuesta...

Para una app de e-learning, recomendamos:

📱 *Frontend:* React Native (multiplataforma)
⚙️ *Backend:* Node.js + Express
💾 *Base de datos:* MongoDB o PostgreSQL
📊 *Streaming:* AWS S3 + CloudFront

Nuestro equipo tiene experiencia en todas estas. ¿Te interesa conocer un caso similar?

¿Te fue útil la respuesta?

[👍 Sí, fue útil] [❓ Otra pregunta] [👤 Hablar con agente]

---

Usuario: (toca) ❓ Otra pregunta

Bot: ✅ Adelante, ¿cuál es tu siguiente pregunta?

---

Usuario: ¿Cuánto tiempo toma desarrollar una app de e-learning?

Bot: ⏳ Buscando la mejor respuesta...

Depende de la complejidad:

⏱️ *Básica:* 8-10 semanas (~$5,000)
⏱️ *Estándar:* 12-16 semanas (~$15,000)
⏱️ *Avanzada:* 18-24 semanas (~$30,000)

Esto incluye: cursos, videos, certificados, pagos y reportes.

¿Necesitas una cotización específica?

[👍 Sí, fue útil] [❓ Otra pregunta] [👤 Hablar con agente]

---

Usuario: (taca) 👍 Sí, fue útil

Bot: ¡Excelente! 👌

¿Te gustaría:
1️⃣ Agendar una llamada con nuestro equipo
2️⃣ Ver nuestro portafolio
3️⃣ Terminar

Responde con un número.

---

Usuario: 1

Bot: Perfecto, vamos a agendar. ¿Cuál es tu nombre?

[continúa flujo de agendamiento]
```

---

## Flujo 4: Escalado a Agente Humano

```
Usuario: Necesito hablar con alguien de tu equipo

Bot: 👤 *Conectando con un especialista...*

Esperando a un agente disponible.

Mientras esperas, cuéntanos brevemente tu situación:

---

Usuario: Tenemos un proyecto complejo que necesita consultoría estratégica antes de empezar

Bot: ✅ *¡Conectado con Carlos!*

Especialista en: Ecommerce

Te responderá en breve. Gracias por tu paciencia 😊

---

[Carlos está disponible - se inicia conversación directa]

Carlos: ¡Hola! Soy Carlos, especialista en ecommerce. 

Leí que necesitas consultoría estratégica. Perfecto, justamente es lo nuestro. ¿Cuéntame más sobre tu proyecto?

Usuario: Queremos lanzar una tienda online para vender electrónica...

[Conversación directa continúa entre usuario y agente]
```

---

## Flujo 5: Portfolio

```
Usuario: (toca) 🎨 Ver Portfolio

Bot: 🎨 *Portfolio Tech Tecnic*

Mira algunos de nuestros proyectos:
https://techtecnic.com/portafolio

¿Necesitas algo específico? Estamos aquí para ayudarte.

[📅 Agendar Reunión] [💰 Solicitar Cotización] [❓ Hacer Consulta]
```

---

## Flujo 6: Manejo de Errores

```
Usuario: (escribe algo muy corto) h

Bot: ❌ Por favor, formula una pregunta más clara.

---

Usuario: juan@mail (email inválido)

Bot: ❌ Por favor, ingresa un email válido (ej: correo@ejemplo.com)

---

Usuario: 32/13/2025 (fecha inválida)

Bot: ❌ Formato inválido. Usa: DD/MM/YYYY HH:MM

Ejemplo: 15/01/2025 14:30
```

---

## Flujo 7: Contexto Conversacional

```
Usuario: ¿Hacen apps?

Bot: Sí, somos especialistas en desarrollo de apps móviles con React Native y Flutter.

¿Qué tipo de app necesitas?

---

Usuario: (el bot recuerda que preguntó sobre apps)

Usuario: ¿Cuál es más rápido de desarrollar, iOS o Android?

Bot: (entiende el contexto de apps)

Para una sola plataforma: 4-8 semanas
Para ambas (iOS + Android): 6-10 semanas

React Native reduce el tiempo significativamente comparado con desarrollo nativo.

¿Necesitas asesoría sobre cuál elegir?
```

---

## Notas Importantes

- ✅ Los mensajes son cortos y puntuales (máximo 3-4 líneas)
- ✅ Se usan emojis estratégicamente para visual appeal
- ✅ Los botones hacen la conversación más fluida
- ✅ El bot recuerda contexto anterior
- ✅ Las validaciones son silenciosas pero claras
- ✅ Siempre hay una opción de escalar a humano
- ✅ Los datos se guardan automáticamente en Google Sheets

---

**Estos ejemplos sirven como guía para entender el flujo esperado del bot.**
