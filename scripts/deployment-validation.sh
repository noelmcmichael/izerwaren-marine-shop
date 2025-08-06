#!/bin/bash

# Cloud Build Deployment Validation Script
# This script integrates deployment validation tests into the CI/CD pipeline

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration from environment or defaults
SERVICE_URL="${SERVICE_URL:-}"
ENVIRONMENT="${ENVIRONMENT:-staging}"
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-izerwaren-frontend}"
VALIDATION_TIMEOUT="${VALIDATION_TIMEOUT:-600}"
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK:-}"

echo -e "${BLUE}🚀 Cloud Build Deployment Validation${NC}"
echo -e "${BLUE}=====================================${NC}"
echo "Service URL: $SERVICE_URL"
echo "Environment: $ENVIRONMENT"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Timeout: $VALIDATION_TIMEOUT seconds"
echo ""

# Function to wait for service to be ready
wait_for_service() {
    local service_url="$1"
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for service to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt/$max_attempts: Checking service availability..."
        
        if curl -sSf "$service_url/api/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Service is ready!${NC}"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}❌ Service did not become ready within timeout${NC}"
            return 1
        fi
        
        sleep 10
        attempt=$((attempt + 1))
    done
}

# Function to determine service URL if not provided
determine_service_url() {
    if [ -n "$SERVICE_URL" ]; then
        echo "$SERVICE_URL"
        return 0
    fi
    
    if [ -z "$PROJECT_ID" ] || [ -z "$REGION" ] || [ -z "$SERVICE_NAME" ]; then
        echo -e "${RED}❌ SERVICE_URL not provided and cannot determine from PROJECT_ID/REGION/SERVICE_NAME${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🔍 Determining service URL from Cloud Run metadata...${NC}"
    
    # Get service URL from Cloud Run
    local service_url
    service_url=$(gcloud run services describe "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --format="value(status.url)" 2>/dev/null || echo "")
    
    if [ -z "$service_url" ]; then
        echo -e "${RED}❌ Could not determine service URL from Cloud Run${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Determined service URL: $service_url${NC}"
    echo "$service_url"
}

# Function to run validation tests
run_validation_tests() {
    local service_url="$1"
    local test_type="${2:-critical}"
    
    echo -e "${YELLOW}🧪 Running deployment validation tests...${NC}"
    
    # Set environment variables for tests
    export PLAYWRIGHT_BASE_URL="$service_url"
    export PLAYWRIGHT_ENV="$ENVIRONMENT"
    export PLAYWRIGHT_HEADLESS="true"
    export PLAYWRIGHT_WORKERS="2"
    
    # Navigate to frontend directory
    cd /workspace/apps/frontend || {
        echo -e "${RED}❌ Cannot find frontend directory${NC}"
        exit 1
    }
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        npm ci
    fi
    
    # Install Playwright browsers if needed
    if [ ! -d "node_modules/.playwright" ]; then
        echo -e "${YELLOW}🎭 Installing Playwright browsers...${NC}"
        npx playwright install --with-deps
    fi
    
    # Run the validation tests
    local exit_code=0
    timeout "$VALIDATION_TIMEOUT" ./scripts/run-deployment-tests.sh "$test_type" || exit_code=$?
    
    return $exit_code
}

# Function to send notification
send_notification() {
    local status="$1"
    local service_url="$2"
    local details="$3"
    
    if [ -z "$NOTIFICATION_WEBHOOK" ]; then
        return 0
    fi
    
    local color
    local emoji
    if [ "$status" = "success" ]; then
        color="good"
        emoji="✅"
    else
        color="danger"
        emoji="❌"
    fi
    
    local payload=$(cat << EOF
{
  "text": "$emoji Deployment Validation $status",
  "attachments": [
    {
      "color": "$color",
      "fields": [
        {
          "title": "Environment",
          "value": "$ENVIRONMENT",
          "short": true
        },
        {
          "title": "Service URL",
          "value": "$service_url",
          "short": true
        },
        {
          "title": "Project",
          "value": "$PROJECT_ID",
          "short": true
        },
        {
          "title": "Region",
          "value": "$REGION",
          "short": true
        }
      ],
      "text": "$details"
    }
  ]
}
EOF
    )
    
    echo -e "${YELLOW}📢 Sending notification...${NC}"
    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$NOTIFICATION_WEBHOOK" > /dev/null 2>&1 || {
        echo -e "${YELLOW}⚠️  Failed to send notification${NC}"
    }
}

