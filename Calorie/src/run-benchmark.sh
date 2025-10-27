#!/bin/bash

# Food Search API Benchmark Runner
# Usage: ./run-benchmark.sh [environment] [input_file]
# Example: ./run-benchmark.sh production food-search-input.json

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

ENVIRONMENT=${1:-production}
INPUT_FILE=${2:-$SCRIPT_DIR/food-search-input.json}

echo "==================================="
echo "Food Search API Benchmark"
echo "==================================="
echo "Environment: $ENVIRONMENT"
echo "Input File: $INPUT_FILE"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to run this benchmark."
    exit 1
fi

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found: $INPUT_FILE"
    exit 1
fi

# Run the benchmark
node "$SCRIPT_DIR/food-search-benchmark.js" "$ENVIRONMENT" "$INPUT_FILE"

exit $?

