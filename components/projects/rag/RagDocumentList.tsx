"use client"

import React from 'react';
import RagDocumentCard from './RagDocumentCard';
import { FileIcon } from "lucide-react";
import { RagDocument } from "@/utils/types";


interface RagDocumentListProps {
  documents: RagDocument[];
  onDelete: (documentId: string) => void;
  onView?: (document: RagDocument) => void;
}

export default function RagDocumentList({ 
  documents, 
  onDelete, 
  onView 
}: RagDocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
        <p className="text-gray-500">
          Upload PDF documents to get started with RAG functionality
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Uploaded Documents ({documents.length})
        </h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((document) => (
          <RagDocumentCard
            key={document.id}
            document={document}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
}
