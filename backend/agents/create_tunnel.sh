#!/bin/bash
# Create a public tunnel for Estate.AI Agent using cloudflared
# This makes your agent accessible from Agentverse and ASI:One

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Estate.AI Public Tunnel Setup${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared is not installed${NC}"
    echo ""
    echo "Install cloudflared:"
    echo "  For Linux/Mac:"
    echo "    brew install cloudflared"
    echo "  Or download from:"
    echo "    https://github.com/cloudflare/cloudflared/releases"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ cloudflared found${NC}"
echo ""

# Check if agent is running
echo -e "${YELLOW}Checking if Estate.AI agent is running on port 8005...${NC}"
if ! curl -s http://127.0.0.1:8005/status > /dev/null 2>&1; then
    echo -e "${RED}❌ Agent is not running on port 8005${NC}"
    echo ""
    echo "Please start the agent first:"
    echo "  ./run_estate_ai.sh"
    echo ""
    echo "Then run this script in another terminal."
    exit 1
fi

echo -e "${GREEN}✅ Agent is running${NC}"
echo ""

# Create tunnel
echo -e "${BLUE}Creating public tunnel for http://localhost:8005${NC}"
echo -e "${YELLOW}This will generate a public URL that you can use in Agentverse${NC}"
echo ""
echo -e "${GREEN}🚀 Starting tunnel...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""
echo "=" * 60
echo ""

# Run cloudflared tunnel
cloudflared tunnel --url http://localhost:8005
