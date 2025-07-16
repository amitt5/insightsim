"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
}

export function PersonaCard({ 
  persona, 
  selected = false, 
  onToggle, 
  selectable = false,
  onUpdate 
}: PersonaCardProps) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  
  // Ensure traits is always an array
  const traits = Array.isArray(persona.traits) 
    ? persona.traits 
    : typeof persona.traits === 'string' 
      ? (persona.traits as string).split(',').map(t => t.trim())
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

  return (
    <>
      <Card 
        className={cardClasses}
        onClick={selectable && onToggle ? onToggle : undefined}
      >
        <CardContent className="p-0">
          <div className="bg-primary/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary">
                <UserCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate">{persona.name}</h3>
                <p className="text-sm flex items-center gap-1 flex-wrap">
                  {persona.gender && <span>{persona.gender}</span>}
                  {persona.age && <span>{persona.age}</span>}
                  {persona.occupation && <><span>•</span> <span className="truncate">{persona.occupation}</span></>}
                  {persona.location && <><span>•</span> <span className="truncate">{persona.location}</span></>}
                </p>
              </div>
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
          </div>
          <div className="p-4">
            {persona.archetype && <Badge className="mb-2">{persona.archetype}</Badge>}
            {persona.bio && <p className="mb-3 text-sm text-gray-600 line-clamp-3">{persona.bio}</p>}
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
                <p className="text-xs text-gray-600 line-clamp-2">{persona.goal}</p>
              </div>
            )}
            {persona.attitude && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">ATTITUDE</span>
                <p className="text-xs text-gray-600 line-clamp-2">{persona.attitude}</p>
              </div>
            )}
            {persona.family_status && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">FAMILY STATUS</span>
                <p className="text-xs text-gray-600 line-clamp-2">{persona.family_status}</p>
              </div>
            )}
            {persona.education_level && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">EDUCATION</span>
                <p className="text-xs text-gray-600 line-clamp-2">{persona.education_level}</p>
              </div>
            )}
            {persona.income_level && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">INCOME</span>
                <p className="text-xs text-gray-600 line-clamp-2">{persona.income_level}</p>
              </div>
            )}
            {persona.lifestyle && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">LIFESTYLE</span>
                <p className="text-xs text-gray-600 line-clamp-3">{persona.lifestyle}</p>
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
                <p className="text-xs text-gray-600 line-clamp-3">{persona.product_relationship}</p>
              </div>
            )}
            {persona.category_habits && (
              <div>
                <span className="text-xs font-medium text-gray-500">CATEGORY HABITS</span>
                <p className="text-xs text-gray-600 line-clamp-3">{persona.category_habits}</p>
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
    </>
  )
}
