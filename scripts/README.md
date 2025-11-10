# Google File Search Upload Script

This Python script handles file uploads to Google File Search Store using the official Google GenAI SDK.

## Setup

1. Install Python 3.8 or higher
2. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
   Or install directly:
   ```bash
   pip install google-genai
   ```

3. Make the script executable (optional):
   ```bash
   chmod +x scripts/upload_to_file_search.py
   ```

## Usage

The script is called automatically by the Node.js backend. Manual usage:

```bash
python3 scripts/upload_to_file_search.py <api_key> <file_path> <store_name> <display_name>
```

### Arguments:
- `api_key`: Google API key (or set GOOGLE_API_KEY environment variable)
- `file_path`: Path to the file to upload
- `store_name`: Google File Search Store name (e.g., `fileSearchStores/123456`)
- `display_name`: Display name for the file (visible in citations)

### Output:
The script outputs JSON to stdout:
- Success: `{"success": true, "operation_name": "...", "file_name": "...", "done": true}`
- Error: `{"error": "error message"}` (to stderr)

## Notes

- The script uses the official Google GenAI SDK, matching the documentation example exactly
- It handles operation polling automatically (waits up to 5 minutes)
- All errors are returned as JSON for easy parsing by Node.js

