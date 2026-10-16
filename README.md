# trip-pal ✈️🏨🌴

A small travel-search API — **flights, hotels, and resorts** — with a built-in web UI.

It runs in **demo mode** (realistic sample data) the moment it's deployed, with **zero configuration**. Add free Amadeus credentials later to switch flights and hotels to live data.

## Endpoints

| Method | Path | What it does |
|--------|------|--------------|
| `GET` | `/health` | Status + current mode (`demo` / `live`) |
| `GET` | `/api/locations?keyword=lon` | Look up airport/city IATA codes |
| `GET` | `/api/flights?origin=SIN&destination=LHR&departureDate=2026-11-01` | Flight offers (optional `returnDate`, `adults`) |
| `GET` | `/api/hotels?cityCode=LON&checkIn=2026-11-01&checkOut=2026-11-04` | Hotel offers (optional `adults`) |
| `GET` | `/api/resorts?destination=Bali` | Curated resort listings |

Every response includes a `source` field: `live`, `demo`, `demo-fallback`, or `curated`.

Open the deployed URL in a browser to use the search UI.

## Data source

Flights and hotels use the **[Amadeus Self-Service API](https://developers.amadeus.com)** — a free developer tier. Without credentials, or if a live call fails, the API returns sample data so nothing ever breaks. (Amadeus has no dedicated resort endpoint, so resorts are curated data.)

## Deploy to Render (no terminal needed)

1. Push this repo to GitHub (see the deployment guide).
2. In [Render](https://render.com): **New + → Blueprint**, pick the repo. It reads `render.yaml` and deploys on the free plan.
3. Your API is live in demo mode at `https://trip-pal-xxxx.onrender.com`.

### Going live with real data (optional)

1. Sign up free at [developers.amadeus.com](https://developers.amadeus.com) → create a Self-Service app → copy the **API Key** and **API Secret**.
2. In Render → your service → **Environment** → add `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET`.
3. Save — Render redeploys and `/health` will report `"mode": "live"`.

## Run locally

```
npm install
npm start
# → http://localhost:3000
```

## Stack

Node.js + Express. No database, no build step. One dependency.
