# Backend Setup Guide

## Environment Setup

### Python Environment
The project uses Python 3.12.2 with pyenv. A `.python-version` file has been created in the project root to automatically use this version.

### Installation Steps

1. **Install Python dependencies:**
   ```bash
   cd /home/cmen/Projects/v0-EstateAI
   python -m pip install -r backend/requirements.txt
   ```

2. **Configure Environment Variables:**

   Create a `.env` file in the `backend/` directory:
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Then edit `backend/.env` and add your MongoDB credentials:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=EstateAI
   MONGODB_COLLECTION=Sample-Listing
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Configure Agent Environment Variables (Optional):**

   If you're running the AI agents in `backend/agents/`, create a `.env` file there:
   ```bash
   cp backend/agents/.env.example backend/agents/.env
   ```
   
   Then edit `backend/agents/.env` with your Fetch.ai and OpenAI credentials.

## MongoDB API Key Location

**Your MongoDB connection string (API key) goes in:** 
- `backend/.env` 
- Variable name: `MONGODB_URI`

**Format:**
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

**To get your MongoDB connection string:**
1. Go to https://cloud.mongodb.com/
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your credentials

## Project Structure

```
backend/
├── __init__.py
├── main.py              # FastAPI application entry point
├── logic.py             # Business logic for property analysis
├── models.py            # Pydantic data models
├── db.py                # MongoDB connection setup
├── requirements.txt     # Python dependencies
├── .env                 # Your environment variables (create this)
├── .env.example         # Template for environment variables
└── agents/              # AI agents directory
    ├── __init__.py
    ├── Estate_Ai_agent.py          # Main orchestrator agent
    ├── condo_agent.py              # Condo specialist
    ├── Single_family_specialist_agent.py
    ├── multifamily_agent.py
    ├── townhouse_agent.py
    ├── protocol_models.py          # Shared agent models
    ├── .env                        # Agent environment variables (create this)
    └── .env.example                # Template for agent environment variables
```

## Running the Backend

```bash
cd /home/cmen/Projects/v0-EstateAI
uvicorn backend.main:app --reload
```

The API will be available at: http://localhost:8000

## Running the AI Agents

The agents in `backend/agents/` are designed to run separately on the Fetch.ai network. Each agent file can be run independently:

```bash
cd /home/cmen/Projects/v0-EstateAI/backend/agents
python Estate_Ai_agent.py
```

## API Endpoints

- `POST /analyze-properties` - Analyze and compare properties
- `GET /api/properties/{zip_code}` - Get properties by ZIP code
- `POST /api/agent-commentary` - Get AI agent commentary on property analysis

## Next Steps

1. Get your MongoDB connection string from MongoDB Atlas
2. Create `backend/.env` and add your `MONGODB_URI`
3. Test the API by running `uvicorn backend.main:app --reload`
4. (Optional) Set up Fetch.ai agents with `.env` in `backend/agents/`
