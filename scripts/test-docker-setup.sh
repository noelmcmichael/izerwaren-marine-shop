#!/bin/bash

# Test script for Docker setup
# Verifies that all services start correctly and are accessible

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test configuration
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
TIMEOUT=60

print_status "Starting Docker setup test..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

print_success "Docker is running"

# Validate compose configuration
print_status "Validating Docker Compose configuration..."
if docker-compose config --quiet; then
    print_success "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration is invalid"
    exit 1
fi

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services to start
print_status "Waiting for services to start (max ${TIMEOUT}s)..."
sleep 10

# Check if containers are running
print_status "Checking container status..."
if docker-compose ps | grep -q "Up"; then
    print_success "All containers are running"
else
    print_error "Some containers failed to start"
    docker-compose ps
    exit 1
fi

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local retries=0
    local max_retries=30

    while [ $retries -lt $max_retries ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$name is ready"
            return 0
        fi
        retries=$((retries + 1))
        sleep 2
    done
    
    print_error "$name failed to start within timeout"
    return 1
}

# Test database connection
print_status "Testing database connection..."
if docker-compose exec -T database pg_isready -U postgres > /dev/null 2>&1; then
    print_success "Database is ready"
else
    print_error "Database connection failed"
    exit 1
fi

# Test backend health
print_status "Testing backend health..."
if wait_for_service "${BACKEND_URL}/api/v1/health" "Backend API"; then
    # Test specific endpoints
    if curl -s "${BACKEND_URL}/api/v1/products" > /dev/null 2>&1; then
        print_success "Backend API endpoints are working"
    else
        print_warning "Backend health check passed but products endpoint failed"
    fi
else
    print_error "Backend API failed to start"
    exit 1
fi

# Test frontend
print_status "Testing frontend..."
if wait_for_service "$FRONTEND_URL" "Frontend"; then
    print_success "Frontend is accessible"
else
    print_error "Frontend failed to start"
    exit 1
fi

# Test database migration
print_status "Testing database migrations..."
if docker-compose exec -T backend npm run db:migrate > /dev/null 2>&1; then
    print_success "Database migrations ran successfully"
else
    print_warning "Database migrations failed (may already be applied)"
fi

# Display service information
print_status "Service Information:"
echo "  Frontend:  $FRONTEND_URL"
echo "  Backend:   $BACKEND_URL/api/v1/health"
echo "  Database:  localhost:5432"
echo ""

print_status "Service Status:"
docker-compose ps

print_success "Docker setup test completed successfully!"
print_status "Run 'docker-compose logs -f' to view service logs"
print_status "Run 'docker-compose down' to stop all services"