# Estate AI Agent Integration Guide

## Overview

This project uses a multi-agent system for real estate investment analysis:

- **Estate_AI_agent.py**: Main orchestrator agent that routes property data
- **Specialist agents**: Analyze specific property types (multi-family, condo, townhouse, single-family)

## Architecture

```
Frontend (Next.js) 
  → API Route (/app/api/analyze/route.ts)
    → FastAPI Backend (/backend/main.py)
      → Estate_AI_agent (Port 8005)
        → Specialist Agents (if type specified)
        → Gemini AI (if type is empty)
```

## Property Routing Logic

The Estate_AI_agent routes properties based on the `type` field in PropertyInput:

1. **If `type` is specified** (e.g., "single-family", "multi-family", "condo", "townhouse"):
   - Routes to the appropriate specialist agent
   - Specialist agent retrieves properties from the property API
   - Returns specialized analysis

2. **If `type` is empty** (`""`):
   - Uses Gemini AI directly for general analysis
   - Provides comprehensive investment analysis
   - Ends session after response

## Setup Instructions

### 1. Configure Environment Variables

#### Backend Agents (`/backend/agents/.env`):
```bash
cp /backend/agents/.env.example /backend/agents/.env
```

Edit `.env` and add:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
UAGENTS_NETWORK=testnet
SPECIALIST_TIMEOUT=60
```

#### Backend API (`/backend/.env`):
```bash
cp /backend/.env.example /backend/.env
```

Edit `.env` and add:
```env
MONGODB_URI=your_mongodb_uri
AGENTVERSE_API_KEY=your_agentverse_api_key_here  # Optional
```

### 2. Install Dependencies

```bash
# Backend Python dependencies
cd backend
pip install -r requirements.txt

# Frontend dependencies
cd ..
npm install
```

### 3. Run the Agents

Start the Estate AI agent (and specialists if needed):

```bash
cd backend/agents

# Start Estate AI orchestrator agent
python Estate_Ai_agent.py

# In separate terminals, start specialist agents:
python multifamily_agent.py
python condo_agent.py
python Single_family_specialist_agent.py
python townhouse_agent.py
```

### 4. Run the Backend API

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 5. Run the Frontend

```bash
npm run dev
```

## Data Flow

### With Property Type Specified

```json
{
  "id": "prop-001",
  "nickname": "Boston Triple Decker",
  "address": "123 Main St, Boston, MA",
  "zipCode": "02118",
  "type": "multi-family",  // ← Type specified
  "listPrice": 750000,
  "estimatedRent": 4500,
  // ... other fields
}
```

Flow:
1. Frontend sends to `/api/analyze`
2. FastAPI processes and sends to Estate_AI_agent
3. Estate_AI_agent routes to `multifamily_agent` based on type
4. Multifamily agent analyzes and returns specialized insights
5. Response flows back to frontend

### Without Property Type (Empty String)

```json
{
  "id": "prop-001",
  "nickname": "Investment Property",
  "address": "123 Main St, Boston, MA",
  "zipCode": "02118",
  "type": "",  // ← Empty type
  "listPrice": 750000,
  "estimatedRent": 4500,
  // ... other fields
}
```

Flow:
1. Frontend sends to `/api/analyze`
2. FastAPI processes and sends to Estate_AI_agent
3. Estate_AI_agent detects empty type
4. **Gemini AI generates comprehensive analysis directly**
5. Agent ends session and returns analysis
6. Response flows back to frontend

## API Endpoints

### FastAPI (Backend)

- `POST /analyze-properties`: Direct property analysis without agents
- `POST /api/agent-commentary`: Property analysis with AI agent commentary
- `GET /api/properties/{zip_code}`: Get properties by ZIP code

### Next.js API Routes

- `POST /api/analyze`: Main analysis endpoint used by frontend
- `GET /api/properties`: Property data endpoints
- `GET /api/properties/[id]`: Individual property details

## Testing the Integration

### Test with empty type (Gemini analysis):

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
    }]
  }'
```

### Test with specified type (Specialist routing):

Same request but change:
```json
"type": "multi-family"
```

## Troubleshooting

### Agent not receiving messages
- Ensure Estate_AI_agent is running on port 8005
- Check that GEMINI_API_KEY is set in agents/.env
- Verify network connectivity

### Empty type not triggering Gemini
- Check Estate_AI_agent logs for "Property has empty type field"
- Verify GEMINI_API_KEY is valid
- Review agent console output for errors

### Specialist agents not responding
- Ensure specialist agents are running (multifamily_agent.py, etc.)
- Check SPECIALISTS dict in Estate_Ai_agent.py has correct addresses
- Verify agents are on the same network (testnet)

## Development Notes

- Estate_AI_agent runs on port 8005
- Specialist agents run on ports 8010, 8011, 8012, 8013
- All agents use the testnet network by default
- Timeout for specialist responses: 60 seconds (configurable)

## Future Enhancements

- [ ] Add support for batch property analysis
- [ ] Implement caching for repeated ZIP code queries
- [ ] Add WebSocket support for real-time updates
- [ ] Integrate with Agentverse for production deployment
- [ ] Add authentication and rate limiting
