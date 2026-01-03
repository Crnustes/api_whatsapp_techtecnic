import path from "path";
import { google } from "googleapis";

const sheets = google.sheets("v4");

async function addRowToSheet(auth, spreadsheetId, values) {
  const request = {
    spreadsheetId,
    range: "reservas!A2:F",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: {
      values: [values],
    },
    auth,
  };
  try {
    const response = await sheets.spreadsheets.values.append(request);
    console.log("Row added:", response.data.updates);
    return response;
  } catch (err) {
    console.error("Error adding row:", err);
  }
}

const appendToSheet = async (data) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), "src/credentials", "credentials.json"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const authClient = await auth.getClient();
    const spreadsheetId = "1EE1ai1QrBXI0SZ3DdvrZrrn3U6DkAD9ILKzTMWezSnM";

    await addRowToSheet(authClient, spreadsheetId, data);

    return "Data appended successfully";
  } catch (error) {
    console.error(error);
  }
};

export default appendToSheet;
