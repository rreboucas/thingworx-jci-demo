# CLAUDE.md

Project notes for Claude Code working in this repository.

## Workflow

- After making changes, always commit and push to `origin/main`. Use a HEREDOC commit message that summarizes the change and ends with the standard `Co-Authored-By` trailer. No need to ask for confirmation before committing.

## Project layout

- `server.js` — Express + Socket.IO backend. Serves `public/` and the `/dashboard` and `/inbox` deep links.
- `public/index.html` — landing page (asset monitor). Header logo is `public/assets/ptc-logo.png`.
- `public/app.js` — asset monitor logic.
- `public/exec-dash.js` — Tableau-style Executive Dashboard overlay (Agentforce storyline).
- `public/styles.css` — asset-monitor and Exec Dashboard styles.
- `public/inbox.html` / `inbox.css` / `inbox.js` — Mailwave email-client demo (Lodge Inn by the Sea suite-upgrade email for Emily Thompson). Self-contained styles; uses `public/assets/mailwave-logo.svg`.
- `data/assets.js` — fleet asset definitions (JCI rooftop HVAC units).

## Demo entry points

- `/` — ThingWorx-style asset monitor. Click the "Johnson Controls" label in the header to open the Executive Dashboard.
- `/dashboard` — opens the Executive Dashboard directly (also `/?view=dashboard` and `/#dashboard`).
- `/inbox` — Mailwave email client showing the Lodge Inn by the Sea suite-upgrade email featured in Emily's inbox.
