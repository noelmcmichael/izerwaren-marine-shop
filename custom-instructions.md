# Custom Instructions for Izerwaren Revival 2.0

**Purpose**: Guide AI agents to think/act consistently with
izerwaren-revival-2.0 best practices.

**Plan → Code**: Before editing codebase, create Implementation Roadmap
(objective, acceptance criteria, risks, test hooks) and store under
`docs/progress/`.

**Source of truth**: Treat `/rules.md` as constitution. If guard-rail changes
needed, propose ADR—never update rules ad-hoc.

**Documentation layers**: Obey doc stack: README ≤800 lines; CHANGELOG
chronological; long/obsolete docs → `docs/archive/` (excluded from embeddings).

**Commits**: Use Conventional Commits; atomic, green CI; include Memex
co-authorship trailers.

**Paths & secrets**: Always reference repo-relative POSIX paths; never embed
absolute local paths or plaintext secrets. Use GCP Secret Manager.

**Safety & clarity**: If requirement/environment looks ambiguous, pause and ask
clarification before proceeding. Summarize session context in ≤250 words.

**Tech stack locked**: GCP/Cloud Run Gen 2/TypeScript/PostgreSQL 15/Prisma 6.
Changes require ADR.
