"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SurveyPageProps {
  params: {
    id: string
  }
}

export default function SurveyPage({ params }: SurveyPageProps) {
  const router = useRouter()
  const [surveyName, setSurveyName] = useState("Product Feedback - Alpha Testers")
  const [surveyDescription, setSurveyDescription] = useState("Gather feedback from our alpha testing group to improve the product before beta release.")
  const [questions, setQuestions] = useState([
    { id: 1, text: "How satisfied are you with the overall product experience?", type: "scale" },
    { id: 2, text: "What features do you find most valuable?", type: "text" },
    { id: 3, text: "What improvements would you suggest?", type: "text" }
  ])

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      text: "",
      type: "text"
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: number, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q))
  }

  const deleteQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Badge variant="secondary">Active</Badge>
      </div>

      {/* Survey Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Survey Name</label>
            <Input
              value={surveyName}
              onChange={(e) => setSurveyName(e.target.value)}
              placeholder="Enter survey name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={surveyDescription}
              onChange={(e) => setSurveyDescription(e.target.value)}
              placeholder="Enter survey description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Questions ({questions.length})</CardTitle>
          <Button onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                <span className="text-sm font-medium text-gray-500 mt-2">
                  {index + 1}.
                </span>
                <div className="flex-1">
                  <Textarea
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, e.target.value)}
                    placeholder="Enter your question"
                    rows={2}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteQuestion(question.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No questions added yet. Click "Add Question" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button>Save Changes</Button>
        <Button variant="outline">Preview Survey</Button>
        <Button variant="outline">Share Survey</Button>
      </div>
    </div>
  )
}
