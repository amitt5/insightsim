import requests
import json

def test_health():
    """Test the health check endpoint"""
    response = requests.get('http://127.0.0.1:8002/health')
    print("Health Check:", response.json())
    assert response.status_code == 200

def test_chunking():
    """Test document chunking"""
    # Sample document
    test_doc = {
        "document_id": "test-123",
        "text": """This is a test document that we'll use to verify the chunking service. 
        We'll make it long enough to potentially create multiple chunks. Let's add some more text 
        to make sure we get multiple chunks. Here's some lorem ipsum: Lorem ipsum dolor sit amet, 
        consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        """ * 10,  # Repeat text to ensure multiple chunks
        "metadata": {
            "file_name": "test.txt",
            "file_type": "text/plain",
            "page_count": 1
        }
    }

    # Send request
    response = requests.post(
        'http://localhost:8002/chunk-document',
        json=test_doc,
        headers={'Content-Type': 'application/json'}
    )
    
    result = response.json()
    print("\nChunking Test Results:")
    print(f"Status Code: {response.status_code}")
    print(f"Number of chunks: {len(result['chunks'])}")
    print("\nFirst chunk:")
    print(json.dumps(result['chunks'][0], indent=2))
    
    assert response.status_code == 200
    assert len(result['chunks']) > 1
    assert 'text' in result['chunks'][0]
    assert 'metadata' in result['chunks'][0]

if __name__ == '__main__':
    print("Testing Chunking Service...")
    test_health()
    test_chunking()
    print("\nAll tests passed!")
