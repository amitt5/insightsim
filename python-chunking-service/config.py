import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Server configuration
PORT = int(os.getenv('CHUNKING_SERVICE_PORT', 8002))
HOST = os.getenv('CHUNKING_SERVICE_HOST', '0.0.0.0')

# Chunking configuration
CHUNK_SIZE = int(os.getenv('CHUNK_SIZE', 1500))  # Production chunk size
CHUNK_OVERLAP = int(os.getenv('CHUNK_OVERLAP', 300))  # Production overlap size

# Temporary file storage
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'tmp')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
