#!/bin/bash
# Run Estate.AI Agent with Chat Protocol Support
# This script activates the virtual environment and starts the agent

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Estate.AI Agent - Chat Protocol${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: ../backend/.env file not found${NC}"
    echo "Make sure to create it with:"
    echo "  GEMINI_API_KEY=your_key"
    echo "  MONGODB_URI=your_mongodb_uri"
    echo ""
fi

# Check if virtual environment exists
if [ ! -d "../.venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found at ../backend/.venv${NC}"
    echo "Creating virtual environment..."
    python3 -m venv ../.venv
    echo "Installing dependencies..."
    source ../.venv/bin/activate
    pip install -r ../requirements.txt
else
    echo -e "${GREEN}✅ Using virtual environment at ../backend/.venv${NC}"
fi

# Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source ../.venv/bin/activate

# Show Python version
echo -e "${GREEN}Python: $(python --version)${NC}"
echo ""

# Show agent configuration
echo -e "${BLUE}Agent Configuration:${NC}"
echo "  Name: Estate-Ai"
echo "  Port: 8005"
echo "  Network: testnet"
echo "  Endpoints:"
echo "    - REST API: http://127.0.0.1:8005/api/analyze"
echo "    - Chat Protocol: http://127.0.0.1:8005/chat"
echo "    - Health Check: http://127.0.0.1:8005/status"
echo ""

# Start the agent
echo -e "${GREEN}Starting Estate.AI Agent...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

python Estate_Ai_agent.py
