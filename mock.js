// Sample data so trip-pal returns realistic results with zero configuration.
// Used automatically when Amadeus credentials are not set, or as a fallback
// when a live call fails.

export function mockLocations(keyword = '') {
  const all = [
    { name: 'SINGAPORE CHANGI', detailedName: 'SINGAPORE/SG:CHANGI', iataCode: 'SIN', subType: 'AIRPORT', cityName: 'SINGAPORE', countryName: 'SINGAPORE', geoCode: { latitude: 1.35019, longitude: 103.994003 } },
    { name: 'LONDON HEATHROW', detailedName: 'LONDON/GB:HEATHROW', iataCode: 'LHR', subType: 'AIRPORT', cityName: 'LONDON', countryName: 'UNITED KINGDOM', geoCode: { latitude: 51.4775, longitude: -0.461389 } },
    { name: 'TOKYO HANEDA', detailedName: 'TOKYO/JP:HANEDA', iataCode: 'HND', subType: 'AIRPORT', cityName: 'TOKYO', countryName: 'JAPAN', geoCode: { latitude: 35.552299, longitude: 139.779999 } },
    { name: 'DUBAI', detailedName: 'DUBAI/AE:DUBAI INTL', iataCode: 'DXB', subType: 'AIRPORT', cityName: 'DUBAI', countryName: 'UNITED ARAB EMIRATES', geoCode: { latitude: 25.2528, longitude: 55.3644 } },
    { name: 'NEW YORK JFK', detailedName: 'NEW YORK/US:JOHN F KENNEDY', iataCode: 'JFK', subType: 'AIRPORT', cityName: 'NEW YORK', countryName: 'UNITED STATES', geoCode: { latitude: 40.639751, longitude: -73.778925 } },
    { name: 'DENPASAR BALI', detailedName: 'DENPASAR/ID:NGURAH RAI', iataCode: 'DPS', subType: 'AIRPORT', cityName: 'DENPASAR', countryName: 'INDONESIA', geoCode: { latitude: -8.748169, longitude: 115.167168 } },
  ];
  const k = keyword.trim().toUpperCase();
  if (!k) return all;
  return all.filter((l) =>
    l.name.includes(k) || l.cityName.includes(k) || l.iataCode === k || l.countryName.includes(k)
  );
}

export function mockFlights({ origin = 'SIN', destination = 'LHR', departureDate = '2026-11-01', returnDate } = {}) {
  const mk = (id, carrier, num, dep, arr, dur, stops, price) => ({
    id: String(id),
    price: { total: price.toFixed(2), currency: 'USD' },
    seatsAvailable: 9,
    itineraries: [
      {
        duration: dur,
        stops,
        segments: [
          {
            carrier,
            flightNumber: `${carrier}${num}`,
            from: origin,
            departureAt: `${departureDate}T${dep}:00`,
            to: destination,
            arrivalAt: `${departureDate}T${arr}:00`,
          },
        ],
      },
    ],
  });
  const offers = [
    mk(1, 'SQ', '322', '09:30', '15:45', 'PT13H15M', 0, 842.5),
    mk(2, 'BA', '12', '23:55', '05:40', 'PT13H45M', 0, 788.0),
    mk(3, 'EK', '354', '01:25', '14:10', 'PT17H45M', 1, 695.3),
    mk(4, 'QF', '1', '20:05', '05:15', 'PT16H10M', 1, 721.9),
  ];
  if (returnDate) {
    for (const o of offers) {
      o.itineraries.push({
        duration: o.itineraries[0].duration,
        stops: o.itineraries[0].stops,
        segments: [
          {
            carrier: o.itineraries[0].segments[0].carrier,
            flightNumber: o.itineraries[0].segments[0].flightNumber.replace(/\d+$/, (n) => String(Number(n) + 1)),
            from: destination,
            departureAt: `${returnDate}T11:00:00`,
            to: origin,
            arrivalAt: `${returnDate}T18:30:00`,
          },
        ],
      });
    }
  }
  return offers;
}

export function mockHotels({ cityCode = 'LON', checkIn = '2026-11-01', checkOut = '2026-11-04' } = {}) {
  const base = [
    { name: 'The Harbour Grand', price: 289.0, room: 'Deluxe King, city view' },
    { name: 'Riverside Boutique Hotel', price: 174.5, room: 'Queen room with breakfast' },
    { name: 'Skyline Business Suites', price: 132.0, room: 'Executive studio' },
    { name: 'The Botanical Resort & Spa', price: 415.0, room: 'Garden villa, private pool' },
    { name: 'Old Town Inn', price: 98.75, room: 'Cozy double' },
  ];
  return base.map((h, i) => ({
    hotelId: `MOCK${cityCode}${i + 1}`,
    name: h.name,
    cityCode,
    geoCode: { latitude: null, longitude: null },
    price: { total: h.price.toFixed(2), currency: 'USD' },
    checkIn,
    checkOut,
    roomDescription: h.room,
  }));
}

export function mockResorts({ destination = 'Bali' } = {}) {
  return [
    { name: 'Azure Cliff Resort', destination, type: 'Beach resort', pricePerNight: { total: '520.00', currency: 'USD' }, rating: 4.8, amenities: ['Infinity pool', 'Private beach', 'Spa', 'All-inclusive'] },
    { name: 'Jungle Canopy Retreat', destination, type: 'Eco resort', pricePerNight: { total: '310.00', currency: 'USD' }, rating: 4.6, amenities: ['Rainforest villas', 'Yoga pavilion', 'Farm-to-table dining'] },
    { name: 'Coral Bay Villas', destination, type: 'Family resort', pricePerNight: { total: '395.00', currency: 'USD' }, rating: 4.5, amenities: ['Kids club', 'Water park', '3 restaurants', 'Snorkeling'] },
    { name: 'Serenity Overwater Lodge', destination, type: 'Luxury resort', pricePerNight: { total: '880.00', currency: 'USD' }, rating: 4.9, amenities: ['Overwater bungalows', 'Butler service', 'Dive center'] },
  ];
}
