"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Zap, Target, RefreshCw, TrendingUp, Database } from "lucide-react"

const slides = [
  {
    id: 1,
    label: "Problem",
  },
  {
    id: 2,
    label: "Solution",
  },
  {
    id: 3,
    label: "Output",
  },
  {
    id: 4,
    label: "Why Now",
  },
  {
    id: 5,
    label: "Business",
  },
]

export default function PitchPage() {
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), [])
  const next = useCallback(() => setCurrent((c) => Math.min(slides.length - 1, c + 1)), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next()
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [next, prev])

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white overflow-hidden flex flex-col select-none">
      {/* Slide area */}
      <div className="flex-1 relative">
        {/* Slide 1 — Problem */}
        <Slide visible={current === 0}>
          <SlideLayout>
            <Tag>01 — Problem</Tag>
            <h1 className="text-5xl font-bold leading-tight mt-6 max-w-3xl">
              AI personalisation is everywhere.{" "}
              <span className="text-zinc-400">It still doesn't work.</span>
            </h1>
            <p className="mt-8 text-xl text-zinc-400 max-w-2xl leading-relaxed">
              Apollo. Clay. HubSpot. Every GTM stack now ships with an AI copy layer. Yet cold
              email reply rates sit at an all-time low of <span className="text-white font-semibold">1–3%</span>.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl">
              {[
                { stat: "1–3%", label: "Average cold email reply rate" },
                { stat: "~$10k+", label: "Cost of a traditional focus group" },
                { stat: "Weeks", label: "Time to get A/B test signal" },
              ].map((item) => (
                <div key={item.stat} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-3xl font-bold text-white">{item.stat}</div>
                  <div className="text-sm text-zinc-500 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-zinc-400 max-w-xl">
              The copy is still generic. Your ICP can tell. And you have{" "}
              <span className="text-white italic">no signal</span> until you've already sent to
              thousands of real prospects.
            </p>
          </SlideLayout>
        </Slide>

        {/* Slide 2 — Solution */}
        <Slide visible={current === 1}>
          <SlideLayout>
            <Tag>02 — Solution</Tag>
            <h1 className="text-5xl font-bold leading-tight mt-6 max-w-3xl">
              Test your copy on synthetic buyers{" "}
              <span className="text-emerald-400">before you send it to real ones.</span>
            </h1>
            <div className="mt-10 flex items-center gap-3 flex-wrap">
              {[
                { icon: <Target className="h-4 w-4" />, label: "ICP description" },
                { icon: null, label: "→" },
                { icon: <Database className="h-4 w-4" />, label: "Your intel (calls, reviews)" },
                { icon: null, label: "→" },
                { icon: <Zap className="h-4 w-4" />, label: "Synthetic buyers" },
                { icon: null, label: "→" },
                { icon: <RefreshCw className="h-4 w-4" />, label: "Score + iterate" },
                { icon: null, label: "→" },
                { icon: <TrendingUp className="h-4 w-4" />, label: "8 iterations overnight" },
              ].map((item, i) =>
                item.label === "→" ? (
                  <span key={i} className="text-zinc-600 text-xl font-light">→</span>
                ) : (
                  <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm">
                    {item.icon && <span className="text-emerald-400">{item.icon}</span>}
                    <span>{item.label}</span>
                  </div>
                )
              )}
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 max-w-2xl">
              {[
                { title: "Grounded synthetic buyers", body: "Each persona is modelled on your ICP + your own sales intel — not a generic chatbot." },
                { title: "Personalised per buyer", body: "Every synthetic user receives a unique message written for their profile, then scores it." },
                { title: "Qualitative + quantitative", body: "Score 1–10 plus verbatim feedback explaining why the copy did or didn't resonate." },
                { title: "Async & overnight", body: "Launch a campaign, close your laptop. Wake up to 8 tested iterations." },
              ].map((item) => (
                <div key={item.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-sm font-semibold text-emerald-400 mb-1">{item.title}</div>
                  <div className="text-sm text-zinc-400">{item.body}</div>
                </div>
              ))}
            </div>
          </SlideLayout>
        </Slide>

        {/* Slide 3 — The Output */}
        <Slide visible={current === 2}>
          <SlideLayout>
            <Tag>03 — The Output</Tag>
            <h1 className="text-5xl font-bold leading-tight mt-6 max-w-3xl">
              Not a message.{" "}
              <span className="text-amber-400">A GTM-ready prompt.</span>
            </h1>
            <p className="mt-6 text-xl text-zinc-400 max-w-2xl">
              Most AI copy tools generate a message. Refinery optimises the{" "}
              <span className="text-white italic">strategy</span> — a reusable personalisation prompt
              that writes a unique message for every prospect.
            </p>
            <div className="mt-8 max-w-2xl">
              <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-5">
                <div className="text-xs font-mono text-amber-400 mb-3 tracking-widest uppercase">
                  Iteration 8 — Personalisation Prompt
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed font-mono">
                  Write a cold email to {"{"}firstName{"}"} at {"{"}company{"}"}. Open with their
                  most recent compliance incident or audit finding. Reference NYDFS 23 NYCRR 500
                  §500.14 specifically. Show you understand the operational burden of manual log
                  review. Mention 3 firms in their sector who avoided fines. Close with a single
                  frictionless ask — a 15-min call to show the dashboard.
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Score 8.1 / 10</span>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Apollo-ready</span>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Clay-ready</span>
                </div>
              </div>
            </div>
            <p className="mt-6 text-zinc-500 text-sm max-w-xl">
              Plug this prompt directly into your enrichment tool. Every real prospect gets a message
              written by a battle-tested strategy — not a template.
            </p>
          </SlideLayout>
        </Slide>

        {/* Slide 4 — Why Now / Moat */}
        <Slide visible={current === 3}>
          <SlideLayout>
            <Tag>04 — Why Now</Tag>
            <h1 className="text-5xl font-bold leading-tight mt-6 max-w-3xl">
              Three forces just aligned.{" "}
              <span className="text-violet-400">The window is now.</span>
            </h1>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-3xl">
              {[
                {
                  num: "01",
                  title: "GTM tools went AI-first",
                  body: "Apollo, Clay, and HubSpot all shipped AI personalisation — and created the exact problem Refinery solves.",
                  color: "text-violet-400",
                },
                {
                  num: "02",
                  title: "LLMs can simulate buyers",
                  body: "GPT-4 level models are now capable of generating realistic ICP-grounded personas. This wasn't possible two years ago.",
                  color: "text-violet-400",
                },
                {
                  num: "03",
                  title: "Outreach is a survival skill",
                  body: "Inbox saturation means differentiated, resonant copy is no longer a nice-to-have. It's the difference between pipeline and silence.",
                  color: "text-violet-400",
                },
              ].map((item) => (
                <div key={item.num} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className={`text-xs font-mono ${item.color} mb-2`}>{item.num}</div>
                  <div className="font-semibold mb-2">{item.title}</div>
                  <div className="text-sm text-zinc-400">{item.body}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 max-w-3xl">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Moat</div>
              <div className="flex gap-3 flex-wrap">
                {[
                  "RAG grounding on your proprietary data (calls, reviews, win/loss) → synthetic users competitors can't replicate",
                  "Output is a prompt, not a template — native to how modern GTM stacks work",
                  "First-mover in async AI copy testing — early data compounds into benchmark advantage",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 max-w-xs">
                    <span className="text-violet-400 mt-0.5 shrink-0">→</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </SlideLayout>
        </Slide>

        {/* Slide 5 — Business */}
        <Slide visible={current === 4}>
          <SlideLayout>
            <Tag>05 — Business</Tag>
            <h1 className="text-5xl font-bold leading-tight mt-6 max-w-3xl">
              Usage-based.{" "}
              <span className="text-sky-400">Scales with outbound volume.</span>
            </h1>
            <div className="mt-10 grid grid-cols-2 gap-6 max-w-3xl">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Revenue model</div>
                <div className="space-y-3">
                  {[
                    { tier: "Pay-per-campaign", desc: "Tied to AI compute cost — natural margin as scale increases" },
                    { tier: "SaaS tier above", desc: "Unlimited campaigns for teams with high outbound volume" },
                    { tier: "Enterprise", desc: "Custom RAG ingestion pipelines + dedicated synthetic panels" },
                  ].map((item) => (
                    <div key={item.tier} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
                      <div className="text-sm font-semibold text-sky-400">{item.tier}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Market</div>
                <div className="space-y-3">
                  {[
                    { stat: "160k+", label: "Apollo customers — every one does cold outbound" },
                    { stat: "$4.7B", label: "Sales intelligence & engagement software market" },
                    { stat: "SDRs", label: "Every outbound team writing copy is a direct buyer" },
                  ].map((item) => (
                    <div key={item.stat} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-4">
                      <div className="text-2xl font-bold text-white shrink-0">{item.stat}</div>
                      <div className="text-xs text-zinc-500">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 max-w-3xl bg-sky-500/10 border border-sky-500/30 rounded-xl px-6 py-4">
              <p className="text-sky-300 text-lg font-medium">
                "Test before you send. Your ICP grounded in your own data. Wake up to 8 iterations."
              </p>
            </div>
          </SlideLayout>
        </Slide>
      </div>

      {/* Navigation bar */}
      <div className="border-t border-zinc-800 bg-zinc-950 px-8 py-4 flex items-center justify-between shrink-0">
        {/* Slide labels */}
        <div className="flex items-center gap-1">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setCurrent(i)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                i === current
                  ? "bg-white text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {slide.label}
            </button>
          ))}
        </div>

        {/* Prev / Next */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600 font-mono">
            {current + 1} / {slides.length}
          </span>
          <button
            onClick={prev}
            disabled={current === 0}
            className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            disabled={current === slides.length - 1}
            className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Slide({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-300 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {children}
    </div>
  )
}

function SlideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col justify-center px-16 py-12 max-w-5xl">
      {children}
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest border border-zinc-800 px-3 py-1 rounded-full w-fit">
      {children}
    </span>
  )
}
