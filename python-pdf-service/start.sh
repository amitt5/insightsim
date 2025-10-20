#!/bin/bash

# PDF Text Extraction Service Startup Script

echo "🚀 Starting PDF Text Extraction Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Start the service
echo "🌟 Starting FastAPI service on http://localhost:8000"
echo "📖 API Documentation available at http://localhost:8000/docs"
echo "🔍 Health check available at http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
