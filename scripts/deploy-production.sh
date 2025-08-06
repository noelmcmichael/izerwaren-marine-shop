#!/bin/bash
set -euo pipefail

# Production deployment script for Izerwaren Revamp 2.0
# Implements blue-green deployment strategy with Cloud Run

echo "🚀 Starting production deployment for Izerwaren Revamp 2.0"

# Configuration
PROJECT_ID=${PROJECT_ID:-"noelmc"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME_FRONTEND="izerwaren-frontend-prod"
SERVICE_NAME_BACKEND="izerwaren-api-prod"
DATABASE_INSTANCE="izerwaren-prod-db"
IMAGE_FRONTEND="gcr.io/${PROJECT_ID}/izerwaren-frontend:${BUILD_ID:-latest}"
IMAGE_BACKEND="gcr.io/${PROJECT_ID}/izerwaren-api:${BUILD_ID:-latest}"

echo "📋 Configuration:"
echo "  Project: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Frontend Service: ${SERVICE_NAME_FRONTEND}"
echo "  Backend Service: ${SERVICE_NAME_BACKEND}"
echo "  Database: ${DATABASE_INSTANCE}"

# Function to check if Cloud SQL instance exists
check_database() {
    echo "🔍 Checking database instance..."
    if gcloud sql instances describe ${DATABASE_INSTANCE} --quiet >/dev/null 2>&1; then
        echo "✅ Database instance ${DATABASE_INSTANCE} exists"
        return 0
    else
        echo "❌ Database instance ${DATABASE_INSTANCE} not found"
        return 1
    fi
}

# Function to create production database
create_production_database() {
    echo "🗄️ Creating production database instance..."
    
    gcloud sql instances create ${DATABASE_INSTANCE} \
        --database-version=POSTGRES_15 \
        --tier=db-standard-2 \
        --region=${REGION} \
        --storage-type=SSD \
        --storage-size=100GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --backup-location=${REGION} \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=03 \
        --maintenance-release-channel=production \
        --enable-bin-log \
        --retained-backups-count=7 \
        --retained-transaction-log-days=7 \
        --deletion-protection
    
    echo "✅ Database instance created with production configuration"
    
    # Create database and user
    echo "👤 Creating database and user..."
    gcloud sql databases create izerwaren_prod --instance=${DATABASE_INSTANCE}
    
    # Generate secure password
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    gcloud sql users create izerwaren_prod --instance=${DATABASE_INSTANCE} --password=${DB_PASSWORD}
    
    echo "✅ Database and user created"
    echo "🔐 Store this password securely: ${DB_PASSWORD}"
}

# Function to deploy backend service
deploy_backend() {
    echo "🖥️ Deploying backend service..."
    
    gcloud run deploy ${SERVICE_NAME_BACKEND} \
        --image=${IMAGE_BACKEND} \
        --region=${REGION} \
        --platform=managed \
        --allow-unauthenticated \
        --memory=1Gi \
        --cpu=1 \
        --concurrency=80 \
        --max-instances=25 \
        --min-instances=1 \
        --timeout=300 \
        --port=8080 \
        --service-account=izerwaren-cloud-run@${PROJECT_ID}.iam.gserviceaccount.com \
        --add-cloudsql-instances=${PROJECT_ID}:${REGION}:${DATABASE_INSTANCE} \
        --set-env-vars="NODE_ENV=production" \
        --set-env-vars="DATABASE_URL=postgresql://izerwaren_prod:${DB_PASSWORD}@localhost/izerwaren_prod?host=/cloudsql/${PROJECT_ID}:${REGION}:${DATABASE_INSTANCE}" \
        --no-traffic \
        --tag=candidate
    
    echo "✅ Backend deployed to candidate revision"
}

# Function to deploy frontend service
deploy_frontend() {
    echo "🌐 Deploying frontend service..."
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe ${SERVICE_NAME_BACKEND} --region=${REGION} --format="value(status.url)")
    
    gcloud run deploy ${SERVICE_NAME_FRONTEND} \
        --image=${IMAGE_FRONTEND} \
        --region=${REGION} \
        --platform=managed \
        --allow-unauthenticated \
        --memory=2Gi \
        --cpu=2 \
        --concurrency=100 \
        --max-instances=10 \
        --min-instances=1 \
        --timeout=300 \
        --port=3000 \
        --service-account=izerwaren-cloud-run@${PROJECT_ID}.iam.gserviceaccount.com \
        --set-env-vars="NODE_ENV=production" \
        --set-env-vars="NEXT_PUBLIC_API_URL=${BACKEND_URL}" \
        --set-env-vars="NEXTAUTH_URL=https://izerwaren.mcmichaelbuild.com" \
        --set-env-vars="NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" \
        --no-traffic \
        --tag=candidate
    
    echo "✅ Frontend deployed to candidate revision"
}

# Function to run health checks
health_check() {
    local service_name=$1
    local max_attempts=10
    local attempt=1
    
    echo "🏥 Running health checks for ${service_name}..."
    
    # Get candidate revision URL
    CANDIDATE_URL=$(gcloud run services describe ${service_name} \
        --region=${REGION} \
        --format="value(status.traffic[?tag=candidate].url)")
    
    while [ $attempt -le $max_attempts ]; do
        echo "  Attempt ${attempt}/${max_attempts}: Testing ${CANDIDATE_URL}"
        
        if [ "${service_name}" = "${SERVICE_NAME_BACKEND}" ]; then
            if curl -f -s "${CANDIDATE_URL}/api/v1/health" > /dev/null; then
                echo "✅ Backend health check passed"
                return 0
            fi
        else
            if curl -f -s "${CANDIDATE_URL}" > /dev/null; then
                echo "✅ Frontend health check passed"
                return 0
            fi
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ Health check failed after ${max_attempts} attempts"
            return 1
        fi
        
        echo "  ⏳ Health check failed, retrying in 30 seconds..."
        sleep 30
        ((attempt++))
    done
}

