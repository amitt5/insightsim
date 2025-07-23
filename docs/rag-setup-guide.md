# RAG Setup Guide

## Overview
This guide walks through setting up the complete RAG (Retrieval Augmented Generation) system for InsightSim, from database setup to Python service deployment.

## Prerequisites
- Node.js 18+ and pnpm installed
- Python 3.9+ installed
- Supabase project with admin access
- OpenAI API key

## Phase 1: Database & Storage Setup

### Step 1: Enable pgvector Extension
1. Go to **Supabase Dashboard** → **Database** → **Extensions**
2. Search for "vector" and enable the extension
3. Wait for activation (usually takes 30 seconds)

### Step 2: Create Database Tables
Execute the following SQL in **Supabase SQL Editor**:

```sql
-- RAG Documents table
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  processing_status TEXT DEFAULT 'processing' CHECK (processing_status IN ('processing', 'completed', 'failed')),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- RAG Settings per simulation
CREATE TABLE simulation_rag_settings (
  simulation_id UUID PRIMARY KEY REFERENCES simulations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT FALSE,
  chunk_size INTEGER DEFAULT 500,
  chunk_overlap INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_rag_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own RAG documents" 
ON rag_documents FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage RAG settings for their simulations" 
ON simulation_rag_settings FOR ALL USING (
  simulation_id IN (SELECT id FROM simulations WHERE user_id = auth.uid())
);

-- Grant permissions
GRANT ALL ON rag_documents TO authenticated;
GRANT ALL ON simulation_rag_settings TO authenticated;
```

### Step 3: Create Storage Bucket
1. Go to **Supabase Storage**
2. Click **"New Bucket"**
3. Configure:
   - **Name**: `rag-documents`
   - **Public**: `false`
   - **File size limit**: `50 MB`
4. Click **"Create Bucket"**

### Step 4: Set Storage Policies
In the `rag-documents` bucket policies section, create these policies:

```sql
-- Upload policy
CREATE POLICY "Users can upload their own RAG files" 
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'rag-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- View policy
CREATE POLICY "Users can view their own RAG files" 
ON storage.objects FOR SELECT USING (
  bucket_id = 'rag-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete policy
CREATE POLICY "Users can delete their own RAG files" 
ON storage.objects FOR DELETE USING (
  bucket_id = 'rag-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Phase 2: Python RAG Service Setup

### Step 1: Create Python Service Directory
```bash
mkdir python-rag-service
cd python-rag-service
```

### Step 2: Create Virtual Environment
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### Step 3: Install Dependencies
Create `requirements.txt`:
```txt
fastapi==0.104.1
uvicorn==0.24.0
llama-index==0.9.8
llama-index-vector-stores-supabase==0.1.3
supabase==2.0.2
python-multipart==0.0.6
asyncio==3.4.3
openai==1.3.5
python-dotenv==1.0.0
psycopg2-binary==2.9.7
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### Step 4: Create Project Structure
```bash
mkdir -p app/{models,services,routes,utils}
touch app/__init__.py
touch app/models/__init__.py
touch app/services/__init__.py
touch app/routes/__init__.py
touch app/utils/__init__.py
```

### Step 5: Environment Configuration
Create `.env` file:
```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
DATABASE_URL=postgresql://postgres:password@host:port/database

# Service Configuration
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
```

### Step 6: Create Core Service Files

**`app/main.py`**:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload, retrieve
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="InsightSim RAG Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(retrieve.router, prefix="/api", tags=["retrieve"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "rag-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
```

### Step 7: Test Python Service
Run the service:
```bash
python app/main.py
```

Visit `http://localhost:8000/docs` to see the FastAPI documentation.

## Phase 3: Next.js Integration

### Step 1: Install Dependencies
In your Next.js project root:
```bash
pnpm add @supabase/storage-js
```

### Step 2: Add Environment Variables
Add to your `.env.local`:
```bash
PYTHON_RAG_SERVICE_URL=http://localhost:8000
```

### Step 3: Create API Routes

