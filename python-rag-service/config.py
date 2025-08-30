"""Configuration for PDF extraction service"""

import os

class Config:
    # Flask configuration
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    PORT = int(os.environ.get('PORT', 8001))
    DEBUG = FLASK_ENV == 'development'
    
    # File upload configuration
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {'pdf'}
    
    # Service configuration
    SERVICE_NAME = 'pdf-extraction-service'
    VERSION = '1.0.0'
