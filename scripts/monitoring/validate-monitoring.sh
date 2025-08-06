#!/bin/bash

# Validate Monitoring Setup for Izerwaren Revamp 2.0
# This script validates that all monitoring components are properly configured

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

# Function to check if APIs are enabled
check_apis() {
    print_status "Checking required APIs..."
    
    local apis=(
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "cloudtrace.googleapis.com"
        "clouderrorreporting.googleapis.com"
    )
    
    local api_status=0
    
    for api in "${apis[@]}"; do
        if gcloud services list --enabled --filter="name:$api" --format="value(name)" --project="$PROJECT_ID" | grep -q "$api"; then
            print_success "$api is enabled"
        else
            print_error "$api is not enabled"
            api_status=1
        fi
    done
    
    return $api_status
}

# Function to check log-based metrics
check_log_metrics() {
    print_status "Checking log-based metrics..."
    
    local metrics=(
        "izerwaren_revamp_2_0_error_count"
        "izerwaren_revamp_2_0_404_errors"
        "izerwaren_revamp_2_0_slow_requests"
        "izerwaren_revamp_2_0_page_views"
        "izerwaren_revamp_2_0_product_views"
        "izerwaren_revamp_2_0_rfq_submissions"
    )
    
    local metric_status=0
    
    for metric in "${metrics[@]}"; do
        if gcloud logging metrics list --filter="name:$metric" --format="value(name)" --project="$PROJECT_ID" | grep -q "$metric"; then
            print_success "Log-based metric '$metric' exists"
        else
            print_error "Log-based metric '$metric' not found"
            metric_status=1
        fi
    done
    
    return $metric_status
}

# Function to check dashboards
check_dashboards() {
    print_status "Checking monitoring dashboards..."
    
    local dashboard_count
    dashboard_count=$(gcloud monitoring dashboards list --filter="displayName:('Izerwaren Revamp 2.0')" --format="value(name)" --project="$PROJECT_ID" | wc -l)
    
    if [ "$dashboard_count" -ge 2 ]; then
        print_success "Found $dashboard_count dashboard(s) for Izerwaren Revamp 2.0"
        
        # List the dashboards
        gcloud monitoring dashboards list --filter="displayName:('Izerwaren Revamp 2.0')" --format="table(displayName,name)" --project="$PROJECT_ID"
        
        return 0
    else
        print_error "Expected at least 2 dashboards, found $dashboard_count"
        return 1
    fi
}

# Function to check alerting policies
check_alerting_policies() {
    print_status "Checking alerting policies..."
    
    local policy_count
    policy_count=$(gcloud alpha monitoring policies list --filter="displayName:('Izerwaren Revamp 2.0')" --format="value(name)" --project="$PROJECT_ID" | wc -l)
    
    if [ "$policy_count" -ge 1 ]; then
        print_success "Found $policy_count alerting policy/policies for Izerwaren Revamp 2.0"
        
        # List the policies
        gcloud alpha monitoring policies list --filter="displayName:('Izerwaren Revamp 2.0')" --format="table(displayName,enabled)" --project="$PROJECT_ID"
        
        return 0
    else
        print_warning "Found $policy_count alerting policies (manual configuration may be needed)"
        return 0
    fi
}

# Function to test health endpoint (if deployed)
test_health_endpoint() {
    print_status "Testing health endpoint (if deployed)..."
    
    local health_url="https://izerwaren.mcmichaelbuild.com/api/health"
    
    if command -v curl >/dev/null 2>&1; then
        if curl -s --connect-timeout 5 "$health_url" >/dev/null 2>&1; then
            print_success "Health endpoint is accessible at $health_url"
            
            # Get detailed health info
            local health_response
            health_response=$(curl -s --connect-timeout 5 "$health_url")
            echo "Health Response: $health_response"
            
            return 0
        else
            print_warning "Health endpoint not accessible (service may not be deployed yet)"
            return 0
        fi
    else
        print_warning "curl not available, skipping health endpoint test"
        return 0
    fi
}

# Function to check log retention
check_log_retention() {
    print_status "Checking log retention configuration..."
    
    local retention_info
    retention_info=$(gcloud logging buckets describe "_Default" --location=global --format="value(retentionDays)" --project="$PROJECT_ID" 2>/dev/null)
    
    if [ "$retention_info" = "30" ]; then
        print_success "Log retention is set to 30 days"
        return 0
    else
        print_warning "Log retention is set to $retention_info days (expected 30)"
        return 0
    fi
}

# Function to generate monitoring report
generate_report() {
    print_status "Generating monitoring validation report..."
    
    local report_file="/tmp/monitoring_validation_report.txt"
    
    cat > "$report_file" << EOF
# Izerwaren Revamp 2.0 - Monitoring Validation Report
Generated: $(date)
Project: $PROJECT_ID
Service: $SERVICE_NAME

## APIs Status
$(gcloud services list --enabled --filter="name:(monitoring.googleapis.com OR logging.googleapis.com OR cloudtrace.googleapis.com OR clouderrorreporting.googleapis.com)" --format="table(name,title)" --project="$PROJECT_ID")

## Log-based Metrics
$(gcloud logging metrics list --filter="name:(izerwaren_revamp_2_0)" --format="table(name,description)" --project="$PROJECT_ID")

## Dashboards
$(gcloud monitoring dashboards list --filter="displayName:('Izerwaren Revamp 2.0')" --format="table(displayName,name)" --project="$PROJECT_ID")

## Alerting Policies  
$(gcloud alpha monitoring policies list --filter="displayName:('Izerwaren Revamp 2.0')" --format="table(displayName,enabled)" --project="$PROJECT_ID")

## Log Retention
Retention Period: $(gcloud logging buckets describe "_Default" --location=global --format="value(retentionDays)" --project="$PROJECT_ID" 2>/dev/null || echo "Not configured") days

## Next Steps
1. Deploy the application to start generating metrics
2. Configure notification channels in Cloud Console
3. Test alerting by triggering conditions
4. Set up uptime checks manually in Cloud Console
5. Monitor dashboards for data flow

## Important URLs
- Cloud Monitoring: https://console.cloud.google.com/monitoring
- Dashboards: https://console.cloud.google.com/monitoring/dashboards
- Alerting: https://console.cloud.google.com/monitoring/alerting
- Logs Explorer: https://console.cloud.google.com/logs/query
- Health Endpoint: https://izerwaren.mcmichaelbuild.com/api/health
EOF
    
    echo "Report saved to: $report_file"
    cat "$report_file"
}

# Main validation function
main() {
    print_status "Starting monitoring validation for Izerwaren Revamp 2.0..."
    echo ""
    
    local overall_status=0
    
    # Run all checks
    check_apis || overall_status=1
    echo ""
    
    check_log_metrics || overall_status=1
    echo ""
    
    check_dashboards || overall_status=1
    echo ""
    
    check_alerting_policies || overall_status=1
    echo ""
    
    check_log_retention || overall_status=1
    echo ""
    
    test_health_endpoint || overall_status=1
    echo ""
    
    # Generate report
    generate_report
    echo ""
    
    if [ $overall_status -eq 0 ]; then
        print_success "Monitoring validation completed successfully!"
        print_status "All monitoring components are properly configured."
    else
        print_warning "Monitoring validation completed with some issues."
        print_status "Check the output above for details on what needs attention."
    fi
    
    print_status "Next steps:"
    echo "  1. Deploy the application to start generating metrics"
    echo "  2. Configure notification channels in Cloud Console"
    echo "  3. Test alerting by triggering conditions"
    echo "  4. Monitor dashboards for data flow"
    
    return $overall_status
}

# Run main function
main "$@"