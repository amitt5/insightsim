"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
    primaryBenefit: ""
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
              <div className="text-center py-8 text-gray-500">
                Research Objective content will be added here
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
              <div className="text-center py-8 text-gray-500">
                Location content will be added here
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
          <Button>Save & Continue</Button>
        </div>
      </div>
    </div>
  )
}
