# InsightSim – Claude Code Guide

when in plan mode DO NOT create a plan without asking first. 

## Project Overview
InsightSim is a synthetic market research platform built with Next.js and Supabase. Users create research projects, generate AI personas, and run qualitative simulations (IDIs and FGDs) with an AI moderator.

We are adding a new feature called **Refinery** — a separate, self-contained flow that lets users optimize marketing copy (emails, ads, subject lines, etc.) through iterative synthetic user testing. The loop is: generate → test with synthetic users → score → iterate → repeat.

---

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database & Auth:** Supabase (check existing auth patterns in the codebase before implementing anything auth-related)
- **UI:** shadcn/ui components only — do not introduce other component libraries
- **AI:** OpenAI API (check existing integration pattern in codebase before making new calls)
- **Language:** TypeScript (check tsconfig for strict mode settings before writing new code)
- **Styling:** Tailwind CSS

---

## Critical Rules

### Do not touch existing code
Refinery is a completely new, isolated feature. Do not modify, refactor, or reference:
- Any existing pages, components, or layouts outside of `/refinery`
- Any existing Supabase tables
- Any existing API routes or server actions
- The existing persona system (InsightSim personas are different from Refinery synthetic users)

If something from the existing codebase is needed, ask first rather than modifying it.

### Check before assuming
- Before writing auth logic, check how existing pages handle Supabase auth
- Before calling OpenAI, check how existing API routes structure those calls
- Before creating API routes, check whether the project uses route handlers or server actions
- Before writing TypeScript, check tsconfig.json for strict mode

---

## Refinery Feature – What It Does

Users provide:
1. What they want to optimize (cold email, ad creative, subject line, landing page copy, etc.) and any starting draft
2. Their ICP (Ideal Customer Profile) description
3. Optional RAG data (transcripts, reviews, sales notes) to ground synthetic users
4. Metrics to optimize for (reply rate, CTR, curiosity, premium feel, etc.)
5. Additional context about the product/service
6. Number of iterations (n) and synthetic users per iteration (m)

The system then:
1. Generates m synthetic user personas grounded in the ICP + RAG data
2. Shows each version of the content to all synthetic users
3. Collects quantitative scores (1–10 scale) and qualitative feedback per user
4. Aggregates results and generates a new, improved version
5. Repeats n times as a background job
6. User wakes up to n iterations with scores and feedback for each

---

## Refinery – Supabase Schema

Use these table names. Create migrations, do not modify existing tables.

- `refinery_campaigns` – the thing being optimized (type, content, ICP, config)
- `refinery_panels` – the synthetic user panel generated for a campaign run
- `refinery_synthetic_users` – individual synthetic users (persona data) within a panel
- `refinery_iterations` – each loop cycle (iteration number, content version, aggregate score)
- `refinery_responses` – individual synthetic user response per iteration (score + qualitative feedback)
- `refinery_jobs` – background job queue (status, progress, error handling)

---

## Refinery – Routing

All Refinery pages live under `/refinery`:
- `/refinery` – dashboard / list of campaigns
- `/refinery/new` – setup wizard (multi-step form)
- `/refinery/[campaignId]` – results view showing all iterations
- `/refinery/[campaignId]/iteration/[n]` – detail view for a single iteration

---

## Refinery – UI Patterns

- Use shadcn components throughout
- Synthetic users should be displayed as a **grid** (not cards like existing InsightSim personas)
- On hover over a grid cell, show: name, age, gender, profession, 1–2 line bio, score for that iteration
- Scores are displayed on a 1–10 scale but are intentionally conservative:
  - Scores start low and never display above 8.5
  - As scores get higher, increments in the visible score get smaller (compressed scale)
  - Never show a 10/10 — this is by design to reflect synthetic user limitations
- Iterations are shown in order so the user can see progression over time

---

## Background Job Architecture

The iteration loop must run server-side as a background job — not client-side. A closed browser tab must not interrupt a running campaign.

Use:
- A `refinery_jobs` table as a simple queue with status fields (`pending`, `running`, `completed`, `failed`)
- A Supabase Edge Function or Next.js route handler to process the queue
- Supabase Realtime or polling to update the UI as iterations complete

Ask before choosing an approach if unclear.

---

## State Management

No global state management is currently used. For Refinery, use React state and React Query (or Supabase's built-in hooks) for server state. Only introduce Zustand or similar if there is a clear reason — ask first.

---

## When in Doubt
- Ask before modifying anything outside `/refinery`
- Ask before introducing new dependencies
- Prefer simple and explicit over clever and abstract
- One thing at a time — complete and confirm before moving to the next piece