# Function to migrate traffic
migrate_traffic() {
    local service_name=$1
    echo "🔄 Migrating traffic for ${service_name}..."
    
    # Gradual traffic migration: 10% -> 50% -> 100%
    for traffic_percent in 10 50 100; do
        echo "  Setting traffic to ${traffic_percent}% for candidate revision..."
        
        gcloud run services update-traffic ${service_name} \
            --region=${REGION} \
            --to-tags=candidate=${traffic_percent}
        
        echo "  ⏳ Monitoring for 2 minutes..."
        sleep 120
        
        # Check error rates (simplified - in real deployment, monitor metrics)
        if ! health_check_simple ${service_name}; then
            echo "❌ Error detected during traffic migration. Rolling back..."
            rollback ${service_name}
            return 1
        fi
        
        echo "✅ Traffic at ${traffic_percent}% - no issues detected"
    done
    
    # Remove tag after successful migration
    gcloud run services update-traffic ${service_name} \
        --region=${REGION} \
        --remove-tags=candidate
    
    echo "✅ Traffic migration completed successfully"
}

# Function for simple health check during traffic migration
health_check_simple() {
    local service_name=$1
    local service_url=$(gcloud run services describe ${service_name} --region=${REGION} --format="value(status.url)")
    
    if [ "${service_name}" = "${SERVICE_NAME_BACKEND}" ]; then
        curl -f -s "${service_url}/api/v1/health" > /dev/null
    else
        curl -f -s "${service_url}" > /dev/null
    fi
}

# Function to rollback
rollback() {
    local service_name=$1
    echo "🔙 Rolling back ${service_name}..."
    
    gcloud run services update-traffic ${service_name} \
        --region=${REGION} \
        --to-tags=candidate=0
    
    gcloud run services update-traffic ${service_name} \
        --region=${REGION} \
        --remove-tags=candidate
    
    echo "✅ Rollback completed"
}

# Function to cleanup old revisions
cleanup_revisions() {
    local service_name=$1
    echo "🧹 Cleaning up old revisions for ${service_name}..."
    
    # Get revisions (keep latest 3)
    gcloud run revisions list \
        --service=${service_name} \
        --region=${REGION} \
        --sort-by="~metadata.creationTimestamp" \
        --format="value(metadata.name)" \
        --limit=100 | tail -n +4 | while read revision; do
        if [ ! -z "$revision" ]; then
            echo "  🗑️ Deleting old revision: ${revision}"
            gcloud run revisions delete ${revision} --region=${REGION} --quiet || true
        fi
    done
}

# Main deployment flow
main() {
    echo "🎯 Starting production deployment process..."
    
    # Check if database exists, create if needed
    if ! check_database; then
        echo "🛠️ Setting up production database..."
        create_production_database
    fi
    
    # Deploy backend first
    echo "🔄 Phase 1: Backend deployment"
    deploy_backend
    
    if ! health_check ${SERVICE_NAME_BACKEND}; then
        echo "❌ Backend health check failed. Aborting deployment."
        exit 1
    fi
    
    # Deploy frontend
    echo "🔄 Phase 2: Frontend deployment"
    deploy_frontend
    
    if ! health_check ${SERVICE_NAME_FRONTEND}; then
        echo "❌ Frontend health check failed. Aborting deployment."
        exit 1
    fi
    
    # Migrate traffic gradually
    echo "🔄 Phase 3: Traffic migration"
    if ! migrate_traffic ${SERVICE_NAME_BACKEND}; then
        echo "❌ Backend traffic migration failed"
        exit 1
    fi
    
    if ! migrate_traffic ${SERVICE_NAME_FRONTEND}; then
        echo "❌ Frontend traffic migration failed"
        exit 1
    fi
    
    # Cleanup old revisions
    echo "🔄 Phase 4: Cleanup"
    cleanup_revisions ${SERVICE_NAME_BACKEND}
    cleanup_revisions ${SERVICE_NAME_FRONTEND}
    
    # Get final URLs
    FRONTEND_URL=$(gcloud run services describe ${SERVICE_NAME_FRONTEND} --region=${REGION} --format="value(status.url)")
    BACKEND_URL=$(gcloud run services describe ${SERVICE_NAME_BACKEND} --region=${REGION} --format="value(status.url)")
    
    echo ""
    echo "🎉 Production deployment completed successfully!"
    echo ""
    echo "📋 Service URLs:"
    echo "  Frontend: ${FRONTEND_URL}"
    echo "  Backend:  ${BACKEND_URL}"
    echo ""
    echo "🔗 Next steps:"
    echo "  1. Configure DNS to point izerwaren.mcmichaelbuild.com to ${FRONTEND_URL}"
    echo "  2. Set up SSL certificate for custom domain"
    echo "  3. Configure monitoring and alerting"
    echo "  4. Run full end-to-end tests"
    echo ""
}

# Check if required environment variables are set
if [ -z "${NEXTAUTH_SECRET:-}" ]; then
    echo "❌ NEXTAUTH_SECRET environment variable is required"
    exit 1
fi

# Run main deployment
main "$@"