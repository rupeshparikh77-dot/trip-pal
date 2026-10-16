// Thin client for the Amadeus Self-Service API.
// Handles OAuth2 token caching and the few endpoints trip-pal uses.
// If no credentials are configured, callers should fall back to mock data.

const ENV = process.env.AMADEUS_ENV === 'production' ? 'production' : 'test';
const BASE = ENV === 'production'
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com';

const CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

export const hasCredentials = Boolean(CLIENT_ID && CLIENT_SECRET);

let tokenCache = { value: null, expiresAt: 0 };

async function getToken() {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt - 30_000) {
    return tokenCache.value;
  }
  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus auth failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  tokenCache = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return tokenCache.value;
}

async function amadeusGet(path, params) {
  const token = await getToken();
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.errors?.[0]?.detail || JSON.stringify(data);
    throw new Error(`Amadeus ${path} failed (${res.status}): ${detail}`);
  }
  return data;
}

// --- Public methods -------------------------------------------------------

export async function searchLocations(keyword, subType = 'CITY,AIRPORT') {
  const data = await amadeusGet('/v1/reference-data/locations', {
    keyword,
    subType,
    'page[limit]': 10,
  });
  return (data.data || []).map((loc) => ({
    name: loc.name,
    detailedName: loc.detailedName,
    iataCode: loc.iataCode,
    subType: loc.subType,
    cityName: loc.address?.cityName,
    countryName: loc.address?.countryName,
    geoCode: loc.geoCode,
  }));
}

export async function searchFlights({ origin, destination, departureDate, returnDate, adults = 1, max = 10 }) {
  const data = await amadeusGet('/v2/shopping/flight-offers', {
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    returnDate,
    adults,
    max,
    currencyCode: 'USD',
  });
  return (data.data || []).map((offer) => {
    const itineraries = (offer.itineraries || []).map((it) => ({
      duration: it.duration,
      stops: Math.max(0, (it.segments || []).length - 1),
      segments: (it.segments || []).map((s) => ({
        carrier: s.carrierCode,
        flightNumber: `${s.carrierCode}${s.number}`,
        from: s.departure?.iataCode,
        departureAt: s.departure?.at,
        to: s.arrival?.iataCode,
        arrivalAt: s.arrival?.at,
      })),
    }));
    return {
      id: offer.id,
      price: { total: offer.price?.total, currency: offer.price?.currency },
      seatsAvailable: offer.numberOfBookableSeats,
      itineraries,
    };
  });
}

export async function searchHotels({ cityCode, checkIn, checkOut, adults = 1, radius = 20 }) {
  // Step 1: hotels in the city
  const list = await amadeusGet('/v1/reference-data/locations/hotels/by-city', {
    cityCode,
    radius,
    radiusUnit: 'KM',
  });
  const hotelIds = (list.data || []).slice(0, 20).map((h) => h.hotelId);
  if (hotelIds.length === 0) return [];

  // Step 2: offers for those hotels
  const offers = await amadeusGet('/v3/shopping/hotel-offers', {
    hotelIds: hotelIds.join(','),
    adults,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    bestRateOnly: true,
  });
  return (offers.data || []).map((entry) => {
    const best = entry.offers?.[0];
    return {
      hotelId: entry.hotel?.hotelId,
      name: entry.hotel?.name,
      cityCode: entry.hotel?.cityCode,
      geoCode: { latitude: entry.hotel?.latitude, longitude: entry.hotel?.longitude },
      price: best ? { total: best.price?.total, currency: best.price?.currency } : null,
      checkIn: best?.checkInDate,
      checkOut: best?.checkOutDate,
      roomDescription: best?.room?.description?.text,
    };
  });
}
