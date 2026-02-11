# Chat Protocol Setup for Estate.AI Agent

## Overview
The Estate.AI agent now includes a Chat Protocol endpoint that makes it accessible from anywhere on the Fetch.ai Agentverse. This allows other agents, users, or applications to interact with Estate.AI through the standard chat protocol.

## Features

### 1. Health Check Endpoint
**URL**: `GET /status`

Returns the current status of the Estate.AI agent:
```json
{
  "status": "OK",
  "agent": "Estate.AI Orchestrator",
  "address": "agent1...",
  "network": "testnet"
}
```

### 2. Chat Protocol Endpoint
**URL**: `POST /chat`

Accepts chat messages in the standard Fetch.ai envelope format.

#### Functionality:
- **Property Data Analysis**: Send property JSON data for analysis
- **Gemini AI Analysis**: For properties without a type field
- **Specialist Routing**: Routes to specialist agents based on property type
- **General Inquiries**: Responds with help information

## How It Works

### Property Analysis Flow

1. **Send Property Data** via chat message:
```json
{
  "address": "123 Main St",
  "listPrice": 500000,
  "estimatedRent": 3000,
  "type": "single-family",
  "zipCode": "12345",
  "bedrooms": 3,
  "bathrooms": 2,
  "sqft": 1800
}
```

2. **Routing Logic**:
   - **Empty type**: Uses Google Gemini for comprehensive AI analysis
   - **"single-family"**: Routes to Single Family specialist agent
   - **"multi-family"**: Routes to Multi-Family specialist agent
   - **"condo"**: Routes to Condo specialist agent
   - **"townhouse"**: Routes to Townhouse specialist agent

3. **Response**: Receives structured investment analysis

## Agent Configuration

The Estate.AI agent is configured with:
- **Name**: Estate-Ai
- **Seed**: selector-agent
- **Port**: 8005
- **Mailbox**: Enabled (for async messaging)
- **Network**: testnet
- **Endpoint**: http://127.0.0.1:8005/submit

## Accessing from Agentverse

### Method 1: Direct Agent-to-Agent Communication
```python
from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import ChatMessage, TextContent

# Your agent
my_agent = Agent(name="my_agent", seed="my_seed")

@my_agent.on_event("startup")
async def send_to_estate_ai(ctx: Context):
    estate_ai_address = "agent1q04xd4gvvp..."  # Estate.AI address
    
    property_data = {
        "address": "123 Main St",
        "listPrice": 500000,
        "type": "condo"
    }
    
    await ctx.send(
        estate_ai_address,
        ChatMessage([TextContent(json.dumps(property_data))])
    )
```

### Method 2: HTTP POST to Chat Endpoint
```python
import requests
from uagents_core.envelope import Envelope
from uagents_core.identity import Identity

# Create your identity
my_identity = Identity.from_seed("my_seed_phrase", 0)

# Prepare your message
property_data = {
    "address": "123 Main St",
    "listPrice": 500000,
    "type": "multi-family"
}

# Send to Estate.AI
response = requests.post(
    "http://127.0.0.1:8005/chat",
    json={
        "sender": my_identity.address,
        "message": json.dumps(property_data)
    }
)
```

