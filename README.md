# EstateAI - AI-Powered Real Estate Investment Analysis Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/rahulsaini5014-4933s-projects/v0-estate-ai)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/eaeyzKPFElE)

## Overview

EstateAI is an AI-powered real estate investment analysis platform designed specifically for New England properties. It combines modern web technologies with intelligent agents to provide comprehensive property underwriting, interactive mapping, and investment insights.

### Key Features

- **🗺️ Interactive Map View** - Explore properties with an intuitive Leaflet-based map interface
- **📊 Comprehensive Deal Analysis** - Calculate key metrics: cash flow, ROI, cap rate, cash-on-cash returns
- **🤖 AI-Powered Insights** - Property-type-specific agents (Single-Family, Multi-Family, Condo, Townhouse) provide tailored investment commentary via Fetch.ai's Agentverse
- **📈 5-Year Projections** - Timeline forecasts showing equity build-up and cumulative returns
- **🎯 Risk Assessment** - Automated risk scoring and timing recommendations (buy now, watch, avoid)
- **🔍 Smart Property Filtering** - Filter by price, bedrooms, bathrooms, and property type
- **📋 Side-by-Side Comparisons** - Compare up to 5 properties simultaneously

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1 (React 19)
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4.1
- **Maps**: Leaflet & React-Leaflet
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts

### Backend
- **API Framework**: FastAPI (Python)
- **Database**: MongoDB with PyMongo
- **AI Agents**: Fetch.ai uAgents & Agentverse
- **Server**: Uvicorn

### DevOps
- **Deployment**: Vercel (Frontend), AWS Lambda compatible (Backend via Mangum)
- **Testing**: Pytest for Python backend
- **Environment**: Python-dotenv for configuration

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── page.tsx             # Home page with address search
│   ├── map/                 # Interactive property map
│   ├── underwrite/          # Deal analysis interface
│   ├── about/               # About page
│   └── api/                 # Next.js API routes
│       ├── analyze/         # TypeScript analysis endpoint
│       └── properties/      # Property data endpoints
├── backend/                 # Python FastAPI backend
│   ├── main.py             # FastAPI app & routes
│   ├── models.py           # Pydantic models
│   ├── logic.py            # Core underwriting calculations
│   ├── db.py               # MongoDB connection
│   └── agent/              # AI agent integration
│       └── agent.py        # Agentverse client
├── components/              # Reusable React components
│   ├── map/                # Map-related components
│   ├── underwrite/         # Underwriting UI components
│   └── ui/                 # Shadcn UI components
├── lib/                     # Shared TypeScript utilities
│   ├── types.ts            # TypeScript type definitions
│   ├── analysis-logic.ts   # Frontend analysis logic
│   └── map-types.ts        # Map-related types
└── data/                    # Sample data
    └── sample-listings.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- MongoDB instance (local or MongoDB Atlas)
- Fetch.ai Agentverse account (for AI agents)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/v0-EstateAI.git
cd v0-EstateAI
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
pip install -r backend/requirements.txt
```

4. **Configure environment variables**

Create a `.env` file in the `backend/` directory:
```env
MONGODB_URI=mongodb+srv://your-connection-string
MONGODB_DB=EstateAI
MONGODB_COLLECTION=Sample-Listing
```

### Running the Application

**Start the Next.js frontend:**
```bash
npm run dev
```
Frontend will be available at `http://localhost:3000`

**Start the Python backend:**
```bash
uvicorn backend.main:app --reload --port 8000
```
API will be available at `http://localhost:8000`

Access the API documentation at `http://localhost:8000/docs`

## API Documentation

### Backend Endpoints

#### POST `/analyze-properties`
Analyzes 2-5 properties and returns comprehensive investment metrics.

