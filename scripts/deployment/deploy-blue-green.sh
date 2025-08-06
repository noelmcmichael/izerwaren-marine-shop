#!/bin/bash

# Blue-Green Deployment Script for Izerwaren Revamp 2.0
# Orchestrates the entire blue-green deployment process

set -euo pipefail

# Configuration
SERVICE_NAME="izerwaren-revamp-2-0-web"
REGION="us-central1"
PROJECT_ID="noelmc"
ARTIFACT_REGISTRY="us-central1-docker.pkg.dev/${PROJECT_ID}/izerwaren-revamp-2-0"
SERVICE_ACCOUNT="izerwaren-revamp-2-0-run@${PROJECT_ID}.iam.gserviceaccount.com"
VPC_CONNECTOR="izerwaren-revamp-2-0-vpc"
DOMAIN="izerwaren.mcmichaelbuild.com"

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEALTH_CHECK_SCRIPT="$SCRIPT_DIR/health-check.sh"
TRAFFIC_SPLIT_SCRIPT="$SCRIPT_DIR/traffic-split.sh"

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

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check gcloud auth
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        error "No active gcloud authentication. Please run 'gcloud auth login'"
        exit 1
    fi
    
    # Check required scripts
    if [ ! -f "$HEALTH_CHECK_SCRIPT" ]; then
        error "Health check script not found: $HEALTH_CHECK_SCRIPT"
        exit 1
    fi
    
    if [ ! -f "$TRAFFIC_SPLIT_SCRIPT" ]; then
        error "Traffic split script not found: $TRAFFIC_SPLIT_SCRIPT"
        exit 1
    fi
    
    # Check Docker authentication
    if ! gcloud auth configure-docker us-central1-docker.pkg.dev --quiet; then
        error "Failed to configure Docker authentication"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Build and push container image
build_and_push() {
    local tag="$1"
    local image_name="$ARTIFACT_REGISTRY/izerwaren-revamp-2-0-web:$tag"
    
    log "Building container image: $image_name"
    
    # Build the Docker image
    if ! docker build -t "$image_name" .; then
        error "Docker build failed"
        exit 1
    fi
    
    # Push to Artifact Registry
    log "Pushing image to Artifact Registry..."
    if ! docker push "$image_name"; then
        error "Docker push failed"
        exit 1
    fi
    
    success "Container image built and pushed: $image_name"
    echo "$image_name"
}

# Deploy new revision with zero traffic
deploy_new_revision() {
    local image_url="$1"
    local revision_suffix="$2"
    
    log "Deploying new revision with zero traffic..."
    
    local revision_name="${SERVICE_NAME}-${revision_suffix}"
    
    # Deploy the new revision with --no-traffic
    gcloud run deploy "$SERVICE_NAME" \
        --image="$image_url" \
        --region="$REGION" \
        --service-account="$SERVICE_ACCOUNT" \
        --vpc-connector="$VPC_CONNECTOR" \
        --vpc-egress=all-traffic \
        --memory=4Gi \
        --cpu=2 \
        --min-instances=1 \
        --max-instances=10 \
        --timeout=300 \
        --port=3000 \
        --revision-suffix="$revision_suffix" \
        --no-traffic \
        --set-env-vars="NEXT_PUBLIC_ENVIRONMENT=production" \
        --set-secrets="DATABASE_URL=izerwaren-revamp-2-0-db-url:latest,NEXTAUTH_SECRET=izerwaren-revamp-2-0-nextauth-secret:latest" \
        --quiet
    
    success "New revision deployed: $revision_name"
    echo "$revision_name"
}

# Get revision URL for testing
get_revision_url() {
    local revision_name="$1"
    
    gcloud run revisions describe "$revision_name" \
        --region="$REGION" \
        --format="value(status.url)"
}

# Test new revision
test_new_revision() {
    local revision_name="$1"
    
    log "Testing new revision: $revision_name"
    
    # Get the direct revision URL
    local revision_url
    revision_url=$(get_revision_url "$revision_name")
    
    if [ -z "$revision_url" ]; then
        error "Could not get revision URL for $revision_name"
        exit 1
    fi
    
    log "Revision URL: $revision_url"
    
    # Test the revision health checks
    if ! "$HEALTH_CHECK_SCRIPT" revision "$revision_url"; then
        error "Health checks failed for new revision"
        exit 1
    fi
    
    success "New revision health checks passed"
}

# Perform blue-green traffic migration
migrate_traffic() {
    local new_revision="$1"
    
    log "Starting traffic migration to: $new_revision"
    
    if ! "$TRAFFIC_SPLIT_SCRIPT" migrate "$new_revision"; then
        error "Traffic migration failed"
        exit 1
    fi
    
    success "Traffic migration completed successfully"
}

