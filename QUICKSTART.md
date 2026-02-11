# Quick Start Guide - Estate AI Integration

## What Changed

The system now properly connects the frontend to the Estate_AI_agent with full support for property type routing:

### 1. **Backend Integration** (`backend/main.py`)
- Added `send_message_to_agent()` function to communicate with agents
- Updated `call_agent_with_analysis_data()` to send PropertyInput data to Estate_AI_agent
- Supports both local agent (port 8005) and Agentverse mailbox

### 2. **Agent Updates** (`backend/agents/Estate_Ai_agent.py`)
- Routes properties based on `type` field
- Empty type (`""`) → Uses Gemini AI for comprehensive analysis
- Specified type → Routes to specialist agents (multi-family, condo, etc.)
- Enhanced Gemini prompt for better property analysis

### 3. **Frontend Updates**
- **TypeScript types** (`lib/types.ts`): Added `type` field to PropertyInput
- **Property form** (`components/underwrite/property-form.tsx`): Added property type dropdown
- **Mock data** (`lib/mock-data.ts`): Properties default to empty type

## Setup Steps

### 1. Configure Environment Variables

```bash
# Backend agents
cd backend/agents
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Backend API
cd ../
cp .env.example .env
# Edit .env and add MONGODB_URI and optionally AGENTVERSE_API_KEY
```

### 2. Start the System

**Terminal 1 - Estate AI Agent:**
```bash
cd backend/agents
python Estate_Ai_agent.py
```

**Terminal 2 - Specialist Agents (optional):**
```bash
cd backend/agents
python multifamily_agent.py  # Port 8011
# python condo_agent.py       # Port 8012
# etc.
```

**Terminal 3 - Backend API:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 4 - Frontend:**
```bash
npm run dev
```

### 3. Test the Integration

**Option A - Use the test script:**
```bash
cd backend
python test_agent_integration.py
```

**Option B - Use the frontend:**
1. Go to http://localhost:3000/underwrite
2. Add properties and select a property type (or leave as "General AI Analysis")
3. Click "Analyze Properties"
4. View the AI-generated analysis

**Option C - Direct API test:**
```bash
curl -X POST http://localhost:8000/api/agent-commentary \
  -H "Content-Type: application/json" \
  -d '{
    "zipCode": "02118",
    "globalAssumptions": {
      "defaultVacancyRatePercent": 5,
      "defaultAppreciationRatePercent": 3,
      "defaultMaintenancePercent": 1
    },
    "properties": [{
      "id": "1",
      "nickname": "Test Property",
      "address": "123 Test St",
      "zipCode": "02118",
      "type": "",
      "listPrice": 500000,
      "estimatedRent": 3000,
      "propertyTaxPerYear": 6000,
      "insurancePerYear": 1200,
      "hoaPerYear": 0,
      "maintenancePerMonth": 200,
      "utilitiesPerMonth": 150,
      "vacancyRatePercent": 5,
      "downPaymentPercent": 20,
      "interestRatePercent": 6.5,
      "loanTermYears": 30,
      "closingCosts": 10000,
      "renovationBudget": 0,
      "arv": 500000
    }, {
      "id": "2",
      "nickname": "Test Property 2",
      "address": "456 Test Ave",
      "zipCode": "02118",
      "type": "",
      "listPrice": 450000,
      "estimatedRent": 2800,
      "propertyTaxPerYear": 5500,
      "insurancePerYear": 1100,
      "hoaPerYear": 0,
      "maintenancePerMonth": 180,
      "utilitiesPerMonth": 140,
      "vacancyRatePercent": 5,
      "downPaymentPercent": 20,
      "interestRatePercent": 6.5,
      "loanTermYears": 30,
      "closingCosts": 9000,
      "renovationBudget": 0,
      "arv": 450000
    }]
  }'
```

## How It Works

### Data Flow Diagram

```
User fills form → Frontend (Next.js)
                     ↓
                 POST /api/analyze
                     ↓
            analysis-logic.ts (calculate metrics)
                     ↓
        Backend API (FastAPI) /api/agent-commentary
                     ↓
         send_message_to_agent() → Estate_AI_agent (port 8005)
                                         ↓
                       ┌─────────────────┴──────────────────┐
                       ↓                                    ↓
              type == "" ?                          type specified?
                       ↓                                    ↓
              Gemini AI Analysis              Route to Specialist Agent
                       ↓                                    ↓
            (Comprehensive report)          (Property-type-specific analysis)
                       ↓                                    ↓
                       └─────────────────┬──────────────────┘
                                         ↓
                         Response → Backend → Frontend → User
```

