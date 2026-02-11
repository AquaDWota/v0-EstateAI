# Estate.AI Public Endpoint Setup Guide

## Overview

To make your Estate.AI agent accessible from Agentverse and ASI:One, you need to expose it to the internet using a public endpoint. This guide shows you how to set up a cloudflared tunnel for your agent.

## Why Public Endpoint?

- **Agentverse Integration**: Allows your agent to be discovered and used by others
- **ASI:One Compatibility**: Enables communication with ASI:One services
- **Remote Access**: Access your agent from anywhere
- **Agent-to-Agent Communication**: Other agents can chat with your Estate.AI agent

## Prerequisites

1. **cloudflared** installed
2. **Estate.AI agent** running locally
3. **Internet connection**

## Installation

### Install cloudflared

#### Mac/Linux (Homebrew)
```bash
brew install cloudflared
```

#### Linux (Direct Download)
```bash
# AMD64
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# ARM64
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb
```

#### Verify Installation
```bash
cloudflared --version
```

## Quick Start

### Method 1: Automated Setup (Recommended)

```bash
cd /home/cmen/Projects/v0-EstateAI/backend/agents
./setup_public_endpoint.sh
```

Follow the interactive prompts to configure your agent.

### Method 2: Manual Setup

#### Step 1: Start Your Agent
```bash
cd /home/cmen/Projects/v0-EstateAI/backend/agents
./run_estate_ai.sh
```

Keep this terminal open.

#### Step 2: Create Tunnel (New Terminal)
```bash
cd /home/cmen/Projects/v0-EstateAI/backend/agents
./create_tunnel.sh
```

Or directly:
```bash
cloudflared tunnel --url http://localhost:8005
```

#### Step 3: Copy the Tunnel URL

You'll see output like:
```
2026-02-11T10:30:45Z INF +--------------------------------------------------------------------------------------------+
2026-02-11T10:30:45Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
2026-02-11T10:30:45Z INF |  https://abc-def-ghi.trycloudflare.com                                                    |
2026-02-11T10:30:45Z INF +--------------------------------------------------------------------------------------------+
```

Copy the URL: `https://abc-def-ghi.trycloudflare.com`

#### Step 4: Update Environment Variable

Add to `backend/.env`:
```env
AGENT_ENDPOINT=https://abc-def-ghi.trycloudflare.com/submit
```

Note: Add `/submit` to the end of the tunnel URL!

#### Step 5: Restart Agent

Stop the agent (Ctrl+C in Terminal 1), then restart:
```bash
./run_estate_ai.sh
```

You should see:
```
🌐 Using public endpoint: https://abc-def-ghi.trycloudflare.com/submit
```

## Environment Variables

Update `backend/.env` with these variables:

```env
# Required for public access
AGENT_ENDPOINT=https://your-tunnel-url.trycloudflare.com/submit

# Optional: Use a secure seed for production
AGENT_SEED=your-secure-random-seed-phrase

# Network (testnet for testing, mainnet for production)
UAGENTS_NETWORK=testnet

# Google Gemini (required)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-latest

# MongoDB (required)
MONGODB_URI=mongodb+srv://your-connection-string
```

## Verification

### 1. Check Agent Status
```bash
curl http://127.0.0.1:8005/status
```

Should return:
```json
{
  "status": "OK",
  "agent": "Estate.AI Orchestrator",
  "address": "agent1q04xd4gvvp...",
  "network": "testnet"
}
```

### 2. Check Public Endpoint
```bash
curl https://your-tunnel-url.trycloudflare.com/status
```

Should return the same status response.

### 3. Get Agent Address

Copy the agent address from the status response. You'll need this for Agentverse registration.

## Agentverse Registration

1. **Visit Agentverse**: https://agentverse.ai
2. **Sign In/Sign Up**
3. **Register Agent**:
   - Name: Estate.AI
   - Address: `agent1q04xd4gvvp...` (from status endpoint)
   - Endpoint: `https://your-tunnel-url.trycloudflare.com/submit`
   - Network: testnet
