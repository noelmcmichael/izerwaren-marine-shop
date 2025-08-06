# ADR-000: Technology Stack Baseline

## Status

Accepted

## Context

Izerwaren Revival 2.0 requires a modern, scalable B2B e-commerce platform with
zero-downtime deployments. The original izerwaren.biz needs re-platforming to
meet current performance and maintainability standards.

## Decision

We establish the following technology baseline as immutable for the project
lifecycle:

### Infrastructure

- **Cloud Provider**: Google Cloud Platform (us-central1 region)
- **Compute**: Cloud Run Gen 2 (serverless containers)
- **Container**: Docker with distroless base images (≤300MB size limit)

### Application Stack

- **Runtime**: Node.js 18 LTS
- **Language**: TypeScript (strict mode)
- **Database**: Cloud SQL PostgreSQL 15
- **ORM**: Prisma 6
- **Payment Processing**: Shopify Payments (delegated, no PCI scope)

### CI/CD

- **Build System**: Cloud Build
- **Deployment**: Blue/green strategy with staging gate
- **Quality Gate**: >80% test coverage requirement

## Consequences

- **Positive**: Standardized stack, GCP-native integration, container
  scalability
- **Negative**: Vendor lock-in to GCP, learning curve for team
- **Neutral**: Requires discipline to maintain image size limits

## Compliance

This ADR establishes the technical foundation referenced in `/rules.md`. Any
changes to these baseline decisions require unanimous team consensus and a new
ADR.

---

_Date: 2025-01-30_ _Status: Baseline Decision_
