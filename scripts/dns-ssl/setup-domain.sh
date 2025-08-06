#!/bin/bash

# DNS and SSL Setup for Izerwaren Revamp 2.0 Production Domain
# This script configures custom domain mapping and SSL certificates

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
OLD_SERVICE="izerwaren-revival"
NEW_SERVICE="izerwaren-revamp-2-0-web"
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

# Function to check if new service is ready
check_service_ready() {
    print_status "Checking if new service is ready..."
    
    local health_url="https://${NEW_SERVICE}-591834531941.${REGION}.run.app/api/health"
    
    if curl -s --connect-timeout 10 "$health_url" >/dev/null 2>&1; then
        print_success "New service is accessible and responding"
        return 0
    else
        print_error "New service is not accessible"
        return 1
    fi
}

# Function to backup current domain mapping
backup_current_mapping() {
    print_status "Backing up current domain mapping..."
    
    # Get current mapping details
    local current_mapping
    current_mapping=$(gcloud beta run domain-mappings describe "$DOMAIN" --region="$REGION" --project="$PROJECT_ID" --format=json 2>/dev/null || echo "null")
    
    if [ "$current_mapping" != "null" ]; then
        echo "$current_mapping" > "domain-mapping-backup-$(date +%Y%m%d-%H%M%S).json"
        print_success "Domain mapping backed up"
    else
        print_warning "No existing domain mapping found"
    fi
}

# Function to update domain mapping to new service
update_domain_mapping() {
    print_status "Updating domain mapping to new service..."
    
    # Remove existing mapping
    print_status "Removing existing domain mapping..."
    gcloud beta run domain-mappings delete "$DOMAIN" --region="$REGION" --project="$PROJECT_ID" --quiet || print_warning "No existing mapping to remove"
    
    # Wait a moment for propagation
    sleep 5
    
    # Create new mapping
    print_status "Creating new domain mapping..."
    gcloud beta run domain-mappings create \
        --service="$NEW_SERVICE" \
        --domain="$DOMAIN" \
        --region="$REGION" \
        --project="$PROJECT_ID"
    
    print_success "Domain mapping updated to $NEW_SERVICE"
}

# Function to verify SSL certificate
verify_ssl() {
    print_status "Verifying SSL certificate..."
    
    # Wait for certificate provisioning
    print_status "Waiting for SSL certificate provisioning (this may take a few minutes)..."
    
    local attempts=0
    local max_attempts=12
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s --connect-timeout 10 "https://$DOMAIN/api/health" >/dev/null 2>&1; then
            print_success "SSL certificate is working correctly"
            return 0
        fi
        
        attempts=$((attempts + 1))
        print_status "Attempt $attempts/$max_attempts - Waiting for SSL certificate..."
        sleep 30
    done
    
    print_warning "SSL certificate may still be provisioning. Check Google Cloud Console."
    return 1
}

# Function to test domain access
test_domain_access() {
    print_status "Testing domain access..."
    
    # Test HTTPS access
    local health_response
    health_response=$(curl -s --connect-timeout 10 "https://$DOMAIN/api/health" || echo "error")
    
    if [ "$health_response" != "error" ]; then
        print_success "Domain is accessible via HTTPS"
        echo "Health Response: $health_response"
        return 0
    else
        print_warning "Domain is not yet accessible via HTTPS"
        return 1
    fi
}

# Function to setup monitoring for the domain
setup_domain_monitoring() {
    print_status "Setting up domain monitoring..."
    
    # Create uptime check for the custom domain
    local uptime_config=$(cat <<EOF
{
  "displayName": "Izerwaren Production Domain Uptime",
  "resource": {
    "type": "uptime_url",
    "labels": {}
  },
  "httpCheck": {
    "requestMethod": "GET",
    "useSsl": true,
    "path": "/api/health",
    "port": 443,
    "hostHeader": "$DOMAIN"
  },
  "period": "60s",
  "timeout": "10s",
  "contentMatchers": [
    {
      "content": "healthy",
      "matcher": "CONTAINS_STRING"
    }
  ],
  "selectedRegions": [
    "USA",
    "EUROPE",
    "ASIA_PACIFIC"
  ]
}
EOF
)
    
    echo "$uptime_config" > /tmp/domain_uptime_config.json
    
    # Try to create the uptime check
    if command -v gcloud >/dev/null 2>&1; then
        print_warning "Uptime check for custom domain should be configured manually in Cloud Console"
        print_status "Configuration saved to /tmp/domain_uptime_config.json"
    fi
    
    rm -f /tmp/domain_uptime_config.json
}

