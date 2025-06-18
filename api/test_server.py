#!/usr/bin/env python3
"""
Simple test script to verify FastAPI server functionality
"""

import asyncio
import sys
from main import app
from fastapi.testclient import TestClient

def test_fastapi_server():
    """Test basic FastAPI functionality"""
    print("🧪 Testing FastAPI Server...")
    
    # Create test client
    client = TestClient(app)
    
    # Test root endpoint
    print("📋 Testing root endpoint...")
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "InsightSim Analysis API" in data["message"]
    print("✅ Root endpoint working")
    
    # Test health endpoint
    print("🏥 Testing health endpoint...")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("✅ Health endpoint working")
    
    print("🎉 All tests passed! FastAPI server is working correctly.")
    return True

if __name__ == "__main__":
    try:
        test_fastapi_server()
        print("\n🚀 Server is ready for development!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1) 