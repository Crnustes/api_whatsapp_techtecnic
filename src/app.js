import express from 'express';
import config from './config/env.js';
import webhookRoutes from './routes/webhookRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { initializeFirebase } from './config/firebase.js';
import { verifyFirebaseConfig } from './config/firebaseVerify.js';

const app = express();
app.use(express.json());

app.use('/', webhookRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send(`<pre>Tech Tecnic WhatsApp Bot
  
📊 Dashboard Admin: http://localhost:${config.PORT}/dashboard
💬 Dashboard Cliente: http://localhost:${config.PORT}/dashboard/client/{PHONE}

Checkout README.md to start.</pre>`);
});

// Inicializar Firebase al arrancar
console.log('🔥 Inicializando Firebase...');
const check = verifyFirebaseConfig();
console.log('🔎 Verificación Firebase:', check);
initializeFirebase();

app.listen(config.PORT, () => {
  console.log(`Server is listening on port:  ${config.PORT}`);
});  