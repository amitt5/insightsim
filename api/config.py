import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Configuration
    api_title: str = "InsightSim Analysis API"
    api_description: str = "Backend API for qualitative research analysis using LlamaIndex"
    api_version: str = "1.0.0"
    
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # Server Configuration
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    
    # OpenAI Configuration
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # Database Configuration
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # CORS Configuration
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "https://insightsim.vercel.app"
    ]
    
    # File Upload Configuration
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    allowed_file_types: List[str] = [".txt", ".doc", ".docx", ".pdf"]
    upload_directory: str = os.getenv("UPLOAD_DIRECTORY", "/tmp/uploads")
    
    # LlamaIndex Configuration
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1024"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "200"))
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "text-embedding-ada-002")
    
    # Analysis Configuration
    max_concurrent_analyses: int = int(os.getenv("MAX_CONCURRENT_ANALYSES", "5"))
    analysis_timeout: int = int(os.getenv("ANALYSIS_TIMEOUT", "3600"))  # 1 hour
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings() 