"use client"

import { useState, useEffect } from "react"
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
import { Plus, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Persona } from "@/utils/types"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface CreatePersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newPersona: any) => void;
  initialData?: Persona;
  mode?: 'create' | 'edit';
  hideTrigger?: boolean;
  onHideSystemPersonasChange?: (hide: boolean) => void;
  hideSystemPersonas?: boolean;
}

// Example constants
const OCCUPATION_EXAMPLES = [
  "Marketing Manager", "Software Engineer", "Nurse", "High School Teacher", "Accountant", "Sales Representative", "Graphic Designer", "Product Manager", "Data Analyst", "Customer Support Specialist", "Construction Worker", "Chef", "Retail Store Manager", "Financial Advisor", "HR Specialist", "Pharmacist", "Research Scientist", "Freelance Writer", "UX Designer", "Operations Director"
];
const ARCHETYPE_EXAMPLES = [
  "Budget Buyer", "Trendsetter", "Caregiver", "Early Adopter", "Skeptic", "Loyalist", "Explorer", "Achiever", "Social Butterfly", "Minimalist", "Health Enthusiast", "Tech-Savvy", "Traditionalist", "Adventurer", "Influencer", "Analytical Thinker", "Eco-Conscious", "Brand Advocate", "Impulse Shopper", "Pragmatist"
];
const GOAL_EXAMPLES = [
  "Save money on monthly expenses", "Find the best product for my needs", "Balance work and family life", "Advance my career", "Stay healthy and fit", "Learn new skills", "Make a positive impact", "Be recognized for my work", "Try new experiences", "Build a strong network", "Achieve financial independence", "Help others succeed", "Reduce stress", "Travel more often", "Live sustainably", "Be a good role model", "Master a hobby", "Improve productivity", "Gain respect from peers", "Make informed decisions"
];
const ATTITUDE_EXAMPLES = [
  "Open-minded and curious", "Skeptical but willing to try", "Cautiously optimistic", "Highly enthusiastic", "Indifferent", "Critical of new trends", "Supportive of innovation", "Traditional and reserved", "Eager to learn", "Wary of risks", "Confident in opinions", "Easily influenced by peers", "Prefers evidence-based decisions", "Emotionally driven", "Pragmatic and realistic", "Idealistic", "Competitive", "Collaborative", "Risk-averse", "Adventurous"
];

export function CreatePersonaDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  initialData,
  mode = 'create',
  hideTrigger = false,
  onHideSystemPersonasChange,
  hideSystemPersonas = false
}: CreatePersonaDialogProps) {
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
  
  // State for hiding system personas
  const [hideSystemPersonasState, setHideSystemPersonasState] = useState(hideSystemPersonas);

  // Update state when the prop changes
  useEffect(() => {
    setHideSystemPersonasState(hideSystemPersonas);
  }, [hideSystemPersonas]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        age: initialData.age?.toString() || "",
        gender: initialData.gender || "",
        occupation: initialData.occupation || "",
        archetype: initialData.archetype || "",
        bio: initialData.bio || "",
        traits: Array.isArray(initialData.traits) 
          ? initialData.traits.join(', ') 
          : initialData.traits || "",
        goal: initialData.goal || "",
        attitude: initialData.attitude || "",
      });
    }
  }, [initialData]);

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Utility to pick a random value from an array
  const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

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
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mode === 'create' ? personaData : { ...personaData, id: initialData?.id }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${mode} persona`);
      }
      
      // Get the persona
      const updatedPersona = await response.json();
      
      // Call the onSuccess callback with the persona
      if (onSuccess) {
        onSuccess(updatedPersona);
      }
      
      // Show success toast
      toast({
        title: "Success",
        description: `Persona ${mode === 'create' ? 'created' : 'updated'} successfully`,
        duration: 3000,
      });
      
      // Reset form fields if in create mode
      if (mode === 'create') {
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
      }
      
      // Close the dialog
      onOpenChange(false);
    } catch (err: any) {
      console.error(`Error ${mode}ing persona:`, err);
      
      // Show error toast
      toast({
        title: "Error",
        description: err.message || `Failed to ${mode} persona`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Handle toggle change for hide system personas
  const handleHideSystemPersonasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setHideSystemPersonasState(isChecked);
    if (onHideSystemPersonasChange) {
      onHideSystemPersonasChange(isChecked);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <div className="space-y-2">
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Create New Persona' : 'Edit Persona'}
            </Button>
          </DialogTrigger>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hide-system-personas"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={hideSystemPersonasState}
              onChange={handleHideSystemPersonasChange}
            />
            <label htmlFor="hide-system-personas" className="text-sm text-gray-700">
              Hide system personas
            </label>
          </div>
        </div>
      )}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col pb-0 pt-0">
        <DialogHeader className="px-6 pt-2 pb-2">
          <DialogTitle>{mode === 'create' ? 'Create New Persona' : 'Edit Persona'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new AI participant persona for your simulations'
              : 'Update the details of this persona'}
          </DialogDescription>
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
            <div className="flex items-center gap-2">
              <Input 
                id="occupation" 
                value={formData.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
                required
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleChange("occupation", pickRandom(OCCUPATION_EXAMPLES))}
                      tabIndex={-1}
                    >
                      <Sparkles className="h-4 w-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Generate a random occupation with AI
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="archetype">Archetype</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="archetype" 
                placeholder="e.g., Budget Buyer, Trendsetter" 
                value={formData.archetype}
                onChange={(e) => handleChange("archetype", e.target.value)}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleChange("archetype", pickRandom(ARCHETYPE_EXAMPLES))}
                      tabIndex={-1}
                    >
                      <Sparkles className="h-4 w-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Generate a random archetype with AI
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
            <div className="flex items-center gap-2">
              <Input 
                id="persona_goal" 
                placeholder="What is this persona trying to achieve?" 
                value={formData.goal}
                onChange={(e) => handleChange("goal", e.target.value)}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleChange("goal", pickRandom(GOAL_EXAMPLES))}
                      tabIndex={-1}
                    >
                      <Sparkles className="h-4 w-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Generate a random persona goal with AI
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attitude">Attitude Toward Topic</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="attitude" 
                placeholder="Initial bias or opinion" 
                value={formData.attitude}
                onChange={(e) => handleChange("attitude", e.target.value)}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleChange("attitude", pickRandom(ATTITUDE_EXAMPLES))}
                      tabIndex={-1}
                    >
                      <Sparkles className="h-4 w-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Generate a random attitude with AI
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 py-2 pb-1 border-t">
          <Button type="submit" onClick={handleSubmit}>
            {mode === 'create' ? 'Create Persona' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 