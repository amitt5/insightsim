"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { CheckCircle, ChevronDown } from "lucide-react"
import { useState } from "react"

export default function LandingPage() {
  // FAQ data (flattened, not grouped)
  const faqList = [
    {
      q: "What is InsightSim?",
      a: "InsightSim is an AI-powered qualitative research platform that simulates focus groups and in-depth interviews using intelligent personas.",
    },
    {
      q: "Who is InsightSim for?",
      a: "Researchers, UX professionals, and product teams who want faster insights without the need for participant recruitment every time.",
    },
    {
      q: "Do I need technical expertise to use it?",
      a: "No. InsightSim is built for researchers. Calibration is user-friendly, and we offer demos and support to help you through it.",
    },
    {
      q: "How are the AI personas created?",
      a: "You can use presets or define your own personas by specifying demographic, behavioral, and attitudinal traits.",
    },
    {
      q: "Can I reuse personas across simulations?",
      a: "Yes. Personas are reusable across studies for concept testing, brand tracking, or iterative design.",
    },
    {
      q: "How are simulations different from surveys?",
      a: "Surveys collect structured responses. Simulations offer rich dialogue—capturing reactions, hesitations, and ideas in context.",
    },
    {
      q: "How can I improve the quality of results?",
      a: "InsightSim lets you calibrate personas with transcripts or insights from real research. The more calibration you do, the more realistic the AI behavior becomes. Watch a demo or request a walkthrough—it's slightly technical but very doable with support.",
    },
    {
      q: "What is calibration, and how does it work?",
      a: "You upload past research, and InsightSim adjusts the persona's dialogue behavior to match real-world patterns—making responses more authentic.",
    },
    {
      q: "Can I combine AI and human moderators?",
      a: "Yes. Use full AI moderation or guide conversations yourself. InsightSim also learns from your moderating style over time.",
    },
    {
      q: "Can I simulate both FGDs and IDIs?",
      a: "Absolutely. Run small-group discussions or 1:1 interviews depending on your research needs.",
    },
    {
      q: "Can I test multiple audience segments?",
      a: "Yes. You can create personas for multiple target groups and simulate sessions with each of them.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes, we offer a limited trial where you can run one simulation and explore the features.",
    },
    {
      q: "What kind of support do you offer?",
      a: "Email support, documentation, live demos, and help with calibration if you're working with custom data.",
    },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

        {/* FAQ Section (styled like screenshot) */}
        <section className="py-20 bg-white border-t">
          <div className="container max-w-4xl mx-auto">
            <h2 className="mb-2 text-center text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="mb-10 text-center text-gray-500 text-lg">Everything you need to know about InsightSim</p>
            <div className="bg-white rounded-lg shadow-sm divide-y">
              {faqList.map((item, idx) => (
                <div key={item.q}>
                  <button
                    className="w-full flex items-center justify-between py-5 px-6 text-left text-lg font-medium focus:outline-none hover:bg-gray-50 transition"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    aria-expanded={openFaq === idx}
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-6 text-gray-700 text-base animate-fade-in">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who Is This Product For Section */}
        <section className="py-20 bg-gray-50 border-t">
          <div className="container max-w-5xl mx-auto">
            <h2 className="mb-2 text-center text-3xl font-bold">Who Is InsightSim For?</h2>
            <p className="mb-10 text-center text-gray-500 text-lg">Our platform is designed for professionals who need deep qualitative insights without the traditional time and cost constraints.</p>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center">
                <span className="text-4xl mb-4">🔍</span>
                <h3 className="mb-2 text-xl font-semibold text-center">Qualitative Researchers</h3>
                <p className="text-gray-600 text-center">Run more studies in less time. Test discussion guides, validate findings, and explore new research directions without recruiting delays.</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center">
                <span className="text-4xl mb-4">💡</span>
                <h3 className="mb-2 text-xl font-semibold text-center">Insight Managers</h3>
                <p className="text-gray-600 text-center">Get consumer feedback on demand. Quickly test concepts, messaging, and product ideas before investing in full-scale research.</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center">
                <span className="text-4xl mb-4">👤</span>
                <h3 className="mb-2 text-xl font-semibold text-center">User Researchers</h3>
                <p className="text-gray-600 text-center">Simulate user feedback sessions for early designs and prototypes. Identify usability issues and preference patterns faster.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Loom Video Demo Section */}
        <section className="py-20 bg-white border-t">
          <div className="container max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="mb-2 text-center text-3xl font-bold">See How InsightSim Works</h2>
            <p className="mb-10 text-center text-gray-500 text-lg">Watch a quick demo of how to run your first AI-powered focus group</p>
            <div className="w-full flex justify-center mb-8">
              <div className="w-full max-w-2xl aspect-video rounded-lg overflow-hidden shadow bg-gray-100 flex items-center justify-center">
                <iframe
                  src="https://www.loom.com/embed/3f2acb20d33541ea8236200f080f3c8b"
                  title="InsightSim Demo Video"
                  allow="autoplay; fullscreen"
                  frameBorder="0"
                  className="w-full h-full min-h-[320px]"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            <Button size="lg" className="mt-2" asChild>
              <Link href="/signup">Try It Yourself</Link>
            </Button>
          </div>
        </section>

        {/* Review Section */}
        <section className="py-20 bg-gray-50 border-t">
          <div className="container max-w-5xl mx-auto">
            <h2 className="mb-12 text-center text-3xl font-bold">What Our Users Say</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {/* Review 1 */}
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center">
                <p className="text-gray-700 text-center mb-4">InsightSim has cut our research timeline in half. We can now test concepts and get directional insights before committing to full studies.</p>
                <div className="flex items-center gap-3 mt-4">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sarah Chen" className="h-10 w-10 rounded-full object-cover border" />
                  <div>
                    <div className="font-semibold">Sarah Chen</div>
                    <div className="text-xs text-gray-500">Research Director, Consumer Goods Inc.</div>
                  </div>
                </div>
              </div>
              {/* Review 2 */}
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center">
                <p className="text-gray-700 text-center mb-4">The AI personas are surprisingly nuanced. They capture the complexity of real consumers and provide insights that feel authentic and actionable.</p>
                <div className="flex items-center gap-3 mt-4">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Michael Johnson" className="h-10 w-10 rounded-full object-cover border" />
                  <div>
                    <div className="font-semibold">Michael Johnson</div>
                    <div className="text-xs text-gray-500">UX Research Lead, TechApp</div>
                  </div>
                </div>
              </div>
              {/* Review 3 */}
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center">
                <p className="text-gray-700 text-center mb-4">We use InsightSim to pressure-test our discussion guides before real sessions. It's improved our moderator effectiveness and research quality.</p>
                <div className="flex items-center gap-3 mt-4">
                  <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Aisha Patel" className="h-10 w-10 rounded-full object-cover border" />
                  <div>
                    <div className="font-semibold">Aisha Patel</div>
                    <div className="text-xs text-gray-500">Qualitative Researcher, Market Insights Group</div>
                  </div>
                </div>
              </div>
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
