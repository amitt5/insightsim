import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

const fakeSurveys = [
  { id: 1, name: "Brand Awareness Q2 2024", created_at: "2024-06-01", sample_size: 500, status: "Draft" },
  { id: 2, name: "Product Feedback - Alpha Testers", created_at: "2024-05-20", sample_size: 200, status: "Active" },
  { id: 3, name: "Pricing Sensitivity Study", created_at: "2024-05-10", sample_size: 1000, status: "Completed" },
]

export default function SurveysPage()  {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Surveys</h1>
        <Button asChild>
          <Link href="#">
            <Plus className="h-4 w-4 mr-2" />
            New Survey
          </Link>
        </Button>
      </div>
      {/* Desktop view - table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Study Name</th>
              <th className="text-left py-3 px-4">Date Created</th>
              <th className="text-left py-3 px-4">Sample size</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fakeSurveys.map((survey) => (
              <tr key={survey.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{survey.name}</td>
                <td className="py-3 px-4">{survey.created_at}</td>
                <td className="py-3 px-4">{survey.sample_size}</td>
                <td className="py-3 px-4">
                  <Badge variant={survey.status === "Completed" ? "default" : "secondary"}>{survey.status}</Badge>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button variant="ghost" asChild>
                    <Link href={`#`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile view - cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {fakeSurveys.map((survey) => (
          <div key={survey.id} className="rounded-lg bg-white p-6 shadow-sm border flex flex-col gap-2">
            <div className="font-semibold text-lg">{survey.name}</div>
            <div className="text-xs text-gray-500">Created: {survey.created_at}</div>
            <div className="text-xs text-gray-500">Sample size: {survey.sample_size}</div>
            <div className="text-xs text-gray-500">Status: <Badge variant={survey.status === "Completed" ? "default" : "secondary"}>{survey.status}</Badge></div>
            <Button variant="outline" size="sm" className="mt-2 w-fit" asChild>
              <Link href={`#`}>View</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 