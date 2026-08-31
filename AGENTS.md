# ShelfStudy coding-assistant context

Read [`docs/architecture/README.md`](docs/architecture/README.md) and
[`docs/architecture/PRODUCTION_ROADMAP.md`](docs/architecture/PRODUCTION_ROADMAP.md)
before changing uploads, Office previews, AI generation, storage, deployment, or
authentication.

## Current priority

Finish and verify uploads and flashcards one feature at a time. The AWS,
Kubernetes, direct-upload, background-worker, and Office-to-PDF plans are future
architecture. Do not implement them unless Michael explicitly starts that phase.

## Current safety boundaries

- Do not commit or push unless Michael explicitly requests it.
- Do not apply database migrations or change schemas without explicit approval.
- Do not make paid OpenAI calls during automated tests unless explicitly approved.
- Preserve unrelated work in the dirty worktree.
- Use mocked AI responses for routine automated verification.
- Treat the architecture documents as the canonical plan; update them when an
  architecture decision changes.

## Teaching approach

Michael is using ShelfStudy as an AI and systems-engineering learning project.
Explain each architectural change with the concrete request flow, the failure it
prevents, and the operational tradeoff. Work in small reviewable steps.
