#!/bin/bash

# Simple Development Workflow
# One command to start development environment

set -e

echo "🛠️  Izerwaren Development Environment"
echo "======================================"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local - please configure your settings"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ]; then
    echo "🗄️  Generating Prisma client..."
    npm run db:generate
fi

# Function to start frontend only (simplified)
start_frontend() {
    echo "🚀 Starting frontend development server..."
    cd apps/frontend
    npm run dev
}

# Function to start full development (frontend + backend)
start_full() {
    echo "🚀 Starting full development environment..."
    npm run dev
}

# Check what the user wants to run
case "${1:-frontend}" in
    "frontend"|"fe"|"f")
        start_frontend
        ;;
    "full"|"all"|"both")
        start_full
        ;;
    "build")
        echo "🔨 Building for production..."
        npm run build
        ;;
    "test")
        echo "🧪 Running tests..."
        npm run test
        ;;
    *)
        echo "Usage: $0 [frontend|full|build|test]"
        echo "  frontend (default) - Start frontend only"
        echo "  full               - Start frontend + backend"
        echo "  build              - Build for production"
        echo "  test               - Run tests"
        ;;
esac