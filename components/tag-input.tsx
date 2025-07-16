"use client";

import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
  className?: string;
}

export default function TagInput({
  tags,
  onTagsChange,
  placeholder = "Add tags...",
  maxTags = 20,
  suggestions = [],
  className = ""
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = suggestions.filter(
    suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(suggestion)
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      tags.length < maxTags
    ) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(e.target.value.length > 0 && filteredSuggestions.length > 0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Tags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="px-2 py-1 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-blue-600 focus:outline-none"
                aria-label={`Remove ${tag} tag`}
              >
                <X size={14} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Section */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.length > 0 && filteredSuggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length >= maxTags ? `Maximum ${maxTags} tags` : placeholder}
            disabled={tags.length >= maxTags}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTag(inputValue)}
            disabled={!inputValue.trim() || tags.length >= maxTags}
            className="px-3"
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>Press Enter or comma to add tags</span>
        <span>{tags.length} / {maxTags}</span>
      </div>
    </div>
  );
} 