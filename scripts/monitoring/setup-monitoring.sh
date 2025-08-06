#!/bin/bash

# Production Monitoring Setup for Izerwaren Revamp 2.0
# This script sets up comprehensive monitoring, logging, and alerting for the production environment

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

# Function to check if gcloud is authenticated
check_gcloud_auth() {
    print_status "Checking gcloud authentication..."
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "Not authenticated with gcloud. Run 'gcloud auth login' first."
        exit 1
    fi
    print_success "gcloud authentication verified"
}

# Function to enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    local apis=(
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "cloudtrace.googleapis.com"
        "clouderrorreporting.googleapis.com"
        "cloudprofiler.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT_ID"
    done
    
    print_success "All required APIs enabled"
}

# Function to create notification channel
create_notification_channel() {
    print_status "Creating notification channel for email alerts..."
    
    local channel_config=$(cat <<EOF
{
  "type": "email",
  "displayName": "Izerwaren Production Email Alerts",
  "description": "Email notifications for Izerwaren Revamp 2.0 production alerts",
  "labels": {
    "email_address": "$NOTIFICATION_EMAIL"
  },
  "enabled": true
}
EOF
)
    
    echo "$channel_config" > /tmp/channel_config.json
    gcloud alpha monitoring channels create --channel-content-from-file=/tmp/channel_config.json --project="$PROJECT_ID" --quiet || true
    rm -f /tmp/channel_config.json
    print_success "Email notification channel created/verified"
}

# Function to create alerting policies
create_alerting_policies() {
    print_status "Creating alerting policies..."
    
    # High Error Rate Alert
    local error_rate_policy=$(cat <<EOF
{
  "displayName": "Izerwaren Revamp 2.0 - High Error Rate",
  "documentation": {
    "content": "Error rate for Izerwaren Revamp 2.0 service has exceeded 1% over 5 minutes",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "Error rate > 1%",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 0.01,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_MEAN",
            "groupByFields": ["resource.labels.service_name"]
          }
        ],
        "trigger": {
          "count": 1
        }
      }
    }
  ],
  "enabled": true,
  "alertStrategy": {
    "autoClose": "86400s"
  }
}
EOF
)
    
    # High Latency Alert
    local latency_policy=$(cat <<EOF
{
  "displayName": "Izerwaren Revamp 2.0 - High Latency",
  "documentation": {
    "content": "95th percentile latency for Izerwaren Revamp 2.0 service has exceeded 500ms over 5 minutes",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "95th percentile latency > 500ms",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND metric.type=\"run.googleapis.com/request_latencies\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 500,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_DELTA",
            "crossSeriesReducer": "REDUCE_PERCENTILE_95",
            "groupByFields": ["resource.labels.service_name"]
          }
        ],
        "trigger": {
          "count": 1
        }
      }
    }
  ],
  "enabled": true,
  "alertStrategy": {
    "autoClose": "86400s"
  }
}
EOF
)
    
    # High Memory Usage Alert
    local memory_policy=$(cat <<EOF
{
  "displayName": "Izerwaren Revamp 2.0 - High Memory Usage",
  "documentation": {
    "content": "Memory utilization for Izerwaren Revamp 2.0 service has exceeded 80% for 5 minutes",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "Memory utilization > 80%",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND metric.type=\"run.googleapis.com/container/memory/utilizations\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 0.8,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_MEAN",
            "crossSeriesReducer": "REDUCE_MEAN",
            "groupByFields": ["resource.labels.service_name"]
          }
        ],
        "trigger": {
          "count": 1
        }
      }
    }
  ],
  "enabled": true,
  "alertStrategy": {
    "autoClose": "86400s"
  }
}
EOF
)
    
    # Create the policies
    echo "$error_rate_policy" > /tmp/error_rate_policy.json
    echo "$latency_policy" > /tmp/latency_policy.json
    echo "$memory_policy" > /tmp/memory_policy.json
    
    gcloud alpha monitoring policies create --policy-from-file=/tmp/error_rate_policy.json --project="$PROJECT_ID" || print_warning "Error rate policy may already exist"
    gcloud alpha monitoring policies create --policy-from-file=/tmp/latency_policy.json --project="$PROJECT_ID" || print_warning "Latency policy may already exist"
    gcloud alpha monitoring policies create --policy-from-file=/tmp/memory_policy.json --project="$PROJECT_ID" || print_warning "Memory policy may already exist"
    
    # Cleanup temp files
    rm -f /tmp/error_rate_policy.json /tmp/latency_policy.json /tmp/memory_policy.json
    
    print_success "Alerting policies created"
}

