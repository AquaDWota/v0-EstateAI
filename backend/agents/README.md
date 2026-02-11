# Estate.AI Agents Directory

This directory contains the AI agents that power Estate.AI's property analysis system.

## 🏗️ Architecture

```
├── Estate_Ai_agent.py          # Main orchestrator agent (Chat Protocol enabled)
├── multifamily_agent.py        # Multi-family property specialist
├── condo_agent.py              # Condo property specialist  
├── townhouse_agent.py          # Townhouse property specialist
├── Single_family_specialist_agent.py  # Single-family specialist
├── protocol_models.py          # Shared Pydantic models
├── example_chat_usage.py       # Chat protocol usage examples
├── test_chat_protocol.py       # Chat protocol test suite
├── run_estate_ai.sh           # Quick start script
└── test_chat.sh               # Test runner script
```

## 🚀 Quick Start

### 1. Start the Estate.AI Agent

```bash
cd /home/cmen/Projects/v0-EstateAI/backend/agents
./run_estate_ai.sh
```

The agent will start on port 8005 with these endpoints:
- **Health Check**: `GET http://127.0.0.1:8005/status`
- **REST API**: `POST http://127.0.0.1:8005/api/analyze`
- **Chat Protocol**: `POST http://127.0.0.1:8005/chat`

### 2. Test the Chat Protocol

In another terminal:

```bash
cd /home/cmen/Projects/v0-EstateAI/backend/agents
./test_chat.sh
```

## 📡 Chat Protocol Integration

Estate.AI now supports the **Fetch.ai Chat Protocol**, making it accessible from anywhere on the Agentverse!

### What This Means

✅ **Agent-to-Agent Communication**: Other agents can chat with Estate.AI  
✅ **Agentverse Integration**: Discoverable on the Agentverse platform  
✅ **Standard Protocol**: Uses Fetch.ai's official chat message format  
✅ **Flexible Analysis**: Send property data via chat for instant analysis  

### Endpoints

#### 1. Health Check
```bash
curl http://127.0.0.1:8005/status
```

Response:
```json
{
  "status": "OK",
  "agent": "Estate.AI Orchestrator",
  "address": "agent1q04xd4gvvp...",
  "network": "testnet"
}
```

#### 2. REST API (Easiest for Testing)
```bash
curl -X POST http://127.0.0.1:8005/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "properties": [{
      "address": "123 Main St",
      "listPrice": 500000,
      "estimatedRent": 3000,
      "type": "",
      "zipCode": "90001"
    }],
    "zipCode": "90001",
    "globalAssumptions": {}
  }'
```

#### 3. Chat Protocol (Agent-to-Agent)
See `example_chat_usage.py` for complete examples.

## 🤖 Property Type Routing

Estate.AI intelligently routes analysis based on property type:

| Property Type | Routing |
|--------------|---------|
| `""` (empty) | → Google Gemini AI (comprehensive analysis) |
| `"single-family"` | → Single Family Specialist Agent |
| `"multi-family"` | → Multi-Family Specialist Agent ✅ |
| `"condo"` | → Condo Specialist Agent ✅ |
| `"townhouse"` | → Townhouse Specialist Agent |

✅ = Currently active  
⏸️ = Commented out (uncomment in Estate_Ai_agent.py to activate)

## 🔧 Environment Setup

Required environment variables (create `backend/.env`):

```env
# Google Gemini API (for untyped properties)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-latest

# MongoDB
MONGODB_URI=mongodb+srv://your_connection
MONGODB_DB=EstateAI
MONGODB_COLLECTION=Sample-Listing

# Agent Configuration (optional)
UAGENTS_NETWORK=testnet
SPECIALIST_TIMEOUT=60

# For production deployment
AGENT_SEED_PHRASE=your_secure_seed
AGENT_EXTERNAL_ENDPOINT=https://your-domain.com/submit
AGENTVERSE_API_KEY=your_agentverse_key
```

## 📝 Usage Examples

### Example 1: Using Python Script
```python
# See example_chat_usage.py for complete code
python example_chat_usage.py
```

