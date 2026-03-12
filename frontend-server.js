const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const dist = path.join(__dirname, 'dist');

console.log(`Serving files from: ${dist}`);

// Serve static files from dist
app.use(express.static(dist, {
  maxAge: '1h',
  etag: false
}));

// SPA routing - serve index.html for all routes without file extensions
app.get('*', (req, res) => {
  console.log(`Serving index.html for route: ${req.path}`);
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`);
});
