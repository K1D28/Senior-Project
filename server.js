import 'dotenv/config';
import express from 'express';

const app = express();

// Minimal middleware
app.use(express.json());

// CORS - must specify exact origin when credentials are used
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://senior-project-1frontend.onrender.com';

app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow the specific frontend URL
  if (origin === FRONTEND_URL || origin === 'http://localhost:5173' || origin === 'https://senior-project-frontend.onrender.com') {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Test endpoints
app.get('/', (req, res) => {
  console.log('Root endpoint called');
  res.json({ message: 'Server is running!' });
});

app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'Test endpoint works!' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login endpoint called with body:', req.body);
  res.json({ 
    message: 'Login successful',
    token: 'test-token',
    user: { email: 'test@test.com', role: 'ADMIN' }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Express error:', err.message);
  res.status(500).json({ error: err.message });
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error('Stack:', err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

const PORT = process.env.PORT || 5001; // Use Railway's PORT
app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});