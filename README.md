# Real estate underwriting app

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/rahulsaini5014-4933s-projects/v0-estate-ai)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/eaeyzKPFElE)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/rahulsaini5014-4933s-projects/v0-estate-ai](https://vercel.com/rahulsaini5014-4933s-projects/v0-estate-ai)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/eaeyzKPFElE](https://v0.app/chat/eaeyzKPFElE)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Backend API

Start the Python API:

```bash
uvicorn backend.main:app --reload --port 8000
```

Or via npm script:

```bash
npm run dev:backend
```

### Endpoints

`POST /analyze-properties`

```bash
curl -X POST http://localhost:8000/analyze-properties \
  -H "Content-Type: application/json" \
  -d '{
    "zipCode": "02134",
    "globalAssumptions": {
      "defaultVacancyRatePercent": 5,
      "defaultAppreciationRatePercent": 3,
      "defaultMaintenancePercent": 1
    },
    "properties": []
  }'
```

`GET /api/properties`

Query params: `zipCode`, `centerLat`, `centerLng`, `count`, `priceMin`, `priceMax`, `beds`, `baths`, `homeType` (comma-separated).

`GET /api/properties/{id}`

Returns a single listing by id.
