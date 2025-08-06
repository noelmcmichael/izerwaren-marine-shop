# Izerwaren Revival 2.0 — Project Constitution

## Immutable Baselines

These technical decisions are locked for the project lifecycle. Changes require
unanimous team consensus + formal ADR.

### Infrastructure

- **Cloud**: Google Cloud Platform only, region `us-central1`
- **Runtime**: Cloud Run Gen 2, Docker (distroless base), image ≤ 300MB
- **Language**: TypeScript (Node 18 LTS)
- **Database**: Cloud SQL PostgreSQL 15 + Prisma 6 ORM
- **Commerce**: All transactional commerce is delegated to Shopify; local code
  must never process card data

### CI/CD Pipeline

- **Build**: Cloud Build with blue/green deployment script
- **Gates**: Staging environment + >80% test coverage requirement
- **Commits**: Conventional Commits format, atomic, green CI required

### Documentation Layers

- `README.md`: Project overview, setup instructions (≤ 800 lines)
- `rules.md`: This constitution (≤ 400 lines)
- `docs/adr/`: Architectural Decision Records (numbered ADR-XXX format)
- `docs/progress/`: Implementation roadmaps, session summaries
- `docs/archive/`: Obsolete/long documentation (excluded from embeddings)

## Development Protocol

1. **Plan → Code**: Create Implementation Roadmap in `docs/progress/` before
   editing codebase
2. **Path Safety**: Use repo-relative POSIX paths only, never absolute local
   paths
3. **Clarity Gate**: If requirements/environment ambiguous, pause and ask for
   clarification

## Security Invariants

- **Secrets stored only in Secret Manager**: Never embed plaintext secrets in
  code, environment files, or configuration
- **Commerce delegation**: All payment processing handled by Shopify; local code
  never touches card data

## Amendment Process

- Minor updates: Direct edit with justification in commit message
- Major changes: Propose ADR, implement only after approval
- Baseline changes: Require unanimous team consensus + ADR amendment

---

_Last updated: 2025-01-30_
