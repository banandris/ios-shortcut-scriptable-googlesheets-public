# iOS Shortcut → Scriptable → Google Sheets Logger

A simple, reusable setup for logging any data from an iOS Shortcut directly into a Google Sheet — no third-party services, no subscriptions.

---

## How it works

```
iOS Shortcut  →  Scriptable (relay)  →  Google Apps Script  →  Google Sheet
```

1. The iOS Shortcut collects data (e.g. a timestamp, a value, an event)
2. It passes that data to a Scriptable script acting as a relay
3. The relay forwards it to a Google Apps Script web app you deploy
4. The GAS script writes a row to your Google Sheet

One Scriptable script handles everything — you never need to touch it again. Each new logger only needs a new Shortcut and a new GAS script.

---

## What you need

- An iPhone with the [Scriptable](https://scriptable.app) app (free)
- An iPhone with the Shortcuts app (built-in)
- A Google account (for Google Sheets and Apps Script, both free)

---

## Setup

### 1. Add the Scriptable relay script

- Open Scriptable and create a new script
- Paste the contents of `scriptable-relay.js`
- Name it something like `Relay` — you'll reuse this for every logger

### 2. Set up the Google Sheet and Apps Script

Start from Google Sheets — this is where your data will live, and it's how you open the script editor for that specific spreadsheet.

- Go to [Google Drive](https://drive.google.com) and create a new Google Sheet
- With the spreadsheet open, click **Extensions > Apps Script**
- The script editor opens with one default file called `Code.gs`. You will be working with three files instead — create two more by clicking the **+** button next to "Files" and choosing **Script**. Name them `rules` and `logger` (Apps Script adds `.gs` automatically)
- Paste the contents of each file into the matching tab:
  - `config.gs` → into `Code.gs` (or rename it to `config`)
  - `rules.gs` → into your `rules` file
  - `logger.gs` → into your `logger` file
- The only file you need to edit is `config.gs` — there are two things to set:
  - `SHEET_NAME` — the name of the sheet tab (default: `Log`)
  - `COLUMNS` — the list of fields you want to log, in the order you want them as columns in your sheet. These names must exactly match the field names your Shortcut will send
- The sheet tab and column headers are created automatically the first time a request comes in
- Deploy the script as a Web App:
  - Click **Deploy > New deployment**
  - Type: **Web app**
  - Execute as: **Me**
  - Who has access: **Anyone**
  - Click **Deploy**, approve the permissions, and copy the URL

The script handles two payload shapes automatically — no extra configuration needed:

- If your Shortcut sends a simple flat set of fields (e.g. a timestamp and a mood rating), it writes one row per submission
- If your Shortcut sends a list of items (e.g. a date plus a list of sleep phases), it writes one row per item in the list, repeating the top-level fields on every row

Every payload must include a top-level `timestamp` field in ISO 8601 format (e.g. `2026-03-29T09:00:00+02:00`). The script uses this to reject accidental duplicate submissions.

### 3. Build the iOS Shortcut

The Shortcut needs to pass a dictionary to the Scriptable relay with this shape:

```
{
  "target_url": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  "payload": { ...your data }
}
```

Simple payload example (one row logged per submission):
```
"payload": {
  "timestamp": "2026-03-29T09:00:00+02:00",
  "mood": "good",
  "note": "slept well"
}
```

List payload example - sleep phase logger (one row logged per item in the list):
```
"payload": {
  "timestamp": "2026-03-29T09:00:00+02:00",
  "date": "2026-03-29",
  "entries": [
    { "phase": "deep", "duration_seconds": 2760 },
    { "phase": "rem",  "duration_seconds": 2640 }
  ]
}
```

In Shortcuts:
- Use a **Dictionary** action to build the envelope above
- Add a **Run Script** action, select Scriptable, choose your relay script, and pass the dictionary as input
- Optionally add a **Show Notification** action using the `message` field from the response (in iOS Shortcuts the response is called `Script Result`)

---

## Response format

Every response from the GAS script follows the same shape:

On success:
```json
{
  "status": "success",
  "message": "Human-readable confirmation",
  "data": { }
}
```

On error:
```json
{
  "status": "error",
  "message": "Description of what went wrong"
}
```

You can use the `status` field in Shortcuts to branch on success/error, and `message` to show a notification.

---

## Adding a new logger

1. Create a new spreadsheet, open **Extensions > Apps Script**, paste all three files
2. Edit only `config.gs` — set `SHEET_NAME`, `COLUMNS`, and optionally extend `customRules`
3. Deploy as a new Web App, copy the URL
4. Build a new Shortcut pointing to that URL using the same `scriptable-relay.js`

That's it — `rules.gs`, `logger.gs`, and the Scriptable relay script stay the same.
