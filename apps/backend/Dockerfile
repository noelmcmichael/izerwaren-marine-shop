# Backend Dockerfile for Express API
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/*/package*.json ./packages/*/

# Install dependencies
RUN npm ci

# Development stage
FROM base AS development

# Install tsx for TypeScript execution with hot reload
RUN npm install -g tsx

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Expose port
EXPOSE 3001

# Start in development mode with hot reload
CMD ["npm", "run", "backend:dev"]

# Production build stage
FROM base AS builder

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build the backend
RUN npm run build --workspace=@izerwaren/backend

# Production stage
FROM node:18-alpine AS production

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

USER backend

EXPOSE 3001

CMD ["node", "dist/server.js"]