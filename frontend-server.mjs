import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const dist = path.join(__dirname, 'dist');

console.log(`[Frontend Server] Starting...`);
console.log(`[Frontend Server] Serving files from: ${dist}`);

// Serve static files from dist with caching headers
app.use(express.static(dist, {
  maxAge: '1h',
  etag: false
}));

// SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  console.log(`[Frontend Server] ${req.method} ${req.path} -> index.html`);
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Frontend Server] ✓ Running on http://0.0.0.0:${PORT}`);
});
