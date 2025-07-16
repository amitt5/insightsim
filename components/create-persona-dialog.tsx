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
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  isGeneratedPersona?: boolean;
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
const BIO_EXAMPLES = [
  "A passionate educator who loves inspiring young minds.",
  "Tech enthusiast and lifelong learner, always seeking new challenges.",
  "Dedicated caregiver with a knack for building strong relationships.",
  "Creative thinker who enjoys solving complex problems.",
  "Fitness lover and advocate for healthy living.",
  "World traveler with a curiosity for different cultures.",
  "Analytical and detail-oriented, excels in data-driven environments.",
  "Natural leader who motivates teams to achieve their best.",
  "Environmentalist committed to sustainable living.",
  "Avid reader and writer with a love for storytelling.",
  "Entrepreneur at heart, always looking for new opportunities.",
  "Community volunteer passionate about making a difference.",
  "Art lover who finds inspiration in creativity.",
  "Problem-solver who thrives under pressure.",
  "Family-oriented and values strong connections.",
  "Innovator who embraces change and new technology.",
  "Customer-focused and skilled at building rapport.",
  "Driven by results and continuous improvement.",
  "Enjoys mentoring and helping others grow.",
  "Believes in lifelong learning and personal growth."
];
const TRAIT_EXAMPLES = [
  "Health-conscious", "Tech-savvy", "Detail-oriented", "Empathetic", "Creative", "Analytical", "Adventurous", "Organized", "Collaborative", "Resilient", "Resourceful", "Curious", "Open-minded", "Goal-driven", "Skeptical", "Optimistic", "Pragmatic", "Ambitious", "Patient", "Sociable"
];
const LOCATION_EXAMPLES = [
  "New York, USA", "London, UK", "Tokyo, Japan", "Sydney, Australia", "Toronto, Canada", "Berlin, Germany", "São Paulo, Brazil", "Mumbai, India", "Singapore", "Dubai, UAE", "Amsterdam, Netherlands", "Stockholm, Sweden", "Copenhagen, Denmark", "Barcelona, Spain", "Mexico City, Mexico", "Seoul, South Korea", "Tel Aviv, Israel", "Vienna, Austria", "Zurich, Switzerland", "Oslo, Norway"
];

const FAMILY_STATUS_EXAMPLES = [
  "Single, living independently", "Married with two young children (ages 3 and 5)", "Living with and supporting elderly parents", "Divorced, co-parenting one teenager", "In a long-term relationship, no children", "Married, no children", "Single parent with one child", "Recently widowed", "Living with roommates", "Married with adult children who moved out"
];

const EDUCATION_LEVEL_EXAMPLES = [
  "High School Graduate", "Completed 2 years of college", "Bachelor's Degree in Communications", "Master of Business Administration (MBA)", "Vocational Certificate in IT", "Associate Degree in Nursing", "PhD in Psychology", "Trade School Certificate", "Bachelor's Degree in Engineering", "Master's Degree in Education"
];

const INCOME_LEVEL_EXAMPLES = [
  "PHP 25,000 - 40,000 per month", "Approx. $60,000 USD per year (household)", "Entry-level salary", "Upper-middle income bracket", "Freelancer with fluctuating income", "$80,000 - $120,000 annually", "Minimum wage worker", "Six-figure income", "Retired with fixed pension", "Student with part-time income"
];

const LIFESTYLE_EXAMPLES = [
  "A busy professional who values convenience above all. Spends on food delivery, ride-sharing, and online shopping. Enjoys occasional weekend trips to de-stress.",
  "A homebody who enjoys online gaming, streaming movies, and cooking at home. Very budget-conscious and actively seeks out discounts and sales.",
  "Socially active and heavily influenced by friends. Enjoys trying new restaurants, attending concerts, and follows the latest fashion trends on Instagram.",
  "A fitness enthusiast who prioritizes health. Spends money on gym memberships, organic food, and athletic wear. Prefers brands that align with a healthy lifestyle.",
  "Family-oriented and spends most free time with children. Values educational experiences and invests in quality products that last.",
  "Creative and artistic, enjoys DIY projects and handmade items. Prefers unique, artisanal products over mass-produced ones.",
  "Tech-savvy early adopter who loves trying new gadgets and apps. Willing to pay premium for cutting-edge technology.",
  "Environmentally conscious and makes purchasing decisions based on sustainability. Prefers eco-friendly and ethically sourced products."
];

const CATEGORY_PRODUCTS_EXAMPLES = [
  "Metrobank Rewards Visa, GCash, BDO Amex", "Sunsilk Damage Repair, Head & Shoulders Cool Menthol, Watsons Generic Argan Oil Shampoo", "Toyota Vios, Grab App, Angkas App", "RELX Infinity Device, Flava Strawberry Pods, Local disposable vape brand", "iPhone 14, Samsung Galaxy S23, Google Pixel 7", "Nike Air Max, Adidas Ultraboost, New Balance 990", "Starbucks Coffee, Dunkin' Donuts, Local coffee shop blend"
];

