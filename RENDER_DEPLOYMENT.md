# Render Deployment Guide for PDF Service

## Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

## Step 2: Deploy PDF Service

### Option A: Using Render Dashboard (Recommended)
1. **Go to Render Dashboard**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `pdf-text-extraction-service` (or any name you prefer)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free (or Starter if you need more resources)

### Option B: Using render.yaml (Auto-deploy)
1. **Push your code to GitHub** (the render.yaml file will auto-configure)
2. **Go to Render Dashboard**
3. **Click "New +" → "Blueprint"**
4. **Select your repository**
5. **Render will automatically detect and configure the service**

## Step 3: Set Environment Variables

In your Render service dashboard, go to **Environment** tab and add:

### Required Variables:
- **OPENAI_API_KEY**: Your OpenAI API key
- **NEXT_PUBLIC_APP_URL**: Your Vercel app URL (e.g., `https://your-app-name.vercel.app`)

### Optional Variables:
- **PORT**: Automatically set by Render (don't override)

## Step 4: Update Your Vercel App

In your Vercel dashboard, add this environment variable:

```
PYTHON_PDF_SERVICE_URL=https://your-pdf-service-name.onrender.com
```

Replace `your-pdf-service-name` with the actual name you gave your Render service.

## Step 5: Test the Deployment

1. **Check PDF Service Health:**
   ```bash
   curl https://your-pdf-service-name.onrender.com/health
   ```

2. **Test PDF Processing:**
   ```bash
   curl -X POST https://your-pdf-service-name.onrender.com/extract-for-cag \
     -F "file=@test.pdf"
   ```

## Render Service Details I Need

Please provide me with:

1. **Your Render service URL** (e.g., `https://pdf-service-abc123.onrender.com`)
2. **Your Vercel app URL** (e.g., `https://your-app-name.vercel.app`)

Once you have these, I'll help you configure the environment variables correctly.

## Troubleshooting

### Common Issues:
1. **Build Failures**: Check that all dependencies are in requirements.txt
2. **Service Not Starting**: Verify the start command is correct
3. **CORS Errors**: Make sure NEXT_PUBLIC_APP_URL is set correctly
4. **OpenAI API Errors**: Verify OPENAI_API_KEY is set correctly

### Render Free Tier Limitations:
- Services sleep after 15 minutes of inactivity
- Cold start can take 30-60 seconds
- 750 hours/month limit
- Consider upgrading to Starter plan ($7/month) for production use

## Next Steps

1. Deploy to Render using the steps above
2. Get your service URL
3. Update your Vercel environment variables
4. Test the integration
5. Monitor the service health

Let me know your Render service URL and Vercel app URL once you have them!
