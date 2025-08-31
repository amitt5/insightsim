#!/bin/bash

# Install dependencies if needed
pip3 install -r requirements.txt

# Start the service using gunicorn
gunicorn -w 4 -b 0.0.0.0:8002 app:app
