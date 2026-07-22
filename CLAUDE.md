# note_project — working rules for Claude

AI study-notes app. Students organize notes by class and chat with an AI that reads them.
**Stack:** React 19 + Vite (client) · Express + TypeScript (server) · Supabase (DB + storage) · OpenAI.

## How to run

| What | Command | URL / notes |
|------|---------|-------------|
| Client | `cd client && npm run dev` | http://localhost:5173 — proxies `/api` → `:3000` |
| Server | `cd server && npm run dev` | http://localhost:3000 — needs `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in `server/.env` |
| Typecheck (client) | `cd client && npm run typecheck` | `tsc -b` |
| Typecheck (server) | `cd server && npm run typecheck` | `tsc --noEmit` |
| Lint (client) | `cd client && npm run lint` | eslint |

Both servers run in separate terminals. If Vite says port 5173 is taken it falls back to **5174** — check which port is live before testing (`lsof -nP -iTCP -sTCP:LISTEN | grep -E ':(5173|5174)'`).

## Browser verification — `playwright-cli` (global)

Use the CLI, not the Playwright MCP (cheaper, and the MCP entry was removed from `.mcp.json`). `playwright-cli` is on PATH.

```bash
playwright-cli open http://localhost:5174        # or 5173
playwright-cli goto http://localhost:5174/...    # navigate
playwright-cli click "<selector|ref>"            # interact
playwright-cli snapshot                           # accessibility tree → read labels/text
playwright-cli screenshot --filename /tmp/x.png   # then open the PNG to eyeball pixels
```
Console errors and network requests are captured under `.playwright-cli/` after each command — read the latest `console-*.log` for JS errors and use `requests` / `response-body` to confirm API status codes.

## THE MANDATORY LOOP — every change, no exceptions

1. **Make ONE small, scoped change.** Touch only what the task needs.
2. **Verify in the running UI** with `playwright-cli`:
   - `goto` the affected page and perform the action,
   - `snapshot` → confirm **every label / text / signal reads correctly**,
   - `screenshot` → open it and eyeball the render,
   - read the latest console log → **zero JS errors**,
   - check network requests → **API calls return 2xx, not 4xx/5xx** (the "goes through the pipeline" check — this is what catches things like the `502 /api/classes` failure).
3. **Check for code errors + conflicts:** run the relevant `npm run typecheck` (+ `npm run lint` for client), then grep for callers/imports of any symbol I changed to confirm nothing downstream broke.

## Guardrails — "don't break the app"

- **One change at a time.** Verify it before starting the next.
- **Make sure to show user the snapshot and reasoning** The users should be outputted a response that shows you verifying/checking for an error. Same with error fixes, showing a working app afterwards.
- **Do not** refactor or "improve" unrelated code, rename across files, or touch files outside the task without asking first.
- If a change starts **ballooning** (many files, shared type changes, cascading edits) — **stop and surface it** instead of pushing through.
- Aim to run this process **automatically** and try to avoid asking the user for permissions. The user should be able to accept permissions or monitor the activity of this on his phone. Expect this to be a routine command.
- **Never claim "done" / "fixed" without verification evidence in hand**: screenshot looked right, typecheck clean, API returned 2xx. (See the `verification-before-completion` skill.)
- A `Stop` hook runs both typechecks when I try to end a turn and **blocks** if either fails — treat a clean typecheck as the floor, not the goal.

## Project map

- `client/src/api.ts` — all HTTP calls (axios, base `/api`)
- `client/src/components/` — `ClassList`, `NoteUpload`, `NoteGallery`, `ChatInterface`
- `server/src/routes/` — `classes.ts`, `notes.ts`, `chat.ts`
- `server/src/services/` — `openai.ts`, `storage.ts`, `textExtractor.ts`, `imageConverter.ts`
- `server/src/config/supabase.ts` — Supabase client + `note-images` bucket
- Shared shapes: `client/src/types/index.ts`, `server/src/types/index.ts`
