import 'dotenv/config';
import express from 'express';

const app = express();

// Minimal middleware
app.use(express.json());

// Simple CORS - no complex logic
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});