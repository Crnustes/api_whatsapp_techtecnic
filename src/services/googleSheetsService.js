import path from "path";
import { google } from "googleapis";

const sheets = google.sheets("v4");

/**
 * Google Sheets Service Mejorado
 * Soporta múltiples hojas con configuración centralizada
 */

// Configuración de hojas
const SHEET_CONFIG = {
  spreadsheetId: "1EE1ai1QrBXI0SZ3DdvrZrrn3U6DkAD9ILKzTMWezSnM",
  sheets: {
    reservas: {
      name: "reservas",
      range: "reservas!A2:H",
      headers: ["Timestamp", "Nombre", "Email", "Teléfono", "Empresa", "Servicio", "Descripción", "Estado"]
    },
    cotizaciones: {
      name: "cotizaciones",
      range: "cotizaciones!A2:H",
      headers: ["Timestamp", "Email", "Cliente", "Tipo_Proyecto", "Complejidad", "Opción", "Monto", "Estado"]
    },
    conversaciones: {
      name: "conversaciones",
      range: "conversaciones!A2:F",
      headers: ["Timestamp", "User_ID", "Nombre", "Interacción", "Resumen", "Estado"]
    },
    escalados: {
      name: "escalados",
      range: "escalados!A2:E",
      headers: ["Timestamp", "User_ID", "Cliente", "Problema", "Estado"]
    }
  }
};

/**
 * Obtener cliente autenticado
 * Soporta tanto credenciales.json como variables de entorno
 */
async function getAuthClient() {
  let credentials;

  // Prioridad 1: Variable de entorno GOOGLE_CREDENTIALS
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } catch (error) {
      console.error("❌ Error parsing GOOGLE_CREDENTIALS:", error.message);
      throw new Error("Invalid GOOGLE_CREDENTIALS JSON format");
    }
  }
  // Prioridad 2: Archivo credentials.json (local development)
  else {
    try {
      const credPath = path.join(process.cwd(), "src/credentials", "credentials.json");
      const fs = await import("fs").then(m => m.default);
      const credFile = fs.readFileSync(credPath, "utf8");
      credentials = JSON.parse(credFile);
    } catch (error) {
      console.error("❌ Error loading credentials.json:", error.message);
      throw new Error("Credentials not found. Set GOOGLE_CREDENTIALS env var or place credentials.json in src/credentials/");
    }
  }

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
