#!/bin/bash
# Quick Reference: Estate.AI Public Endpoint Setup

cat << 'EOF'

╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║        ESTATE.AI PUBLIC ENDPOINT - QUICK REFERENCE               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

🎯 GOAL: Make Estate.AI accessible from Agentverse & ASI:One

📋 QUICK START:

  Terminal 1 - Start Agent:
  ─────────────────────────────────────────────────────────────
  cd /home/cmen/Projects/v0-EstateAI/backend/agents
  ./run_estate_ai.sh


  Terminal 2 - Create Tunnel:
  ─────────────────────────────────────────────────────────────
  cd /home/cmen/Projects/v0-EstateAI/backend/agents
  cloudflared tunnel --url http://localhost:8005

  (Or use: ./create_tunnel.sh)


  Copy Tunnel URL:
  ─────────────────────────────────────────────────────────────
  Look for: https://xxx-xxx-xxx.trycloudflare.com


  Update .env:
  ─────────────────────────────────────────────────────────────
  Edit: backend/agents/.env
  Add:  AGENT_ENDPOINT=https://xxx-xxx-xxx.trycloudflare.com/submit
  
  (Important: Add /submit to the end!)


  Restart Agent:
  ─────────────────────────────────────────────────────────────
  Stop agent (Ctrl+C in Terminal 1)
  Start again: ./run_estate_ai.sh
  
  Should see: 🌐 Using public endpoint: https://...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 AUTOMATED SETUP (EASIER):

  ./setup_public_endpoint.sh

  Follow prompts for interactive configuration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ VERIFY:

  Local:
  curl http://127.0.0.1:8005/status

  Public:
  curl https://your-tunnel-url.trycloudflare.com/status

  Get Agent Address:
  curl http://127.0.0.1:8005/status | jq '.address'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 AGENTVERSE REGISTRATION:

  1. Visit: https://agentverse.ai
  2. Register agent with:
     - Name: Estate.AI
     - Address: agent1q04xd4gvvp... (from status)
     - Endpoint: https://tunnel-url.trycloudflare.com/submit
     - Network: testnet
  3. Test via Agentverse chat interface

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 ENVIRONMENT VARIABLES:

  Required in backend/agents/.env:
  ┌────────────────────────────────────────────────────────────┐
  │ # For public access (from cloudflared tunnel)             │
  │ AGENT_ENDPOINT=https://xxx.trycloudflare.com/submit       │
  │                                                            │
  │ # Google Gemini (required)                                │
  │ GEMINI_API_KEY=your_key                                   │
  │ GEMINI_MODEL=gemini-2.5-flash-latest                      │
  │                                                            │
  │ # Optional                                                │
  │ AGENT_SEED=your-secure-random-seed                        │
  │ UAGENTS_NETWORK=testnet                                   │
  └────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT NOTES:

  • Keep tunnel terminal open (tunnel dies when closed)
  • Free tunnel URL changes on restart
  • Update .env with new URL each time
  • Add /submit to tunnel URL in AGENT_ENDPOINT
  • Restart agent after updating .env

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️  TROUBLESHOOTING:

  Agent won't start:
  └─ Check: lsof -i :8005
  └─ Kill: kill -9 $(lsof -t -i:8005)

  Tunnel not working:
  └─ Verify agent is running first
  └─ Check cloudflared is installed
  └─ Try: cloudflared --version

  Public endpoint not working:
  └─ Verify /submit is added to URL
  └─ Restart agent after .env update
  └─ Check tunnel is still running

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 DOCUMENTATION:

  • PUBLIC_ENDPOINT_SETUP.md   - Detailed guide
  • CHAT_PROTOCOL_SETUP.md     - Chat protocol details
  • README.md                  - Agents overview

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 SCRIPTS:

  ./run_estate_ai.sh           - Start agent
  ./create_tunnel.sh           - Create cloudflared tunnel
  ./setup_public_endpoint.sh   - Interactive setup
  ./test_chat.sh              - Test endpoints

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
