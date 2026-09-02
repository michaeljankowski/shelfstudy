# ShelfStudy

An AI study-notes app. Organize class notes and chat with an AI that has read them —
upload photos of handwritten pages, PDFs, PowerPoints, or Word docs, and ask questions,
get explanations, or generate quizzes from the material.

## Stack

- **Client:** React 19 + Vite + TypeScript
- **Server:** Express + TypeScript
- **Database / storage:** Supabase
- **AI:** OpenAI

## Getting started

Requires a Supabase project and an OpenAI API key.

```bash
# Server
cd server
npm install
cp .env.example .env   # fill in OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm run dev             # http://localhost:3000

# Client (separate terminal)
cd client
npm install
npm run dev              # http://localhost:5173, proxies /api to :3000
```

## Project structure

```
client/     React app — components, API client, types
server/     Express API — routes, services (OpenAI, storage, text extraction), Supabase config
supabase/   Database migrations
```

## Architecture

See [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) for the current
request flows, data model, production deployment target, security boundaries,
AI evaluation strategy, scaling triggers, and an interview-ready explanation
of the design decisions.

## Scripts

| | Client | Server |
|---|---|---|
| Dev server | `npm run dev` | `npm run dev` |
| Typecheck | `npm run typecheck` | `npm run typecheck` |
| Lint | `npm run lint` | — |
| Build | `npm run build` | `npm run build` |