### Property Type Routing

| Property Type | Behavior |
|---------------|----------|
| `""` (empty) | Gemini AI provides comprehensive general analysis |
| `"single-family"` | Routes to Single Family Specialist Agent |
| `"multi-family"` | Routes to Multi-Family Specialist Agent |
| `"condo"` | Routes to Condo Specialist Agent |
| `"townhouse"` | Routes to Townhouse Specialist Agent |

## Troubleshooting

### Issue: "Cannot connect to agent on port 8005"
**Solution:** Start the Estate_AI_agent:
```bash
cd backend/agents
python Estate_Ai_agent.py
```

### Issue: "Missing GEMINI_API_KEY env var"
**Solution:** Add your Gemini API key to `backend/agents/.env`:
```env
GEMINI_API_KEY=your_key_here
```

### Issue: "Agent not responding / timeout"
**Possible causes:**
1. Agent not running → Start Estate_Ai_agent.py
2. Wrong network → Check UAGENTS_NETWORK in .env (should be "testnet")
3. Port conflict → Check nothing else is using port 8005

### Issue: "TypeError: PropertyInput missing 'type' field"
**Solution:** This was fixed by adding `type: ""` to all PropertyInput objects. If you see this:
1. Clear browser cache
2. Restart the development server
3. Verify `lib/mock-data.ts` includes `type: ""` in property objects

## Testing Checklist

- [ ] Estate_AI_agent starts without errors on port 8005
- [ ] Backend API starts on port 8000
- [ ] Frontend starts on port 3000
- [ ] Can add properties in the UI
- [ ] Property type dropdown appears in form
- [ ] Test script runs successfully
- [ ] Analysis with empty type returns Gemini response
- [ ] Analysis with specific type routes to specialist (if agent is running)
- [ ] Chat protocol health check returns status
- [ ] REST API endpoint accepts property data

## Chat Protocol Integration

Estate.AI now supports the **Fetch.ai Chat Protocol**, making it accessible from anywhere on the Agentverse!

### Quick Start

```bash
# Start the agent with chat protocol support
cd backend/agents
./run_estate_ai.sh
```

### Test the Integration

```bash
# In another terminal
cd backend/agents
./test_chat.sh
```

### Endpoints Available

1. **Health Check**: `GET http://127.0.0.1:8005/status`
2. **REST API**: `POST http://127.0.0.1:8005/api/analyze`
3. **Chat Protocol**: `POST http://127.0.0.1:8005/chat`

### Get Your Agent Address

```bash
curl http://127.0.0.1:8005/status
```

This returns your agent's address for Agentverse integration.

### Documentation

- **Comprehensive Guide**: [backend/agents/CHAT_PROTOCOL_SETUP.md](./backend/agents/CHAT_PROTOCOL_SETUP.md)
- **Usage Examples**: [backend/agents/example_chat_usage.py](./backend/agents/example_chat_usage.py)
- **Test Suite**: [backend/agents/test_chat_protocol.py](./backend/agents/test_chat_protocol.py)
- **Agent README**: [backend/agents/README.md](./backend/agents/README.md)

## Next Steps

1. **Production Deployment:**
   - Deploy agents to Agentverse with public endpoints
   - Update agent addresses in Estate_Ai_agent.py SPECIALISTS dict
   - Add AGENTVERSE_API_KEY to backend .env
   - Set AGENT_EXTERNAL_ENDPOINT for public access
   - Use network="mainnet" for production

2. **Enhanced Features:**
   - Add loading states during agent processing
   - Display detailed analysis in a modal
   - Save analysis results to database
   - Add comparison view for multiple analyst responses
   - Implement retry logic for Gemini rate limits

3. **Monitoring:**
   - Add logging for agent responses
   - Track response times
   - Monitor success/failure rates
   - Set up health check monitoring

4. **Agentverse Integration:**
   - Register Estate.AI on Agentverse marketplace
   - Enable discovery for other agents
   - Add webhook notifications for completed analyses
   - Implement agent-to-agent collaboration

## Support

For detailed documentation, see:
- [AGENT_INTEGRATION.md](./AGENT_INTEGRATION.md) - Complete integration guide
- [backend/agents/README.md](./backend/agents/README.md) - Agents documentation
- [backend/agents/CHAT_PROTOCOL_SETUP.md](./backend/agents/CHAT_PROTOCOL_SETUP.md) - Chat protocol guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
