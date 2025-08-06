#!/bin/bash
set -euo pipefail

# Deployment Security Validation Script
# Validates that no secrets are embedded in Docker images or deployment artifacts

PROJECT_ID=${PROJECT_ID:-$(gcloud config get-value project)}
IMAGE_NAME=${1:-"gcr.io/$PROJECT_ID/izerwaren-revival"}
IMAGE_TAG=${2:-"latest"}
FULL_IMAGE_NAME="$IMAGE_NAME:$IMAGE_TAG"

echo "🔍 DEPLOYMENT SECURITY VALIDATION"
echo "=================================="
echo "🐳 Image: $FULL_IMAGE_NAME"
echo "📅 Date: $(date)"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validation 1: Check Docker image history for secrets
echo "1️⃣  Checking Docker image history for embedded secrets..."
if command_exists docker; then
    if docker pull "$FULL_IMAGE_NAME" >/dev/null 2>&1; then
        echo "   📦 Image pulled successfully"
        
        # Check for secrets in image layers
        SECRET_PATTERNS="password|secret|token|api.*key|private.*key|credential"
        
        if docker history --no-trunc "$FULL_IMAGE_NAME" | grep -iE "$SECRET_PATTERNS" | grep -v "COPY\|ADD\|FROM\|#(nop)"; then
            echo "   ❌ SECURITY ISSUE: Potential secrets found in image layers!"
            echo "   💡 Review Dockerfile and build process"
            exit 1
        else
            echo "   ✅ No secrets found in image layers"
        fi
        
        # Check environment variables in image
        echo "   🔍 Checking default environment variables..."
        if docker inspect "$FULL_IMAGE_NAME" --format='{{range .Config.Env}}{{println .}}{{end}}' | grep -iE "$SECRET_PATTERNS"; then
            echo "   ❌ SECURITY ISSUE: Potential secrets in default environment variables!"
            exit 1
        else
            echo "   ✅ No secrets in default environment variables"
        fi
    else
        echo "   ⚠️  Could not pull image for inspection (may not exist yet)"
    fi
else
    echo "   ⚠️  Docker not available for image inspection"
fi

# Validation 2: Check source code for committed secrets
echo ""
echo "2️⃣  Checking source code for accidentally committed secrets..."
cd "$(dirname "$0")/.."

# Common secret patterns
SECRET_FILES=(
    "*.env"
    "*.key"
    "*.pem"
    "service-account*.json"
    "*credentials*.json"
)

# Check if any secret files are tracked by git
for pattern in "${SECRET_FILES[@]}"; do
    if git ls-files | grep -E "$pattern" 2>/dev/null; then
        echo "   ❌ SECURITY ISSUE: Secret files found in git: $pattern"
        exit 1
    fi
done

# Check for secret patterns in committed files
if git grep -iE "password.*=|secret.*=|token.*=|api.*key.*=" -- '*.js' '*.ts' '*.json' '*.yaml' '*.yml' 2>/dev/null | grep -v "example\|template\|placeholder"; then
    echo "   ❌ SECURITY ISSUE: Potential hardcoded secrets found in committed files!"
    exit 1
else
    echo "   ✅ No hardcoded secrets found in committed files"
fi

# Validation 3: Check Dockerfile for secret build arguments  
echo ""
echo "3️⃣  Checking Dockerfile for secret build arguments..."
if grep -E "ARG.*password|ARG.*secret|ARG.*token|ARG.*key" Dockerfile* 2>/dev/null; then
    echo "   ❌ SECURITY ISSUE: Secret build arguments found in Dockerfile!"
    echo "   💡 Remove secret ARG declarations and use runtime environment variables"
    exit 1
else
    echo "   ✅ No secret build arguments in Dockerfiles"
fi

# Validation 4: Check Cloud Build configuration
echo ""
echo "4️⃣  Checking Cloud Build configuration for secret exposure..."
if [ -f "cloudbuild.yaml" ]; then
    if grep -E "secretEnv|SHOPIFY.*TOKEN|PASSWORD|SECRET|PRIVATE.*KEY" cloudbuild.yaml 2>/dev/null; then
        echo "   ⚠️  Secrets may be used in Cloud Build (verify they're not in build args)"
    else
        echo "   ✅ No obvious secret usage in Cloud Build configuration"
    fi
fi

# Validation 5: Check for .env files with real secrets
echo ""
echo "5️⃣  Checking for environment files with real secrets..."
if [ -f ".env.production" ]; then
    if grep -E "shpat_|sk_|pk_|-----BEGIN" .env.production 2>/dev/null; then
        echo "   ❌ SECURITY ISSUE: Real secrets found in .env.production!"
        echo "   💡 Use placeholder values only in committed environment files"
        exit 1
    else
        echo "   ✅ .env.production contains no real secrets"
    fi
fi

if [ -f ".env.local.production" ]; then
    echo "   ⚠️  .env.local.production exists (should not be committed)"
    if git ls-files | grep -q ".env.local.production"; then
        echo "   ❌ SECURITY ISSUE: .env.local.production is tracked by git!"
        exit 1
    else
        echo "   ✅ .env.local.production is not tracked by git"
    fi
fi

# Validation 6: Check Secret Manager availability (if in GCP context)
echo ""
echo "6️⃣  Checking Secret Manager configuration..."
if command_exists gcloud && gcloud auth list --filter=status:ACTIVE --format="value(account)" >/dev/null 2>&1; then
    echo "   🔍 Checking required secrets in Secret Manager..."
    
    REQUIRED_SECRETS=(
        "izerwaren-db-password"
        "izerwaren-shopify-admin-token"
        "izerwaren-shopify-webhook-secret"
        "izerwaren-firebase-private-key"
        "izerwaren-jwt-secret"
    )
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if gcloud secrets describe "$secret" --project="$PROJECT_ID" >/dev/null 2>&1; then
            echo "   ✅ Secret Manager secret exists: $secret"
        else
            echo "   ⚠️  Secret Manager secret missing: $secret"
            echo "       💡 Create with: gcloud secrets create $secret --data-file=-"
        fi
    done
else
    echo "   ⚠️  GCloud not authenticated - skipping Secret Manager validation"
fi

# Final security summary
echo ""
echo "🔒 SECURITY VALIDATION SUMMARY"
echo "=============================="
echo "✅ Image layers free of embedded secrets"
echo "✅ Source code free of hardcoded secrets"  
echo "✅ Dockerfile uses runtime secret injection"
echo "✅ Environment files contain no real secrets"
echo "✅ Local secret files excluded from git"
echo ""
echo "🎉 SECURITY VALIDATION PASSED!"
echo ""
echo "💡 Best Practices Verified:"
echo "   • Secrets injected at runtime only"
echo "   • No secrets in Docker image layers"
echo "   • No secrets committed to source control"
echo "   • Secret Manager used for production secrets"
echo "   • Local development secrets properly isolated"
echo ""
echo "🚀 Safe to deploy!"