4. **Test Communication** via Agentverse chat interface

## Testing Public Access

### Test from Another Machine

```bash
# Get agent status
curl https://your-tunnel-url.trycloudflare.com/status

# Test analysis (optional)
curl -X POST https://your-tunnel-url.trycloudflare.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "properties": [{
      "address": "123 Test St",
      "listPrice": 500000,
      "type": "condo"
    }],
    "zipCode": "90001",
    "globalAssumptions": {}
  }'
```

## Important Notes

### Tunnel Stability

⚠️ **Free cloudflared tunnels expire after inactivity!**

- The tunnel URL changes each time you restart
- For production, consider:
  - Paid Cloudflare Argo Tunnel
  - ngrok paid plan
  - Self-hosted reverse proxy (nginx + public IP)
  - Cloud hosting (AWS, GCP, Azure)

### Security

🔒 **Security Considerations:**

1. **Use a secure seed** in production (not "selector-agent")
2. **Enable HTTPS** (cloudflared provides this)
3. **Monitor access logs**
4. **Rate limit requests** (implement in code)
5. **Validate inputs** (already done via Pydantic)

### Production Deployment

For stable production deployment:

1. **Use a permanent domain**:
   ```env
   AGENT_ENDPOINT=https://estate-ai.yourdomain.com/submit
   ```

2. **Configure proper DNS** pointing to your server

3. **Use a production seed**:
   ```env
   AGENT_SEED=$(openssl rand -base64 32)
   ```

4. **Switch to mainnet**:
   ```env
   UAGENTS_NETWORK=mainnet
   ```

5. **Add monitoring** and health checks

## Troubleshooting

### Tunnel Won't Start

```bash
# Check if port 8005 is in use
lsof -i :8005

# Kill existing process
kill -9 $(lsof -t -i:8005)

# Try again
./create_tunnel.sh
```

### Agent Not Reachable Externally

1. Verify agent is running: `curl http://localhost:8005/status`
2. Verify tunnel is active (check terminal output)
3. Test tunnel URL directly: `curl https://tunnel-url.trycloudflare.com/status`
4. Check firewall settings
5. Ensure `/submit` is added to endpoint in .env

### Connection Refused on Agentverse

1. Confirm `AGENT_ENDPOINT` in .env includes `/submit`
2. Restart agent after updating .env
3. Check agent logs for errors
4. Verify network matches (testnet/mainnet)

### Tunnel URL Changes

This is normal for free tunnels. Each restart generates a new URL.

**Solution**: Update `.env` with new URL and restart agent:
```bash
# Update AGENT_ENDPOINT in backend/.env
# Then restart
./run_estate_ai.sh
```

## Architecture

```
Internet
   │
   ▼
Cloudflare Tunnel
   │
   ▼
localhost:8005 (Estate.AI Agent)
   │
   ├─► /status       (Health Check)
   ├─► /chat         (Chat Protocol)
   └─► /api/analyze  (REST API)
```

## Alternative Tools

If cloudflared doesn't work, try:

1. **ngrok**:
   ```bash
   ngrok http 8005
   ```

2. **localtunnel**:
   ```bash
   npx localtunnel --port 8005
   ```

3. **SSH Reverse Tunnel** (if you have a VPS):
   ```bash
   ssh -R 8005:localhost:8005 user@your-vps.com
   ```

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `run_estate_ai.sh` | Start agent locally |
| `create_tunnel.sh` | Create public tunnel |
| `setup_public_endpoint.sh` | Interactive setup |
| `test_chat.sh` | Test chat protocol |

## Next Steps

1. ✅ Setup public endpoint
2. ✅ Verify external access
3. 🔲 Register on Agentverse
4. 🔲 Test agent-to-agent communication
5. 🔲 Deploy to production with permanent endpoint

## Support

For issues:
- Check [CHAT_PROTOCOL_SETUP.md](./CHAT_PROTOCOL_SETUP.md)
- Review [README.md](./README.md)
- Test with `./test_chat.sh`

---

**Ready to go public! 🌐🚀**