const PRODUCT_RELATIONSHIP_EXAMPLES = [
  "Primary card is Metrobank for daily use, but keeps a BDO card specifically for dining promotions. Is actively looking for a better travel card.",
  "Has been loyal to Sunsilk for years out of habit, but recently tried a friend's L'Oréal and was impressed. Now considers it a premium alternative for special occasions.",
  "Relies on their Toyota Vios for weekend family trips, but uses Grab for daily commuting to the office to avoid parking issues.",
  "Primary device is RELX due to brand reliability, but buys Flava pods when their preferred flavor is out of stock. Views Flava as a cheaper, secondary option.",
  "Loyal Apple user across all devices, but considering switching to Android for better customization options.",
  "Prefers Nike for running shoes due to comfort, but buys Adidas for casual wear because of style preferences."
];

const CATEGORY_HABITS_EXAMPLES = [
  "Checks account balance daily via the mobile app. Pays off the full credit card balance every month to avoid interest. Actively hunts for cashback deals before making any large purchase.",
  "Washes hair every other day. Tends to buy the largest bottle available to save money. Is highly influenced by TikTok reviews when considering a new shampoo brand.",
  "Gets the car serviced every 6 months. Spends roughly PHP 4,000 per month on gasoline. Always uses Waze for navigation, even on familiar routes.",
  "Usually vapes after meals and during work breaks. Prefers fruit-flavored pods over tobacco flavors. Spends about PHP 1,000 per month on pods and accessories.",
  "Upgrades phone every 2-3 years. Always buys a protective case and screen protector immediately. Researches extensively before making any tech purchase.",
  "Shops for clothes seasonally during sales. Prefers to try on items in-store rather than buying online. Follows fashion influencers for style inspiration."
];

