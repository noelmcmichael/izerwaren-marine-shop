#!/bin/bash

# Blue-Green Traffic Splitting Script for Izerwaren Revamp 2.0
# Gradually migrates traffic from current revision to new revision

set -euo pipefail

# Configuration
SERVICE_NAME="izerwaren-revamp-2-0-web"
REGION="us-central1"
HEALTH_CHECK_URL="https://izerwaren.mcmichaelbuild.com/api/health/readiness"
HEALTH_CHECK_RETRIES=3
HEALTH_CHECK_TIMEOUT=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if gcloud is authenticated
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        error "No active gcloud authentication. Please run 'gcloud auth login'"
        exit 1
    fi
}

# Health check function
health_check() {
    local url="$1"
    local retries="$2"
    local timeout="$3"
    
    for i in $(seq 1 "$retries"); do
        log "Health check attempt $i/$retries for $url"
        
        if curl -f -s --max-time "$timeout" "$url" > /dev/null 2>&1; then
            success "Health check passed"
            return 0
        else
            warning "Health check failed (attempt $i/$retries)"
            if [ "$i" -lt "$retries" ]; then
                sleep 5
            fi
        fi
    done
    
    error "Health check failed after $retries attempts"
    return 1
}

# Get current traffic distribution
get_current_traffic() {
    gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --format="value(status.traffic[].percent,status.traffic[].revisionName)" \
        | paste - -
}

# Set traffic distribution
set_traffic() {
    local new_percent="$1"
    local new_revision="$2"
    local current_revision="$3"
    local current_percent=$((100 - new_percent))
    
    log "Setting traffic: $new_revision=$new_percent%, $current_revision=$current_percent%"
    
    gcloud run services update-traffic "$SERVICE_NAME" \
        --region="$REGION" \
        --to-revisions="$new_revision=$new_percent,$current_revision=$current_percent" \
        --quiet
}

# Main traffic migration function
migrate_traffic() {
    local target_revision="$1"
    
    # Get current traffic state
    log "Getting current traffic distribution..."
    local traffic_info
    traffic_info=$(get_current_traffic)
    
    # Parse current revision (assuming the one with 100% traffic)
    local current_revision
    current_revision=$(echo "$traffic_info" | grep "100" | awk '{print $2}' | head -1)
    
    if [ -z "$current_revision" ]; then
        error "Could not determine current revision with 100% traffic"
        exit 1
    fi
    
    log "Current revision: $current_revision"
    log "Target revision: $target_revision"
    
    if [ "$current_revision" = "$target_revision" ]; then
        warning "Target revision is already receiving 100% traffic"
        exit 0
    fi
    
    # Traffic migration stages: 10% -> 25% -> 50% -> 75% -> 100%
    local stages=(10 25 50 75 100)
    
    for stage in "${stages[@]}"; do
        log "Migrating to $stage% traffic for revision $target_revision"
        
        # Set traffic distribution
        set_traffic "$stage" "$target_revision" "$current_revision"
        
        # Wait for traffic to settle
        sleep 10
        
        # Perform health check
        if ! health_check "$HEALTH_CHECK_URL" "$HEALTH_CHECK_RETRIES" "$HEALTH_CHECK_TIMEOUT"; then
            error "Health check failed at $stage% traffic. Rolling back..."
            set_traffic 0 "$target_revision" "$current_revision"
            exit 1
        fi
        
        # Wait before next stage (except for final stage)
        if [ "$stage" -ne 100 ]; then
            log "Traffic migration to $stage% successful. Waiting 30 seconds before next stage..."
            sleep 30
        fi
    done
    
    success "Traffic migration completed successfully! $target_revision is now receiving 100% traffic"
}

# Rollback function
rollback() {
    local target_revision="$1"
    
    log "Rolling back to revision: $target_revision"
    
    gcloud run services update-traffic "$SERVICE_NAME" \
        --region="$REGION" \
        --to-latest=0 \
        --to-revisions="$target_revision=100" \
        --quiet
    
    success "Rollback completed to revision: $target_revision"
}

# Usage function
usage() {
    echo "Usage: $0 [migrate|rollback] <revision-name>"
    echo ""
    echo "Commands:"
    echo "  migrate <revision>  - Gradually migrate traffic to specified revision"
    echo "  rollback <revision> - Immediately rollback to specified revision"
    echo ""
    echo "Examples:"
    echo "  $0 migrate izerwaren-revamp-2-0-web-00001-abc"
    echo "  $0 rollback izerwaren-revamp-2-0-web-00002-def"
    exit 1
}

# Main script logic
main() {
    if [ $# -ne 2 ]; then
        usage
    fi
    
    local command="$1"
    local revision="$2"
    
    check_auth
    
    case "$command" in
        migrate)
            migrate_traffic "$revision"
            ;;
        rollback)
            rollback "$revision"
            ;;
        *)
            usage
            ;;
    esac
}

# Run main function
main "$@"