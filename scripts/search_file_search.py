#!/usr/bin/env python3
"""
Google File Search Script
Searches a Google File Search Store using the official SDK.
This script is called from Node.js via subprocess.
"""

import sys
import json
import requests

try:
    from google import genai
    from google.genai import types
except ImportError:
    print(json.dumps({
        "error": "google-genai package not installed. Run: pip install google-genai"
    }), file=sys.stderr)
    sys.exit(1)


def main():
    """Main function to handle file search in Google File Search Store."""
    try:
        # Parse command-line arguments
        if len(sys.argv) < 4:
            print(json.dumps({
                "error": "Missing required arguments. Usage: python search_file_search.py <api_key> <store_name> <query>"
            }), file=sys.stderr)
            sys.exit(1)

        api_key = sys.argv[1]
        store_name = sys.argv[2]
        query = sys.argv[3]

        # Use REST API directly to avoid SDK API issues
        # Try different models in order of preference
        models_to_try = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro-002']
        
        # Ensure store_name is in correct format
        if not store_name.startswith('fileSearchStores/'):
            store_name = f'fileSearchStores/{store_name}'
        
        # Try different tools format - maybe it needs to be an object, not an array
        request_body = {
            'contents': [{
                'role': 'user',
                'parts': [{'text': query}]
            }],
            'tools': {
                'fileSearch': {
                    'fileSearchStoreNames': [store_name]
                }
            }
        }
        
        # Try each model until one works
        last_error = None
        for model in models_to_try:
            url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
            
            # Make the API request
            api_response = requests.post(url, json=request_body)
            
            if api_response.ok:
                response_data = api_response.json()
                break
            else:
                error_text = api_response.text
                last_error = f'Model {model}: {api_response.status_code} - {error_text}'
                # If it's a 404 (model not found), try next model
                if api_response.status_code == 404:
                    continue
                else:
                    # For other errors, raise immediately
                    raise Exception(f'Google API error: {api_response.status_code} - {error_text}')
        else:
            # If all models failed, raise the last error
            raise Exception(f'All models failed. Last error: {last_error}')
        
        # Extract the response - REST API returns JSON directly
        result = {
            "success": True,
            "candidates": []
        }

        # Process candidates from REST API response
        candidates = response_data.get('candidates', [])
        for candidate in candidates:
            candidate_data = {
                "content": {
                    "parts": []
                },
                "groundingMetadata": {
                    "groundingChunks": []
                }
            }

            # Extract content parts
            content = candidate.get('content', {})
            parts = content.get('parts', [])
            for part in parts:
                if 'text' in part:
                    candidate_data["content"]["parts"].append({"text": part['text']})

            # Extract grounding metadata
            grounding_metadata = candidate.get('groundingMetadata', {})
            grounding_chunks = grounding_metadata.get('groundingChunks', [])
            for chunk in grounding_chunks:
                chunk_data = {
                    "documentChunkInfo": {},
                    "chunk": {}
                }
                
                doc_chunk_info = chunk.get('documentChunkInfo', {})
                if 'documentName' in doc_chunk_info:
                    chunk_data["documentChunkInfo"]["documentName"] = doc_chunk_info['documentName']
                if 'chunkIndex' in doc_chunk_info:
                    chunk_data["documentChunkInfo"]["chunkIndex"] = doc_chunk_info['chunkIndex']
                
                chunk_obj = chunk.get('chunk', {})
                if 'chunkId' in chunk_obj:
                    chunk_data["chunk"]["chunkId"] = chunk_obj['chunkId']
                if 'chunkRelevanceScore' in chunk_obj:
                    chunk_data["chunk"]["chunkRelevanceScore"] = chunk_obj['chunkRelevanceScore']
                
                candidate_data["groundingMetadata"]["groundingChunks"].append(chunk_data)

            result["candidates"].append(candidate_data)

        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "error_type": type(e).__name__
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

