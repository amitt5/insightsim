#!/usr/bin/env python3
"""
Google File Search Upload Script
Uploads a file to Google File Search Store using the official SDK.
This script is called from Node.js via subprocess.
"""

import sys
import json
import time
import os
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print(json.dumps({
        "error": "google-genai package not installed. Run: pip install google-genai"
    }), file=sys.stderr)
    sys.exit(1)


def main():
    """Main function to handle file upload to Google File Search Store."""
    try:
        # Parse command-line arguments
        if len(sys.argv) < 5:
            print(json.dumps({
                "error": "Missing required arguments. Usage: python upload_to_file_search.py <api_key> <file_path> <store_name> <display_name>"
            }), file=sys.stderr)
            sys.exit(1)

        api_key = sys.argv[1]
        file_path = sys.argv[2]
        store_name = sys.argv[3]
        display_name = sys.argv[4]

        # Validate file exists
        if not os.path.exists(file_path):
            print(json.dumps({
                "error": f"File not found: {file_path}"
            }), file=sys.stderr)
            sys.exit(1)

        # Initialize Google GenAI client
        client = genai.Client(api_key=api_key)

        # Upload and import file into the file search store
        # This matches the exact format from the documentation
        operation = client.file_search_stores.upload_to_file_search_store(
            file=file_path,
            file_search_store_name=store_name,
            config={
                'display_name': display_name,
            }
        )

        # Wait until import is complete (matching documentation example)
        max_wait_time = 300  # 5 minutes
        poll_interval = 2  # 2 seconds
        start_time = time.time()

        while not operation.done:
            if time.time() - start_time > max_wait_time:
                print(json.dumps({
                    "error": f"Operation timed out after {max_wait_time} seconds",
                    "operation_name": operation.name if hasattr(operation, 'name') else None
                }), file=sys.stderr)
                sys.exit(1)

            time.sleep(poll_interval)
            operation = client.operations.get(operation)

        # Check for errors
        if hasattr(operation, 'error') and operation.error:
            print(json.dumps({
                "error": f"Operation failed: {operation.error}",
                "operation_name": operation.name if hasattr(operation, 'name') else None
            }), file=sys.stderr)
            sys.exit(1)

        # Extract document resource name from operation response
        # The document resource name format is: fileSearchStores/{store_id}/documents/{document_id}
        document_resource_name = None
        if hasattr(operation, 'response'):
            response = operation.response
            if isinstance(response, dict):
                # Check for document resource name (fileSearchStores/.../documents/...)
                if 'document' in response and 'name' in response['document']:
                    document_resource_name = response['document']['name']
                elif 'name' in response:
                    name = response['name']
                    # Check if it's the document resource name format
                    if name.startswith('fileSearchStores/'):
                        document_resource_name = name
                    # Otherwise it might be files/{id} which we can't use directly for deletion
                    # We'll need to look it up later
                # Also check for file reference (legacy - if document not found)
                if not document_resource_name and 'file' in response and 'name' in response['file']:
                    # This is files/{id}, not the document resource name
                    # We can't use this directly, will need lookup later
                    # For now, we'll return None and the Node.js code will look it up
                    pass

        # Return success result
        # If we have document_resource_name, use it; otherwise use display_name
        # The Node.js code will look up the document resource name if needed
        result = {
            "success": True,
            "operation_name": operation.name if hasattr(operation, 'name') else None,
            "file_name": document_resource_name or display_name,  # Use document resource name if available
            "done": operation.done
        }

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