### Example 2: Direct API Call
```python
import requests

response = requests.post(
    "http://127.0.0.1:8005/api/analyze",
    json={
        "properties": [{
            "address": "123 Main St",
            "listPrice": 500000,
            "type": "condo",
            "zipCode": "90001"
        }],
        "zipCode": "90001",
        "globalAssumptions": {}
    }
)

print(response.json())
```

### Example 3: Agent-to-Agent
```python
from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import ChatMessage, TextContent

my_agent = Agent(name="MyAgent", seed="my-seed", port=8006)

@my_agent.on_event("startup")
async def send_to_estate_ai(ctx: Context):
    await ctx.send(
        "agent1q04xd4gvvp...",  # Estate.AI address
        ChatMessage([TextContent('{"address": "123 Main St", "type": "condo"}')])
    )

my_agent.run()
```

## 🧪 Testing

### Run All Tests
```bash
./test_chat.sh
```

### Run Specific Test
```bash
source ../.venv/bin/activate
python test_chat_protocol.py
```

### Test Individual Agents
```bash
source ../.venv/bin/activate

# Test multifamily agent
python multifamily_agent.py

# Test condo agent  
python condo_agent.py
```

## 📚 Documentation

- **[CHAT_PROTOCOL_SETUP.md](CHAT_PROTOCOL_SETUP.md)** - Comprehensive chat protocol guide
- **[example_chat_usage.py](example_chat_usage.py)** - Working code examples
- **[test_chat_protocol.py](test_chat_protocol.py)** - Test suite

## 🔍 Troubleshooting

### Agent Won't Start
```bash
# Check if port 8005 is already in use
lsof -i :8005

# Kill existing process
kill -9 $(lsof -t -i:8005)

# Try again
./run_estate_ai.sh
```

### Import Errors
```bash
# Reinstall dependencies
source ../.venv/bin/activate
pip install -r ../requirements.txt
```

### Gemini API Errors
- Check `GEMINI_API_KEY` is set correctly in `backend/.env`
- Verify model name: `gemini-2.5-flash-latest`
- Monitor rate limits (429 errors)

### Chat Protocol Not Working
- Verify agent is running: `curl http://127.0.0.1:8005/status`
- Check network matches sender's network (testnet/mainnet)
- Ensure proper envelope format for chat messages

## 🌐 Deployment

### Local Development
```bash
./run_estate_ai.sh
```

### Production (Agentverse)

1. Update agent configuration in `Estate_Ai_agent.py`:
```python
agent = Agent(
    name="Estate-Ai",
    seed=os.getenv("AGENT_SEED_PHRASE"),  # Secure seed
    port=8005,
    mailbox=True,
    endpoint=[os.getenv("AGENT_EXTERNAL_ENDPOINT")],  # Public URL
    network="mainnet",  # Use mainnet for production
)
```

2. Set environment variables:
```env
AGENT_SEED_PHRASE=your_secure_seed_phrase
AGENT_EXTERNAL_ENDPOINT=https://your-domain.com/submit
AGENTVERSE_API_KEY=your_api_key
```

3. Run the agent:
```bash
./run_estate_ai.sh
```

4. Register on Agentverse:
   - Visit https://agentverse.ai
   - Your agent will be automatically discoverable
   - Share your agent address with users

## 🎯 Key Features

✅ **Chat Protocol Support** - Standard Fetch.ai chat message format  
✅ **REST API** - Easy HTTP endpoint for testing  
✅ **Type-based Routing** - Intelligent specialist selection  
✅ **Gemini Integration** - AI analysis for untyped properties  
✅ **Health Monitoring** - Status endpoint for uptime checks  
✅ **Mailbox Enabled** - Async messaging support  
✅ **Testnet Ready** - Safe testing environment  

## 📞 Support

For issues or questions:
1. Check the documentation in `CHAT_PROTOCOL_SETUP.md`
2. Review examples in `example_chat_usage.py`
3. Run tests with `./test_chat.sh`
4. Check agent logs for error messages

## 🔗 Related Documentation

- [Fetch.ai uAgents Documentation](https://docs.fetch.ai/uagents/)
- [Chat Protocol Specification](https://docs.fetch.ai/guides/agents/intermediate/communicating-with-other-agents)
- [Agentverse Platform](https://agentverse.ai)
- [Google Gemini API](https://ai.google.dev/docs)

---

**Happy Agent Building! 🤖🏡**
