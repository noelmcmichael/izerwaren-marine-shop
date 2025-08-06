# Frontend Dockerfile for Next.js application
FROM node:24-alpine AS base

# Install dependencies for native modules and Prisma
RUN apk add --no-cache libc6-compat python3 make g++ openssl openssl-dev

WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY turbo.json ./

# Create workspace structure and copy package.json files
RUN mkdir -p apps/frontend packages/database packages/shared packages/shopify-integration
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shopify-integration/package*.json ./packages/shopify-integration/

# Install dependencies for workspace
RUN npm install

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Generate Prisma client (skip if prisma schema doesn't exist)
RUN if [ -f packages/database/prisma/schema.prisma ]; then npm run db:generate; else echo "No Prisma schema found, skipping generation"; fi

# Expose port
EXPOSE 3000

# Start in development mode with hot reload
CMD ["npm", "run", "frontend:dev"]

# Production build stage
FROM base AS builder

# Build-time configuration (non-sensitive only)
ARG NODE_ENV=production
ARG NEXT_TELEMETRY_DISABLED=1
ARG NEXT_BUILD_MODE=true
ARG BUILD_VERSION
ARG BUILD_TIMESTAMP

# Copy source code
COPY . .

# Set build environment variables (no secrets)
ENV NODE_ENV=$NODE_ENV \
    NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED \
    NEXT_BUILD_MODE=$NEXT_BUILD_MODE \
    DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Note: Shopify credentials will be injected at runtime from Secret Manager
# This ensures no secrets are embedded in Docker image layers

# Generate Prisma client first
RUN npm run db:generate || echo "Prisma generate failed, continuing with build..."

# Build the frontend in production mode
RUN npm run build --workspace=@izerwaren/frontend

# Production stage
FROM node:24-alpine AS production

# Security: Install security updates and minimal dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache libc6-compat openssl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Production environment variables (non-sensitive)
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Security: Create non-root user with minimal permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

# Copy Prisma client with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Security: Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Note: All sensitive configuration (API keys, database credentials, etc.) 
# will be injected at runtime via environment variables from Secret Manager
CMD ["node", "apps/frontend/server.js"]