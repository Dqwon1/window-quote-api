
# ScrapeOwl Square Footage API

This Node.js app uses ScrapeOwl to fetch real-time square footage from Zillow based on property address input.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your ScrapeOwl API key:

```
SCRAPEOWL_API_KEY=your_key_here
```

3. Start the server:

```bash
npm start
```

## Endpoint

**POST** `/get-sqft`

**Body:**
```json
{
  "address": "1999 Alcovy Shoals Bluff, Lawrenceville, GA"
}
```

**Response:**
```json
{
  "squareFootage": 3958
}
```

## Deployment

You can deploy this on [Render](https://render.com) by:

- Connecting a GitHub repo
- Adding `SCRAPEOWL_API_KEY` as an environment variable
