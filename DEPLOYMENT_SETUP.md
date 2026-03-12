# Deployment Setup Guide

## Architecture
- **Backend**: Railway (Node.js/Express server)
- **Frontend**: Render (React static site)
- **Database**: PostgreSQL (Railway)

## Railway Backend Deployment

### 1. Connect Repository
1. Go to https://railway.app
2. Create new project and select your GitHub repository
3. Railway will automatically detect `railway.json`

### 2. Environment Variables (in Railway dashboard)
Set these variables in Railway's environment:
- `NODE_ENV`: production
- `DATABASE_URL`: (automatically set if using Railway PostgreSQL)
- `PORT`: 8080 (or Railway's default)
- `SUPABASE_URL`: https://mbmilbbdjywnmagxfcyg.supabase.co
- `SUPABASE_SERVICE_KEY`: (your key)
- `CLAUDE_API_KEY`: (your key)
- `NODEMAILER_EMAIL`: (your email)
- `NODEMAILER_EMAIL_PASSWORD`: (your password)
- `FRONTEND_URL`: https://your-render-frontend-url.onrender.com

### 3. Build & Start
- Build Command: (automatic - Node.js)
- Start Command: `node server.js`

## Render Frontend Deployment

### 1. Create New Web Service on Render
1. Go to https://render.com
2. Create new "Web Service" 
3. Connect your GitHub repository
4. Select branch: `main`

### 2. Configuration
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npx serve -s dist -l 3000`
- **Environment**: Node
- **Plan**: Choose based on needs

### 3. Environment Variables (in Render dashboard)
```
VITE_API_URL=https://your-railway-backend-url
VITE_BACKEND_URL=https://your-railway-backend-url
VITE_SUPABASE_URL=https://mbmilbbdjywnmagxfcyg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Replace `your-railway-backend-url` with your actual Railway backend URL (e.g., `https://senior-project-a0jj.onrender.com`)

### 4. After Deployment
1. Copy your Render frontend URL
2. Update `FRONTEND_URL` in Railway backend
3. Copy your Railway backend URL
4. Update `VITE_API_URL` in Render frontend
5. Both services will redeploy automatically

## API Communication

The frontend makes API calls to the backend:
```javascript
// In frontend code
const API_URL = import.meta.env.VITE_API_URL;
fetch(`${API_URL}/api/endpoint`);
```

## Troubleshooting

### 404 errors on page refresh
- Check that Render has the build command set correctly
- Verify `dist/index.html` exists after build
- Frontend should have `_redirects` file (usually automatic on Render)

### CORS errors
- Ensure `FRONTEND_URL` is set correctly in Railway backend
- Check CORS middleware in `server.js` allows your Render domain

### Build failures
- Check logs in Railway/Render dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set
