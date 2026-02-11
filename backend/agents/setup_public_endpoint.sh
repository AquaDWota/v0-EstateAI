#!/bin/bash
# Setup Estate.AI Agent with Public Endpoint
# This script helps configure the agent to be accessible from Agentverse

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Estate.AI Agent - Public Endpoint Configuration${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo ""

echo "This script will help you configure Estate.AI agent for Agentverse access."
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}⚠️  cloudflared is not installed${NC}"
    echo ""
    echo "To make your agent accessible from Agentverse, you need cloudflared."
    echo ""
    echo "Install options:"
    echo "  1. Homebrew (Mac/Linux):  brew install cloudflared"
    echo "  2. Download: https://github.com/cloudflare/cloudflared/releases"
    echo ""
    read -p "Continue without cloudflared? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    CLOUDFLARED_AVAILABLE=false
else
    echo -e "${GREEN}✅ cloudflared is installed${NC}"
    CLOUDFLARED_AVAILABLE=true
fi

echo ""
echo -e "${BLUE}Configuration Options:${NC}"
echo ""
echo "  1. Local Testing (localhost only)"
echo "  2. Public Access (Agentverse + ASI:One)"
echo ""
read -p "Select option (1 or 2): " -n 1 -r
echo ""

if [[ $REPLY == "1" ]]; then
    # Local testing
    echo ""
    echo -e "${GREEN}Setting up for local testing...${NC}"
    echo ""
    
    # Create .env if it doesn't exist
    if [ ! -f "../.env" ]; then
        cp ../.env.example ../.env 2>/dev/null || touch ../.env
    fi
    
    # Remove AGENT_ENDPOINT from .env if present
    if grep -q "AGENT_ENDPOINT=" ../.env; then
        sed -i.bak '/AGENT_ENDPOINT=/d' ../.env
        echo "Removed AGENT_ENDPOINT from .env (using localhost)"
    fi
    
    echo -e "${GREEN}✅ Configured for local testing${NC}"
    echo ""
    echo "Starting agent..."
    ./run_estate_ai.sh
    
elif [[ $REPLY == "2" ]]; then
    # Public access
    if [ "$CLOUDFLARED_AVAILABLE" = false ]; then
        echo -e "${RED}❌ cloudflared is required for public access${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  STEP-BY-STEP PUBLIC ENDPOINT SETUP${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${BLUE}STEP 1: Start the Estate.AI Agent${NC}"
    echo "  Run in Terminal 1:"
    echo "    cd /home/cmen/Projects/v0-EstateAI/backend/agents"
    echo "    ./run_estate_ai.sh"
    echo ""
    
    read -p "Is the agent running? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please start the agent first, then run this script again."
        exit 1
    fi
    
    # Verify agent is running
    if ! curl -s http://127.0.0.1:8005/status > /dev/null 2>&1; then
        echo -e "${RED}❌ Agent is not responding on port 8005${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Agent confirmed running${NC}"
    echo ""
    
    echo -e "${BLUE}STEP 2: Create Public Tunnel${NC}"
    echo "  Opening cloudflared tunnel..."
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Keep this terminal open!${NC}"
    echo -e "${YELLOW}The tunnel URL will appear below - copy it!${NC}"
    echo ""
    echo "=" * 60
    echo ""
    
    # Run cloudflared in background and capture output
    cloudflared tunnel --url http://localhost:8005 &
    TUNNEL_PID=$!
    
    # Wait for tunnel URL to appear
    sleep 5
    
    echo ""
    echo "=" * 60
    echo ""
    echo -e "${GREEN}STEP 3: Configure Agent with Tunnel URL${NC}"
    echo ""
    echo "Copy the tunnel URL from above (e.g., https://xxx-xxx-xxx.trycloudflare.com)"
    read -p "Paste the tunnel URL here: " TUNNEL_URL
    
    if [[ -z "$TUNNEL_URL" ]]; then
        echo -e "${RED}❌ No URL provided${NC}"
        kill $TUNNEL_PID 2>/dev/null || true
        exit 1
    fi
    
    # Add /submit to the endpoint
    ENDPOINT="${TUNNEL_URL}/submit"
    
    echo ""
    echo -e "${GREEN}Setting AGENT_ENDPOINT=${ENDPOINT}${NC}"
    
    # Update .env file
    if [ ! -f "../.env" ]; then
        cp ../.env.example ../.env 2>/dev/null || touch ../.env
    fi
    
    # Remove old AGENT_ENDPOINT if present
    sed -i.bak '/AGENT_ENDPOINT=/d' ../.env 2>/dev/null || true
    
    # Add new AGENT_ENDPOINT
    echo "AGENT_ENDPOINT=${ENDPOINT}" >> ../.env
    
    echo -e "${GREEN}✅ Updated .env file${NC}"
    echo ""
    
    echo -e "${BLUE}STEP 4: Restart Agent with Public Endpoint${NC}"
    echo ""
    echo "Stop the agent in Terminal 1 (Ctrl+C), then restart:"
    echo "  ./run_estate_ai.sh"
    echo ""
    echo -e "${YELLOW}Keep this tunnel running while the agent is active!${NC}"
    echo ""
    
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  CONFIGURATION COMPLETE!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo "Your agent endpoint: ${ENDPOINT}"
    echo ""
    echo "Next steps:"
    echo "  1. Restart your agent in Terminal 1"
    echo "  2. Keep this tunnel running"
    echo "  3. Register on Agentverse: https://agentverse.ai"
    echo "  4. Use your agent address for integration"
    echo ""
    
    # Keep tunnel running
    echo -e "${YELLOW}Press Ctrl+C to stop the tunnel${NC}"
    wait $TUNNEL_PID
    
else
    echo "Invalid option"
    exit 1
fi
