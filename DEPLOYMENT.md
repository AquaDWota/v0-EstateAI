# Deploying to Vercel

This guide explains how to deploy your Next.js application to Vercel.

## Prerequisites

- A Vercel account
- Git repository connected to Vercel
- MongoDB database (Atlas or similar)

## Architecture

This is a **pure Next.js application** - no separate backend needed!

- **Frontend**: Next.js pages and components
- **Backend Logic**: Ported to TypeScript in `lib/analysis-logic.ts`
- **API Routes**: Next.js API routes in `app/api/`
- **Database**: MongoDB via the official Node.js driver

## Deployment Steps

### 1. Configure Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string

**Optional:**
- `MONGODB_DB` - Database name (defaults to "EstateAI")
- `MONGODB_COLLECTION` - Collection name (defaults to "Sample-Listing")

### 2. Deploy

```bash
git add .
git commit -m "Convert to Next.js-only architecture"
git push origin main
```

Vercel will automatically deploy when you push to your repository. Or use the CLI:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel --prod
```

## How It Works

### Single Build Process

- `npm run build` - Builds everything (frontend + API routes)
- All APIs are Next.js serverless functions
- No Python, no separate backend server needed

### API Routes

All API endpoints are in `app/api/`:

- `/api/analyze` - Property analysis endpoint
- `/api/properties` - Fetch properties by ZIP code
- `/api/properties/[id]` - Fetch single property by ID

### Business Logic

- `lib/analysis-logic.ts` - Property analysis calculations (ported from Python)
- `lib/mongodb.ts` - MongoDB connection helper
- `lib/types.ts` - TypeScript type definitions

## Development

```bash
# Single command to run everything
npm run dev
```

Visit http://localhost:3000 - all APIs work automatically!

## Key Files

- `app/api/*` - Next.js API routes (serverless functions)
- `lib/analysis-logic.ts` - Core business logic
- `lib/mongodb.ts` - Database connection
- `.env.example` - Required environment variables
- `package.json` - Dependencies (includes `mongodb` driver)

## Troubleshooting

### MongoDB Connection Issues

1. Ensure `MONGODB_URI` is set in Vercel environment variables
2. Whitelist Vercel's IP addresses in MongoDB Atlas (or allow all: 0.0.0.0/0)
3. Check that the connection string includes authentication credentials
4. Test connection locally with `.env.local`

### Build Errors

If you see build errors:
1. Check TypeScript errors: `npm run lint`
2. Ensure all dependencies are installed: `npm install`
3. Verify environment variables are set

### API Timeout

Vercel serverless functions have a 10-second timeout on Hobby plan, 60 seconds on Pro.
If your analysis takes longer:
- Optimize calculation logic
- Upgrade to Vercel Pro
- Consider caching results

## Local Testing

```bash
# Create .env.local with your MongoDB URI
echo "MONGODB_URI=your-connection-string" > .env.local

# Run the development server
npm run dev
```

The app will be available at http://localhost:3000 with full API functionality.
