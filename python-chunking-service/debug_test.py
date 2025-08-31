import requests
import json

def test_chunking():
    """Test document chunking"""
    # Sample document
    test_doc = {
        "document_id": "test-123",
        "text": """This is a test document with multiple sentences. Each sentence should be processed separately. 
        We want to make sure the chunking works correctly. Here is another sentence that adds more content. 
        And another one. Plus one more to be thorough. Let's add a few more to really test it out. 
        The chunking should handle this text appropriately. Breaking it into reasonable sized chunks. 
        While maintaining sentence boundaries where possible. And respecting the configured chunk size.""",
        "metadata": {
            "document_id": "test-123",
            "file_name": "test.txt",
            "file_type": "text/plain",
            "page_count": 1
        }
    }
    print("Debug: Constructed test document")

    print("Sending request to chunking service...")
    try:
        print("Testing health endpoint first...")
        health = requests.get('http://localhost:8002/health')
        print(f"Health check response: {health.status_code} - {health.text}")
        
        print("\nNow testing chunking endpoint...")
        print(f"Sending data: {json.dumps(test_doc, indent=2)}")
        
        response = requests.post(
            'http://localhost:8002/chunk-document',
            json=test_doc,
            headers={'Content-Type': 'application/json'},
            timeout=10  # Add timeout
        )
        
        print(f"\nResponse status code: {response.status_code}")
        print(f"Response content: {response.text}")
        
    except requests.exceptions.Timeout:
        print("Request timed out after 10 seconds")
    except requests.exceptions.RequestException as e:
        print(f"Error making request: {str(e)}")

if __name__ == '__main__':
    test_chunking()
