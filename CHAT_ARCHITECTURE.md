# Estate.AI Chat Protocol Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AGENTVERSE                               │
│                     (Fetch.ai Network)                           │
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │ External     │      │   Other      │      │  Agentverse  │  │
│  │ Agents       │◄────►│   Estate.AI  │◄────►│  Dashboard   │  │
│  │              │      │   Agent      │      │              │  │
│  └──────────────┘      └──────┬───────┘      └──────────────┘  │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                │ Chat Protocol
                                │ (Envelope Format)
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      LOCAL/PRODUCTION SERVER                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Estate.AI Agent (Port 8005)                     │  │
│  │                                                           │  │
│  │  ┌─────────────┐                                         │  │
│  │  │ /status     │  Health Check                           │  │
│  │  └─────────────┘                                         │  │
│  │                                                           │  │
│  │  ┌─────────────┐                                         │  │
│  │  │ /chat       │  Chat Protocol Endpoint                 │  │
│  │  └──────┬──────┘  (Receives Envelope)                    │  │
│  │         │                                                 │  │
│  │         │         ┌──────────────────┐                   │  │
│  │         └────────►│ Message Parser   │                   │  │
│  │                   └────────┬─────────┘                   │  │
│  │                            │                             │  │
│  │                   ┌────────▼─────────┐                   │  │
│  │                   │ Property Type    │                   │  │
│  │                   │ Router           │                   │  │
│  │                   └────────┬─────────┘                   │  │
│  │                            │                             │  │
│  │           ┌────────────────┼────────────────┐            │  │
│  │           │                │                │            │  │
│  │           ▼                ▼                ▼            │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │  │
│  │  │ Type=""      │ │ Type="condo" │ │ Type="multi  │    │  │
│  │  │              │ │              │ │ -family"     │    │  │
│  │  │ Gemini AI    │ │ Condo Agent  │ │ Multifamily  │    │  │
│  │  │ Analysis     │ │ Specialist   │ │ Specialist   │    │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘    │  │
│  │                                                           │  │
│  │  ┌─────────────┐                                         │  │
│  │  │/api/analyze │  REST Endpoint (FastAPI Backend)        │  │
│  │  └─────────────┘                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          FastAPI Backend (Port 8000)                     │  │
│  │                                                           │  │
│  │  POST /api/agent-commentary                              │  │
│  │       │                                                   │  │
│  │       └──────► Calls Estate.AI via REST API              │  │
│  │                http://127.0.0.1:8005/api/analyze         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Next.js Frontend (Port 3000)                    │  │
│  │                                                           │  │
│  │  Property Form  ──►  POST /api/analyze  ──►  FastAPI     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Message Flow

### 1. Chat Protocol Message (Agentverse → Estate.AI)

```
External Agent
     │
     │ ChatMessage with property JSON
     │
     ▼
Estate.AI /chat endpoint
     │
     │ Parse Envelope
     │ Extract property data
     │
     ▼
Check property.type field
     │
     ├─── type="" ─────► Gemini AI Analysis
     │                   └─► Return 200-word analysis
     │
     └─── type="condo" ─► Route to Condo Specialist
                          └─► Return specialist analysis
```

### 2. REST API Message (Frontend → Estate.AI)

```
Next.js Frontend
     │
     │ Property form submission
     │
     ▼
FastAPI Backend (/api/agent-commentary)
     │
     │ HTTP POST with properties
     │
     ▼
Estate.AI (/api/analyze)
     │
     │ Process each property
     │
     ├─► Property 1 (type="") ────► Gemini
     ├─► Property 2 (type="condo") ► Condo Specialist
     └─► Property 3 (type="multi-family") ► Multifamily Specialist
     │
     │ Combine results
     │
     ▼
Return JSON response
     │
     ▼
FastAPI formats for frontend
     │
     ▼
Frontend displays analysis
```

## Property Type Routing

| Input Type       | Destination           | Analysis Method         |
|------------------|-----------------------|-------------------------|
| `""` (empty)     | Gemini AI             | AI-generated 200+ words |
| `"single-family"`| Single Family Agent   | Specialist analysis     |
| `"multi-family"` | Multi-Family Agent    | Specialist analysis     |
| `"condo"`        | Condo Agent           | Specialist analysis     |
| `"townhouse"`    | Townhouse Agent       | Specialist analysis     |

## Endpoint Details

### Health Check
- **URL**: `GET /status`
- **Response**: Agent status and address
- **Usage**: Monitoring and getting agent address

### Chat Protocol
- **URL**: `POST /chat`
- **Format**: Envelope with ChatMessage
- **Usage**: Agent-to-agent communication via Agentverse
- **Features**:
  - Accepts property JSON in message content
  - Routes based on property type
  - Returns analysis via ChatMessage response

### REST API
- **URL**: `POST /api/analyze`
- **Format**: PropertyAnalysisRequest JSON
- **Usage**: Direct HTTP integration (no envelope required)
- **Features**:
  - Batch property analysis
  - Global assumptions support
  - Structured JSON response

## Security & Access

### Local Development
- Agent runs on `localhost:8005`
- Accessible only from local machine
- Network: testnet

### Production Deployment
- Set `AGENT_EXTERNAL_ENDPOINT` environment variable
- Use HTTPS for secure communication
- Enable mailbox for async messaging
- Network: mainnet (recommended)
- Register on Agentverse for discoverability

## Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional
GEMINI_MODEL=gemini-2.5-flash-latest
UAGENTS_NETWORK=testnet
SPECIALIST_TIMEOUT=60
AGENT_SEED_PHRASE=your_secure_seed
AGENT_EXTERNAL_ENDPOINT=https://your-domain.com/submit
```

## Testing the Chat Protocol

### 1. Check Agent Status
```bash
curl http://127.0.0.1:8005/status
```

### 2. Test REST API
```bash
python backend/agents/test_chat_protocol.py
```

### 3. Test Agent-to-Agent Communication
```bash
python backend/agents/example_chat_usage.py
```

### 4. Access from Agentverse
1. Get agent address from `/status` endpoint
2. Visit https://agentverse.ai
3. Search for agent by address
4. Use chat interface to send property data

## Integration Examples

See the following files for detailed examples:
- `backend/agents/CHAT_PROTOCOL_SETUP.md` - Full setup guide
- `backend/agents/test_chat_protocol.py` - Test suite
- `backend/agents/example_chat_usage.py` - Integration examples
