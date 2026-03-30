// ════════════════════════════════════════════════════════════════════════════
// config.gs — THIS IS THE ONLY FILE YOU NEED TO EDIT
//
// Set your sheet name, column names, and any custom rules below.
// The engine (logger.gs) and rule helpers (rules.gs) never need to change.
// ════════════════════════════════════════════════════════════════════════════

// ── Sheet configuration ───────────────────────────────────────────────────────

// Name of the sheet tab — created automatically on first run if it doesn't exist
const SHEET_NAME = "Log";

// Column names — define what gets logged and in what order.
// These become the header row in your sheet.
// They must exactly match the field names your Shortcut sends in the payload.
//
// Simple payload example (one row per request):
//   Shortcut sends: { "timestamp": "...", "mood": "good", "note": "..." }
//   COLUMNS:        ["timestamp", "mood", "note"]
//
// List payload example (one row per item in the list):
//   Shortcut sends: { "timestamp": "...", "date": "2026-03-29", "entries": [ { "phase": "rem", "duration_seconds": 2640 }, ... ] }
//   COLUMNS:        ["timestamp", "date", "phase", "duration_seconds"]
//   The script repeats top-level fields on every row and expands each item in the list.
const COLUMNS = ["timestamp", "field_1", "field_2"];

// ── Custom rules ──────────────────────────────────────────────────────────────

// Called before every write. Return an error string to reject the request,
// or null to allow it through.
//
// Parameters:
//   body        — the full payload sent by the Shortcut
//   sheet       — the Google Sheet object (use getAllRows(sheet) to read existing data)
//
// The example below rejects duplicate submissions based on the timestamp field.
// Every payload must include a top-level "timestamp" in ISO 8601 format
// (e.g. "2026-03-29T09:00:00+02:00") — duplicates only happen if the Shortcut
// runs twice by mistake with the exact same data.
function customRules(body, sheet) {
  return isDuplicateTimestamp(body, sheet);
}
