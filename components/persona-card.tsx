"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCircle } from "lucide-react"
import { Persona } from "@/utils/types";


interface PersonaCardProps {
  persona: Persona
  selected?: boolean
  onToggle?: () => void
  selectable?: boolean
}

export function PersonaCard({ persona, selected = false, onToggle, selectable = false }: PersonaCardProps) {
  // Process traits to handle various data formats
  const processTraits = () => {
    let traits: string[] = [];
    if (Array.isArray(persona.traits)) {
      traits = persona.traits;
    } else if (typeof persona.traits === 'string') {
      if (persona.traits.trim().startsWith('[')) {
        try {
          traits = JSON.parse(persona.traits);
        } catch {
          traits = persona.traits.split(',').map((t: string) => t.trim());
        }
      } else {
        traits = persona.traits.split(',').map((t: string) => t.trim());
      }
    }
    return traits;
  };

  const traits = processTraits();

  const cardClasses = `${selectable 
    ? `cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-primary" : ""}`
    : ""} min-w-0 w-full`;

  return (
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
              </p>
            </div>
          </div>
        </div>
        <div className="p-4">
          {persona.archetype && <Badge className="mb-2">{persona.archetype}</Badge>}
          {persona.bio && <p className="mb-3 text-sm text-gray-600 line-clamp-3">{persona.bio}</p>}
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-500">TRAITS</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {traits.map((trait, i) => (
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
            <div>
              <span className="text-xs font-medium text-gray-500">ATTITUDE</span>
              <p className="text-xs text-gray-600 line-clamp-2">{persona.attitude}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
