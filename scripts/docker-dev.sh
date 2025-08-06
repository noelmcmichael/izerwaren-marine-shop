#!/bin/bash

# Docker Development Helper Script
# Provides convenient commands for Docker-based development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
}

# Display help
show_help() {
    echo "Docker Development Helper Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start all development services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Show service status"
    echo "  logs        Show logs for all services"
    echo "  logs [svc]  Show logs for specific service"
    echo "  shell [svc] Open shell in service container"
    echo "  db          Open database shell"
    echo "  migrate     Run database migrations"
    echo "  seed        Seed database with initial data"
    echo "  reset       Reset database (destructive)"
    echo "  build       Rebuild all images"
    echo "  clean       Clean up containers and volumes"
    echo "  test        Run tests in containers"
    echo "  tools       Start additional tools (pgadmin)"
    echo "  health      Check service health"
    echo ""
}

# Start services
start_services() {
    print_status "Starting Izerwaren development environment..."
    check_docker
    
    docker-compose up -d
    
    print_status "Waiting for services to be healthy..."
    sleep 10
    
    if docker-compose ps | grep -q "Up"; then
        print_success "Development environment started successfully!"
        print_status "Services available at:"
        echo "  Frontend:  http://localhost:3000"
        echo "  Backend:   http://localhost:3001"
        echo "  Database:  localhost:5432"
        echo ""
        print_status "Run '$0 logs' to view service logs"
    else
        print_error "Some services failed to start. Check logs with '$0 logs'"
        exit 1
    fi
}

# Stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped"
}

# Restart services
restart_services() {
    print_status "Restarting all services..."
    docker-compose restart
    print_success "All services restarted"
}

# Show service status
show_status() {
    print_status "Service status:"
    docker-compose ps
}

# Show logs
show_logs() {
    if [ -n "$2" ]; then
        print_status "Showing logs for $2..."
        docker-compose logs -f "$2"
    else
        print_status "Showing logs for all services..."
        docker-compose logs -f
    fi
}

# Open shell in service
open_shell() {
    if [ -z "$2" ]; then
        print_error "Please specify a service: frontend, backend, or database"
        exit 1
    fi
    
    print_status "Opening shell in $2 container..."
    docker-compose exec "$2" sh
}

# Open database shell
open_db_shell() {
    print_status "Opening PostgreSQL shell..."
    docker-compose exec database psql -U postgres -d izerwaren_dev
}

# Run migrations
run_migrations() {
    print_status "Running database migrations..."
    docker-compose exec backend npm run db:migrate
    print_success "Migrations completed"
}

# Seed database
seed_database() {
    print_status "Seeding database..."
    docker-compose exec backend npm run db:seed
    print_success "Database seeded"
}

# Reset database
reset_database() {
    print_warning "This will destroy all database data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        docker-compose down
        docker volume rm izerwaren_postgres_data 2>/dev/null || true
        docker-compose up -d database
        sleep 5
        run_migrations
        seed_database
        print_success "Database reset completed"
    else
        print_status "Database reset cancelled"
    fi
}

# Build images
build_images() {
    print_status "Building all Docker images..."
    docker-compose build --no-cache
    print_success "Images built successfully"
}

# Clean up
clean_up() {
    print_warning "This will remove all containers, images, and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up Docker resources..."
        docker-compose down -v --rmi all
        docker system prune -f
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Run tests
run_tests() {
    print_status "Running tests in containers..."
    docker-compose exec backend npm test
    docker-compose exec frontend npm test
    print_success "Tests completed"
}

# Start tools
start_tools() {
    print_status "Starting additional tools..."
    docker-compose --profile tools up -d pgadmin
    print_success "PgAdmin available at http://localhost:8080"
    echo "  Email: admin@izerwaren.local"
    echo "  Password: admin123"
}

# Check health
check_health() {
    print_status "Checking service health..."
    
    # Check frontend
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Frontend: Healthy"
    else
        print_error "Frontend: Unhealthy"
    fi
    
    # Check backend
    if curl -s http://localhost:3001/api/v1/health > /dev/null; then
        print_success "Backend: Healthy"
    else
        print_error "Backend: Unhealthy"
    fi
    
    # Check database
    if docker-compose exec -T database pg_isready -U postgres > /dev/null; then
        print_success "Database: Healthy"
    else
        print_error "Database: Unhealthy"
    fi
}

# Main command handling
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    shell)
        open_shell "$@"
        ;;
    db)
        open_db_shell
        ;;
    migrate)
        run_migrations
        ;;
    seed)
        seed_database
        ;;
    reset)
        reset_database
        ;;
    build)
        build_images
        ;;
    clean)
        clean_up
        ;;
    test)
        run_tests
        ;;
    tools)
        start_tools
        ;;
    health)
        check_health
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac