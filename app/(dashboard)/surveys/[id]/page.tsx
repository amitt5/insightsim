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
    competitorContext: "",
    primaryTG: {
      demographics: {
        ageRange: { min: 18, max: 65 },
        gender: [],
        income: [],
        location: [],
        education: []
      },
      psychographics: {
        interests: [],
        values: [],
        lifestyle: []
      },
      behavioral: {
        purchaseFrequency: "",
        brandLoyalty: "",
        decisionFactors: []
      }
    },
    exclusionCriteria: "",
    sampleSize: 300,
    confidenceLevel: 95,
    marginOfError: 5,
    demographicSplits: {}
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

  // Handle number input changes
  const handleNumberChange = (field: keyof Survey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSurvey(prev => ({
      ...prev,
      [field]: parseInt(e.target.value) || 0
    }))
  }

  // Handle demographic array changes
  const handleDemographicArrayChange = (category: 'gender' | 'income' | 'location' | 'education', values: string[]) => {
    setSurvey(prev => ({
      ...prev,
      primaryTG: {
        ...prev.primaryTG!,
        demographics: {
          ...prev.primaryTG!.demographics,
          [category]: values
        }
      }
    }))
  }

  // Handle psychographic array changes
  const handlePsychographicArrayChange = (category: 'interests' | 'values' | 'lifestyle', values: string[]) => {
    setSurvey(prev => ({
      ...prev,
      primaryTG: {
        ...prev.primaryTG!,
        psychographics: {
          ...prev.primaryTG!.psychographics,
          [category]: values
        }
      }
    }))
  }

  // Handle behavioral changes
  const handleBehavioralChange = (field: 'purchaseFrequency' | 'brandLoyalty') => (value: string) => {
    setSurvey(prev => ({
      ...prev,
      primaryTG: {
        ...prev.primaryTG!,
        behavioral: {
          ...prev.primaryTG!.behavioral,
          [field]: value
        }
      }
    }))
  }

  // Handle age range changes
  const handleAgeRangeChange = (type: 'min' | 'max') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSurvey(prev => ({
      ...prev,
      primaryTG: {
        ...prev.primaryTG!,
        demographics: {
          ...prev.primaryTG!.demographics,
          ageRange: {
            ...prev.primaryTG!.demographics.ageRange,
            [type]: parseInt(e.target.value) || 0
          }
        }
      }
    }))
  }

  // Generic function to add/remove items from arrays
  const addArrayItem = (path: string, category: string) => {
    const newItem = ''
    if (path === 'demographics') {
      const currentArray = survey.primaryTG?.demographics[category as keyof typeof survey.primaryTG.demographics] as string[] || []
      handleDemographicArrayChange(category as any, [...currentArray, newItem])
    } else if (path === 'psychographics') {
      const currentArray = survey.primaryTG?.psychographics[category as keyof typeof survey.primaryTG.psychographics] as string[] || []
      handlePsychographicArrayChange(category as any, [...currentArray, newItem])
    }
  }

  const updateArrayItem = (path: string, category: string, index: number, value: string) => {
    if (path === 'demographics') {
      const currentArray = survey.primaryTG?.demographics[category as keyof typeof survey.primaryTG.demographics] as string[] || []
      const updatedArray = currentArray.map((item, i) => i === index ? value : item)
      handleDemographicArrayChange(category as any, updatedArray)
    } else if (path === 'psychographics') {
      const currentArray = survey.primaryTG?.psychographics[category as keyof typeof survey.primaryTG.psychographics] as string[] || []
      const updatedArray = currentArray.map((item, i) => i === index ? value : item)
      handlePsychographicArrayChange(category as any, updatedArray)
    }
  }

  const removeArrayItem = (path: string, category: string, index: number) => {
    if (path === 'demographics') {
      const currentArray = survey.primaryTG?.demographics[category as keyof typeof survey.primaryTG.demographics] as string[] || []
      const updatedArray = currentArray.filter((_, i) => i !== index)
      handleDemographicArrayChange(category as any, updatedArray)
    } else if (path === 'psychographics') {
      const currentArray = survey.primaryTG?.psychographics[category as keyof typeof survey.primaryTG.psychographics] as string[] || []
      const updatedArray = currentArray.filter((_, i) => i !== index)
      handlePsychographicArrayChange(category as any, updatedArray)
    }
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
            <CardContent className="space-y-6">
              {/* Demographics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Demographics</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={survey.primaryTG?.demographics.ageRange.min || 18}
                        onChange={handleAgeRangeChange('min')}
                        placeholder="Min age"
                      />
                      <span>to</span>
                      <Input
                        type="number"
                        value={survey.primaryTG?.demographics.ageRange.max || 65}
                        onChange={handleAgeRangeChange('max')}
                        placeholder="Max age"
                      />
                    </div>
                  </div>
                </div>

                {['gender', 'income', 'education'].map((category) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="capitalize">{category}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addArrayItem('demographics', category)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {category.slice(0, -1)}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(survey.primaryTG?.demographics[category as keyof typeof survey.primaryTG.demographics] as string[] || []).map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={item}
                            onChange={(e) => updateArrayItem('demographics', category, index, e.target.value)}
                            placeholder={`Enter ${category.slice(0, -1)}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrayItem('demographics', category, index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Psychographics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Psychographics</h3>
                {['interests', 'values', 'lifestyle'].map((category) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="capitalize">{category}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addArrayItem('psychographics', category)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {category.slice(0, -1)}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(survey.primaryTG?.psychographics[category as keyof typeof survey.primaryTG.psychographics] as string[] || []).map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={item}
                            onChange={(e) => updateArrayItem('psychographics', category, index, e.target.value)}
                            placeholder={`Enter ${category.slice(0, -1)}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrayItem('psychographics', category, index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Behavioral */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Behavioral</h3>
                
                <div className="space-y-2">
                  <Label>Purchase Frequency</Label>
                  <Select 
                    value={survey.primaryTG?.behavioral.purchaseFrequency || ""} 
                    onValueChange={handleBehavioralChange('purchaseFrequency')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purchase frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="rarely">Rarely</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Brand Loyalty</Label>
                  <Select 
                    value={survey.primaryTG?.behavioral.brandLoyalty || ""} 
                    onValueChange={handleBehavioralChange('brandLoyalty')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand loyalty level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very-loyal">Very Loyal</SelectItem>
                      <SelectItem value="somewhat-loyal">Somewhat Loyal</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="switcher">Brand Switcher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Exclusion Criteria */}
              <div className="space-y-2">
                <Label htmlFor="exclusionCriteria">Exclusion Criteria</Label>
                <Textarea
                  id="exclusionCriteria"
                  value={survey.exclusionCriteria || ""}
                  onChange={handleInputChange('exclusionCriteria')}
                  placeholder="Describe any criteria that would exclude participants from this study..."
                  rows={3}
                />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sampleSize">Sample Size</Label>
                  <Input
                    id="sampleSize"
                    type="number"
                    value={survey.sampleSize || 300}
                    onChange={handleNumberChange('sampleSize')}
                    placeholder="300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidenceLevel">Confidence Level (%)</Label>
                  <Select 
                    value={survey.confidenceLevel?.toString() || "95"} 
                    onValueChange={(value) => setSurvey(prev => ({ ...prev, confidenceLevel: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select confidence level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marginOfError">Margin of Error (%)</Label>
                  <Input
                    id="marginOfError"
                    type="number"
                    value={survey.marginOfError || 5}
                    onChange={handleNumberChange('marginOfError')}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sample Calculation Info</Label>
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p>With a sample size of <strong>{survey.sampleSize || 300}</strong> and a confidence level of <strong>{survey.confidenceLevel || 95}%</strong>, your margin of error will be approximately <strong>±{survey.marginOfError || 5}%</strong>.</p>
                  <p className="mt-2 text-xs">This means you can be {survey.confidenceLevel || 95}% confident that your results are within {survey.marginOfError || 5} percentage points of the true population value.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Demographic Splits (Optional)</Label>
                <p className="text-sm text-gray-500">
                  Specify how you want to split your sample across different demographics
                </p>
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded">
                  Demographic splits configuration will be added here
                </div>
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
