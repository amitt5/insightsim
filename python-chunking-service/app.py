from flask import Flask, request, jsonify
from chunking.processor import process_document
from chunking.types import ChunkRequest, ChunkResponse
import config

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

@app.route('/chunk-document', methods=['POST'])
def chunk_document():
    """
    Chunk a document using LlamaIndex
    
    Expected request body:
    {
        "document_id": "uuid",
        "text": "document text",
        "metadata": {
            "file_name": "example.pdf",
            "file_type": "application/pdf",
            ...
        }
    }
    """
    try:
        print("Received chunk request")
        data: ChunkRequest = request.json
        print(f"Request data: {data}")
        
        if not data or not isinstance(data, dict):
            print("Error: Invalid request body")
            return jsonify({"error": "Invalid request body"}), 400
        
        required_fields = ['document_id', 'text', 'metadata']
        if not all(field in data for field in required_fields):
            missing = [f for f in required_fields if f not in data]
            print(f"Error: Missing required fields: {missing}")
            return jsonify({"error": f"Missing required fields: {missing}"}), 400
        
        print("Processing document...")
        try:
            chunks = process_document(data['text'], data['metadata'])
            print(f"Generated {len(chunks)} chunks")
            
            response: ChunkResponse = {
                "chunks": chunks,
                "error": None
            }
            
            return jsonify(response)
        except Exception as e:
            print(f"Error in process_document: {str(e)}")
            raise
    
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({
            "chunks": [],
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=True
    )
