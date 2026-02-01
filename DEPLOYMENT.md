# Deploying to Vercel

This guide explains how to deploy your Next.js + FastAPI application to Vercel.

## Prerequisites

- A Vercel account
- Git repository connected to Vercel
- MongoDB database (Atlas or similar)

## Deployment Steps

### 1. Push Your Code

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 2. Configure Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string

**Optional:**
- `BACKEND_URL` - Leave empty for production (handled automatically)

### 3. Deploy

Vercel will automatically deploy when you push to your repository. Or you can:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel --prod
```

## How It Works

### Architecture

- **Next.js Frontend**: Deployed as static pages and API routes
- **FastAPI Backend**: Deployed as Python serverless functions in `/api/backend/`

### URL Routing

The `vercel.json` configuration handles routing:

- All `/backend-api/*` requests → Python serverless function at `/api/backend/index`
- FastAPI app handles internal routing (`/api/agent-commentary`, `/api/properties/*`, etc.)
- All other routes → Next.js

### Development vs Production

**Development (Local):**
```bash
# Terminal 1: Run Next.js
npm run dev

# Terminal 2: Run FastAPI backend (if needed for testing)
cd backend && uvicorn main:app --reload --port 8000
```

**Production (Vercel):**
- Single deploy command: `npm run build`
- All routes handled automatically by Vercel
- Python functions run as serverless

## Key Files

- `vercel.json` - Routing configuration (routes `/backend-api/*` to Python)
- `api/backend/index.py` - Single Python serverless function handler
- `backend/requirements.txt` - Python dependencies
- `.env.example` - Required environment variables

## Troubleshooting

### Python Import Errors

If you see import errors in production, ensure:
1. All dependencies are in `backend/requirements.txt`
2. The `mangum` adapter is installed (version 0.17.0)
3. Paths in `api/backend/*.py` correctly reference the backend folder

### Database Connection Issues

1. Ensure `MONGODB_URI` is set in Vercel environment variables
2. Whitelist Vercel's IP addresses in MongoDB Atlas (or allow all: 0.0.0.0/0)
3. Check that the connection string includes authentication credentials

### Function Timeout

Vercel serverless functions have a 10-second timeout on Hobby plan, 60 seconds on Pro.
If your analysis takes longer, consider:
- Optimizing the analysis logic
- Upgrading to Vercel Pro
- Moving long-running tasks to a background job queue

## Local Testing

To test the Vercel configuration locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with Vercel dev server
vercel dev
```

This simulates the Vercel production environment on your local machine.
