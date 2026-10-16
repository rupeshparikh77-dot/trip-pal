import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import searchRouter from './routes/search.js';
import { hasCredentials } from './amadeus.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Simple request log
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check (Render pings this)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: hasCredentials ? 'live' : 'demo', time: new Date().toISOString() });
});

// API
app.use('/api', searchRouter);

// Static frontend
app.use(express.static(join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`trip-pal listening on port ${PORT} — mode: ${hasCredentials ? 'LIVE (Amadeus)' : 'DEMO (sample data)'}`);
});
