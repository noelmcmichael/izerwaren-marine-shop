#!/bin/bash

# Deployment Validation Test Runner
# This script runs the full deployment validation test suite

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RESULTS_DIR="$PROJECT_DIR/test-results"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Default values
BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
ENVIRONMENT="${PLAYWRIGHT_ENV:-local}"
TEST_TYPE="${1:-all}"
HEADLESS="${PLAYWRIGHT_HEADLESS:-true}"
WORKERS="${PLAYWRIGHT_WORKERS:-2}"

echo -e "${BLUE}🚀 Starting Deployment Validation Tests${NC}"
echo -e "${BLUE}===============================================${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Base URL: $BASE_URL"
echo "Environment: $ENVIRONMENT"
echo "Test Type: $TEST_TYPE"
echo "Headless: $HEADLESS"
echo "Workers: $WORKERS"
echo "Results Directory: $RESULTS_DIR"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR/screenshots"

# Function to run specific test suite
run_test_suite() {
    local suite_name="$1"
    local test_pattern="$2"
    local timeout="${3:-300}"
    
    echo -e "${YELLOW}📋 Running $suite_name tests...${NC}"
    
    local start_time=$(date +%s)
    local exit_code=0
    
    # Run the tests
    cd "$PROJECT_DIR"
    timeout "$timeout" npx playwright test \
        --project="$suite_name" \
        --grep="$test_pattern" \
        --workers="$WORKERS" \
        --output-dir="$RESULTS_DIR/artifacts" \
        --reporter=html \
        --reporter=json \
        --reporter=junit || exit_code=$?
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $suite_name tests completed successfully (${duration}s)${NC}"
    elif [ $exit_code -eq 124 ]; then
        echo -e "${RED}⏰ $suite_name tests timed out after ${timeout}s${NC}"
    else
        echo -e "${RED}❌ $suite_name tests failed with exit code $exit_code (${duration}s)${NC}"
    fi
    
    return $exit_code
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    # Check if base URL is accessible
    if ! curl -sSf "$BASE_URL" > /dev/null 2>&1; then
        echo -e "${RED}❌ Base URL $BASE_URL is not accessible${NC}"
        exit 1
    fi
    
    # Check if health endpoint is accessible
    if ! curl -sSf "$BASE_URL/api/health" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Health endpoint not accessible, proceeding anyway${NC}"
    fi
    
    # Check Playwright installation
    if ! npx playwright --version > /dev/null 2>&1; then
        echo -e "${RED}❌ Playwright not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to generate summary report
generate_summary() {
    local overall_exit_code="$1"
    
    echo -e "\n${BLUE}📊 Generating Test Summary${NC}"
    echo -e "${BLUE}===========================${NC}"
    
    # Create summary JSON
    cat > "$RESULTS_DIR/deployment-test-summary.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "environment": "$ENVIRONMENT",
  "baseUrl": "$BASE_URL",
  "testType": "$TEST_TYPE",
  "overallResult": "$([ $overall_exit_code -eq 0 ] && echo "PASSED" || echo "FAILED")",
  "exitCode": $overall_exit_code,
  "resultsDirectory": "$RESULTS_DIR",
  "reportPaths": {
    "html": "$RESULTS_DIR/html-report/index.html",
    "json": "$RESULTS_DIR/results.json",
    "junit": "$RESULTS_DIR/results.xml"
  }
}
EOF
    
    # Display summary
    if [ $overall_exit_code -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL DEPLOYMENT VALIDATION TESTS PASSED${NC}"
        echo -e "${GREEN}✅ Deployment is validated and ready for production traffic${NC}"
    else
        echo -e "${RED}💥 DEPLOYMENT VALIDATION TESTS FAILED${NC}"
        echo -e "${RED}❌ Deployment issues detected - review test results${NC}"
    fi
    
    echo ""
    echo "📁 Test Results:"
    echo "   HTML Report: $RESULTS_DIR/html-report/index.html"
    echo "   JSON Results: $RESULTS_DIR/results.json"
    echo "   JUnit Results: $RESULTS_DIR/results.xml"
    echo "   Screenshots: $RESULTS_DIR/screenshots/"
    echo "   Summary: $RESULTS_DIR/deployment-test-summary.json"
    echo ""
    
    # Show quick stats if JSON report exists
    if [ -f "$RESULTS_DIR/results.json" ]; then
        echo "📈 Quick Stats:"
        if command -v jq > /dev/null 2>&1; then
            local total_tests=$(jq '.suites[].tests | length' "$RESULTS_DIR/results.json" 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "N/A")
            local passed_tests=$(jq '.suites[].tests[] | select(.outcome == "passed") | 1' "$RESULTS_DIR/results.json" 2>/dev/null | wc -l || echo "N/A")
            local failed_tests=$(jq '.suites[].tests[] | select(.outcome == "failed") | 1' "$RESULTS_DIR/results.json" 2>/dev/null | wc -l || echo "N/A")
            
            echo "   Total Tests: $total_tests"
            echo "   Passed: $passed_tests"
            echo "   Failed: $failed_tests"
        else
            echo "   (Install jq for detailed stats)"
        fi
    fi
}

# Function to setup test environment
setup_test_environment() {
    echo -e "${YELLOW}🛠️  Setting up test environment...${NC}"
    
    # Set environment variables for tests
    export PLAYWRIGHT_BASE_URL="$BASE_URL"
    export PLAYWRIGHT_ENV="$ENVIRONMENT"
    export PLAYWRIGHT_HEADLESS="$HEADLESS"
    export PLAYWRIGHT_WORKERS="$WORKERS"
    export TEST_CORRELATION_ID="deployment-test-$TIMESTAMP"
    
    # Ensure Playwright browsers are installed
    npx playwright install --with-deps > /dev/null 2>&1 || {
        echo -e "${YELLOW}⚠️  Installing Playwright browsers...${NC}"
        npx playwright install
    }
    
    echo -e "${GREEN}✅ Test environment ready${NC}"
}

# Main execution
main() {
    local overall_exit_code=0
    
    # Check prerequisites
    check_prerequisites
    
    # Setup test environment
    setup_test_environment
    
    echo -e "\n${BLUE}🧪 Starting Test Execution${NC}"
    echo -e "${BLUE}==========================${NC}"
    
    case "$TEST_TYPE" in
        "smoke")
            echo -e "${YELLOW}Running smoke tests only${NC}"
            run_test_suite "smoke-tests-chromium" "." 180 || overall_exit_code=$?
            ;;
        "integration")
            echo -e "${YELLOW}Running integration tests only${NC}"
            run_test_suite "integration-tests" "." 300 || overall_exit_code=$?
            ;;
        "deployment")
            echo -e "${YELLOW}Running deployment validation tests only${NC}"
            run_test_suite "deployment-validation" "." 600 || overall_exit_code=$?
            ;;
        "critical"|"fast")
            echo -e "${YELLOW}Running critical tests (smoke + post-deployment)${NC}"
            run_test_suite "smoke-tests-chromium" "." 180 || overall_exit_code=$?
            if [ $overall_exit_code -eq 0 ]; then
                run_test_suite "deployment-validation" "Post-Deployment Validation" 300 || overall_exit_code=$?
            fi
            ;;
        "all"|*)
            echo -e "${YELLOW}Running full test suite${NC}"
            
            # Run smoke tests first (fastest feedback)
            run_test_suite "smoke-tests-chromium" "." 180 || overall_exit_code=$?
            
            # Only continue if smoke tests pass
            if [ $overall_exit_code -eq 0 ]; then
                echo -e "\n${YELLOW}Smoke tests passed, continuing with integration tests...${NC}"
                run_test_suite "integration-tests" "." 300 || overall_exit_code=$?
                
                # Run deployment validation
                if [ $overall_exit_code -eq 0 ]; then
                    echo -e "\n${YELLOW}Integration tests passed, running deployment validation...${NC}"
                    run_test_suite "deployment-validation" "." 600 || overall_exit_code=$?
                fi
                
                # Run mobile tests (non-blocking)
                echo -e "\n${YELLOW}Running mobile compatibility tests...${NC}"
                run_test_suite "mobile-smoke" "." 240 || {
                    echo -e "${YELLOW}⚠️  Mobile tests failed but not blocking deployment${NC}"
                }
            else
                echo -e "\n${RED}❌ Smoke tests failed, skipping remaining tests${NC}"
            fi
            ;;
    esac
    
    # Generate summary report
    generate_summary $overall_exit_code
    
    # Exit with overall result
    exit $overall_exit_code
}

# Handle script arguments
case "$1" in
    "--help"|"-h")
        echo "Usage: $0 [TEST_TYPE]"
        echo ""
        echo "TEST_TYPE options:"
        echo "  smoke       - Run smoke tests only (fastest)"
        echo "  integration - Run integration tests only"
        echo "  deployment  - Run deployment validation tests only"
        echo "  critical    - Run critical tests (smoke + post-deployment)"
        echo "  all         - Run full test suite (default)"
        echo ""
        echo "Environment variables:"
        echo "  PLAYWRIGHT_BASE_URL  - Base URL for tests (default: http://localhost:3000)"
        echo "  PLAYWRIGHT_ENV       - Environment name (default: local)"
        echo "  PLAYWRIGHT_HEADLESS  - Run in headless mode (default: true)"
        echo "  PLAYWRIGHT_WORKERS   - Number of test workers (default: 2)"
        echo ""
        echo "Examples:"
        echo "  $0 smoke                           # Run smoke tests only"
        echo "  PLAYWRIGHT_BASE_URL=https://staging.example.com $0 all"
        echo "  PLAYWRIGHT_ENV=production $0 critical"
        exit 0
        ;;
esac

# Run main function
main