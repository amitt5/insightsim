#!/usr/bin/env python3
"""
PDF Text Extraction Service using PyMuPDF4LLM
Provides clean, LLM-ready text extraction from PDF documents
"""

import os
import tempfile
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import pymupdf4llm

app = Flask(__name__)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'pdf-extraction-service',
        'version': '1.0.0'
    })

@app.route('/extract-text', methods=['POST'])
def extract_text():
    """
    Extract clean text from PDF using PyMuPDF4LLM
    
    Returns:
        JSON response with extracted text or error message
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Only PDF files are supported'
            }), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            file.save(temp_file.name)
            temp_file_path = temp_file.name
        
        try:
            # Extract text using PyMuPDF4LLM
            md_text = pymupdf4llm.to_markdown(temp_file_path)
            
            # Basic cleaning (PyMuPDF4LLM already does most of the work)
            cleaned_text = md_text.strip()
            
            return jsonify({
                'success': True,
                'text': cleaned_text,
                'filename': filename,
                'character_count': len(cleaned_text)
            })
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except Exception as e:
        app.logger.error(f"Error extracting text from PDF: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to extract text: {str(e)}'
        }), 500

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'error': 'File too large. Maximum size is 10MB.'
    }), 413

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Starting PDF extraction service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
