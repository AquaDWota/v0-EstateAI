#!/bin/bash
# Test Estate.AI Chat Protocol Integration
# This script runs the test suite for chat protocol functionality

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Estate.AI Chat Protocol Tests${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if agent is running
echo -e "${YELLOW}Checking if Estate.AI agent is running...${NC}"
if curl -s http://127.0.0.1:8005/status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Agent is running${NC}"
else
    echo -e "${RED}❌ Agent is not running${NC}"
    echo ""
    echo "Please start the agent first:"
    echo "  cd /home/cmen/Projects/v0-EstateAI/backend/agents"
    echo "  ./run_estate_ai.sh"
    echo ""
    echo "Or run in background:"
    echo "  ./run_estate_ai.sh &"
    echo ""
    exit 1
fi

# Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source ../.venv/bin/activate

# Run the test script
echo ""
echo -e "${BLUE}Running test suite...${NC}"
echo ""

python test_chat_protocol.py

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Testing Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