# Function to create uptime check
create_uptime_check() {
    print_status "Creating uptime check for production service..."
    
    local uptime_config=$(cat <<EOF
{
  "displayName": "Izerwaren Revamp 2.0 Production Uptime",
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {}
  },
  "httpCheck": {
    "requestMethod": "GET",
    "useSsl": true,
    "path": "/api/health",
    "port": 443
  },
  "period": "60s",
  "timeout": "10s",
  "contentMatchers": [
    {
      "content": "ok",
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
    
    echo "$uptime_config" > /tmp/uptime_config.json
    gcloud monitoring uptime create --config-from-file=/tmp/uptime_config.json --project="$PROJECT_ID" || print_warning "Uptime check may already exist"
    rm -f /tmp/uptime_config.json
    
    print_success "Uptime check created"
}

# Function to configure log-based metrics
create_log_based_metrics() {
    print_status "Creating log-based metrics..."
    
    # Error count metric
    gcloud logging metrics create izerwaren_revamp_2_0_error_count \
        --description="Count of errors in Izerwaren Revamp 2.0 application" \
        --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="'$SERVICE_NAME'" AND severity>=ERROR' \
        --project="$PROJECT_ID" 2>/dev/null || print_warning "Error count metric may already exist"
    
    # 404 errors metric
    gcloud logging metrics create izerwaren_revamp_2_0_404_errors \
        --description="Count of 404 errors in Izerwaren Revamp 2.0 application" \
        --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="'$SERVICE_NAME'" AND httpRequest.status=404' \
        --project="$PROJECT_ID" 2>/dev/null || print_warning "404 errors metric may already exist"
    
    # Slow requests metric
    gcloud logging metrics create izerwaren_revamp_2_0_slow_requests \
        --description="Count of slow requests (>2s) in Izerwaren Revamp 2.0 application" \
        --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="'$SERVICE_NAME'" AND httpRequest.latency>"2s"' \
        --project="$PROJECT_ID" 2>/dev/null || print_warning "Slow requests metric may already exist"
    
    print_success "Log-based metrics created"
}

# Function to set up log retention
configure_log_retention() {
    print_status "Configuring log retention policies..."
    
    # Get the Cloud Run logs bucket
    local bucket_name="_Default"
    
    # Set retention to 30 days for application logs
    gcloud logging buckets update "$bucket_name" \
        --location=global \
        --retention-days=30 \
        --project="$PROJECT_ID" 2>/dev/null || print_warning "Log retention may already be configured"
    
    print_success "Log retention configured to 30 days"
}

# Main execution
main() {
    print_status "Starting monitoring setup for Izerwaren Revamp 2.0..."
    
    check_gcloud_auth
    enable_apis
    
    print_status "Waiting for APIs to be fully enabled..."
    sleep 10
    
    create_notification_channel
    create_alerting_policies
    create_uptime_check
    create_log_based_metrics
    configure_log_retention
    
    print_success "Monitoring setup completed successfully!"
    print_status "Next steps:"
    echo "  1. Create monitoring dashboard using scripts/monitoring/create-dashboard.sh"
    echo "  2. Configure distributed tracing in your application"
    echo "  3. Review alerting policies in Google Cloud Console"
    echo "  4. Test alerts by triggering conditions"
}

# Run main function
main "$@"