/**
 * Configuración de Firebase
 * Para memoria persistente de clientes y sesiones
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import config from './env.js';
import fs from 'fs';
import path from 'path';

let firebaseApp = null;
let database = null;

/**
 * Inicializar Firebase
 */
export const initializeFirebase = () => {
  if (firebaseApp) {
    console.log('✅ Firebase ya inicializado');
    return database;
  }

  try {
    // Opción 1: Usar credenciales desde variables de entorno (Railway)
    if (config.FIREBASE_PROJECT_ID && config.FIREBASE_PRIVATE_KEY && config.FIREBASE_CLIENT_EMAIL) {
      console.log('🔥 Inicializando Firebase con variables de entorno...');
      
      firebaseApp = initializeApp({
        credential: cert({
          projectId: config.FIREBASE_PROJECT_ID,
          privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: config.FIREBASE_CLIENT_EMAIL,
        }),
        databaseURL: config.FIREBASE_DATABASE_URL || `https://${config.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
      });
    } 
    // Opción 2: Usar archivo de credenciales local
    else if (config.FIREBASE_SERVICE_ACCOUNT_PATH) {
      console.log('🔥 Inicializando Firebase con archivo de credenciales...');

      const resolvedPath = path.resolve(process.cwd(), config.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`No se encontró el archivo de credenciales en: ${resolvedPath}`);
      }

      const raw = fs.readFileSync(resolvedPath, 'utf-8');
      const serviceAccount = JSON.parse(raw);

      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: config.FIREBASE_DATABASE_URL
      });
    }
    // Opción 3: Sin Firebase (fallback a memoria)
    else {
      console.log('⚠️ Firebase no configurado. Usando memoria RAM (datos se perderán al reiniciar)');
      return null;
    }

    database = getDatabase(firebaseApp);
    console.log('✅ Firebase inicializado correctamente');
    return database;

  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error.message);
    console.log('⚠️ Fallback a memoria RAM');
    return null;
  }
};

/**
 * Obtener referencia a la base de datos
 */
export const getDB = () => {
  if (!database) {
    database = initializeFirebase();
  }
  return database;
};

/**
 * Referencias a colecciones principales
 */
export const getClientProfilesRef = () => {
  const db = getDB();
  return db ? db.ref('clientProfiles') : null;
};

export const getSessionsRef = () => {
  const db = getDB();
  return db ? db.ref('sessions') : null;
};

export const getConversationsRef = () => {
  const db = getDB();
  return db ? db.ref('conversations') : null;
};

export const getOpportunitiesRef = () => {
  const db = getDB();
  return db ? db.ref('opportunities') : null;
};

export default {
  initializeFirebase,
  getDB,
  getClientProfilesRef,
  getSessionsRef,
  getConversationsRef,
  getOpportunitiesRef
};
