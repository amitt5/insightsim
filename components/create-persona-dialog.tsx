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
import { useToast } from "@/hooks/use-toast"

interface CreatePersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newPersona: any) => void;
}

export function CreatePersonaDialog({ open, onOpenChange, onSuccess }: CreatePersonaDialogProps) {
  const { toast } = useToast();
  
  // State to store form values
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    occupation: "",
    archetype: "",
    bio: "",
    traits: "",
    goal: "",
    attitude: "",
  });

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Create persona object from form data
    const personaData = {
      ...formData,
      // Convert age to number if present
      age: formData.age ? parseInt(formData.age) : undefined,
      // Convert traits string to array
      traits: formData.traits ? formData.traits.split(',').map(t => t.trim()) : [],
    };

    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create persona');
      }
      
      // Get the newly created persona
      const newPersona = await response.json();
      
      // Call the onSuccess callback with the newly created persona
      if (onSuccess) {
        onSuccess(newPersona);
      }
      
      // Show success toast
      toast({
        title: "Success",
        description: "Persona created successfully",
        duration: 3000,
      });
      
      // Reset form fields
      setFormData({
        name: "",
        age: "",
        gender: "",
        occupation: "",
        archetype: "",
        bio: "",
        traits: "",
        goal: "",
        attitude: "",
      });
      
      // Close the dialog
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error creating persona:', err);
      
      // Show error toast
      toast({
        title: "Error",
        description: err.message || "Failed to create persona",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

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
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input 
                id="age" 
                type="number" 
                value={formData.age}
                onChange={(e) => handleChange("age", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select 
              value={formData.gender}
              onValueChange={(value) => handleChange("gender", value)}
            >
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
            <Input 
              id="occupation" 
              value={formData.occupation}
              onChange={(e) => handleChange("occupation", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="archetype">Archetype</Label>
            <Input 
              id="archetype" 
              placeholder="e.g., Budget Buyer, Trendsetter" 
              value={formData.archetype}
              onChange={(e) => handleChange("archetype", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Short Bio</Label>
            <Textarea 
              id="bio" 
              rows={3} 
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="traits">Traits (comma-separated)</Label>
            <Input 
              id="traits" 
              placeholder="e.g., Health-conscious, Tech-savvy" 
              value={formData.traits}
              onChange={(e) => handleChange("traits", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="persona_goal">Persona Goal</Label>
            <Input 
              id="persona_goal" 
              placeholder="What is this persona trying to achieve?" 
              value={formData.goal}
              onChange={(e) => handleChange("goal", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attitude">Attitude Toward Topic</Label>
            <Input 
              id="attitude" 
              placeholder="Initial bias or opinion" 
              value={formData.attitude}
              onChange={(e) => handleChange("attitude", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="px-6 py-2 pb-1 border-t">
          <Button type="submit" onClick={handleSubmit}>
            Save Persona
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 