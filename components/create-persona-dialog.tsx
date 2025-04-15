"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

interface CreatePersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (personaData: any) => void;
}

export function CreatePersonaDialog({ open, onOpenChange, onSave }: CreatePersonaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Persona
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col pb-0 pt-0">
        <DialogHeader className="px-6 pt-2 pb-2">
          <DialogTitle>Create New Persona</DialogTitle>
          <DialogDescription>Add a new AI participant persona for your simulations</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 px-6 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300">
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
            <Label htmlFor="gender">Gender</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Non-binary">Non-binary</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input id="occupation" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="archetype">Archetype</Label>
            <Input id="archetype" placeholder="e.g., Budget Buyer, Trendsetter" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Short Bio</Label>
            <Textarea id="bio" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="traits">Traits (comma-separated)</Label>
            <Input id="traits" placeholder="e.g., Health-conscious, Tech-savvy" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="persona_goal">Persona Goal</Label>
            <Input id="persona_goal" placeholder="What is this persona trying to achieve?" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attitude">Attitude Toward Topic</Label>
            <Input id="attitude" placeholder="Initial bias or opinion" />
          </div>
        </div>
        <DialogFooter className="px-6 py-2 pb-1 border-t">
          <Button type="submit" onClick={() => onSave && onSave({})}>
            Save Persona
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 