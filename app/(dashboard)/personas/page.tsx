"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, UserCircle } from "lucide-react"

export default function PersonasPage() {
  const [open, setOpen] = useState(false)

  // Mock personas data
  const personas = [
    {
      id: "1",
      name: "Emma Chen",
      age: 34,
      occupation: "Marketing Manager",
      traits: ["Health-conscious", "Tech-savvy", "Budget-aware"],
      bio: "Emma is a busy professional who values efficiency and quality. She makes quick decisions but researches products thoroughly when she has time.",
      goal: "Find products that fit into her busy lifestyle while maintaining health standards",
      attitude: "Open to innovation but skeptical of marketing claims",
      archetype: "Busy Professional",
    },
    {
      id: "2",
      name: "David Kim",
      age: 28,
      occupation: "Software Developer",
      traits: ["Early adopter", "Analytical", "Convenience-focused"],
      bio: "David loves trying new technologies and products. He's data-driven and appreciates when companies use technology to improve experiences.",
      goal: "Discover innovative products that solve real problems",
      attitude: "Enthusiastic about new concepts, especially tech-enabled ones",
      archetype: "Tech Enthusiast",
    },
    {
      id: "3",
      name: "Sarah Johnson",
      age: 42,
      occupation: "Healthcare Administrator",
      traits: ["Quality-focused", "Practical", "Family-oriented"],
      bio: "Sarah makes purchasing decisions for her family of four. She prioritizes quality and safety over trends or novelty.",
      goal: "Find reliable, high-quality products that the whole family will enjoy",
      attitude: "Cautious about new products until proven safe and effective",
      archetype: "Careful Planner",
    },
    {
      id: "4",
      name: "Michael Rodriguez",
      age: 31,
      occupation: "Financial Analyst",
      traits: ["Value-conscious", "Detail-oriented", "Skeptical"],
      bio: "Michael carefully evaluates the cost-benefit of every purchase. He reads reviews extensively and compares options before buying.",
      goal: "Maximize value for money in every purchase decision",
      attitude: "Skeptical of marketing claims, needs proof of value",
      archetype: "Rational Buyer",
    },
    {
      id: "5",
      name: "Aisha Patel",
      age: 26,
      occupation: "Content Creator",
      traits: ["Trend-focused", "Social", "Experience-driven"],
      bio: "Aisha is highly influenced by social media and peer recommendations. She values aesthetics and shareability in products.",
      goal: "Find products that enhance her lifestyle and social presence",
      attitude: "Excited by trends and visual appeal",
      archetype: "Trendsetter",
    },
    {
      id: "6",
      name: "Robert Wilson",
      age: 58,
      occupation: "Retired Teacher",
      traits: ["Traditional", "Price-sensitive", "Community-minded"],
      bio: "Robert prefers familiar brands and products. He's price-conscious and values durability and reliability.",
      goal: "Find trustworthy products at reasonable prices",
      attitude: "Cautious about change, prefers established brands",
      archetype: "Traditionalist",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Personas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Persona
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Persona</DialogTitle>
              <DialogDescription>Add a new AI participant persona for your simulations</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input id="occupation" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="traits">Traits (comma-separated)</Label>
                <Input id="traits" placeholder="e.g., Health-conscious, Tech-savvy" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea id="bio" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona_goal">Persona Goal</Label>
                <Input id="persona_goal" placeholder="What is this persona trying to achieve?" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attitude">Attitude Toward Topic</Label>
                <Input id="attitude" placeholder="Initial bias or opinion" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="archetype">Archetype</Label>
                <Input id="archetype" placeholder="e.g., Budget Buyer, Trendsetter" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setOpen(false)}>
                Save Persona
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Personas</CardTitle>
          <CardDescription>Manage your AI participant personas for simulations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {personas.map((persona) => (
              <Card key={persona.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-primary/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary">
                        <UserCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-medium">{persona.name}</h3>
                        <p className="text-sm">
                          {persona.age} • {persona.occupation}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <Badge className="mb-2">{persona.archetype}</Badge>
                    <p className="mb-3 text-sm text-gray-600">{persona.bio}</p>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500">TRAITS</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {persona.traits.map((trait, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500">GOAL</span>
                      <p className="text-xs text-gray-600">{persona.goal}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">ATTITUDE</span>
                      <p className="text-xs text-gray-600">{persona.attitude}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
