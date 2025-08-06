#!/bin/bash

# Health Check Validation Script for Blue-Green Deployment
# Validates all health check endpoints before traffic migration

set -euo pipefail

# Configuration
DOMAIN="izerwaren.mcmichaelbuild.com"
HEALTH_ENDPOINTS=(
    "/api/health"
    "/api/health/database" 
    "/api/health/readiness"
)
TIMEOUT=30
RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Test a single health endpoint
test_endpoint() {
    local url="$1"
    local retries="$2"
    local timeout="$3"
    
    log "Testing endpoint: $url"
    
    for i in $(seq 1 "$retries"); do
        local start_time=$(date +%s%3N)
        
        if response=$(curl -f -s --max-time "$timeout" "$url" 2>/dev/null); then
            local end_time=$(date +%s%3N)
            local response_time=$((end_time - start_time))
            
            # Parse JSON response if possible
            if echo "$response" | jq . >/dev/null 2>&1; then
                local status=$(echo "$response" | jq -r '.status // "unknown"')
                local service=$(echo "$response" | jq -r '.service // "general"')
                
                if [ "$status" = "healthy" ] || [ "$status" = "ready" ]; then
                    success "✓ $service health check passed (${response_time}ms)"
                    return 0
                else
                    warning "✗ $service health check returned status: $status"
                fi
            else
                success "✓ Endpoint responded successfully (${response_time}ms)"
                return 0
            fi
        else
            warning "✗ Health check failed (attempt $i/$retries)"
        fi
        
        if [ "$i" -lt "$retries" ]; then
            sleep 2
        fi
    done
    
    error "✗ Health check failed after $retries attempts"
    return 1
}

# Test all health endpoints
test_all_endpoints() {
    local protocol="$1"
    local domain="$2"
    local failed_checks=0
    
    log "Testing all health endpoints for $protocol://$domain"
    echo ""
    
    for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
        local url="$protocol://$domain$endpoint"
        
        if ! test_endpoint "$url" "$RETRIES" "$TIMEOUT"; then
            ((failed_checks++))
        fi
        echo ""
    done
    
    if [ "$failed_checks" -eq 0 ]; then
        success "All health checks passed! Service is ready for traffic."
        return 0
    else
        error "$failed_checks health check(s) failed. Service is not ready for traffic."
        return 1
    fi
}

# Test specific revision URL
test_revision() {
    local revision_url="$1"
    
    log "Testing specific revision: $revision_url"
    
    # Extract the base URL for health checks
    local base_url
    if [[ "$revision_url" =~ ^https?:// ]]; then
        base_url="$revision_url"
    else
        base_url="https://$revision_url"
    fi
    
    local failed_checks=0
    
    for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
        local url="$base_url$endpoint"
        
        if ! test_endpoint "$url" "$RETRIES" "$TIMEOUT"; then
            ((failed_checks++))
        fi
    done
    
    if [ "$failed_checks" -eq 0 ]; then
        success "Revision health checks passed!"
        return 0
    else
        error "Revision health checks failed!"
        return 1
    fi
}

# Comprehensive health check report
health_report() {
    local domain="$1"
    
    log "Generating comprehensive health report for $domain"
    echo ""
    
    # Test HTTPS endpoints
    if test_all_endpoints "https" "$domain"; then
        echo ""
        log "HTTPS health checks: PASSED ✓"
    else
        echo ""
        warning "HTTPS health checks: FAILED ✗"
    fi
    
    echo ""
    log "=== Health Check Summary ==="
    
    # Get detailed health status
    local health_url="https://$domain/api/health"
    if response=$(curl -f -s "$health_url" 2>/dev/null); then
        echo "$response" | jq . 2>/dev/null || echo "$response"
    else
        error "Could not retrieve detailed health status"
    fi
}

# Usage function
usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  test                    - Test all health endpoints for default domain"
    echo "  test <domain>          - Test all health endpoints for specified domain"
    echo "  revision <revision-url> - Test health endpoints for specific revision"
    echo "  report                 - Generate comprehensive health report"
    echo "  report <domain>        - Generate health report for specified domain"
    echo ""
    echo "Examples:"
    echo "  $0 test"
    echo "  $0 test staging.izerwaren.mcmichaelbuild.com"
    echo "  $0 revision https://izerwaren-revamp-2-0-web-abc123-591834531941.us-central1.run.app"
    echo "  $0 report"
    exit 1
}

# Main script logic
main() {
    case "${1:-}" in
        test)
            if [ $# -eq 1 ]; then
                test_all_endpoints "https" "$DOMAIN"
            elif [ $# -eq 2 ]; then
                test_all_endpoints "https" "$2"
            else
                usage
            fi
            ;;
        revision)
            if [ $# -eq 2 ]; then
                test_revision "$2"
            else
                usage
            fi
            ;;
        report)
            if [ $# -eq 1 ]; then
                health_report "$DOMAIN"
            elif [ $# -eq 2 ]; then
                health_report "$2"
            else
                usage
            fi
            ;;
        *)
            usage
            ;;
    esac
}

# Check if jq is available for JSON parsing
if ! command -v jq &> /dev/null; then
    warning "jq not found. JSON parsing will be limited."
fi

# Run main function
main "$@"