#!/bin/bash
set -euo pipefail

# Configuration Validation Script
# Validates environment setup and configuration patterns

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔍 CONFIGURATION VALIDATION"
echo "==========================="
echo "📁 Project: $PROJECT_ROOT"
echo "📅 Date: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Helper functions
pass() {
    echo -e "   ${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

fail() {
    echo -e "   ${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

warn() {
    echo -e "   ${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

info() {
    echo -e "   ${BLUE}ℹ️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validation 1: Environment Files
echo "1️⃣  Environment Files Validation"
echo "================================"

if [ -f ".env.example" ]; then
    pass ".env.example template exists"
else
    fail ".env.example template missing"
fi

if [ -f ".env.example.complete" ]; then
    pass ".env.example.complete comprehensive template exists"
else
    fail ".env.example.complete comprehensive template missing"
fi

if [ -f ".env.local" ]; then
    warn ".env.local exists (development file)"
    if grep -q "your-" .env.local 2>/dev/null; then
        warn ".env.local contains placeholder values"
    fi
else
    info ".env.local not found (expected for fresh checkout)"
fi

if [ -f ".env.production" ]; then
    if grep -E "shpat_|sk_|pk_|-----BEGIN" .env.production >/dev/null 2>&1; then
        fail ".env.production contains real secrets (security issue)"
    else
        pass ".env.production contains no real secrets"
    fi
else
    info ".env.production not found"
fi

echo ""

# Validation 2: Configuration Files
echo "2️⃣  Configuration Files Validation"
echo "=================================="

CONFIG_FILES=(
    "apps/frontend/src/lib/config.ts"
    "apps/backend/src/lib/secrets.ts"
    "docs/CONFIGURATION_GUIDE.md"
    "docs/DEVELOPER_ONBOARDING.md"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        pass "Configuration file exists: $file"
    else
        fail "Configuration file missing: $file"
    fi
done

echo ""

# Validation 3: Frontend Configuration
echo "3️⃣  Frontend Configuration Structure"
echo "==================================="

if [ -f "apps/frontend/src/lib/config.ts" ]; then
    # Check for required exports
    REQUIRED_EXPORTS=(
        "config"
        "api"
        "shopify"
        "firebase"
        "validation"
    )
    
    for export in "${REQUIRED_EXPORTS[@]}"; do
        if grep -q "export.*$export" apps/frontend/src/lib/config.ts; then
            pass "Config export exists: $export"
        else
            fail "Config export missing: $export"
        fi
    done
    
    # Check for security patterns
    if grep -q "process.env.NODE_ENV" apps/frontend/src/lib/config.ts; then
        pass "Environment detection present"
    else
        fail "Environment detection missing"
    fi
    
    if grep -q "validation" apps/frontend/src/lib/config.ts; then
        pass "Configuration validation present"
    else
        fail "Configuration validation missing"
    fi
else
    fail "Frontend configuration file missing"
fi

echo ""

# Validation 4: Backend Secret Management
echo "4️⃣  Backend Secret Management"
echo "============================"

if [ -f "apps/backend/src/lib/secrets.ts" ]; then
    # Check for required classes/functions
    SECRET_COMPONENTS=(
        "SecretManagerService"
        "getSecret"
        "validateSecrets"
        "secretManager"
    )
    
    for component in "${SECRET_COMPONENTS[@]}"; do
        if grep -q "$component" apps/backend/src/lib/secrets.ts; then
            pass "Secret component exists: $component"
        else
            fail "Secret component missing: $component"
        fi
    done
    
    # Check for security patterns
    if grep -q "SecretManagerServiceClient" apps/backend/src/lib/secrets.ts; then
        pass "GCP Secret Manager integration present"
    else
        fail "GCP Secret Manager integration missing"
    fi
    
    if grep -q "cache" apps/backend/src/lib/secrets.ts; then
        pass "Secret caching implemented"
    else
        warn "Secret caching not implemented"
    fi
else
    fail "Backend secrets file missing"
fi

echo ""

# Validation 5: API Path Fixes
echo "5️⃣  API Path Configuration"
echo "========================="

# Check for corrected API path patterns
API_FILES=(
    "apps/frontend/src/components/products/VariantSelector.tsx"
    "apps/frontend/src/components/shared/CategoryCards.tsx"
    "apps/frontend/src/components/shared/CategoryDropdown.tsx"
    "apps/frontend/src/components/b2b/cart/ProductSearchModal.tsx"
    "apps/frontend/src/services/cart.ts"
)

for file in "${API_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Check for corrected API path pattern
        if grep -q "config.api.baseUrl === '/api'" "$file"; then
            pass "API path fix implemented: $(basename "$file")"
        else
            # Check if file still has the double path issue
            if grep -q "\${config.api.baseUrl}/api/" "$file"; then
                fail "Double API path issue remains: $(basename "$file")"
            else
                info "API path pattern not found in: $(basename "$file")"
            fi
        fi
    else
        warn "API file not found: $file"
    fi
done

echo ""

# Validation 6: Security Validation Script
echo "6️⃣  Security Validation Tools"
echo "============================"

SECURITY_SCRIPTS=(
    "scripts/validate-deployment-security.sh"
    "scripts/deploy-blue-green-secure.sh"
)

for script in "${SECURITY_SCRIPTS[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        pass "Security script exists and executable: $(basename "$script")"
    elif [ -f "$script" ]; then
        warn "Security script exists but not executable: $(basename "$script")"
        chmod +x "$script"
        pass "Made security script executable: $(basename "$script")"
    else
        fail "Security script missing: $script"
    fi
done

echo ""

# Validation 7: Documentation
echo "7️⃣  Documentation Validation"
echo "==========================="

DOC_FILES=(
    "docs/CONFIGURATION_GUIDE.md"
    "docs/DEVELOPER_ONBOARDING.md"
    "README.md"
)

for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        # Check file size (should not be empty)
        if [ -s "$doc" ]; then
            pass "Documentation exists: $(basename "$doc")"
        else
            fail "Documentation file empty: $(basename "$doc")"
        fi
    else
        fail "Documentation missing: $doc"
    fi
done

# Check for recent updates
if [ -f "docs/CONFIGURATION_GUIDE.md" ]; then
    if grep -q "August 2025" docs/CONFIGURATION_GUIDE.md; then
        pass "Configuration guide recently updated"
    else
        warn "Configuration guide may be outdated"
    fi
fi

echo ""

# Validation 8: Build System Validation
echo "8️⃣  Build System Validation"
echo "=========================="

if [ -f "package.json" ]; then
    pass "Package.json exists"
    
    # Check for required scripts
    REQUIRED_SCRIPTS=(
        "build"
        "dev"
        "test"
        "lint"
    )
    
    for script in "${REQUIRED_SCRIPTS[@]}"; do
        if grep -q "\"$script\":" package.json; then
            pass "NPM script exists: $script"
        else
            fail "NPM script missing: $script"
        fi
    done
else
    fail "Package.json missing"
fi

if [ -f "turbo.json" ]; then
    pass "Turbo configuration exists"
else
    warn "Turbo configuration missing"
fi

echo ""

# Validation 9: TypeScript Configuration
echo "9️⃣  TypeScript Configuration"
echo "==========================="

if [ -f "tsconfig.json" ]; then
    pass "TypeScript configuration exists"
    
    # Check for path mapping
    if grep -q "\"@/*\"" tsconfig.json; then
        pass "Path mapping configured"
    else
        fail "Path mapping missing"
    fi
else
    fail "TypeScript configuration missing"
fi

# Check individual app tsconfigs
APP_TSCONFIGS=(
    "apps/frontend/tsconfig.json"
    "apps/backend/tsconfig.json"
)

for tsconfig in "${APP_TSCONFIGS[@]}"; do
    if [ -f "$tsconfig" ]; then
        pass "App TypeScript config exists: $(dirname "$tsconfig")"
    else
        warn "App TypeScript config missing: $tsconfig"
    fi
done

echo ""

# Validation 10: Git Configuration
echo "🔟 Git Configuration"
echo "==================="

if [ -d ".git" ]; then
    pass "Git repository initialized"
else
    fail "Git repository not initialized"
fi

if [ -f ".gitignore" ]; then
    pass ".gitignore exists"
    
    # Check for important ignores
    IMPORTANT_IGNORES=(
        ".env.local"
        "node_modules"
        ".next"
        "dist"
    )
    
    for ignore in "${IMPORTANT_IGNORES[@]}"; do
        if grep -q "$ignore" .gitignore; then
            pass "Git ignores: $ignore"
        else
            warn "Git ignore missing: $ignore"
        fi
    done
else
    fail ".gitignore missing"
fi

echo ""

# Final Summary
echo "📊 VALIDATION SUMMARY"
echo "===================="
echo -e "✅ Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "❌ Checks Failed: ${RED}$CHECKS_FAILED${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 VALIDATION PASSED!${NC}"
    echo ""
    echo "✨ Configuration is properly set up and ready for development."
    echo ""
    echo "Next Steps:"
    echo "1. Copy .env.example to .env.local and configure for your environment"
    echo "2. Run 'npm run dev' to start development server"
    echo "3. Read docs/DEVELOPER_ONBOARDING.md for detailed setup instructions"
    echo ""
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED!${NC}"
    echo ""
    echo "🔧 Issues found that need to be addressed:"
    echo "   - $CHECKS_FAILED critical issues"
    echo "   - $WARNINGS warnings"
    echo ""
    echo "Please review the output above and fix the failing checks."
    echo "Refer to docs/CONFIGURATION_GUIDE.md for troubleshooting help."
    echo ""
    exit 1
fi