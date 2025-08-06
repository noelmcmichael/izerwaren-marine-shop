#!/bin/bash

# Configure Production Environment Variables for Izerwaren Revamp 2.0
# This script sets up all required environment variables for the production Cloud Run service

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="noelmc"
REGION="us-central1"
SERVICE_NAME="izerwaren-revamp-2-0-web"
DOMAIN="izerwaren.mcmichaelbuild.com"

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

# Function to check if secret exists
check_secret_exists() {
    local secret_name="$1"
    if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to get secret value
get_secret_value() {
    local secret_name="$1"
    gcloud secrets versions access latest --secret="$secret_name" --project="$PROJECT_ID" 2>/dev/null
}

# Function to create secret if it doesn't exist
create_secret_if_needed() {
    local secret_name="$1"
    local secret_value="$2"
    
    if ! check_secret_exists "$secret_name"; then
        print_status "Creating secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets create "$secret_name" --data-file=- --project="$PROJECT_ID"
        print_success "Secret created: $secret_name"
    else
        print_status "Secret already exists: $secret_name"
    fi
}

# Function to setup environment variables
setup_environment_variables() {
    print_status "Setting up environment variables for $SERVICE_NAME..."
    
    # Get existing secrets
    local db_url=""
    local nextauth_secret=""
    
    if check_secret_exists "izerwaren-revamp-2-0-db-url"; then
        db_url=$(get_secret_value "izerwaren-revamp-2-0-db-url")
        print_success "Retrieved database URL from secret"
    else
        print_error "Database URL secret not found"
        return 1
    fi
    
    if check_secret_exists "izerwaren-revamp-2-0-nextauth-secret"; then
        nextauth_secret=$(get_secret_value "izerwaren-revamp-2-0-nextauth-secret")
        print_success "Retrieved NextAuth secret"
    else
        print_error "NextAuth secret not found"
        return 1
    fi
    
    # Create/update environment configuration
    print_status "Updating Cloud Run service with environment variables..."
    
    gcloud run services update "$SERVICE_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --set-env-vars="\
NODE_ENV=production,\
NEXT_PUBLIC_ENVIRONMENT=production,\
NEXTAUTH_URL=https://$DOMAIN,\
NEXT_TELEMETRY_DISABLED=1,\
NEXT_PRIVATE_STANDALONE=true,\
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=izerwaren.myshopify.com,\
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=placeholder_token,\
SHOPIFY_SHOP_DOMAIN=izerwaren.myshopify.com,\
SHOPIFY_ADMIN_ACCESS_TOKEN=placeholder_admin_token,\
FIREBASE_PROJECT_ID=izerwaren-revamp-2-0,\
NEXT_PUBLIC_FIREBASE_PROJECT_ID=izerwaren-revamp-2-0,\
NEXT_PUBLIC_FIREBASE_API_KEY=placeholder_firebase_key,\
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=placeholder_sender_id,\
NEXT_PUBLIC_FIREBASE_APP_ID=placeholder_app_id" \
        --set-secrets="\
DATABASE_URL=izerwaren-revamp-2-0-db-url:latest,\
NEXTAUTH_SECRET=izerwaren-revamp-2-0-nextauth-secret:latest"
    
    print_success "Environment variables updated successfully"
}

# Function to test service health
test_service_health() {
    print_status "Testing service health..."
    
    local service_url="https://${SERVICE_NAME}-591834531941.${REGION}.run.app"
    local max_attempts=6
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        print_status "Health check attempt $((attempt + 1))/$max_attempts"
        
        local health_response
        health_response=$(curl -s --connect-timeout 10 "$service_url/api/health" 2>/dev/null || echo "error")
        
        if [ "$health_response" != "error" ]; then
            echo "Health Response:"
            echo "$health_response" | jq . 2>/dev/null || echo "$health_response"
            
            # Check if database is healthy now
            if echo "$health_response" | jq -e '.services.database.status == "healthy"' >/dev/null 2>&1; then
                print_success "Service is healthy!"
                return 0
            elif echo "$health_response" | jq -e '.services' >/dev/null 2>&1; then
                print_warning "Service is responding but some components are unhealthy"
                return 0
            fi
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -lt $max_attempts ]; then
            print_status "Waiting 30 seconds before next attempt..."
            sleep 30
        fi
    done
    
    print_error "Service health check failed after $max_attempts attempts"
    return 1
}