export function CreatePersonaDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  initialData,
  mode = 'create',
  hideTrigger = false,
  onHideSystemPersonasChange,
  hideSystemPersonas = false,
  variant = "default",
  isGeneratedPersona = false
}: CreatePersonaDialogProps) {
  const { toast } = useToast();
  
  // State to store form values
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    occupation: "",
    location: "",
    archetype: "",
    bio: "",
    traits: "",
    goal: "",
    attitude: "",
    family_status: "",
    education_level: "",
    income_level: "",
    lifestyle: "",
    category_products: "",
    product_relationship: "",
    category_habits: "",
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
        location: initialData.location || "",
        archetype: initialData.archetype || "",
        bio: initialData.bio || "",
        traits: Array.isArray(initialData.traits) 
          ? initialData.traits.join(', ') 
          : initialData.traits || "",
        goal: initialData.goal || "",
        attitude: initialData.attitude || "",
        family_status: initialData.family_status || "",
        education_level: initialData.education_level || "",
        income_level: initialData.income_level || "",
        lifestyle: initialData.lifestyle || "",
        category_products: Array.isArray(initialData.category_products) 
          ? initialData.category_products.join(', ') 
          : initialData.category_products || "",
        product_relationship: initialData.product_relationship || "",
        category_habits: initialData.category_habits || "",
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
      // Convert category_products string to array
      category_products: formData.category_products ? formData.category_products.split(',').map(p => p.trim()) : [],
    };

    // If this is a generated persona, handle it differently (no DB save)
    if (isGeneratedPersona) {
      try {
        // For generated personas, just update the local data
        const updatedPersona = {
          ...initialData,
          ...personaData
        };
        
        // Call the onSuccess callback with the updated persona
        if (onSuccess) {
          onSuccess(updatedPersona);
        }
        
        // Show success toast
        toast({
          title: "Success",
          description: "Persona updated successfully",
          duration: 3000,
        });
        
        // Close the dialog
        onOpenChange(false);
        return;
      } catch (err: any) {
        console.error("Error updating generated persona:", err);
        toast({
          title: "Error",
          description: "Failed to update persona",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
    }

    // Original database save logic for regular personas
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
          location: "",
          archetype: "",
          bio: "",
          traits: "",
          goal: "",
          attitude: "",
          family_status: "",
          education_level: "",
          income_level: "",
          lifestyle: "",
          category_products: "",
          product_relationship: "",
          category_habits: "",
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
            <Button variant={variant}>
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
            <div className="relative">
              <Input 
                id="occupation" 
                value={formData.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
                required
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("occupation", pickRandom(OCCUPATION_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random occupation with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <Input 
                id="location" 
                placeholder="e.g., New York, USA" 
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("location", pickRandom(LOCATION_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random location with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="archetype">Archetype</Label>
            <div className="relative">
              <Input 
                id="archetype" 
                placeholder="e.g., Budget Buyer, Trendsetter" 
                value={formData.archetype}
                onChange={(e) => handleChange("archetype", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("archetype", pickRandom(ARCHETYPE_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random archetype with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Short Bio</Label>
            <div className="relative">
              <Textarea 
                id="bio" 
                rows={3} 
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 top-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("bio", pickRandom(BIO_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6 mt-2"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random short bio with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="traits">Traits (comma-separated)</Label>
            <div className="relative">
              <Input 
                id="traits" 
                placeholder="e.g., Health-conscious, Tech-savvy" 
                value={formData.traits}
                onChange={(e) => handleChange("traits", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          // Split current traits, trim, and filter out empty
                          const currentTraits = formData.traits
                            .split(',')
                            .map(t => t.trim())
                            .filter(t => t.length > 0);
                          // Pick a random trait not already present
                          let availableTraits = TRAIT_EXAMPLES.filter(t => !currentTraits.includes(t));
                          if (availableTraits.length === 0) availableTraits = TRAIT_EXAMPLES;
                          const newTrait = pickRandom(availableTraits);
                          // Append to the list
                          const updatedTraits = currentTraits.length > 0
                            ? [...currentTraits, newTrait].join(', ')
                            : newTrait;
                          handleChange("traits", updatedTraits);
                        }}
                        tabIndex={-1}
                        className="p-0 h-6 w-6"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Add a random trait with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="persona_goal">Persona Goal</Label>
            <div className="relative">
              <Input 
                id="persona_goal" 
                placeholder="What is this persona trying to achieve?" 
                value={formData.goal}
                onChange={(e) => handleChange("goal", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("goal", pickRandom(GOAL_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random persona goal with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attitude">Attitude Toward Topic</Label>
            <div className="relative">
              <Input 
                id="attitude" 
                placeholder="Initial bias or opinion" 
                value={formData.attitude}
                onChange={(e) => handleChange("attitude", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("attitude", pickRandom(ATTITUDE_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random attitude with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="family_status">Family Status</Label>
            <div className="relative">
              <Input 
                id="family_status" 
                placeholder="e.g., Single, living independently" 
                value={formData.family_status}
                onChange={(e) => handleChange("family_status", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("family_status", pickRandom(FAMILY_STATUS_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random family status with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="education_level">Education Level</Label>
            <div className="relative">
              <Input 
                id="education_level" 
                placeholder="e.g., Bachelor's Degree in Communications" 
                value={formData.education_level}
                onChange={(e) => handleChange("education_level", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("education_level", pickRandom(EDUCATION_LEVEL_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random education level with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="income_level">Income Level</Label>
            <div className="relative">
              <Input 
                id="income_level" 
                placeholder="e.g., PHP 25,000 - 40,000 per month" 
                value={formData.income_level}
                onChange={(e) => handleChange("income_level", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("income_level", pickRandom(INCOME_LEVEL_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random income level with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lifestyle">Lifestyle</Label>
            <div className="relative">
              <Textarea 
                id="lifestyle" 
                rows={3}
                placeholder="Describe hobbies, routines, and values..." 
                value={formData.lifestyle}
                onChange={(e) => handleChange("lifestyle", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 top-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("lifestyle", pickRandom(LIFESTYLE_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6 mt-2"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random lifestyle with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_products">Category Products (comma-separated)</Label>
            <div className="relative">
              <Input 
                id="category_products" 
                placeholder="e.g., Metrobank Rewards Visa, GCash, BDO Amex" 
                value={formData.category_products}
                onChange={(e) => handleChange("category_products", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("category_products", pickRandom(CATEGORY_PRODUCTS_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate random category products with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_relationship">Product Relationship</Label>
            <div className="relative">
              <Textarea 
                id="product_relationship" 
                rows={3}
                placeholder="Describe relationship with products used..." 
                value={formData.product_relationship}
                onChange={(e) => handleChange("product_relationship", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 top-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("product_relationship", pickRandom(PRODUCT_RELATIONSHIP_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6 mt-2"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate a random product relationship with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_habits">Category Habits</Label>
            <div className="relative">
              <Textarea 
                id="category_habits" 
                rows={3}
                placeholder="Describe specific behaviors and routines..." 
                value={formData.category_habits}
                onChange={(e) => handleChange("category_habits", e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 top-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleChange("category_habits", pickRandom(CATEGORY_HABITS_EXAMPLES))}
                        tabIndex={-1}
                        className="p-0 h-6 w-6 mt-2"
                        style={{ minWidth: 0 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Generate random category habits with AI
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 py-2 pb-1 border-t">
          <Button type="submit" onClick={handleSubmit}>
            {isGeneratedPersona 
              ? 'Update' 
              : mode === 'create' 
                ? 'Create Persona' 
                : 'Save Changes'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 