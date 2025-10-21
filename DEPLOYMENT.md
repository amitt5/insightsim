# PDF Service Deployment Guide

## Problem
The error `ECONNREFUSED 127.0.0.1:8000` occurs because the Python PDF service is not running in production. The Next.js app is trying to connect to `localhost:8000` but there's no service running there.

## Solution Options

### Option 1: Deploy PDF Service to Railway (Recommended)

1. **Deploy the PDF Service:**
   ```bash
   cd python-pdf-service
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Deploy
   railway up
   ```

2. **Set Environment Variables in Railway:**
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `NEXT_PUBLIC_APP_URL`: Your production app URL

3. **Update your main app's environment variables:**
   ```bash
   # Set this in your main app's environment
   PYTHON_PDF_SERVICE_URL=https://your-pdf-service.railway.app
   ```

### Option 2: Deploy PDF Service to Heroku

1. **Deploy the PDF Service:**
   ```bash
   cd python-pdf-service
   # Install Heroku CLI
   
   # Create Heroku app
   heroku create your-pdf-service-name
   
   # Set environment variables
   heroku config:set OPENAI_API_KEY=your_openai_api_key
   heroku config:set NEXT_PUBLIC_APP_URL=your_production_app_url
   
   # Deploy
   git push heroku main
   ```

2. **Update your main app's environment variables:**
   ```bash
   PYTHON_PDF_SERVICE_URL=https://your-pdf-service-name.herokuapp.com
   ```

### Option 3: Deploy PDF Service to Render

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Set the following:**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `NEXT_PUBLIC_APP_URL`: Your production app URL

4. **Update your main app's environment variables:**
   ```bash
   PYTHON_PDF_SERVICE_URL=https://your-pdf-service.onrender.com
   ```

### Option 4: Use Docker Compose (For VPS/Server)

1. **Deploy both services together:**
   ```bash
   # Make sure both services are in the same docker-compose.yml
   docker-compose up -d
   ```

2. **Set environment variables:**
   ```bash
   PYTHON_PDF_SERVICE_URL=http://pdf-service:8000
   ```

## Environment Variables Required

### For PDF Service:
- `OPENAI_API_KEY`: Required for text processing
- `NEXT_PUBLIC_APP_URL`: Your main app URL for CORS
- `PORT`: Automatically set by hosting platform

### For Main App:
- `PYTHON_PDF_SERVICE_URL`: URL of your deployed PDF service

## Testing the Deployment

1. **Check PDF Service Health:**
   ```bash
   curl https://your-pdf-service-url/health
   ```

2. **Test PDF Processing:**
   ```bash
   curl -X POST https://your-pdf-service-url/extract-for-cag \
     -F "file=@test.pdf"
   ```

## Monitoring

The PDF service includes health checks at `/health` endpoint. Monitor this endpoint to ensure the service is running properly.

## Troubleshooting

1. **Connection Refused Error:**
   - Ensure PDF service is deployed and running
   - Check that `PYTHON_PDF_SERVICE_URL` is set correctly
   - Verify the service URL is accessible

2. **CORS Errors:**
   - Make sure `NEXT_PUBLIC_APP_URL` is set correctly in PDF service
   - Check that your main app URL is in the CORS origins list

3. **OpenAI API Errors:**
   - Verify `OPENAI_API_KEY` is set correctly in PDF service
   - Check API key has sufficient credits

## Quick Fix for Immediate Testing

If you need a quick fix for testing, you can temporarily modify the API route to handle the connection error gracefully:

```typescript
// In your API route, add error handling
try {
  const response = await fetch(`${pythonServiceUrl}/extract-for-cag`, {
    method: 'POST',
    body: formData,
  })
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    return NextResponse.json({ 
      error: 'PDF processing service is not available. Please contact support.' 
    }, { status: 503 })
  }
  throw error
}
```
