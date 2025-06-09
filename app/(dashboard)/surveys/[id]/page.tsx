"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Survey } from "@/utils/types"

interface SurveyPageProps {
  params: {
    id: string
  }
}

export default function SurveyPage({ params }: SurveyPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(1)
  
  // Initialize survey with minimum properties
  const [survey, setSurvey] = useState<Survey>({
    id: params.id,
    status: 'BRIEFING' as any,
    current_step: 1,
    productName: "Product Feedback - Alpha Testers",
    productDescription: "Gather feedback from our alpha testing group to improve the product before beta release.",
    keyFeatures: [],
    primaryBenefit: "",
    locations: [],
    marketType: "",
    competitorContext: ""
  })

  const tabs = [
    { id: 1, name: "Product Details", label: "Product Details" },
    { id: 2, name: "Research Objective", label: "Research Objective" },
    { id: 3, name: "Location", label: "Location" },
    { id: 4, name: "Target Group", label: "Target Group" },
    { id: 5, name: "Sample Design", label: "Sample Design" }
  ]

  // Handle input changes
  const handleInputChange = (field: keyof Survey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSurvey(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  // Handle adding a new feature
  const addFeature = () => {
    setSurvey(prev => ({
      ...prev,
      keyFeatures: [...(prev.keyFeatures || []), ""]
    }))
  }

  // Handle updating a feature
  const updateFeature = (index: number, value: string) => {
    setSurvey(prev => ({
      ...prev,
      keyFeatures: prev.keyFeatures?.map((feature, i) => i === index ? value : feature) || []
    }))
  }

  // Handle removing a feature
  const removeFeature = (index: number) => {
    setSurvey(prev => ({
      ...prev,
      keyFeatures: prev.keyFeatures?.filter((_, i) => i !== index) || []
    }))
  }

  // Handle adding a new success metric
  const addSuccessMetric = () => {
    setSurvey(prev => ({
      ...prev,
      successMetrics: [...(prev.successMetrics || []), ""]
    }))
  }

  // Handle updating a success metric
  const updateSuccessMetric = (index: number, value: string) => {
    setSurvey(prev => ({
      ...prev,
      successMetrics: prev.successMetrics?.map((metric, i) => i === index ? value : metric) || []
    }))
  }

  // Handle removing a success metric
  const removeSuccessMetric = (index: number) => {
    setSurvey(prev => ({
      ...prev,
      successMetrics: prev.successMetrics?.filter((_, i) => i !== index) || []
    }))
  }

  // Handle adding a new location
  const addLocation = () => {
    setSurvey(prev => ({
      ...prev,
      locations: [...(prev.locations || []), ""]
    }))
  }

  // Handle updating a location
  const updateLocation = (index: number, value: string) => {
    setSurvey(prev => ({
      ...prev,
      locations: prev.locations?.map((location, i) => i === index ? value : location) || []
    }))
  }

  // Handle removing a location
  const removeLocation = (index: number) => {
    setSurvey(prev => ({
      ...prev,
      locations: prev.locations?.filter((_, i) => i !== index) || []
    }))
  }

  // Handle select changes
  const handleSelectChange = (field: keyof Survey) => (value: string) => {
    setSurvey(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle Save & Continue
  const handleSaveAndContinue = () => {
    // Save logic would go here (API call)
    // For now, just navigate to next tab
    if (activeTab < 5) {
      setActiveTab(activeTab + 1)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{survey.productName}</h1>
        <Badge variant="secondary">Active</Badge>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Tab Navigation */}
        <div className="mb-8 flex justify-between">
          {tabs.map((tab) => (
            <div key={tab.id} className="flex flex-col items-center">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  activeTab === tab.id ? "bg-primary text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                }`}
              >
                {tab.id}
              </button>
              <span className="mt-2 text-xs text-gray-500 text-center max-w-[80px]">
                {tab.label}
              </span>
            </div>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Define the product or service being researched</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={survey.productName || ""}
                  onChange={handleInputChange('productName')}
                  placeholder="Enter product name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescription">Product Description</Label>
                <Textarea
                  id="productDescription"
                  value={survey.productDescription || ""}
                  onChange={handleInputChange('productDescription')}
                  placeholder="Describe your product or service"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Key Features</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeature}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
                <div className="space-y-2">
                  {survey.keyFeatures?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!survey.keyFeatures || survey.keyFeatures.length === 0) && (
                    <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded">
                      No features added yet. Click "Add Feature" to get started.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryBenefit">Primary Benefit</Label>
                <Textarea
                  id="primaryBenefit"
                  value={survey.primaryBenefit || ""}
                  onChange={handleInputChange('primaryBenefit')}
                  placeholder="What is the main benefit or value proposition of your product?"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Research Objective</CardTitle>
              <CardDescription>Define the goals and objectives of your research</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="objective">Study Objective</Label>
                <Textarea
                  id="objective"
                  value={survey.objective || ""}
                  onChange={handleInputChange('objective')}
                  placeholder="What is the main objective of this study? What do you want to learn or understand?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Success Metrics</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSuccessMetric}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Metric
                  </Button>
                </div>
                <div className="space-y-2">
                  {survey.successMetrics?.map((metric, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={metric}
                        onChange={(e) => updateSuccessMetric(index, e.target.value)}
                        placeholder={`Success metric ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSuccessMetric(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!survey.successMetrics || survey.successMetrics.length === 0) && (
                    <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded">
                      No success metrics added yet. Click "Add Metric" to get started.
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Define what results or outcomes would make this study successful (e.g., "80% positive feedback on concept", "Identify top 3 pain points")
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Specify the geographic scope and locations for your research</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Target Locations</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLocation}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>
                <div className="space-y-2">
                  {survey.locations?.map((location, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={location}
                        onChange={(e) => updateLocation(index, e.target.value)}
                        placeholder="e.g., New York City, United States, Global"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!survey.locations || survey.locations.length === 0) && (
                    <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded">
                      No locations added yet. Click "Add Location" to get started.
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Add cities, countries, regions, or specify "Global" for worldwide research
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketType">Market Type</Label>
                <Select 
                  value={survey.marketType || ""} 
                  onValueChange={handleSelectChange('marketType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select market type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="mix">Mix (Online + Offline)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="competitorContext">Competitor Context</Label>
                <Textarea
                  id="competitorContext"
                  value={survey.competitorContext || ""}
                  onChange={handleInputChange('competitorContext')}
                  placeholder="Who do you see as your main competitors? Describe the competitive landscape..."
                  rows={4}
                />
                <p className="text-sm text-gray-500">
                  Identify key competitors and describe how they position themselves in the market
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Target Group</CardTitle>
              <CardDescription>Define your target audience and participant criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                Target Group content will be added here
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Sample Design</CardTitle>
              <CardDescription>Configure your sampling methodology and sample size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                Sample Design content will be added here
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={handleSaveAndContinue}>Save & Continue</Button>
        </div>
      </div>
    </div>
  )
}
