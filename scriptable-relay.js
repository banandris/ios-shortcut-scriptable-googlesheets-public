/**
 * Scriptable Relay — Universal HTTP Middleware
 *
 * A single reusable Scriptable script that connects any iOS Shortcut
 * to any Google Apps Script web app endpoint.
 *
 * The Shortcut passes an envelope with a target URL and a data payload.
 * This script forwards the payload to that URL and returns the response
 * back to the Shortcut.
 *
 * INPUT (from Shortcut via "Run Script" action — pass as a dictionary):
 *   {
 *     "target_url": "https://script.google.com/macros/s/.../exec",
 *     "payload": { ...your data }
 *   }
 *
 * OUTPUT (returned to Shortcut via Script.setShortcutOutput):
 *   On success:
 *   {
 *     "status": "success",
 *     "message": "...",
 *     "data": { ... }
 *   }
 *
 *   On error:
 *   {
 *     "status": "error",
 *     "message": "..."
 *   }
 */

const input = args.shortcutParameter;

// Accept both a raw dictionary (Shortcuts dict action) and a JSON string
const envelope = typeof input === "string" ? JSON.parse(input) : input;

// Validate envelope before doing anything
if (!envelope || !envelope.target_url || !envelope.payload) {
  Script.setShortcutOutput(
    JSON.stringify({
      status: "error",
      message: "Invalid envelope: target_url and payload are required.",
    })
  );
  Script.complete();
  return;
}

// Forward only the payload to GAS — routing metadata stays here
const req = new Request(envelope.target_url);
req.method = "POST";
req.headers = { "Content-Type": "application/json" };
req.body = JSON.stringify(envelope.payload);
req.timeoutInterval = 15;

try {
  const responseText = await req.loadString();

  let response;
  try {
    response = JSON.parse(responseText);
  } catch {
    response = {
      status: "error",
      message: "GAS returned a non-JSON response: " + responseText,
    };
  }

  Script.setShortcutOutput(JSON.stringify(response));
} catch (err) {
  Script.setShortcutOutput(
    JSON.stringify({
      status: "error",
      message: "Request failed: " + err.message,
    })
  );
}

Script.complete();
