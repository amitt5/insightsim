#!/bin/bash
# Start the PDF extraction service

echo "Starting PDF extraction service on port 8001..."
cd "$(dirname "$0")"
export FLASK_ENV=development
export PORT=8001
python3 app.py
