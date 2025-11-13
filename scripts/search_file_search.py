#!/usr/bin/env python3
"""
Google File Search Script
Searches a Google File Search Store using the official SDK.
This script is called from Node.js via subprocess.
"""

import sys
import json

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

        # Initialize Google GenAI client (same as upload script)
        client = genai.Client(api_key=api_key)

        # Ensure store_name is in correct format
        if not store_name.startswith('fileSearchStores/'):
            store_name = f'fileSearchStores/{store_name}'

        # Use SDK's generate_content method with file search
        # Based on official docs: https://ai.google.dev/gemini-api/docs/file-search#javascript
        # Try gemini-2.5-flash first, fallback to gemini-2.5-pro
        models_to_try = ['gemini-2.5-flash', 'gemini-2.5-pro']
        
        response = None
        last_error = None
        
        for model in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=query,  # Can be a string directly
                    config=types.GenerateContentConfig(
                        tools=[
                            types.Tool(
                                file_search=types.FileSearch(
                                    file_search_store_names=[store_name]
                                )
                            )
                        ]
                    )
                )
                break  # Success, exit loop
            except Exception as e:
                last_error = str(e)
                # If it's a model not found error, try next model
                if 'not found' in str(e).lower() or '404' in str(e):
                    continue
                else:
                    # For other errors, raise immediately
                    raise
        
        if response is None:
            raise Exception(f'All models failed. Last error: {last_error}')

        # Extract the response
        result = {
            "success": True,
            "candidates": []
        }

        # Process candidates from SDK response
        if hasattr(response, 'candidates') and response.candidates:
            for candidate in response.candidates:
                candidate_data = {
                    "content": {
                        "parts": []
                    },
                    "groundingMetadata": {
                        "groundingChunks": []
                    }
                }

                # Extract content parts
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts'):
                        for part in candidate.content.parts:
                            if hasattr(part, 'text'):
                                candidate_data["content"]["parts"].append({"text": part.text})

                # Extract grounding metadata
                if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                    if hasattr(candidate.grounding_metadata, 'grounding_chunks'):
                        for chunk in candidate.grounding_metadata.grounding_chunks:
                            chunk_data = {
                                "documentChunkInfo": {},
                                "chunk": {}
                            }
                            
                            if hasattr(chunk, 'document_chunk_info'):
                                doc_info = chunk.document_chunk_info
                                if hasattr(doc_info, 'document_name'):
                                    chunk_data["documentChunkInfo"]["documentName"] = doc_info.document_name
                                if hasattr(doc_info, 'chunk_index'):
                                    chunk_data["documentChunkInfo"]["chunkIndex"] = doc_info.chunk_index
                            
                            if hasattr(chunk, 'chunk'):
                                chunk_obj = chunk.chunk
                                if hasattr(chunk_obj, 'chunk_id'):
                                    chunk_data["chunk"]["chunkId"] = chunk_obj.chunk_id
                                if hasattr(chunk_obj, 'chunk_relevance_score'):
                                    chunk_data["chunk"]["chunkRelevanceScore"] = chunk_obj.chunk_relevance_score
                            
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

