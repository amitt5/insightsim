"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCircle } from "lucide-react"

interface Persona {
  id: string
  name: string
  age: number
  occupation: string
  traits: string[]
  archetype: string
}

interface PersonaCardProps {
  persona: Persona
  selected: boolean
  onToggle: () => void
}

export function PersonaCard({ persona, selected, onToggle }: PersonaCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${selected ? "border-2 border-primary" : ""}`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{persona.name}</h3>
              <Badge variant="outline" className="ml-2">
                {persona.archetype}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {persona.age} • {persona.occupation}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {persona.traits.map((trait, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
