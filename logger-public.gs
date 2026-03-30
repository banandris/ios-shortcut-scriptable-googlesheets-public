// ════════════════════════════════════════════════════════════════════════════
// logger.gs — Engine
//
// Handles incoming requests, flattens payloads, applies rules, and writes
// rows to the sheet. You do not need to edit this file.
// ════════════════════════════════════════════════════════════════════════════

// ── Entry Point ──────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const body  = JSON.parse(e.postData.contents);
    const sheet = getSheet();

    const ruleError = customRules(body, sheet);
    if (ruleError) return respond({ status: "error", message: ruleError });

    const rows = flattenPayload(body);
    if (rows.length === 0) return respond({ status: "error", message: "No data to log." });

    for (const row of rows) {
      sheet.appendRow(COLUMNS.map(col => row[col] !== undefined ? row[col] : ""));
    }

    return respond({
      status:  "success",
      message: "Logged " + rows.length + (rows.length === 1 ? " row." : " rows."),
      data:    { rows_logged: rows.length },
    });

  } catch (err) {
    return respond({ status: "error", message: "Invalid request: " + err.message });
  }
}

// ── Payload Flattening ────────────────────────────────────────────────────────

// Handles two payload shapes automatically:
//
// 1. Flat — all values are simple (text, number, date):
//    { "timestamp": "...", "mood": "good" }  →  one row
//
// 2. List — one field is an array of objects, the rest are scalars:
//    { "timestamp": "...", "date": "2026-03-29", "entries": [ {...}, {...} ] }
//    →  one row per item, scalar fields repeated on every row
function flattenPayload(body) {
  const scalars  = {};
  let   listItems = null;

  for (const key of Object.keys(body)) {
    if (Array.isArray(body[key])) {
      listItems = body[key];
    } else {
      scalars[key] = body[key];
    }
  }

  if (!listItems) return [scalars];
  return listItems.map(item => ({ ...scalars, ...item }));
}

// ── Sheet Helper ──────────────────────────────────────────────────────────────

function getSheet() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
  }
  return sheet;
}

// ── Response Helper ───────────────────────────────────────────────────────────

function respond(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