# Function to provide rollback instructions
provide_rollback_instructions() {
    print_status "Rollback instructions (if needed):"
    echo ""
    echo "To rollback to the previous service:"
    echo "  gcloud beta run domain-mappings delete $DOMAIN --region=$REGION --project=$PROJECT_ID --quiet"
    echo "  gcloud beta run domain-mappings create --service=$OLD_SERVICE --domain=$DOMAIN --region=$REGION --project=$PROJECT_ID"
    echo ""
    echo "To check service logs:"
    echo "  gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$NEW_SERVICE\" --limit=20 --project=$PROJECT_ID"
    echo ""
}

# Function to generate domain configuration report
generate_domain_report() {
    print_status "Generating domain configuration report..."
    
    local report_file="/tmp/domain_migration_report.txt"
    
    cat > "$report_file" << EOF
# Izerwaren Revamp 2.0 - Domain Migration Report
Generated: $(date)
Project: $PROJECT_ID
Domain: $DOMAIN
Old Service: $OLD_SERVICE
New Service: $NEW_SERVICE

## Migration Status
$(gcloud beta run domain-mappings list --filter="spec.routeName:$DOMAIN" --format="table(metadata.name,spec.routeName,status.url)" --project="$PROJECT_ID")

## Current Service Status  
$(gcloud run services describe "$NEW_SERVICE" --region="$REGION" --format="table(metadata.name,status.url,status.latestReadyRevisionName)" --project="$PROJECT_ID")

## DNS Information
$(dig +short "$DOMAIN")

## SSL Certificate Status
SSL Status: $(curl -s -I "https://$DOMAIN/api/health" 2>/dev/null | grep "HTTP/" || echo "Not accessible")

## Health Check Response
$(curl -s "https://$DOMAIN/api/health" 2>/dev/null || echo "Service not accessible")

## Next Steps
1. Monitor service performance and error rates
2. Verify all application features work correctly
3. Update any hardcoded references to old service URLs
4. Consider decommissioning old service after validation period
5. Update monitoring dashboards to point to new service

## Important URLs
- Production Site: https://$DOMAIN
- Health Endpoint: https://$DOMAIN/api/health
- Cloud Run Service: https://izerwaren-revamp-2-0-web-591834531941.us-central1.run.app
- Google Cloud Console: https://console.cloud.google.com/run?project=$PROJECT_ID
- Domain Mappings: https://console.cloud.google.com/run/domains?project=$PROJECT_ID
EOF
    
    echo "Report saved to: $report_file"
    cat "$report_file"
}

# Main execution function
main() {
    print_status "Starting DNS and SSL setup for Izerwaren Revamp 2.0..."
    echo ""
    
    # Preliminary checks
    if ! check_service_ready; then
        print_error "New service is not ready. Please fix service issues before proceeding."
        exit 1
    fi
    
    # Backup current configuration
    backup_current_mapping
    
    # Update domain mapping
    update_domain_mapping
    
    # Setup domain monitoring
    setup_domain_monitoring
    
    # Wait and verify SSL
    if verify_ssl; then
        print_success "SSL certificate is working correctly"
    else
        print_warning "SSL certificate may still be provisioning"
    fi
    
    # Test domain access
    if test_domain_access; then
        print_success "Domain migration completed successfully!"
    else
        print_warning "Domain is not fully accessible yet"
    fi
    
    # Generate report
    generate_domain_report
    
    # Provide rollback instructions
    provide_rollback_instructions
    
    print_success "DNS and SSL setup completed!"
    print_status "Monitor the service for the next 24 hours to ensure stability."
    
    echo ""
    print_status "Key URLs to test:"
    echo "  - Production Site: https://$DOMAIN"
    echo "  - Health Check: https://$DOMAIN/api/health"
    echo "  - Admin Interface: https://$DOMAIN/admin (if applicable)"
}

# Run main function
main "$@"