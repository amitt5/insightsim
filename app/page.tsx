import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { CheckCircle } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                AI-Powered Focus Groups. <span className="text-primary">Real Insights.</span> No Waiting.
              </h1>
              <p className="mb-10 text-xl text-gray-600">
                Run simulated qualitative research with intelligent AI personas and moderators.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Try for Free
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-50 py-20">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold">Why InsightSim?</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "AI Participants",
                  description: "Domain-specific personas trained to simulate real consumer behavior",
                },
                {
                  title: "Flexible Moderation",
                  description: "Choose between AI or human-led moderation for your research",
                },
                {
                  title: "Results in Minutes",
                  description: "Get qualitative insights in minutes, not weeks",
                },
                {
                  title: "Cost-Effective",
                  description: "Reduce research costs while maintaining quality insights",
                },
              ].map((feature, i) => (
                <div key={i} className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-medium">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-20">
          <div className="container">
            <h2 className="mb-2 text-center text-3xl font-bold">Why not just use ChatGPT?</h2>
            <p className="mb-12 text-center text-lg text-gray-600">
              InsightSim is purpose-built for qualitative research
            </p>

            <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-left">Feature</th>
                    <th className="p-4 text-center">InsightSim</th>
                    <th className="p-4 text-center">ChatGPT</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Multi-agent memory", insightSim: true, chatGpt: false },
                    { name: "Project management", insightSim: true, chatGpt: false },
                    { name: "Domain-trained personas", insightSim: true, chatGpt: false },
                    { name: "Exportable reports", insightSim: true, chatGpt: false },
                  ].map((feature, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-4">{feature.name}</td>
                      <td className="p-4 text-center text-primary">{feature.insightSim ? "✓" : "✗"}</td>
                      <td className="p-4 text-center text-gray-500">{feature.chatGpt ? "✓" : "✗"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white py-8">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-purple-500 to-violet-600">
                <span className="text-lg font-bold text-white">IS</span>
              </div>
              <span className="text-xl font-bold">InsightSim</span>
            </div>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-gray-600 hover:text-primary">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-gray-600 hover:text-primary">
                Terms
              </Link>
              <Link href="#" className="text-sm text-gray-600 hover:text-primary">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
