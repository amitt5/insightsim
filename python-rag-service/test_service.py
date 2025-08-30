#!/usr/bin/env python3
"""
Test script for PDF extraction service
"""

import requests
import sys

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get('http://localhost:8001/health')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def main():
    print("Testing PDF extraction service...")
    
    if test_health():
        print("🎉 Service is running and healthy!")
    else:
        print("💥 Service is not responding")
        sys.exit(1)

if __name__ == '__main__':
    main()
