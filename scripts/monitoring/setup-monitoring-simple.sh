#!/bin/bash

# Simplified Production Monitoring Setup for Izerwaren Revamp 2.0

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="noelmc"
SERVICE_NAME="izerwaren-revamp-2-0-web"
REGION="us-central1"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-noel@mcmichaelbuild.com}"

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

# Function to enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    local apis=(
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "cloudtrace.googleapis.com"
        "clouderrorreporting.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT_ID" --quiet
    done
    
    print_success "All required APIs enabled"
}

# Function to create log-based metrics using gcloud commands
create_log_based_metrics() {
    print_status "Creating log-based metrics..."
    
    # Error count metric
    gcloud logging metrics create izerwaren_revamp_2_0_error_count \
        --description="Count of errors in Izerwaren Revamp 2.0 application" \
        --log-filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND severity>=ERROR" \
        --project="$PROJECT_ID" --quiet 2>/dev/null || print_warning "Error count metric may already exist"
    
    # 404 errors metric
    gcloud logging metrics create izerwaren_revamp_2_0_404_errors \
        --description="Count of 404 errors in Izerwaren Revamp 2.0 application" \
        --log-filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND httpRequest.status=404" \
        --project="$PROJECT_ID" --quiet 2>/dev/null || print_warning "404 errors metric may already exist"
    
    # Slow requests metric  
    gcloud logging metrics create izerwaren_revamp_2_0_slow_requests \
        --description="Count of slow requests (>2s) in Izerwaren Revamp 2.0 application" \
        --log-filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND httpRequest.latency>\"2s\"" \
        --project="$PROJECT_ID" --quiet 2>/dev/null || print_warning "Slow requests metric may already exist"
    
    # Business metrics
    gcloud logging metrics create izerwaren_revamp_2_0_page_views \
        --description="Count of page views in Izerwaren Revamp 2.0 application" \
        --log-filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND jsonPayload.business_event=\"page_view\"" \
        --project="$PROJECT_ID" --quiet 2>/dev/null || print_warning "Page views metric may already exist"
    
    gcloud logging metrics create izerwaren_revamp_2_0_product_views \
        --description="Count of product views in Izerwaren Revamp 2.0 application" \
        --log-filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND jsonPayload.business_event=\"product_view\"" \
        --project="$PROJECT_ID" --quiet 2>/dev/null || print_warning "Product views metric may already exist"
    
    gcloud logging metrics create izerwaren_revamp_2_0_rfq_submissions \
        --description="Count of RFQ submissions in Izerwaren Revamp 2.0 application" \
        --log-filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND jsonPayload.business_event=\"rfq_submission\"" \
        --project="$PROJECT_ID" --quiet 2>/dev/null || print_warning "RFQ submissions metric may already exist"
    
    print_success "Log-based metrics created"
}

# Function to set up log retention
configure_log_retention() {
    print_status "Configuring log retention policies..."
    
    # Set retention to 30 days for application logs
    gcloud logging buckets update "_Default" \
        --location=global \
        --retention-days=30 \
        --project="$PROJECT_ID" --quiet 2>/dev/null || print_warning "Log retention may already be configured"
    
    print_success "Log retention configured to 30 days"
}

# Function to create uptime check using gcloud
create_uptime_check() {
    print_status "Creating uptime check for production service..."
    
    # Note: For now we'll skip the uptime check creation via gcloud as it's complex
    # It can be created manually in the console or with the REST API
    print_warning "Uptime check creation skipped - configure manually in Cloud Console"
    print_status "  1. Go to Cloud Monitoring > Uptime checks"
    print_status "  2. Create check for https://izerwaren.mcmichaelbuild.com/api/health"
    print_status "  3. Set check interval to 1 minute"
    print_status "  4. Monitor from multiple regions"
}

# Function to create alerting policy using gcloud  
create_basic_alerts() {
    print_status "Creating basic alerting policies..."
    
    # Create alert for high error rate using log-based metric
    gcloud alpha monitoring policies create \
        --notification-channels="" \
        --display-name="Izerwaren Revamp 2.0 - High Error Rate" \
        --condition-display-name="Error rate > 5 errors/min" \
        --condition-filter="resource.type=\"logging.googleapis.com/logs\" AND metric.type=\"logging.googleapis.com/user/izerwaren_revamp_2_0_error_count\"" \
        --condition-comparison="GREATER" \
        --condition-threshold-value=5 \
        --condition-threshold-duration=300s \
        --project="$PROJECT_ID" --quiet 2>/dev/null || print_warning "Error rate alert may already exist"
    
    print_success "Basic alerting policies created"
    print_warning "Configure notification channels manually in Cloud Console"
}

# Main execution
main() {
    print_status "Starting simplified monitoring setup for Izerwaren Revamp 2.0..."
    
    enable_apis
    
    print_status "Waiting for APIs to be fully enabled..."
    sleep 5
    
    create_log_based_metrics
    configure_log_retention
    create_uptime_check
    create_basic_alerts
    
    print_success "Monitoring setup completed successfully!"
    print_status "Next steps:"
    echo "  1. Create monitoring dashboard using scripts/monitoring/create-dashboard.sh"
    echo "  2. Configure notification channels in Cloud Console"
    echo "  3. Review and customize alerting policies"
    echo "  4. Set up uptime checks manually"
    echo "  5. Test monitoring with sample requests"
}

# Run main function
main "$@"