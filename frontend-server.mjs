import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const dist = path.join(__dirname, 'dist');

console.log(`[Frontend Server] Starting...`);
console.log(`[Frontend Server] __dirname: ${__dirname}`);
console.log(`[Frontend Server] dist path: ${dist}`);
console.log(`[Frontend Server] dist exists: ${fs.existsSync(dist)}`);
console.log(`[Frontend Server] index.html exists: ${fs.existsSync(path.join(dist, 'index.html'))}`);

// Serve static files from dist with caching headers
app.use(express.static(dist, {
  maxAge: '1h',
  etag: false
}));

// SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = path.join(dist, 'index.html');
  console.log(`[Frontend Server] ${req.method} ${req.path}`);
  console.log(`[Frontend Server] Serving: ${indexPath}`);
  console.log(`[Frontend Server] File exists: ${fs.existsSync(indexPath)}`);
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[Frontend Server] Error sending file: ${err.message}`);
      res.status(500).send(`Error: ${err.message}`);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Frontend Server] ✓ Running on http://0.0.0.0:${PORT}`);
});
