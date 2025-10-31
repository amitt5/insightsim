"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { generatePersonaFromThreeFields } from "@/utils/personaAnalysis"
import { Persona, RagDocument } from "@/utils/types"
import { RagDocumentUpload, RagDocumentList } from "@/components/projects/rag"

export default function EnhancedPersonasIdPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const isNew = (params?.id || "").toLowerCase() === "new"
  const personaId = isNew ? null : params?.id

  const [basicDemographics, setBasicDemographics] = useState("")
  const [behaviorsAttitudes, setBehaviorsAttitudes] = useState("")
  const [researchContext, setResearchContext] = useState("")
  const [showGenerated, setShowGenerated] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [ragDocuments, setRagDocuments] = useState<RagDocument[]>([])
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Persona form state
  const [personaForm, setPersonaForm] = useState({
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
  })

  // Load existing persona when ID is present
  useEffect(() => {
    if (personaId && !isNew) {
      const loadPersona = async () => {
        try {
          const response = await fetch(`/api/personas?id=${personaId}`)
          if (response.ok) {
            const personas = await response.json()
            const persona = Array.isArray(personas) ? personas.find((p: Persona) => p.id === personaId) : personas
            if (persona) {
              setPersonaForm({
                name: persona.name || "",
                age: persona.age ? String(persona.age) : "",
                gender: persona.gender || "",
                occupation: persona.occupation || "",
                location: persona.location || "",
                archetype: persona.archetype || "",
                bio: persona.bio || "",
                traits: Array.isArray(persona.traits) ? persona.traits.join(", ") : (persona.traits || ""),
                goal: persona.goal || "",
                attitude: persona.attitude || "",
                family_status: persona.family_status || "",
                education_level: persona.education_level || "",
                income_level: persona.income_level || "",
                lifestyle: persona.lifestyle || "",
                category_products: Array.isArray(persona.category_products) ? persona.category_products.join(", ") : (persona.category_products || ""),
                product_relationship: persona.product_relationship || "",
                category_habits: persona.category_habits || "",
              })
              setShowGenerated(true)
            }
          }
        } catch (error) {
          console.error("Error loading persona:", error)
        }
      }
      loadPersona()
    }
  }, [personaId, isNew])

  // Load RAG documents for the persona
  useEffect(() => {
    if (personaId && !isNew) {
      const fetchRagDocuments = async () => {
        try {
          const response = await fetch(`/api/personas/${personaId}/rag/documents`)
          if (response.ok) {
            const data = await response.json()
            setRagDocuments(data.documents || [])
          } else if (response.status !== 404) {
            // Only show error if it's not a 404 (404 means no documents yet)
            toast({
              title: "Error",
              description: "Failed to load documents",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error fetching RAG documents:", error)
          toast({
            title: "Error",
            description: "Failed to load documents",
            variant: "destructive",
          })
        }
      }
      fetchRagDocuments()
    }
  }, [personaId, isNew, toast])

  const handlePersonaChange = (field: string, value: string) => {
    setPersonaForm(prev => ({ ...prev, [field]: value }))
  }

  // Save persona to database
  const savePersona = async (personaData: any, isUpdate = false) => {
    try {
      const response = await fetch('/api/personas', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save persona')
      }

      const savedPersona = await response.json()
      return savedPersona
    } catch (error: any) {
      console.error('Error saving persona:', error)
      throw error
    }
  }

  // Handle RAG document upload
  const handleRagDocumentUpload = (document: RagDocument) => {
    setRagDocuments(prev => [...prev, document])
  }

  // Handle RAG document delete
  const handleRagDocumentDelete = async (documentId: string) => {
    if (!personaId) return
    
    try {
      const response = await fetch(`/api/personas/${personaId}/rag/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }

      setRagDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully",
      })
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  // Handle RAG document process
  const handleRagDocumentProcess = async (documentId: string) => {
    if (!personaId) return
    
    try {
      // Add to processing set
      setProcessingDocuments(prev => new Set(prev).add(documentId))

      const response = await fetch(`/api/personas/${personaId}/rag/documents/${documentId}/process`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process document')
      }

      const result = await response.json()
      
      // Update document in the list
      setRagDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'completed' as const }
          : doc
      ))

      toast({
        title: "Processing successful",
        description: "Document has been processed successfully",
      })
    } catch (error: any) {
      console.error('Error processing document:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to process document",
        variant: "destructive",
      })
      
      // Update document status to failed
      setRagDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'failed' as const, processing_error: error.message }
          : doc
      ))
    } finally {
      // Remove from processing set
      setProcessingDocuments(prev => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isNew ? 'Create Enhanced Persona' : 'Edit Enhanced Persona'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Step 1: Provide initial details to generate a base persona.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Initial Persona Creation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Basic Demographics</label>
            <Textarea
              placeholder="Enter basic information (name, age, occupation, location, etc.)"
              value={basicDemographics}
              onChange={(e) => setBasicDemographics(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Behaviors & Attitudes</label>
            <Textarea
              placeholder="Describe how they interact with your product category, their goals, frustrations, etc."
              value={behaviorsAttitudes}
              onChange={(e) => setBehaviorsAttitudes(e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Research Context</label>
            <Textarea
              placeholder="What are you trying to learn from this persona? What scenarios will they be responding to?"
              value={researchContext}
              onChange={(e) => setResearchContext(e.target.value)}
              rows={4}
            />
          </div>

          <div className="pt-2">
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isGenerating || isSaving}
              onClick={async () => {
                setIsGenerating(true)
                try {
                  // Generate persona from LLM
                  const generated = await generatePersonaFromThreeFields({
                    basicDemographics,
                    behaviorsAttitudes,
                    researchContext,
                  })
                  
                  // Transform generated persona for form display
                  const formData = {
                    name: generated.name || "",
                    age: generated.age ? String(generated.age) : "",
                    gender: generated.gender || "",
                    occupation: generated.occupation || "",
                    location: generated.location || "",
                    archetype: generated.archetype || "",
                    bio: generated.bio || "",
                    traits: Array.isArray(generated.traits) ? generated.traits.join(", ") : "",
                    goal: generated.goal || "",
                    attitude: generated.attitude || "",
                    family_status: generated.family_status || "",
                    education_level: generated.education_level || "",
                    income_level: generated.income_level || "",
                    lifestyle: generated.lifestyle || "",
                    category_products: Array.isArray(generated.category_products) ? generated.category_products.join(", ") : (generated.category_products || ""),
                    product_relationship: generated.product_relationship || "",
                    category_habits: generated.category_habits || "",
                  }
                  
                  setPersonaForm(formData)
                  setShowGenerated(true)
                  
                  // Now save to database with grounded=true
                  setIsSaving(true)
                  try {
                    // Transform form data back to API format
                    const personaData = {
                      name: generated.name || "",
                      age: generated.age,
                      gender: generated.gender || "",
                      occupation: generated.occupation || "",
                      location: generated.location || "",
                      archetype: generated.archetype || "",
                      bio: generated.bio || "",
                      traits: generated.traits || [],
                      goal: generated.goal || "",
                      attitude: generated.attitude || "",
                      family_status: generated.family_status || "",
                      education_level: generated.education_level || "",
                      income_level: generated.income_level || "",
                      lifestyle: generated.lifestyle || "",
                      category_products: generated.category_products || [],
                      product_relationship: generated.product_relationship || "",
                      category_habits: generated.category_habits || "",
                      grounded: true,
                    }

                    const savedPersona = await savePersona(personaData, false)
                    
                    // Redirect to the persona ID URL
                    if (savedPersona?.id) {
                      toast({
                        title: "Success",
                        description: "Persona generated and saved successfully",
                      })
                      router.push(`/personas/enhanced/${savedPersona.id}`)
                    }
                  } catch (saveError: any) {
                    console.error('Save failed:', saveError)
                    toast({
                      title: "Generation succeeded, but save failed",
                      description: saveError?.message || "Please save manually using 'Save Changes' button",
                      variant: "destructive",
                    })
                    // Still show the persona form so user can save manually
                  } finally {
                    setIsSaving(false)
                  }
                } catch (e: any) {
                  toast({
                    title: "Generation failed",
                    description: e?.message || "Please try again.",
                    variant: "destructive"
                  })
                  setShowGenerated(true)
                } finally {
                  setIsGenerating(false)
                }
              }}
            >
              {isGenerating || isSaving ? (isGenerating ? "Generating..." : "Saving...") : "Generate Persona"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Persona (Not yet research-enhanced)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={personaForm.name} onChange={(e) => handlePersonaChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" value={personaForm.age} onChange={(e) => handlePersonaChange("age", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={personaForm.gender} onValueChange={(v) => handlePersonaChange("gender", v)}>
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
                <Input id="occupation" value={personaForm.occupation} onChange={(e) => handlePersonaChange("occupation", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={personaForm.location} onChange={(e) => handlePersonaChange("location", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="archetype">Archetype</Label>
                <Input id="archetype" value={personaForm.archetype} onChange={(e) => handlePersonaChange("archetype", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea id="bio" rows={3} value={personaForm.bio} onChange={(e) => handlePersonaChange("bio", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="traits">Traits (comma-separated)</Label>
                <Input id="traits" value={personaForm.traits} onChange={(e) => handlePersonaChange("traits", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Persona Goal</Label>
                <Input id="goal" value={personaForm.goal} onChange={(e) => handlePersonaChange("goal", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attitude">Attitude Toward Topic</Label>
                <Input id="attitude" value={personaForm.attitude} onChange={(e) => handlePersonaChange("attitude", e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="family_status">Family Status</Label>
                  <Input id="family_status" value={personaForm.family_status} onChange={(e) => handlePersonaChange("family_status", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education_level">Education Level</Label>
                  <Input id="education_level" value={personaForm.education_level} onChange={(e) => handlePersonaChange("education_level", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="income_level">Income Level</Label>
                  <Input id="income_level" value={personaForm.income_level} onChange={(e) => handlePersonaChange("income_level", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_products">Category Products (comma-separated)</Label>
                  <Input id="category_products" value={personaForm.category_products} onChange={(e) => handlePersonaChange("category_products", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifestyle">Lifestyle</Label>
                <Textarea id="lifestyle" rows={3} value={personaForm.lifestyle} onChange={(e) => handlePersonaChange("lifestyle", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_relationship">Product Relationship</Label>
                <Textarea id="product_relationship" rows={3} value={personaForm.product_relationship} onChange={(e) => handlePersonaChange("product_relationship", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_habits">Category Habits</Label>
                <Textarea id="category_habits" rows={3} value={personaForm.category_habits} onChange={(e) => handlePersonaChange("category_habits", e.target.value)} />
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  disabled={!personaId || isSaving}
                  onClick={async () => {
                    if (!personaId) return
                    
                    setIsSaving(true)
                    try {
                      // Transform form data to API format
                      const personaData = {
                        id: personaId,
                        name: personaForm.name || "",
                        age: personaForm.age ? parseInt(personaForm.age) : undefined,
                        gender: personaForm.gender || "",
                        occupation: personaForm.occupation || "",
                        location: personaForm.location || "",
                        archetype: personaForm.archetype || "",
                        bio: personaForm.bio || "",
                        traits: personaForm.traits ? personaForm.traits.split(',').map(t => t.trim()).filter(Boolean) : [],
                        goal: personaForm.goal || "",
                        attitude: personaForm.attitude || "",
                        family_status: personaForm.family_status || "",
                        education_level: personaForm.education_level || "",
                        income_level: personaForm.income_level || "",
                        lifestyle: personaForm.lifestyle || "",
                        category_products: personaForm.category_products ? personaForm.category_products.split(',').map(p => p.trim()).filter(Boolean) : [],
                        product_relationship: personaForm.product_relationship || "",
                        category_habits: personaForm.category_habits || "",
                      }

                      await savePersona(personaData, true)
                      
                      toast({
                        title: "Success",
                        description: "Persona updated successfully",
                      })
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error?.message || "Failed to save changes",
                        variant: "destructive",
                      })
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RAG Documents Section - Only show if persona has been saved (has ID) */}
      {personaId && !isNew && (
        <Card>
          <CardHeader>
            <CardTitle>RAG Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Upload Documents</label>
              <p className="text-sm text-gray-400 mt-1">
                Upload and manage documents for this persona's retrieval-augmented generation
              </p>
            </div>
            
            <RagDocumentUpload 
              personaId={personaId}
              onUploadSuccess={handleRagDocumentUpload}
            />
            
            <RagDocumentList 
              documents={ragDocuments}
              onDelete={handleRagDocumentDelete}
              onProcess={handleRagDocumentProcess}
              processingDocuments={processingDocuments}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}


