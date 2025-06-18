# InsightSim Analysis API

FastAPI backend for qualitative research analysis using LlamaIndex.

## Project Structure

```
api/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Setup

### 1. Install Dependencies

```bash
# From the project root
cd api
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the `api` directory with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
ENVIRONMENT=development
DEBUG=true
```

### 3. Run Development Server

```bash
# From the api directory
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /` - Root endpoint with API info
- `GET /health` - Health check endpoint

### Analysis Endpoints
- `POST /analysis/upload` - Upload transcript files and metadata
- `POST /analysis/{analysis_id}/process` - Start processing analysis
- `GET /analysis/{analysis_id}/status` - Get analysis status
- `GET /analysis/{analysis_id}/results` - Get analysis results

## Development

### API Documentation
FastAPI automatically generates interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Testing
```bash
# Run tests (when implemented)
pytest
```

### Code Formatting
```bash
# Format code
black .

# Lint code
flake8 .
```

## Deployment

This API is configured to deploy on Vercel as a serverless function alongside the Next.js frontend. The `vercel.json` file in the project root handles the deployment configuration.

## Next Steps

1. **Configure Python Environment** - Install dependencies and set up environment variables
2. **Implement LlamaIndex Integration** - Add document processing and analysis logic
3. **Connect to Frontend** - Update Next.js UI to call these API endpoints
4. **Add Database Storage** - Implement persistence for analysis results
5. **Add Authentication** - Secure endpoints with user authentication 