### Method 3: Using Agentverse Dashboard
1. Go to [Agentverse Dashboard](https://agentverse.ai)
2. Find Estate.AI agent by address
3. Use the chat interface to send messages
4. Send property JSON data for analysis

## Environment Variables Required

```bash
# Google Gemini API (for untyped properties)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-latest

# Agent Network (optional, defaults to testnet)
UAGENTS_NETWORK=testnet

# Specialist timeout (optional, defaults to 60 seconds)
SPECIALIST_TIMEOUT=60

# For production deployment
AGENT_SEED_PHRASE=your_secure_seed_phrase
AGENT_EXTERNAL_ENDPOINT=https://your-domain.com/submit
```

## Running the Agent

### Local Development
```bash
cd backend/agents
python Estate_Ai_agent.py
```

### Production Deployment
For production, you should:
1. Set `AGENT_EXTERNAL_ENDPOINT` to your public URL
2. Use a secure `AGENT_SEED_PHRASE`
3. Enable HTTPS for the endpoint
4. Update the agent configuration:

```python
agent = Agent(
    name="Estate-Ai",
    seed=os.getenv("AGENT_SEED_PHRASE", "selector-agent"),
    port=8005,
    mailbox=True,
    endpoint=[os.getenv("AGENT_EXTERNAL_ENDPOINT", "http://127.0.0.1:8005/submit")],
    network=os.getenv("UAGENTS_NETWORK", "testnet"),
)
```

## Example Chat Interactions

### Example 1: Property with No Type (Gemini Analysis)
**Input**:
```json
{
  "address": "456 Oak Ave",
  "listPrice": 350000,
  "estimatedRent": 2200,
  "type": "",
  "zipCode": "90210"
}
```

**Response**:
```
Estate.AI Analysis (Gemini):

PROPERTY OVERVIEW
456 Oak Ave is listed at $350,000 with estimated rent of $2,200/month...
[Full 200-word analysis]
```

### Example 2: Condo Property (Specialist Routing)
**Input**:
```json
{
  "address": "789 Beach Blvd Unit 5A",
  "listPrice": 400000,
  "estimatedRent": 2500,
  "type": "condo",
  "zipCode": "33139"
}
```

**Response**:
```
Property type 'condo' received. Routing to condo specialist agent for detailed analysis.
```

### Example 3: General Inquiry
**Input**:
```
Hello, what can you do?
```

**Response**:
```
Hello! I'm Estate.AI, your real estate investment orchestrator.

Send me property data in JSON format with these fields:
- address (string)
- listPrice (number)
- estimatedRent (number)
- type (string): "single-family", "multi-family", "condo", or "townhouse"
... and more
```

## Specialist Agent Integration

The Estate.AI agent coordinates with specialist agents:

| Property Type | Specialist | Status |
|--------------|-----------|---------|
| multi-family | Multi-Family Agent | ✅ Active |
| condo | Condo Agent | ✅ Active |
| single-family | Single Family Agent | ⏸️ Commented |
| townhouse | Townhouse Agent | ⏸️ Commented |

To activate additional specialists, uncomment their addresses in `Estate_Ai_agent.py`:
```python
SPECIALISTS: Dict[str, str] = {
    "single_family": "agent1qgvq...",  # Uncomment to activate
    "multi_family": "agent1qwn4...",
    "condo": "agent1qv0f...",
    "townhouse": "agent1qd9l...",  # Uncomment to activate
}
```

## Monitoring and Debugging

### Check Agent Status
```bash
curl http://127.0.0.1:8005/status
```

### View Agent Logs
The agent logs all incoming messages and routing decisions:
```
📨 Received chat message from agent1xxx: {"address": "123 Main St"...}
🤖 Analyzing with Gemini (no type specified)
✅ Responded to agent1xxx
```

### Test Chat Endpoint
```bash
# Using curl (requires proper envelope format)
curl -X POST http://127.0.0.1:8005/chat \
  -H "Content-Type: application/json" \
  -d '{"sender": "test", "message": "Hello"}'
```

## Security Considerations

1. **API Keys**: Keep GEMINI_API_KEY secure, never commit to Git
2. **Network**: Use `mainnet` for production, `testnet` for development
3. **Endpoint**: Use HTTPS for production endpoints
4. **Rate Limiting**: Consider adding rate limiting for public endpoints
5. **Input Validation**: All property data is validated through Pydantic models

## Troubleshooting

### Agent Not Responding
- Check if agent is running: `curl http://127.0.0.1:8005/status`
- Verify GEMINI_API_KEY is set
- Check network configuration matches sender's network

### Specialist Not Routing
- Verify specialist address is uncommented in SPECIALISTS dict
- Check specialist agent is running
- Review timeout settings (default 60s)

### Gemini API Errors
- Check API key validity
- Verify model name is correct (gemini-2.5-flash-latest)
- Monitor rate limits (429 errors)

## Future Enhancements

- [ ] Add authentication for chat endpoint
- [ ] Implement message queue for high-volume requests
- [ ] Add webhook notifications for completed analyses
- [ ] Integrate with Agentverse marketplace
- [ ] Add support for batch property analysis
- [ ] Implement caching for frequent queries

## Reference Links

- [uagents Documentation](https://docs.fetch.ai/uagents/)
- [Chat Protocol Spec](https://docs.fetch.ai/guides/agents/intermediate/communicating-with-other-agents)
- [Agentverse Platform](https://agentverse.ai)
- [Google Gemini API](https://ai.google.dev/docs)
