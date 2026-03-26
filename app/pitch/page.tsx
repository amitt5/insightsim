"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Zap, Target, RefreshCw, TrendingUp, Database } from "lucide-react"

const LABELS = ["Problem", "Solution", "Output", "Why Now", "Business"]

export default function PitchPage() {
  const [current, setCurrent] = useState(0)
  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), [])
  const next = useCallback(() => setCurrent((c) => Math.min(LABELS.length - 1, c + 1)), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next()
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [next, prev])

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fff", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Slide content */}
      <div style={{ flex: 1, padding: "56px 72px", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "960px" }}>

        {current === 0 && (
          <div>
            <SlideTag>01 — Problem</SlideTag>
            <h1 style={{ fontSize: "3rem", fontWeight: 700, lineHeight: 1.15, marginTop: "24px", marginBottom: 0 }}>
              AI personalisation is everywhere.{" "}
              <span style={{ color: "#71717a" }}>It still doesn't work.</span>
            </h1>
            <p style={{ marginTop: "24px", fontSize: "1.1rem", color: "#a1a1aa", maxWidth: "580px", lineHeight: 1.7 }}>
              Apollo. Clay. HubSpot. Every GTM stack now ships with an AI copy layer. Yet cold email reply rates sit at an all-time low of <strong style={{ color: "#fff" }}>1–3%</strong>.
            </p>
            <div style={{ marginTop: "32px", display: "flex", gap: "16px" }}>
              {[
                { stat: "1–3%", label: "Average cold email reply rate" },
                { stat: "~$10k+", label: "Cost of a traditional focus group" },
                { stat: "Weeks", label: "Time to get A/B test signal" },
              ].map((item) => (
                <div key={item.stat} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", padding: "20px 24px", minWidth: "160px" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 700 }}>{item.stat}</div>
                  <div style={{ fontSize: "0.8rem", color: "#71717a", marginTop: "4px" }}>{item.label}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: "28px", color: "#a1a1aa", maxWidth: "520px", lineHeight: 1.7 }}>
              The copy is still generic. Your ICP can tell. And you have <em style={{ color: "#fff" }}>no signal</em> until you've already sent to thousands of real prospects.
            </p>
          </div>
        )}

        {current === 1 && (
          <div>
            <SlideTag>02 — Solution</SlideTag>
            <h1 style={{ fontSize: "3rem", fontWeight: 700, lineHeight: 1.15, marginTop: "24px" }}>
              Test your copy on synthetic buyers{" "}
              <span style={{ color: "#34d399" }}>before you send it to real ones.</span>
            </h1>
            <div style={{ marginTop: "28px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {[
                { icon: <Target size={14} />, label: "ICP description" },
                "→",
                { icon: <Database size={14} />, label: "Your intel (calls, reviews)" },
                "→",
                { icon: <Zap size={14} />, label: "Synthetic buyers" },
                "→",
                { icon: <RefreshCw size={14} />, label: "Score + iterate" },
                "→",
                { icon: <TrendingUp size={14} />, label: "8 iterations overnight" },
              ].map((item, i) =>
                item === "→" ? (
                  <span key={i} style={{ color: "#3f3f46", fontSize: "1.2rem" }}>→</span>
                ) : (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", padding: "8px 12px", fontSize: "0.85rem" }}>
                    <span style={{ color: "#34d399" }}>{(item as { icon: React.ReactNode; label: string }).icon}</span>
                    <span>{(item as { icon: React.ReactNode; label: string }).label}</span>
                  </div>
                )
              )}
            </div>
            <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "620px" }}>
              {[
                { title: "Grounded synthetic buyers", body: "Each persona is modelled on your ICP + your own sales intel — not a generic chatbot." },
                { title: "Personalised per buyer", body: "Every synthetic user receives a unique message written for their profile, then scores it." },
                { title: "Qualitative + quantitative", body: "Score 1–10 plus verbatim feedback on why the copy did or didn't resonate." },
                { title: "Async & overnight", body: "Launch a campaign, close your laptop. Wake up to 8 tested iterations." },
              ].map((item) => (
                <div key={item.title} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#34d399", marginBottom: "6px" }}>{item.title}</div>
                  <div style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {current === 2 && (
          <div>
            <SlideTag>03 — The Output</SlideTag>
            <h1 style={{ fontSize: "3rem", fontWeight: 700, lineHeight: 1.15, marginTop: "24px" }}>
              Not a message.{" "}
              <span style={{ color: "#fbbf24" }}>A GTM-ready prompt.</span>
            </h1>
            <p style={{ marginTop: "20px", fontSize: "1.1rem", color: "#a1a1aa", maxWidth: "580px", lineHeight: 1.7 }}>
              Most AI copy tools generate a message. Refinery optimises the <em style={{ color: "#fff" }}>strategy</em> — a reusable personalisation prompt that writes a unique message for every prospect.
            </p>
            <div style={{ marginTop: "28px", maxWidth: "620px", border: "1px dashed rgba(251,191,36,0.35)", borderRadius: "12px", background: "rgba(251,191,36,0.04)", padding: "20px" }}>
              <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#fbbf24", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
                Iteration 8 — Personalisation Prompt
              </div>
              <p style={{ fontSize: "0.85rem", color: "#d4d4d8", lineHeight: 1.75, fontFamily: "monospace" }}>
                Write a cold email to {"{"}firstName{"}"} at {"{"}company{"}"}. Open with their most recent compliance incident or audit finding. Reference NYDFS 23 NYCRR 500 §500.14 specifically. Show you understand the operational burden of manual log review. Mention 3 firms in their sector who avoided fines. Close with a single frictionless ask — a 15-min call to show the dashboard.
              </p>
              <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                <span style={{ fontSize: "0.75rem", background: "rgba(52,211,153,0.15)", color: "#34d399", padding: "4px 8px", borderRadius: "6px" }}>Score 8.1 / 10</span>
                <span style={{ fontSize: "0.75rem", background: "#27272a", color: "#a1a1aa", padding: "4px 8px", borderRadius: "6px" }}>Apollo-ready</span>
                <span style={{ fontSize: "0.75rem", background: "#27272a", color: "#a1a1aa", padding: "4px 8px", borderRadius: "6px" }}>Clay-ready</span>
              </div>
            </div>
            <p style={{ marginTop: "20px", fontSize: "0.85rem", color: "#71717a", maxWidth: "520px" }}>
              Plug this directly into your enrichment tool. Every real prospect gets a message written by a battle-tested strategy — not a template.
            </p>
          </div>
        )}

        {current === 3 && (
          <div>
            <SlideTag>04 — Why Now</SlideTag>
            <h1 style={{ fontSize: "3rem", fontWeight: 700, lineHeight: 1.15, marginTop: "24px" }}>
              Three forces just aligned.{" "}
              <span style={{ color: "#a78bfa" }}>The window is now.</span>
            </h1>
            <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", maxWidth: "740px" }}>
              {[
                { num: "01", title: "GTM tools went AI-first", body: "Apollo, Clay, HubSpot all shipped AI personalisation — and created the exact problem Refinery solves." },
                { num: "02", title: "LLMs can simulate buyers", body: "GPT-4 level models now generate realistic ICP-grounded personas. This wasn't possible two years ago." },
                { num: "03", title: "Outreach is a survival skill", body: "Inbox saturation means resonant copy is no longer a nice-to-have. It's the difference between pipeline and silence." },
              ].map((item) => (
                <div key={item.num} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#a78bfa", marginBottom: "8px" }}>{item.num}</div>
                  <div style={{ fontWeight: 600, marginBottom: "8px", fontSize: "0.95rem" }}>{item.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "#a1a1aa", lineHeight: 1.6 }}>{item.body}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "24px", maxWidth: "740px" }}>
              <div style={{ fontSize: "0.7rem", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Moat</div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {[
                  "RAG grounding on your proprietary data — synthetic users competitors can't replicate",
                  "Output is a prompt, not a template — native to how modern GTM stacks work",
                  "First-mover in async AI copy testing — early data compounds into benchmark advantage",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", fontSize: "0.82rem", color: "#a1a1aa", background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", padding: "10px 12px", maxWidth: "220px" }}>
                    <span style={{ color: "#a78bfa", flexShrink: 0 }}>→</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {current === 4 && (
          <div>
            <SlideTag>05 — Business</SlideTag>
            <h1 style={{ fontSize: "3rem", fontWeight: 700, lineHeight: 1.15, marginTop: "24px" }}>
              Usage-based.{" "}
              <span style={{ color: "#38bdf8" }}>Scales with outbound volume.</span>
            </h1>
            <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", maxWidth: "680px" }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Revenue model</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { tier: "Pay-per-campaign", desc: "Tied to AI compute cost — natural margin as scale increases" },
                    { tier: "SaaS tier above", desc: "Unlimited campaigns for teams with high outbound volume" },
                    { tier: "Enterprise", desc: "Custom RAG ingestion pipelines + dedicated synthetic panels" },
                  ].map((item) => (
                    <div key={item.tier} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", padding: "12px 16px" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#38bdf8" }}>{item.tier}</div>
                      <div style={{ fontSize: "0.78rem", color: "#71717a", marginTop: "2px" }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Market</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { stat: "160k+", label: "Apollo customers — every one does cold outbound" },
                    { stat: "$4.7B", label: "Sales intelligence & engagement software market" },
                    { stat: "SDRs", label: "Every outbound team writing copy is a direct buyer" },
                  ].map((item) => (
                    <div key={item.stat} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ fontSize: "1.6rem", fontWeight: 700, flexShrink: 0 }}>{item.stat}</div>
                      <div style={{ fontSize: "0.78rem", color: "#71717a" }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: "28px", maxWidth: "680px", background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: "12px", padding: "20px 24px" }}>
              <p style={{ color: "#7dd3fc", fontSize: "1.1rem", fontWeight: 500, margin: 0 }}>
                "Test before you send. Your ICP grounded in your own data. Wake up to 8 iterations."
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nav bar */}
      <div style={{ borderTop: "1px solid #27272a", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          {LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => setCurrent(i)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                background: i === current ? "#fff" : "transparent",
                color: i === current ? "#09090b" : "#71717a",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.75rem", color: "#3f3f46", fontFamily: "monospace" }}>{current + 1} / {LABELS.length}</span>
          <button
            onClick={prev}
            disabled={current === 0}
            style={{ padding: "8px", border: "1px solid #27272a", borderRadius: "8px", background: "transparent", color: current === 0 ? "#3f3f46" : "#a1a1aa", cursor: current === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            disabled={current === LABELS.length - 1}
            style={{ padding: "8px", border: "1px solid #27272a", borderRadius: "8px", background: "transparent", color: current === LABELS.length - 1 ? "#3f3f46" : "#a1a1aa", cursor: current === LABELS.length - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function SlideTag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.12em", border: "1px solid #27272a", padding: "4px 12px", borderRadius: "999px", display: "inline-block" }}>
      {children}
    </span>
  )
}
