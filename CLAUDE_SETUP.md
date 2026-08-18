# Claude AI Integration Setup Guide

## Overview
The application now includes Claude AI analysis for coffee samples in:
- **Q Grader Dashboard**: Analyzes sample scores and provides tasting recommendations
- **Head Judge Dashboard**: Analyzes score consistency and recommends adjustments

## Setup Steps

### 1. Get Your Claude API Key
1. Go to https://console.anthropic.com/
2. Sign up or log in to your account
3. Navigate to Settings → API Keys
4. Create a new API key
5. Copy your API key (starts with `sk-ant-`)

### 2. Add to Environment Variables
Edit `.env` file in the project root and add:
```
CLAUDE_API_KEY=sk-ant-your-actual-key-here
```

### 3. Install Claude SDK
```bash
npm install @anthropic-ai/sdk
```

### 4. Restart Backend Server
```bash
# Kill the existing server
kill $(lsof -t -i :5001)

# Start the server again
npm run dev
```

### 5. Test the Integration
- Log in as Q Grader or Head Judge
- Navigate to a cupping event with samples
- Click the "✨ Analyze" button on any sample
- Wait for Claude AI analysis to load

## Features

### Q Grader Analysis
When a Q Grader clicks "Analyze" on a sample, Claude AI will:
1. Review all individual scores (fragrance, flavor, acidity, etc.)
2. Identify score strengths and weaknesses
3. Provide specific tasting notes aligned with scores
4. Recommend final grade

### Head Judge Analysis  
When a Head Judge clicks "Analyze" on a sample, Claude AI will:
1. Analyze Q Grader score consistency (standard deviation)
2. Identify potential outliers or inconsistencies
3. Recommend which scores might need adjustment
4. Provide reasoning for adjustments
5. Suggest adjusted final scores

## Troubleshooting

### "Error analyzing sample. Make sure CLAUDE_API_KEY is set."
- Verify `.env` file has `CLAUDE_API_KEY=sk-ant-...`
- Restart the backend server
- Check that the API key is valid (not expired)

### No Analysis Modal Appears
- Check browser console (F12) for errors
- Verify backend is running on port 5001
- Ensure authentication token is valid

### "Error: 401 Unauthorized"
- Make sure CLAUDE_API_KEY is set correctly
- Verify the API key hasn't been revoked

## Cost Considerations
- Claude AI API calls are metered by Anthropic
- Each analysis uses approximately 500-1000 tokens
- Visit https://console.anthropic.com/account/usage for pricing

## Disabling AI Features
To temporarily disable AI analysis:
1. Comment out the Claude SDK import in server.js
2. Remove the `/api/analyze-sample` endpoint
3. Remove the "Analyze" buttons from dashboards

## Files Modified
- `server.js` - Added Claude API endpoint
- `components/dashboards/QGraderDashboard.tsx` - Added AI analysis UI
- `components/dashboards/HeadJudgeDashboard.tsx` - Added AI analysis UI
- `.env` - Add CLAUDE_API_KEY

## Support
For Claude API documentation, visit: https://docs.anthropic.com/
