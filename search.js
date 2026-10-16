import { Router } from 'express';
import * as amadeus from '../amadeus.js';
import * as mock from '../mock.js';

const router = Router();
const LIVE = amadeus.hasCredentials;

// Wrap a live call so that any failure degrades gracefully to mock data
// instead of throwing a 500 at the client.
async function withFallback(liveFn, mockFn, res, label) {
  if (!LIVE) {
    return res.json({ source: 'demo', note: 'Set Amadeus credentials for live results.', results: mockFn() });
  }
  try {
    const results = await liveFn();
    return res.json({ source: 'live', results });
  } catch (err) {
    console.error(`[${label}] live call failed, using demo data:`, err.message);
    return res.json({ source: 'demo-fallback', note: err.message, results: mockFn() });
  }
}

// GET /api/locations?keyword=lon
router.get('/locations', async (req, res) => {
  const keyword = String(req.query.keyword || '');
  await withFallback(
    () => amadeus.searchLocations(keyword),
    () => mock.mockLocations(keyword),
    res,
    'locations'
  );
});

// GET /api/flights?origin=SIN&destination=LHR&departureDate=2026-11-01[&returnDate=&adults=1]
router.get('/flights', async (req, res) => {
  const { origin, destination, departureDate, returnDate, adults } = req.query;
  if (LIVE && (!origin || !destination || !departureDate)) {
    return res.status(400).json({
      error: 'origin, destination and departureDate are required (IATA codes, e.g. origin=SIN&destination=LHR&departureDate=2026-11-01).',
    });
  }
  await withFallback(
    () => amadeus.searchFlights({
      origin, destination, departureDate, returnDate,
      adults: Number(adults) || 1,
    }),
    () => mock.mockFlights({ origin, destination, departureDate, returnDate }),
    res,
    'flights'
  );
});

// GET /api/hotels?cityCode=LON&checkIn=2026-11-01&checkOut=2026-11-04[&adults=1]
router.get('/hotels', async (req, res) => {
  const { cityCode, checkIn, checkOut, adults } = req.query;
  if (LIVE && (!cityCode || !checkIn || !checkOut)) {
    return res.status(400).json({
      error: 'cityCode, checkIn and checkOut are required (e.g. cityCode=LON&checkIn=2026-11-01&checkOut=2026-11-04).',
    });
  }
  await withFallback(
    () => amadeus.searchHotels({
      cityCode, checkIn, checkOut, adults: Number(adults) || 1,
    }),
    () => mock.mockHotels({ cityCode, checkIn, checkOut }),
    res,
    'hotels'
  );
});

// GET /api/resorts?destination=Bali
// Amadeus has no dedicated resort endpoint, so this is curated/demo data.
router.get('/resorts', async (req, res) => {
  const destination = String(req.query.destination || 'Bali');
  res.json({ source: 'curated', results: mock.mockResorts({ destination }) });
});

export default router;
