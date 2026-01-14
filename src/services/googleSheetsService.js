import path from "path";
import { google } from "googleapis";
import { getDataServiceConfig } from "../config/dataServices.js";

const sheets = google.sheets("v4");

/**
 * Google Sheets Service Mejorado
 * Soporta múltiples hojas con configuración centralizada
 * 
 * La configuración de hojas ahora está en: src/config/dataServices.js
 * Para agregar nuevas hojas o cambiar configuración, edita dataServices.js
 */

// Obtener configuración desde dataServices
const SHEET_CONFIG = getDataServiceConfig('GOOGLE_SHEETS');

/**
 * Obtener cliente autenticado
 * Soporta tanto credenciales.json como variables de entorno (Railway o local)
 */
async function getAuthClient() {
  let credentials;
  let credentialSource = null;

  // Intentar diferentes fuentes de credenciales en orden de prioridad
  
  // Prioridad 1: Variable de entorno GOOGLE_CREDENTIALS (Railway)
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      console.log("📌 Usando GOOGLE_CREDENTIALS desde variable de entorno...");
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      credentialSource = "GOOGLE_CREDENTIALS env var";
    } catch (error) {
      console.error("❌ Error parsing GOOGLE_CREDENTIALS:", error.message);
      console.error("Variable value:", process.env.GOOGLE_CREDENTIALS.substring(0, 50) + "...");
    }
  }

  // Prioridad 2: Variable de entorno GOOGLE_CREDENTIALS_JSON (alternativa)
  if (!credentials && process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      console.log("📌 Usando GOOGLE_CREDENTIALS_JSON desde variable de entorno...");
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      credentialSource = "GOOGLE_CREDENTIALS_JSON env var";
    } catch (error) {
      console.error("❌ Error parsing GOOGLE_CREDENTIALS_JSON:", error.message);
    }
  }

  // Prioridad 3: Archivo credentials.json (local development)
  if (!credentials) {
    try {
      const credPath = path.join(process.cwd(), "src/credentials", "credentials.json");
      console.log("📌 Intentando leer credentials.json desde:", credPath);
      const fs = await import("fs").then(m => m.default);
      const credFile = fs.readFileSync(credPath, "utf8");
      credentials = JSON.parse(credFile);
      credentialSource = "credentials.json file";
    } catch (error) {
      console.error("❌ Error loading credentials.json:", error.message);
    }
  }

  if (!credentials) {
    console.error("🔴 Variables de entorno disponibles (primeras 5):", Object.keys(process.env).filter(k => k.includes("GOOGLE") || k.includes("CREDENTIAL")).slice(0, 5));
    throw new Error(
      "❌ Credentials not found!\n" +
      "Opciones:\n" +
      "1. Railway: Agregue variable 'GOOGLE_CREDENTIALS' en la pestaña Variables\n" +
      "2. Local: Coloque credentials.json en src/credentials/\n" +
      "3. Variable alternativa: GOOGLE_CREDENTIALS_JSON"
    );
  }

  console.log("✅ Credenciales cargadas desde:", credentialSource);
  console.log("📊 Project ID:", credentials.project_id);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return auth.getClient();
}

/**
 * Agregar fila a una hoja específica
 */
async function addRowToSheet(auth, sheetKey, values) {
  const config = SHEET_CONFIG.sheets[sheetKey];
  
  if (!config) {
    throw new Error(`Hoja '${sheetKey}' no configurada`);
  }

  const request = {
    spreadsheetId: SHEET_CONFIG.spreadsheetId,
    range: config.range,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: {
      values: [values],
    },
    auth,
  };

  try {
    const response = await sheets.spreadsheets.values.append(request);
    console.log(`Fila agregada a ${config.name}:`, response.data.updates);
    return response;
  } catch (err) {
    console.error(`Error agregando fila a ${config.name}:`, err);
    throw err;
  }
}

/**
 * Leer datos de una hoja
 */
async function readSheet(auth, sheetKey, range) {
  const config = SHEET_CONFIG.sheets[sheetKey];
  
  if (!config) {
    throw new Error(`Hoja '${sheetKey}' no configurada`);
  }

  const finalRange = range || `${config.name}!A:Z`;

  const request = {
    spreadsheetId: SHEET_CONFIG.spreadsheetId,
    range: finalRange,
    auth,
  };

  try {
    const response = await sheets.spreadsheets.values.get(request);
    return response.data.values || [];
  } catch (err) {
    console.error(`Error leyendo ${config.name}:`, err);
    throw err;
  }
}

/**
 * Exportar función principal
 */
const googleSheetsService = async (data, sheetKey = 'reservas') => {
  try {
    const auth = await getAuthClient();
    await addRowToSheet(auth, sheetKey, data);
    return "Datos guardados correctamente";
  } catch (error) {
    console.error('Error en Google Sheets:', error);
    throw error;
  }
};

/**
 * Funciones adicionales para lectura
 */
export async function getReservations() {
  try {
    const auth = await getAuthClient();
    return await readSheet(auth, 'reservas');
  } catch (error) {
    console.error('Error leyendo reservas:', error);
    throw error;
  }
}

export async function getQuotations() {
  try {
    const auth = await getAuthClient();
    return await readSheet(auth, 'cotizaciones');
  } catch (error) {
    console.error('Error leyendo cotizaciones:', error);
    throw error;
  }
}

export async function getEscalations() {
  try {
    const auth = await getAuthClient();
    return await readSheet(auth, 'escalados');
  } catch (error) {
    console.error('Error leyendo escalados:', error);
    throw error;
  }
}

export default googleSheetsService;