# Cleanup old revisions
cleanup_old_revisions() {
    log "Cleaning up old revisions (keeping last 5)..."
    
    # Get all revisions sorted by creation time
    local revisions
    revisions=$(gcloud run revisions list \
        --service="$SERVICE_NAME" \
        --region="$REGION" \
        --format="value(metadata.name)" \
        --sort-by="metadata.creationTimestamp" \
        --limit=100)
    
    # Convert to array and keep only old revisions (skip last 5)
    local revision_array=($revisions)
    local total_revisions=${#revision_array[@]}
    local revisions_to_keep=5
    
    if [ "$total_revisions" -gt "$revisions_to_keep" ]; then
        local revisions_to_delete=$((total_revisions - revisions_to_keep))
        
        for i in $(seq 0 $((revisions_to_delete - 1))); do
            local revision_to_delete="${revision_array[$i]}"
            log "Deleting old revision: $revision_to_delete"
            
            gcloud run revisions delete "$revision_to_delete" \
                --region="$REGION" \
                --quiet
        done
        
        success "Cleaned up $revisions_to_delete old revision(s)"
    else
        log "No old revisions to clean up (total: $total_revisions)"
    fi
}

# Post-deployment verification
post_deployment_verification() {
    log "Performing post-deployment verification..."
    
    # Test the production domain
    if ! "$HEALTH_CHECK_SCRIPT" test "$DOMAIN"; then
        error "Post-deployment health checks failed"
        exit 1
    fi
    
    # Generate health report
    log "Generating health report..."
    "$HEALTH_CHECK_SCRIPT" report "$DOMAIN"
    
    success "Post-deployment verification completed"
}

# Usage function
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -t, --tag TAG          Container image tag (default: timestamp-commit)"
    echo "  -s, --suffix SUFFIX    Revision suffix (default: generated from tag)"
    echo "  --skip-build          Skip building new container image"
    echo "  --skip-cleanup        Skip cleaning up old revisions"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy with auto-generated tag"
    echo "  $0 --tag v1.2.3              # Deploy with specific tag"
    echo "  $0 --skip-build --tag latest # Deploy existing image without building"
    exit 1
}

# Main deployment function
main() {
    local image_tag=""
    local revision_suffix=""
    local skip_build=false
    local skip_cleanup=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--tag)
                image_tag="$2"
                shift 2
                ;;
            -s|--suffix)
                revision_suffix="$2"
                shift 2
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-cleanup)
                skip_cleanup=true
                shift
                ;;
            -h|--help)
                usage
                ;;
            *)
                error "Unknown option: $1"
                usage
                ;;
        esac
    done
    
    # Generate default tag if not provided
    if [ -z "$image_tag" ]; then
        local timestamp=$(date +%Y%m%d-%H%M%S)
        local commit_sha=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        image_tag="$timestamp-$commit_sha"
    fi
    
    # Generate revision suffix if not provided
    if [ -z "$revision_suffix" ]; then
        revision_suffix=$(echo "$image_tag" | tr '.' '-' | tr ':' '-')
    fi
    
    log "Starting blue-green deployment..."
    log "Image tag: $image_tag"
    log "Revision suffix: $revision_suffix"
    
    # Step 1: Check prerequisites
    check_prerequisites
    
    # Step 2: Build and push image (unless skipped)
    local image_url
    if [ "$skip_build" = true ]; then
        image_url="$ARTIFACT_REGISTRY/izerwaren-revamp-2-0-web:$image_tag"
        log "Skipping build, using existing image: $image_url"
    else
        image_url=$(build_and_push "$image_tag")
    fi
    
    # Step 3: Deploy new revision with zero traffic
    local new_revision
    new_revision=$(deploy_new_revision "$image_url" "$revision_suffix")
    
    # Step 4: Test new revision
    test_new_revision "$new_revision"
    
    # Step 5: Migrate traffic gradually
    migrate_traffic "$new_revision"
    
    # Step 6: Post-deployment verification
    post_deployment_verification
    
    # Step 7: Cleanup old revisions (unless skipped)
    if [ "$skip_cleanup" = true ]; then
        log "Skipping cleanup of old revisions"
    else
        cleanup_old_revisions
    fi
    
    success "Blue-green deployment completed successfully!"
    log "New revision $new_revision is now receiving 100% traffic"
    log "Service URL: https://$DOMAIN"
}

# Ensure we're in the project root
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# Run main function
main "$@"