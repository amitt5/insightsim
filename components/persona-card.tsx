"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { UserCircle, Pencil, Copy, Trash } from "lucide-react"
import { Persona } from "@/utils/types"
import { CreatePersonaDialog } from "./create-persona-dialog"
import { useToast } from "@/hooks/use-toast"

interface PersonaCardProps {
  persona: Persona
  selected?: boolean
  onToggle?: () => void
  selectable?: boolean
  onUpdate?: (updatedPersona: Persona) => void
  isEnhanced?: boolean
}

export function PersonaCard({ 
  persona, 
  selected = false, 
  onToggle, 
  selectable = false,
  onUpdate,
  isEnhanced = false
}: PersonaCardProps) {
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  
  // Ensure traits is always an array
  const traits = Array.isArray(persona.traits) 
    ? persona.traits 
    : typeof persona.traits === 'string' 
      ? (() => {
          try {
            // Try to parse as JSON first (for LLM-generated personas)
            const parsed = JSON.parse(persona.traits);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            // Fallback to comma-split for manually entered traits
            return (persona.traits as string).split(',').map(t => t.trim());
          }
        })()
      : [];

  const cardClasses = `${selectable 
    ? `cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary" : ""}`
    : ""} min-w-0 w-full`;

  const handleEditSuccess = (updatedPersona: Persona) => {
    if (onUpdate) {
      onUpdate(updatedPersona);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the persona "${persona.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/personas?id=${persona.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete persona');
      }

      toast({
        title: "Success",
        description: "Persona deleted successfully",
        duration: 3000,
      });

      if (onUpdate) {
        onUpdate(persona);
      }
    } catch (err: any) {
      console.error('Error deleting persona:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete persona",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Don't render the card if the persona is not editable
  if (!persona.editable) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card 
        className={cardClasses}
        onClick={selectable && onToggle ? onToggle : undefined}
      >
        <CardContent className="p-0 relative">
          {isEnhanced && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="default" className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200">
                Enhanced
              </Badge>
            </div>
          )}
          <div className="bg-primary/10 p-4">
            {/* Row 1: Name/Basic Info + Buttons */}
            <div className="flex items-start gap-3 mb-1">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary">
                <UserCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{persona.name} </h3>
                <div className="text-sm">
                  {(persona.gender || persona.age) && (
                    <p className="flex items-center gap-1">
                      {persona.gender && <span>{persona.gender},</span>}
                      {persona.age && <span>{persona.age}</span>}
                    </p>
                  )}
                </div>
              </div>
              {!isEnhanced && (
                <div className="flex gap-1">
                  {persona.editable && (
                    <>
                      <button 
                        className="p-1 hover:bg-white/50 rounded-full transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditDialogOpen(true);
                        }}
                        title="Edit Persona"
                      >
                        <Pencil className="h-4 w-4 text-primary" />
                      </button>
                      <button 
                        className="p-1 hover:bg-white/50 rounded-full transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        title="Delete Persona"
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </button>
                    </>
                  )}
                  <button
                    className="p-1 hover:bg-white/50 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDuplicateDialogOpen(true);
                    }}
                    title="Duplicate Persona"
                  >
                    <Copy className="h-4 w-4 text-primary" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Row 2: Occupation */}
            {persona.occupation && (
              <div className="flex items-start gap-3 mb-1">
                <div className="flex-shrink-0 w-10"></div>
                <div className="flex-1 text-sm">
                  <p>{persona.occupation}</p>
                </div>
              </div>
            )}
            
            {/* Row 3: Location */}
            {persona.location && (
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10"></div>
                <div className="flex-1 text-sm">
                  <p>{persona.location}</p>
                </div>
              </div>
            )}
            
            {/* Tags */}
            {persona.tags && persona.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10"></div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1">
                    {persona.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4">
            {persona.archetype && <Badge className="mb-2">{persona.archetype}</Badge>}
            {persona.bio && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="mb-3 text-sm text-gray-600 line-clamp-3 cursor-help">{persona.bio}</p>
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <p className="whitespace-normal">{persona.bio}</p>
                </TooltipContent>
              </Tooltip>
            )}
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-500">TRAITS</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {traits.map((trait: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
            {persona.goal && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">GOAL</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-600 line-clamp-2 cursor-help">{persona.goal}</p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="whitespace-normal">{persona.goal}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {persona.attitude && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">ATTITUDE</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-600 line-clamp-2 cursor-help">{persona.attitude}</p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="whitespace-normal">{persona.attitude}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {persona.family_status && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">FAMILY STATUS</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-600 line-clamp-2 cursor-help">{persona.family_status}</p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="whitespace-normal">{persona.family_status}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {persona.education_level && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">EDUCATION</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-600 line-clamp-2 cursor-help">{persona.education_level}</p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="whitespace-normal">{persona.education_level}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {persona.income_level && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">INCOME</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-600 line-clamp-2 cursor-help">{persona.income_level}</p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="whitespace-normal">{persona.income_level}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {persona.lifestyle && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">LIFESTYLE</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-600 line-clamp-3 cursor-help">{persona.lifestyle}</p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="whitespace-normal">{persona.lifestyle}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {persona.category_products && persona.category_products.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">CATEGORY PRODUCTS</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {persona.category_products.map((product: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {persona.product_relationship && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">PRODUCT RELATIONSHIP</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-600 line-clamp-3 cursor-help">{persona.product_relationship}</p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="whitespace-normal">{persona.product_relationship}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {persona.category_habits && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">CATEGORY HABITS</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-600 line-clamp-3 cursor-help">{persona.category_habits}</p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p className="whitespace-normal">{persona.category_habits}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

          </div>
        </CardContent>
      </Card>

      <CreatePersonaDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialData={persona}
        mode="edit"
        onSuccess={handleEditSuccess}
        hideTrigger={true}
      />
      <CreatePersonaDialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        initialData={persona}
        mode="create"
        hideTrigger={true}
        onSuccess={onUpdate}
      />
    </TooltipProvider>
  )
}
