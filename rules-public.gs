// ════════════════════════════════════════════════════════════════════════════
// rules.gs — Reusable rule helpers
//
// These functions are available to use inside customRules() in config.gs.
// You do not need to edit this file.
// ════════════════════════════════════════════════════════════════════════════

// Returns an error string if the payload's timestamp already exists in the sheet,
// or null if it's new. Requires body.timestamp to be a valid ISO 8601 string.
function isDuplicateTimestamp(body, sheet) {
  if (!body.timestamp) return "Missing required field: timestamp";
  if (isNaN(Date.parse(body.timestamp))) return "Invalid ISO 8601 timestamp: " + body.timestamp;

  const rows = getAllRows(sheet);
  const tsIndex = COLUMNS.indexOf("timestamp");
  if (tsIndex === -1) return null; // timestamp not a logged column, skip check

  const incoming = new Date(body.timestamp).getTime();
  for (const row of rows) {
    if (new Date(row[tsIndex]).getTime() === incoming) {
      return "Duplicate: a row with timestamp " + body.timestamp + " already exists.";
    }
  }
  return null;
}

// Returns all data rows from the sheet (excluding the header row) as arrays.
function getAllRows(sheet) {
  const data = sheet.getDataRange().getValues();
  return data.slice(1); // skip header row
}
