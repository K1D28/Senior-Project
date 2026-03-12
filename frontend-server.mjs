import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('[Frontend Server] Initializing...');

// Serve static files from dist
const distPath = path.join(__dirname, 'dist');
console.log(`[Frontend Server] dist path: ${distPath}`);

app.use(express.static(distPath));

// SPA fallback - serve index.html for any route
app.get('*', (req, res) => {
  console.log(`[Frontend Server] GET ${req.path} -> index.html`);
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Frontend Server] ✓ Listening on 0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('[Frontend Server] Error:', err);
});