**`app/api/rag/upload/route.ts`**:
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const simulationId = formData.get('simulation_id') as string
    
    // Validate file type
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json({ error: 'Only .txt files are supported' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileName = `${session.user.id}/${simulationId}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rag-documents')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Save document record
    const { data: docData, error: docError } = await supabase
      .from('rag_documents')
      .insert({
        simulation_id: simulationId,
        filename: file.name,
        storage_path: uploadData.path,
        file_size: file.size,
        user_id: session.user.id,
        processing_status: 'processing'
      })
      .select()
      .single()

    if (docError) throw docError

    // Call Python service for processing
    const pythonResponse = await fetch(`${process.env.PYTHON_RAG_SERVICE_URL}/api/process-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulation_id: simulationId,
        document_id: docData.id,
        storage_path: uploadData.path
      })
    })

    if (!pythonResponse.ok) {
      throw new Error('Failed to start document processing')
    }

    return NextResponse.json({ document: docData })
  } catch (error: any) {
    console.error('RAG upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Step 4: Create React Components

**`components/rag-upload-modal.tsx`**:
```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface RAGUploadModalProps {
  simulationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDocumentUploaded: () => void
}

export function RAGUploadModal({ simulationId, open, onOpenChange, onDocumentUploaded }: RAGUploadModalProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return
    
    const file = files[0]
    if (!file.name.endsWith('.txt')) {
      toast({
        title: "Invalid file type",
        description: "Only .txt files are supported in Phase 1",
        variant: "destructive"
      })
      return
    }
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('simulation_id', simulationId)

    try {
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast({
          title: "Upload successful",
          description: "Document is being processed for RAG"
        })
        onDocumentUploaded()
        onOpenChange(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Documents for RAG</DialogTitle>
        </DialogHeader>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            handleFileUpload(e.dataTransfer.files)
          }}
        >
          <p className="mb-4">Drag and drop your text files here, or click to select</p>
          <p className="text-sm text-gray-500 mb-4">Currently supports: .txt files only</p>
          <input
            type="file"
            accept=".txt"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              {uploading ? 'Uploading...' : 'Select Files'}
            </label>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Phase 4: Testing

### Test Database Setup
1. Verify tables exist in Supabase Database tab
2. Check RLS policies are enabled
3. Confirm storage bucket is created with correct policies

### Test Python Service
1. Start service: `python app/main.py`
2. Visit `http://localhost:8000/docs`
3. Test health endpoint: `curl http://localhost:8000/health`

### Test File Upload
1. Start Next.js dev server: `pnpm dev`
2. Navigate to a simulation page
3. Try uploading a sample .txt file
4. Check Supabase Storage for uploaded file
5. Verify database record in `rag_documents` table

### Test Processing Pipeline
1. Upload a document
2. Check processing status in database
3. Monitor Python service logs
4. Verify status changes to 'completed'

## Deployment Checklist

### Environment Setup
- [ ] All environment variables configured
- [ ] Database tables created with correct permissions
- [ ] Storage bucket and policies configured
- [ ] Python service dependencies installed

### Security Verification
- [ ] RLS policies tested and working
- [ ] Storage policies prevent cross-user access
- [ ] API endpoints validate user authentication
- [ ] File type validation working

### Performance Testing
- [ ] Test with various file sizes
- [ ] Verify async processing works
- [ ] Check database query performance
- [ ] Monitor embedding API usage

## Troubleshooting

### Common Issues

**Python service won't start**:
- Check all environment variables are set
- Verify OpenAI API key is valid
- Ensure database connection string is correct

**File upload fails**:
- Check Supabase storage policies
- Verify bucket name matches configuration
- Check file size limits

**Document processing stuck**:
- Check Python service logs
- Verify OpenAI API key has credits
- Check database connectivity

**RAG queries fail**:
- Ensure vector tables exist
- Check LlamaIndex configuration
- Verify simulation has processed documents

### Debug Commands

Check document status:
```sql
SELECT * FROM rag_documents WHERE processing_status = 'processing';
```

View storage objects:
```sql
SELECT * FROM storage.objects WHERE bucket_id = 'rag-documents';
```

Monitor vector tables:
```sql
SELECT schemaname, tablename FROM pg_tables WHERE tablename LIKE 'vecs_%';
```

## Next Steps

After completing Phase 1:
1. Test thoroughly with various text documents
2. Optimize chunk sizes and retrieval parameters
3. Monitor embedding costs and performance
4. Plan Phase 2 PDF implementation
5. Consider additional file format support

For support, refer to:
- [RAG Architecture Documentation](./rag-architecture.md)
- [Database Schema Documentation](./rag-database-schema.md)
- LlamaIndex documentation
- Supabase documentation 