# Function to test domain access
test_domain_access() {
    print_status "Testing domain access..."
    
    local max_attempts=6
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        print_status "Domain test attempt $((attempt + 1))/$max_attempts"
        
        # Test HTTPS access
        if curl -s --connect-timeout 10 "https://$DOMAIN/api/health" >/dev/null 2>&1; then
            local health_response
            health_response=$(curl -s "https://$DOMAIN/api/health")
            
            print_success "Domain is accessible via HTTPS!"
            echo "Domain Health Response:"
            echo "$health_response" | jq . 2>/dev/null || echo "$health_response"
            return 0
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -lt $max_attempts ]; then
            print_status "SSL certificate may still be provisioning. Waiting 60 seconds..."
            sleep 60
        fi
    done
    
    print_warning "HTTPS domain access not yet available (SSL still provisioning)"
    return 1
}

# Function to check deployment status
check_deployment_status() {
    print_status "Checking overall deployment status..."
    
    # Check domain mapping
    local domain_status
    domain_status=$(gcloud beta run domain-mappings list --project="$PROJECT_ID" --filter="metadata.name:$DOMAIN" --format="value(status.conditions[0].reason)" 2>/dev/null || echo "NotFound")
    
    echo ""
    echo "=== DEPLOYMENT STATUS SUMMARY ==="
    echo "Service: $SERVICE_NAME"
    echo "Domain: $DOMAIN"
    echo "Domain Status: $domain_status"
    echo ""
    
    # Check service URL
    local service_url
    service_url=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(status.url)")
    echo "Service URL: $service_url"
    
    # Check latest deployment
    local latest_revision
    latest_revision=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(status.latestReadyRevisionName)")
    echo "Latest Revision: $latest_revision"
    
    echo ""
    echo "=== NEXT STEPS ==="
    if [ "$domain_status" = "Ready" ]; then
        echo "✅ Domain is ready: https://$DOMAIN"
        echo "✅ Production deployment complete!"
    elif [ "$domain_status" = "CertificatePending" ]; then
        echo "⏳ SSL certificate is still provisioning"
        echo "   Check again in 10-15 minutes: https://$DOMAIN"
        echo "   Service is accessible via: $service_url"
    else
        echo "❌ Domain mapping issue detected"
        echo "   Please check Google Cloud Console: https://console.cloud.google.com/run/domains?project=$PROJECT_ID"
    fi
    
    echo ""
    echo "=== MONITORING URLS ==="
    echo "• Health Check: $service_url/api/health"
    echo "• Cloud Run Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
    echo "• Monitoring Dashboard: https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"
    echo "• Logs: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
}

# Main execution
main() {
    print_status "Starting production environment configuration..."
    echo ""
    
    # Setup environment variables
    if setup_environment_variables; then
        print_success "Environment variables configured successfully"
    else
        print_error "Failed to configure environment variables"
        exit 1
    fi
    
    # Wait for deployment to complete
    print_status "Waiting for service deployment to complete..."
    sleep 30
    
    # Test service health
    if test_service_health; then
        print_success "Service health check passed"
    else
        print_warning "Service health check issues detected"
    fi
    
    # Test domain access
    if test_domain_access; then
        print_success "Domain access verified"
    else
        print_warning "Domain access not yet available"
    fi
    
    # Check overall status
    check_deployment_status
    
    print_success "Production environment configuration completed!"
}

# Run main function
main "$@"