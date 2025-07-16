"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X, Tag } from "lucide-react";
import { Persona } from "@/utils/types";

interface PersonaFilterProps {
  personas: Persona[];
  onFilteredPersonasChange: (filtered: Persona[]) => void;
  className?: string;
}

export default function PersonaFilter({ 
  personas, 
  onFilteredPersonasChange, 
  className = "" 
}: PersonaFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>(personas);

  // Get all unique tags from all personas
  const allTags = Array.from(
    new Set(
      personas
        .flatMap(persona => persona.tags || [])
        .filter(tag => tag && tag.trim().length > 0)
    )
  ).sort();

  // Filter personas based on search query and selected tags
  useEffect(() => {
    let filtered = personas;

    // Filter by search query (name, occupation, location, archetype)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(persona =>
        persona.name.toLowerCase().includes(query) ||
        persona.occupation?.toLowerCase().includes(query) ||
        persona.location?.toLowerCase().includes(query) ||
        persona.archetype?.toLowerCase().includes(query) ||
        persona.bio?.toLowerCase().includes(query)
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(persona =>
        selectedTags.some(tag => persona.tags?.includes(tag))
      );
    }

    setFilteredPersonas(filtered);
    onFilteredPersonasChange(filtered);
  }, [searchQuery, selectedTags, personas, onFilteredPersonasChange]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery.trim() || selectedTags.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search personas by name, occupation, location, or bio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Tag Filters
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedTags.length}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <Badge
              key={tag}
              variant="default"
              className="cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200"
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Filters */}
      {showFilters && allTags.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Filter by Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "secondary"}
                  className={`cursor-pointer transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {allTags.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No tags found in your personas
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-gray-500">
          {filteredPersonas.length === 0 ? (
            "No personas match your filters"
          ) : (
            <>
              Showing {filteredPersonas.length} of {personas.length} personas
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedTags.length > 0 && ` with tags: ${selectedTags.join(", ")}`}
            </>
          )}
        </div>
      )}
    </div>
  );
} 