# Function to handle deployment validation failure
handle_validation_failure() {
    local service_url="$1"
    local exit_code="$2"
    
    echo -e "${RED}💥 DEPLOYMENT VALIDATION FAILED${NC}"
    echo -e "${RED}Exit code: $exit_code${NC}"
    
    # Send failure notification
    send_notification "FAILED" "$service_url" "Deployment validation tests failed with exit code $exit_code. Manual investigation required."
    
    # In production, you might want to:
    # 1. Rollback the deployment
    # 2. Create an incident
    # 3. Alert the on-call team
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${RED}🚨 PRODUCTION DEPLOYMENT VALIDATION FAILED${NC}"
        echo -e "${RED}Consider immediate rollback and investigation${NC}"
        
        # Example rollback command (uncomment if you want automatic rollback)
        # echo -e "${YELLOW}🔄 Initiating automatic rollback...${NC}"
        # gcloud run services replace-traffic "$SERVICE_NAME" \
        #     --to-revisions=PREVIOUS=100 \
        #     --project="$PROJECT_ID" \
        #     --region="$REGION"
    fi
    
    exit $exit_code
}

# Function to handle deployment validation success
handle_validation_success() {
    local service_url="$1"
    
    echo -e "${GREEN}🎉 DEPLOYMENT VALIDATION SUCCESSFUL${NC}"
    echo -e "${GREEN}✅ Service is ready for production traffic${NC}"
    
    # Send success notification
    send_notification "SUCCESS" "$service_url" "Deployment validation tests passed. Service is ready for production traffic."
    
    # Update traffic routing for production
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${GREEN}🚦 Deployment validated for production traffic${NC}"
        
        # Example: Update traffic routing to 100% for the new revision
        # gcloud run services update-traffic "$SERVICE_NAME" \
        #     --to-latest \
        #     --project="$PROJECT_ID" \
        #     --region="$REGION"
    fi
}

# Main execution
main() {
    # Determine service URL
    local service_url
    service_url=$(determine_service_url)
    
    # Wait for service to be ready
    if ! wait_for_service "$service_url"; then
        handle_validation_failure "$service_url" 1
    fi
    
    # Run validation tests
    local test_type="critical"
    if [ "$ENVIRONMENT" = "production" ]; then
        test_type="all"  # More thorough testing for production
    fi
    
    local validation_exit_code=0
    if ! run_validation_tests "$service_url" "$test_type"; then
        validation_exit_code=$?
        handle_validation_failure "$service_url" $validation_exit_code
    else
        handle_validation_success "$service_url"
    fi
}

# Handle script arguments
case "$1" in
    "--help"|"-h")
        echo "Cloud Build Deployment Validation Script"
        echo ""
        echo "Environment Variables:"
        echo "  SERVICE_URL          - Direct service URL (if known)"
        echo "  ENVIRONMENT          - Environment name (staging, production)"
        echo "  PROJECT_ID           - GCP Project ID"
        echo "  REGION              - Cloud Run region"
        echo "  SERVICE_NAME        - Cloud Run service name"
        echo "  VALIDATION_TIMEOUT  - Test timeout in seconds (default: 600)"
        echo "  NOTIFICATION_WEBHOOK - Slack/Teams webhook URL for notifications"
        echo ""
        echo "Usage in Cloud Build:"
        echo "  - name: 'gcr.io/cloud-builders/docker'"
        echo "    env:"
        echo "      - 'PROJECT_ID=\$PROJECT_ID'"
        echo "      - 'ENVIRONMENT=production'"
        echo "      - 'SERVICE_NAME=izerwaren-frontend'"
        echo "    script: |"
        echo "      ./scripts/deployment-validation.sh"
        exit 0
        ;;
esac

# Check if running in Cloud Build
if [ -n "$BUILD_ID" ]; then
    echo -e "${BLUE}🔧 Running in Cloud Build environment${NC}"
    echo "Build ID: $BUILD_ID"
    echo "Project ID: $PROJECT_ID"
fi

# Run main function
main