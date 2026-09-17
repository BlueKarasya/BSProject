# Meeting Workspace Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent work and review. Execute without additional confirmation; the user approved the design and requested implementation.

**Goal:** Deliver a runnable first release of the meeting platform, with truthful demo mode, paired audio/TXT intake, transcript evidence, editable minutes and proposal drafts, and Supabase/OpenAI integration boundaries.

**Architecture:** Next.js/TypeScript application with domain validation independent of UI. Supabase authenticated persistence and private Storage in connected mode; clearly labeled browser-local demo when no configuration is available. OpenAI runs exclusively on authenticated server routes. No fake API connection or fake successful processing.

**Tech Stack:** Next.js, React, TypeScript, Supabase client, OpenAI SDK, Zod, Vitest, Lucide icons.

**Spec:** Vercel_Supabase_MCP_기반_플랫폼_개발설계서.md and existing detailed requirements.

## Constraints

- Preserve all user documents. No existing repository/code exists; work in this project folder.
- No secret collection in chat, paid API calls, external deployment, or cloud changes without configured credentials.
- Audio+TXT uses TXT; no implicit external audio transmission. No invented speakers/times.
- Never show local samples as real GPT output; connected mode must not fall back to demo data.
- Cloud RLS and Storage policies, request auth, input limits, and origin checks are mandatory.
- Full original specification is a multi-stage program; record implementation status explicitly. Missing cloud account and local connector must be visible rather than simulated as operational.

## Task 1 — Domain and project foundation

Files: package.json, tsconfig.json, src/lib/domain.ts, src/lib/transcript.ts, tests/domain.test.ts.
- [ ] Write failing tests for TXT parsing, duplicate/oversize input, missing timestamps, bundle readiness, evidence validation, approval invalidation.
- [ ] Run `npm test`; implement the smallest real behavior and rerun.
- [ ] Provide stable typed models for customers, meetings, segments, minutes, documents and proposals.

Interfaces: `parseTranscript(text): TranscriptSegment[]`; `validateIntake({audio,text}): string[]`; `validateEvidence(ids,segments): boolean`.

## Task 2 — Supabase foundation

Files: supabase/migrations/202609170001_initial.sql, supabase/tests/access.sql, docs/SUPABASE_SETUP.md.
- [ ] Define organizations, memberships, customers, meetings, assets, jobs and versioned documents.
- [ ] Create organization-scoped RLS, private bucket policies, server-only queue claim, secure bootstrap.
- [ ] Provide executable access isolation test and setup instructions. Do not claim DB execution without a DB.

## Task 3 — Application workflow

Files: src/app, src/components, src/lib/workspace.ts, src/lib/demo.ts.
- [ ] Implement Korean dashboard, customers, meeting list/detail, paired upload dialog, editable transcript and minutes, proposals, reference documents and settings.
- [ ] Demo mode persists locally and labels all sample outputs. Connected mode requires authentication.
- [ ] Cover interactive intake, editing, source navigation, proposal approval invalidation, download and reload manually.

## Task 4 — External integration

Files: src/lib/supabase.ts, src/lib/ai.ts, src/app/api/*, .env.example, vercel.json.
- [ ] Implement Supabase auth, scoped reads/writes and direct resumable Storage uploads.
- [ ] Authenticated AI route checks owned meeting and server-loaded text; structured responses validated for source IDs.
- [ ] Model calls disabled when missing configuration; status route exposes booleans only.
- [ ] Provide queued job contract and execution path with bounded work; limit unsupported tasks explicitly.

## Task 5 — Verification and handoff

- [ ] Run unit tests, TypeScript and production build.
- [ ] Browser QA: dashboard, customer creation, intake, sources, minutes edits, proposal draft and mobile layout.
- [ ] Independent code/security review, address important findings.
- [ ] Write README with run/setup instructions and IMPLEMENTATION_STATUS.md with implemented/untested/pending distinctions.

## Execution record

- Initial environment: Windows, Node 24, npm 11. No app files, no available Supabase/Vercel/OpenAI-key MCP tools. Cloud calls not attempted.