**Request Body:**
```json
{
  "zipCode": "02134",
  "globalAssumptions": {
    "defaultVacancyRatePercent": 5,
    "defaultAppreciationRatePercent": 3,
    "defaultMaintenancePercent": 1
  },
  "properties": [
    {
      "id": "1",
      "nickname": "Property A",
      "address": "123 Main St",
      "zipCode": "02134",
      "listPrice": 500000,
      "estimatedRent": 2500,
      "propertyTaxPerYear": 5000,
      "insurancePerYear": 1200,
      "hoaPerYear": 0,
      "maintenancePerMonth": 200,
      "utilitiesPerMonth": 150,
      "vacancyRatePercent": 5,
      "downPaymentPercent": 20,
      "interestRatePercent": 6.5,
      "loanTermYears": 30,
      "closingCosts": 15000,
      "renovationBudget": 0,
      "arv": 500000
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "property": { /* property details */ },
      "metrics": {
        "monthlyMortgagePayment": 2528.27,
        "monthlyOperatingExpenses": 933.33,
        "monthlyNOI": 1566.67,
        "monthlyCashFlow": 633.40,
        "capRatePercent": 4.5,
        "cashOnCashReturnPercent": 7.2,
        "fiveYearTotalRoiPercent": 52.3,
        "fiveYearEquityBuilt": 45231.50,
        "fiveYearTotalCashFlow": 38004.00,
        "riskLevel": "low",
        "timingRecommendation": "buy_now"
      },
      "timeline": [ /* 5-year projections */ ],
      "commentary": {
        "cashFlowSummary": "Strong positive cash flow...",
        "riskSummary": "Low risk profile...",
        "marketTimingSummary": "Favorable market conditions...",
        "renovationSummary": "No renovations planned...",
        "overallSummary": "Excellent investment opportunity...",
        "keyBullets": [ /* key insights */ ]
      },
      "overallScore": 87.5
    }
  ],
  "meta": {
    "zipCode": "02134",
    "summary": "Analyzed 2 properties..."
  }
}
```

#### GET `/api/properties/{zip_code}`
Retrieves all properties in a specific ZIP code from MongoDB.

**Query Parameters:** None

**Response:** Array of property objects from the database.

### Key Calculations

The platform calculates the following metrics:

- **Monthly Mortgage Payment**: P&I based on loan amount, interest rate, and term
- **Monthly Operating Expenses**: Property tax, insurance, HOA, maintenance, utilities
- **Monthly NOI (Net Operating Income)**: Rent - operating expenses (excluding mortgage)
- **Monthly Cash Flow**: NOI - mortgage payment
- **Cap Rate**: (Annual NOI / Purchase Price) × 100
- **Cash-on-Cash Return**: (Annual Cash Flow / Total Cash Invested) × 100
- **5-Year ROI**: Total returns including cash flow, equity, and appreciation
- **Risk Assessment**: Based on cash flow stability and return thresholds
- **Timing Recommendation**: Buy now, watch, or avoid based on risk and returns

## AI Agent Integration

The platform integrates with Fetch.ai's Agentverse, using specialized agents for different property types:

- **Selector Agent**: Routes analysis to the appropriate property-type agent
- **Single-Family Agent**: Analyzes single-family homes
- **Multi-Family Agent**: Analyzes multi-unit properties
- **Condo Agent**: Analyzes condominium investments
- **Townhouse Agent**: Analyzes townhouse properties

Each agent provides tailored commentary on cash flow, risk, market timing, and renovations based on property-specific factors.

## Testing

Run Python backend tests:
```bash
pytest backend/test_main.py
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to Vercel.

### Quick Deploy to Vercel

1. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `MONGODB_DB` (optional, defaults to "EstateAI")
   - `MONGODB_COLLECTION` (optional, defaults to "Sample-Listing")

2. Deploy:
```bash
git push origin main
```
Or use Vercel CLI:
```bash
vercel --prod
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project was built during a hackathon and is available for educational purposes.

## Acknowledgments

- Built with [v0.app](https://v0.app) for rapid UI development
- Powered by [Fetch.ai](https://fetch.ai) Agentverse for AI agent orchestration
- UI components from [shadcn/ui](https://ui.shadcn.com)

---

**Live Demo**: [https://vercel.com/rahulsaini5014-4933s-projects/v0-estate-ai](https://vercel.com/rahulsaini5014-4933s-projects/v0-estate-ai)
