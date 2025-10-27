#!/bin/bash

# Food Search Benchmark Setup Verification Script
# This script verifies that all files are in place and the setup is correct

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Food Search Benchmark - Setup Verification                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check if file is executable
check_executable() {
    if [ -x "$1" ]; then
        echo -e "${GREEN}✓${NC} Executable: $1"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Not executable: $1 (will try to fix)"
        chmod +x "$1" 2>/dev/null && echo -e "  ${GREEN}✓${NC} Fixed permissions" || echo -e "  ${RED}✗${NC} Could not fix permissions"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo "1. Checking core files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "food-search-benchmark.js"
check_file "food-search-input.json"
check_file "compare-results.js"
check_file "benchmark-viewer.html"
check_file "benchmark-cli.js"
check_file "run-benchmark.sh"
check_file "package.json"

echo ""
echo "2. Checking documentation files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "README.md"
check_file "USAGE_EXAMPLES.md"
check_file "SETUP_COMPLETE.md"
check_file "TESTING_CHECKLIST.md"

echo ""
echo "3. Checking executable permissions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_executable "benchmark-cli.js"
check_executable "run-benchmark.sh"

echo ""
echo "4. Checking Node.js installation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js is installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js is not installed"
    echo "  Please install Node.js from https://nodejs.org/"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "5. Checking test-results directory..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "../test-results" ]; then
    echo -e "${GREEN}✓${NC} test-results directory exists"
    COUNT=$(ls -1 ../test-results/*.json 2>/dev/null | wc -l)
    echo "  Found $COUNT JSON result file(s)"
else
    echo -e "${YELLOW}⚠${NC} test-results directory does not exist (will be created on first run)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "6. Validating JSON files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node &> /dev/null; then
    if node -e "JSON.parse(require('fs').readFileSync('food-search-input.json', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} food-search-input.json is valid JSON"
    else
        echo -e "${RED}✗${NC} food-search-input.json has invalid JSON"
        ERRORS=$((ERRORS + 1))
    fi
    
    if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} package.json is valid JSON"
    else
        echo -e "${RED}✗${NC} package.json has invalid JSON"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "7. Checking input data..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node &> /dev/null; then
    QUERY_COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('food-search-input.json', 'utf8')).food_queries.length)" 2>/dev/null)
    if [ "$QUERY_COUNT" = "10" ]; then
        echo -e "${GREEN}✓${NC} Input file contains 10 test queries"
    elif [ -n "$QUERY_COUNT" ]; then
        echo -e "${YELLOW}⚠${NC} Input file contains $QUERY_COUNT test queries (expected 10)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗${NC} Could not read query count from input file"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ VERIFICATION PASSED!${NC}"
    echo ""
    echo "Everything is set up correctly. You can start using the tool:"
    echo ""
    echo "  Interactive CLI:"
    echo "    node benchmark-cli.js"
    echo ""
    echo "  Command line:"
    echo "    node food-search-benchmark.js production food-search-input.json"
    echo ""
    echo "  Shell script:"
    echo "    ./run-benchmark.sh production"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ VERIFICATION COMPLETED WITH WARNINGS${NC}"
    echo ""
    echo "Found $WARNINGS warning(s). The tool should work, but you may want to review the warnings above."
    echo ""
    exit 0
else
    echo -e "${RED}✗ VERIFICATION FAILED${NC}"
    echo ""
    echo "Found $ERRORS error(s) and $WARNINGS warning(s)."
    echo "Please fix the errors above before using the tool."
    echo ""
    exit 1
fi

exit 0

