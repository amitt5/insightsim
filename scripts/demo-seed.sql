-- =============================================================
-- InsightSim Refinery — Hackathon Demo Seed
-- ChaosTrack cold email campaign — 8 iterations, score 5.0 → 8.1
--
-- HOW TO USE:
-- 1. Go to Supabase > Auth > Users and copy your user UUID
-- 2. Replace 'REPLACE-WITH-YOUR-USER-ID' below with your UUID
-- 3. Run this in the Supabase SQL editor
-- 4. Copy the Campaign ID from the output (RAISE NOTICE line)
-- 5. Navigate to /refinery/<campaign-id> in the app
-- =============================================================

DO $$
DECLARE
  v_user_id    UUID := 'c5143197-9581-468e-8fcc-e1b9257e7ea1';
  v_campaign   UUID;
  v_panel      UUID;
  v_job        UUID;
  u1 UUID; u2 UUID; u3 UUID; u4 UUID; u5 UUID; u6 UUID;
  i1 UUID; i2 UUID; i3 UUID; i4 UUID; i5 UUID; i6 UUID; i7 UUID; i8 UUID;
BEGIN

-- ── CAMPAIGN ────────────────────────────────────────────────────────────────

INSERT INTO refinery_campaigns (
  user_id, name, content_type, icp,
  metrics, extra_context, messaging_guidelines,
  iterations, users_per_iter, status,
  initial_draft
) VALUES (
  v_user_id,
  'ChaosTrack — NYDFS Cold Email',
  'cold_email',
  'CISOs, VP InfoSec, and Chief Risk Officers at mid-market financial institutions (banks, fintechs, insurance firms) with 100–2000 employees operating under NYDFS 23 NYCRR 500. They are personally accountable for compliance defensibility, skeptical of vendor claims, and pressed for time.',
  ARRAY['reply rate', 'curiosity', 'personal relevance', 'credibility'],
  'ChaosTrack is an incident response simulation platform that helps financial firms run structured, examiner-ready exercises on-demand — replacing manual tabletop drills that generate no audit evidence.',
  'Peer-to-peer tone only. Never use: leverage, streamline, synergy, game-changer, revolutionary. No unverifiable statistics. Never open with a question. CTA should be a conversation, not a demo request.',
  8, 6, 'completed',
  'Write a cold email to {{firstName}} at {{company}}. Mention ChaosTrack helps with NYDFS compliance. Professional tone, under 100 words.'
) RETURNING id INTO v_campaign;

-- ── JOB ─────────────────────────────────────────────────────────────────────

INSERT INTO refinery_jobs (
  campaign_id, status, current_iteration, total_iterations,
  started_at, completed_at
) VALUES (
  v_campaign, 'completed', 8, 8,
  NOW() - INTERVAL '2 hours', NOW() - INTERVAL '20 minutes'
) RETURNING id INTO v_job;

-- ── PANEL ────────────────────────────────────────────────────────────────────

INSERT INTO refinery_panels (campaign_id) VALUES (v_campaign) RETURNING id INTO v_panel;

-- ── SYNTHETIC USERS ──────────────────────────────────────────────────────────

INSERT INTO refinery_synthetic_users (panel_id, campaign_id, name, age, gender, profession, bio, persona_data)
VALUES (v_panel, v_campaign, 'Sarah Chen', 41, 'female', 'CISO at Meridian Financial',
  'Former compliance attorney turned security executive — she reads cold emails the way an examiner reads audit submissions.',
  '{"company":"Meridian Financial — Series B fintech, ~180 employees, NYC, $2B annual transaction volume","career_arc":"12 years in financial compliance law before transitioning to security leadership — thinks like a regulator first, technologist second","recent_signal":"Posted last month about receiving an NYDFS audit notice; commented skeptically on an AI compliance vendor post","communication_style":"Direct and evidence-driven. Responds to peer framing with specifics. Deletes anything that reads like a pitch in the first sentence","decision_driver":"Personal liability is on the line — she needs defensible, examiner-ready evidence, not slide decks","blocker":"Has been burned by two vendors who overpromised automated compliance. Won''t engage without a concrete proof point from a comparable firm","pain_right_now":"Section 500.17 amendment deadline in 6 months — her current quarterly tabletops generate no structured evidence for examiners"}'
) RETURNING id INTO u1;

INSERT INTO refinery_synthetic_users (panel_id, campaign_id, name, age, gender, profession, bio, persona_data)
VALUES (v_panel, v_campaign, 'Marcus Webb', 47, 'male', 'VP Information Security at Heritage Community Bank',
  'Twenty-year banking veteran who has survived four NYDFS exams and trusts his network more than any vendor website.',
  '{"company":"Heritage Community Bank — $4B assets, 340 employees, upstate NY, community bank under full NYDFS oversight","career_arc":"Started as a network admin at a regional bank in 2003, worked up through IT, security, to VP InfoSec — deeply operational mindset","recent_signal":"Spoke at a regional banking conference last quarter about the burden of regulatory compliance on community banks","communication_style":"Prefers brief, direct emails. Responds to peer referrals and operational specifics. Ignores anything with a calendar link in paragraph one","decision_driver":"Needs to justify every tool spend to a conservative board — must show tangible exam readiness improvement, not efficiency metrics","blocker":"Budget-constrained. Skeptical of SaaS pricing for community bank budgets. Needs to see ROI framed in exam outcome terms, not hours saved","pain_right_now":"Annual exam coming up in 9 months — his IR exercises are still paper-based tabletops that examiners have flagged twice for lack of documentation"}'
) RETURNING id INTO u2;

INSERT INTO refinery_synthetic_users (panel_id, campaign_id, name, age, gender, profession, bio, persona_data)
VALUES (v_panel, v_campaign, 'Priya Patel', 39, 'female', 'Chief Risk Officer at Apex Insurance Group',
  'Governance-first executive who evaluates every vendor through a three-lens filter: regulatory defensibility, operational risk, and vendor stability.',
  '{"company":"Apex Insurance Group — mid-size P&C insurer, 600 employees, NJ-based, dual NYDFS and NJ DOB oversight","career_arc":"Actuarial background → enterprise risk → CRO at 39 — uniquely quantitative approach to operational risk that most CISOs lack","recent_signal":"Recently published an internal framework for third-party risk assessment — thinks systematically about vendor relationships","communication_style":"Analytical. Wants data, not stories. Respects precision in language — vague superlatives are an immediate trust killer","decision_driver":"Dual regulatory oversight means every compliance tool must work for both NYDFS and NJ DOB — integration complexity is a dealbreaker","blocker":"Currently managing a vendor consolidation initiative — actively reducing the number of point solutions. Needs a compelling case to add vs. replace","pain_right_now":"Board has asked for a quantified IR capability score — she has no systematic way to generate one from current tabletop exercises"}'
) RETURNING id INTO u3;

INSERT INTO refinery_synthetic_users (panel_id, campaign_id, name, age, gender, profession, bio, persona_data)
VALUES (v_panel, v_campaign, 'James Kowalski', 53, 'male', 'Director of Cybersecurity at Sterling Savings Bank',
  'Old-school security veteran who has seen every vendor trend come and go — earns trust slowly and loses it instantly.',
  '{"company":"Sterling Savings Bank — $1.2B assets, 180 employees, Philadelphia metro, community bank under NYDFS","career_arc":"Military IT background → federal government security roles → community banking for the past 15 years. Zero patience for hype","recent_signal":"Declined three vendor meetings last quarter citing irrelevance — has a well-known reputation for hanging up on cold calls","communication_style":"Blunt. Appreciates brevity and operational specificity. Has a documented policy of not responding to emails with scheduling links","decision_driver":"Wants to see his bank pass the next NYDFS exam cleanly — not interested in innovation, only in defensibility","blocker":"Deeply skeptical of SaaS tools after a 2021 incident where a compliance SaaS vendor had a data breach. Needs clear security posture evidence","pain_right_now":"His IR team runs the same tabletop script they''ve used for four years — examiners have informally noted it feels rehearsed, not real"}'
) RETURNING id INTO u4;

INSERT INTO refinery_synthetic_users (panel_id, campaign_id, name, age, gender, profession, bio, persona_data)
VALUES (v_panel, v_campaign, 'Nicole Rousseau', 44, 'female', 'Head of Compliance Technology at Vertex Capital',
  'Bridge between legal, compliance, and technology — she speaks all three languages and holds vendors to the highest standard of precision.',
  '{"company":"Vertex Capital — boutique asset manager, $8B AUM, 220 employees, NYC, NYDFS licensed","career_arc":"JD from Fordham Law → 8 years at a compliance consultancy → in-house at Vertex building their compliance tech stack from scratch","recent_signal":"Active on LinkedIn discussing RegTech trends — recently criticized vendors who use ''AI-powered compliance'' without explaining the mechanism","communication_style":"Values precision over enthusiasm. Responds well to vendors who demonstrate understanding of the regulatory nuance, not just the category","decision_driver":"Her reputation is built on selecting tools that hold up under regulatory scrutiny — one bad vendor selection would damage her credibility significantly","blocker":"Has a formal vendor evaluation process that takes 6–8 weeks minimum. Cold emails must earn a first meeting, not skip to a demo request","pain_right_now":"NYDFS is asking for more granular evidence of tested IR capability — her current process produces exercise summaries, not structured evidence packages"}'
) RETURNING id INTO u5;

INSERT INTO refinery_synthetic_users (panel_id, campaign_id, name, age, gender, profession, bio, persona_data)
VALUES (v_panel, v_campaign, 'David Kim', 36, 'male', 'CISO at Finova Payments',
  'Startup CISO moving at 3x the speed of enterprise — his time is his scarcest resource and he filters ruthlessly.',
  '{"company":"Finova Payments — Series A fintech, 85 employees, SF/NYC, processing $500M annually, just received NYDFS license","career_arc":"Software engineer → security engineer → first CISO hire at Finova 18 months ago — building the compliance function from zero","recent_signal":"Tweeted last week about being overwhelmed by NYDFS requirements as a first-time CISO at a startup — asking for peer advice publicly","communication_style":"Responds to brevity, peer recommendations, and practical specifics. Does not have time for 5-paragraph vendor emails","decision_driver":"Needs to achieve NYDFS exam readiness within 12 months with a 2-person security team and no compliance background to draw on","blocker":"Budget is tight and the board wants to see progress metrics — every tool he buys needs to show visible compliance progress quickly","pain_right_now":"Has never run an NYDFS-compliant IR exercise before — doesn''t even know what examiner-ready documentation looks like"}'
) RETURNING id INTO u6;

-- ── ITERATIONS ───────────────────────────────────────────────────────────────

-- Iteration 1: Generic (5.0)
INSERT INTO refinery_iterations (campaign_id, iteration_number, content, aggregate_score, status, improvement_notes)
VALUES (v_campaign, 1,
  'Write a cold email to {{firstName}} at {{company}}. Mention ChaosTrack helps with NYDFS compliance. Professional tone, under 100 words.',
  5.0, 'completed', NULL
) RETURNING id INTO i1;

-- Iteration 2: Adds pain point framing (5.3)
INSERT INTO refinery_iterations (campaign_id, iteration_number, content, aggregate_score, status, improvement_notes)
VALUES (v_campaign, 2,
  'Write a cold email to {{firstName}}, a security leader at a financial institution. Reference their NYDFS 23 NYCRR 500 compliance challenges and the pressure of upcoming examination cycles. Mention ChaosTrack''s incident response simulation platform as a solution. Professional tone, peer framing, under 100 words. Avoid salesy language.',
  5.3, 'completed',
  'Added specific regulatory reference (NYDFS 23 NYCRR 500) and peer framing instruction. Removed generic product description. Score improved slightly — feedback suggests the pain point is landing but the message still lacks a specific hook that makes it feel personally relevant.'
) RETURNING id INTO i2;

-- Iteration 3: Overcorrected — product features + fake stats (4.8) DIP
INSERT INTO refinery_iterations (campaign_id, iteration_number, content, aggregate_score, status, improvement_notes)
VALUES (v_campaign, 3,
  'Write a cold email to {{firstName}}. Lead with ChaosTrack''s specific capabilities: on-demand simulation exercises, automated NYDFS compliance reporting, and documented 40% reduction in audit prep time. Reference upcoming NYDFS Section 500.17 deadlines. Include a social proof reference. End with a clear demo CTA. Under 100 words.',
  4.8, 'completed',
  'Attempted to add specificity through product features and statistics — this backfired. Feedback indicates the 40% efficiency claim felt unverifiable and the feature list read as a vendor brochure. The demo CTA was flagged as too aggressive for a first touch. Reverting to peer framing and removing unsubstantiated metrics.'
) RETURNING id INTO i3;

-- Iteration 4: Recovery — peer tone, no vendor claims (6.0)
INSERT INTO refinery_iterations (campaign_id, iteration_number, content, aggregate_score, status, improvement_notes)
VALUES (v_campaign, 4,
  'Write a cold email to {{firstName}}, CISO or security leader at a mid-market financial institution. Open with a specific, observable challenge related to NYDFS 23 NYCRR 500 examination readiness — not a product pitch. Use peer-to-peer tone throughout, as if from a fellow practitioner. Reference one concrete outcome that is defensible and not over-claimed. Soft CTA inviting a conversation, not a demo. Under 100 words. No statistics, no feature lists.',
  6.0, 'completed',
  'Significant recovery. Removing the feature list and stat dropped the "vendor feel" flagged in iteration 3. The peer-practitioner framing resonated across the panel — multiple personas noted it felt like it came from someone who understood the space. Soft CTA performed better than demo request. Feedback now pointing toward needing more specificity about what makes their situation distinctive.'
) RETURNING id INTO i4;

-- Iteration 5: Overloaded with tokens (5.7) DIP
INSERT INTO refinery_iterations (campaign_id, iteration_number, content, aggregate_score, status, improvement_notes)
VALUES (v_campaign, 5,
  'Write a cold email to {{firstName}}. Acknowledge their {{career_arc}} background and how it shapes their perspective on compliance vs. security. Reference {{company}}''s specific context and regulatory pressure. Mention how peers in similar roles are approaching NYDFS exercise documentation differently. Include a specific question about their current IR process. Avoid vendor language throughout. Under 100 words.',
  5.7, 'completed',
  'Introduced persona tokens (career_arc, company) to drive specificity — but the prompt tried to do too much in under 100 words. Feedback flagged the email as feeling disjointed: the career arc reference felt forced when combined with the company context and the process question. Scaling back to one central angle with one precise close.'
) RETURNING id INTO i5;

-- Iteration 6: Breakthrough — specific regulatory hook (6.8)
INSERT INTO refinery_iterations (campaign_id, iteration_number, content, aggregate_score, status, improvement_notes)
VALUES (v_campaign, 6,
  'Write a cold email to {{firstName}} at {{company}}. Open with a specific, grounded observation about the NYDFS 23 NYCRR 500 Section 500.17 amendment and what it requires firms to demonstrate — not what ChaosTrack does. Do not mention the product by name in the opening sentence. Frame the email as a peer checking in on how firms are preparing, not as a vendor outreach. Reference the accountability that comes with their specific role (board reporting, examiner defensibility, personal liability). End with exactly one precise question about how their current exercise process generates structured evidence for examiners. Under 80 words. Zero buzzwords.',
  6.8, 'completed',
  'Breakthrough iteration. Anchoring the opening to a specific regulatory requirement (Section 500.17) rather than a product gave the message credibility before ChaosTrack was even mentioned. The single closing question about examiner evidence performed strongly across all personas — it exposed a real gap without claiming to fill it. Feedback now focusing on wanting even more specific acknowledgment of their individual background.'
) RETURNING id INTO i6;

-- Iteration 7: Adds career arc signal (7.5)
INSERT INTO refinery_iterations (campaign_id, iteration_number, content, aggregate_score, status, improvement_notes)
VALUES (v_campaign, 7,
  'Write a cold email to {{firstName}}. Open with a brief, specific insight that connects their career background ({{career_arc}}) to why the gap between documented IR plans and tested IR capability is particularly visible from their vantage point — this should feel like you actually looked at their profile, not like a template. Reference the NYDFS Section 500.17 requirement for demonstrated, tested capability and what that means for someone in their specific role at {{company}}. Frame ChaosTrack as what peers in their space are quietly adopting to close this gap — a peer recommendation, not a product pitch. Close with one specific, unanswered question about how their current exercise methodology produces evidence for the next exam cycle. 70 words maximum. Zero jargon. No scheduling links.',
  7.5, 'completed',
  'Adding the career arc hook drove a meaningful score improvement — personas reported the opening felt researched rather than templated. The phrase "quietly adopting" for the ChaosTrack reference worked well as soft social proof without making a specific claim. The 70-word constraint sharpened the message significantly. Final iteration will refine the core message structure and close.'
) RETURNING id INTO i7;

-- Iteration 8: Best — full version (8.1)
INSERT INTO refinery_iterations (campaign_id, iteration_number, content, aggregate_score, status, improvement_notes,
  rag_recommendations)
VALUES (v_campaign, 8,
  E'Write a cold email to {{firstName}} at {{company}}.\n\nOpening hook: reference something specific from {{career_arc}} that makes them uniquely positioned to understand the gap between tabletop exercises and real incident readiness — must feel researched and specific to them, not like a mail-merge template. One sentence maximum.\n\nCore message: NYDFS Section 500.17 requires firms to demonstrate tested incident response capability, not just documented plans. Most financial firms are still running annual tabletops that generate zero structured evidence for examiners. Frame this as an observation, not a pitch.\n\nChaosTrack frame: position as the approach that peers in their segment are quietly adopting to close the evidence gap — a peer recommendation, not a product pitch. Do not list features. Do not cite statistics.\n\nClose: one specific, unconditional question about how their current exercise process produces examiner-ready evidence for their next NYDFS review cycle. Not a meeting request. Not a demo ask.\n\nConstraints: 80 words maximum. Peer-to-peer tone throughout. No vendor claims. No unverifiable statistics. No buzzwords (banned: leverage, streamline, synergy, game-changing, innovative, cutting-edge). No scheduling links in the email body.',
  8.1, 'completed',
  'Final iteration achieved the target. The structured prompt — opening hook / core message / peer frame / precise close — produced consistently high scores across all persona types. Skeptical personas (James, Marcus) responded to the absence of vendor claims. Time-pressed personas (David) responded to the brevity and single question. The career arc hook made each message feel individually written. This prompt is ready for GTM tool integration.',
  '{"recommendations":[{"type":"Customer case study","description":"A story from a fintech or regional bank that used ChaosTrack to pass an NYDFS examination — ideally naming the firm size, exam outcome, and one specific thing the examiner noted positively","why":"Every persona in the panel asked for proof from a comparable firm before they would seriously consider engaging — a named case study would unlock the skeptics"},{"type":"Examiner testimony or DFS guidance quote","description":"A direct quote from NYDFS guidance or an examiner report specifying what constitutes acceptable IR exercise evidence under Section 500.17","why":"Multiple personas (Priya, Nicole) want regulatory grounding — citing the actual DFS language would make the core message unassailable"},{"type":"Peer adoption metrics","description":"Anonymous data on how many firms of a given size/type have adopted simulation-based IR exercises ahead of the 500.17 amendment, without naming clients","why":"The ''quietly adopting'' framing works — but even anonymised prevalence data (''40 of the 200 NYDFS-regulated fintechs we work with'') would convert soft interest to real curiosity"},{"type":"Before/after exercise documentation sample","description":"A redacted example showing what a tabletop exercise report looks like vs. what a ChaosTrack simulation evidence package looks like for an examiner","why":"The evidence gap is the core message — making it visual and tangible would eliminate the ''I''ll take your word for it'' objection that kept iteration 6-7 scores from going higher"}]}'
) RETURNING id INTO i8;

-- ── RESPONSES: Iteration 1 (all scores ~5, generic reactions) ─────────────────

INSERT INTO refinery_responses (iteration_id, campaign_id, synthetic_user_id, score, feedback, personalized_content) VALUES
(i1, v_campaign, u1, 5, 'The email acknowledges ChaosTrack''s relevance to NYDFS compliance, which is in my wheelhouse. But it feels generic — there''s nothing here that suggests the sender knows anything specific about my situation or what an NYDFS exam actually demands. I''d file this under "maybe later" and never come back to it.',
 'Hi Sarah, wanted to reach out because I noticed you''re navigating NYDFS compliance at Meridian Financial. ChaosTrack helps financial firms like yours strengthen incident response capabilities to meet regulatory requirements. Would love to connect and share how we''re helping teams prepare. Best, Carter'),
(i1, v_campaign, u2, 5, 'It mentions NYDFS, which shows some awareness, but the framing is pure vendor speak. "Helps with NYDFS compliance" could describe literally fifty different tools. Nothing here earns a reply.',
 'Hi Marcus, reaching out as Heritage Community Bank navigates the evolving NYDFS compliance landscape. ChaosTrack supports financial institutions in building robust incident response capabilities. Happy to connect and discuss how we can help. Regards, Carter'),
(i1, v_campaign, u3, 5, 'Structurally fine. Completely uninformative. The phrase "helps with NYDFS compliance" is not a value proposition — it''s a category description. I receive four emails like this a week.',
 'Hi Priya, with Apex Insurance Group''s dual regulatory obligations, I thought ChaosTrack''s compliance-focused incident response platform might be relevant. We help risk teams build defensible IR programs. Would value connecting. Best, Carter'),
(i1, v_campaign, u4, 4, 'Generic vendor email. The only specific thing in here is the acronym NYDFS, which every compliance vendor drops. Delete.',
 'Hi James, as Director of Cybersecurity at Sterling Savings Bank, you''re no doubt focused on maintaining NYDFS compliance. ChaosTrack helps security teams build examination-ready incident response programs. Let me know if you''d like to connect. Carter'),
(i1, v_campaign, u5, 5, 'Nothing here is wrong, per se. But nothing is right either. It''s the email equivalent of a firm handshake with no eye contact. Compliance is mentioned; value is not established.',
 'Hi Nicole, given Vertex Capital''s NYDFS licensing requirements, I wanted to introduce ChaosTrack — we help compliance technology teams build structured IR exercise programs. Would be glad to connect. Best, Carter'),
(i1, v_campaign, u6, 6, 'I''m new enough to this role that I''m actually googling things mentioned in cold emails. NYDFS is definitely on my radar. But I wish this said something more specific about what the actual problem is — I would have engaged if it spoke to where I actually am.',
 'Hi David, as Finova Payments builds out its NYDFS compliance posture, ChaosTrack can help establish a solid incident response exercise framework. Happy to share how other Series A fintechs are approaching this. Carter');

-- ── RESPONSES: Iteration 2 (5.3, slightly better) ────────────────────────────

INSERT INTO refinery_responses (iteration_id, campaign_id, synthetic_user_id, score, feedback, personalized_content) VALUES
(i2, v_campaign, u1, 5, 'Slightly better — at least it mentions examination cycles, which is the actual business driver. But it still reads like a template that could have been sent to 500 people. The word "challenges" is doing a lot of vague heavy lifting here.',
 'Hi Sarah, with NYDFS examination cycles becoming more demanding for fintechs, I''m reaching out to security leaders navigating 23 NYCRR 500 requirements. ChaosTrack''s incident response simulation platform helps firms like Meridian build examination-ready capabilities. Worth a quick conversation? Carter'),
(i2, v_campaign, u2, 5, 'At least the regulatory reference is right. But "pressure of upcoming examination cycles" is generic — I have a specific exam coming up in 9 months and if you knew anything about my situation you might have found a way to reference that.',
 'Hi Marcus, NYDFS examination cycles put real pressure on security teams at community banks. ChaosTrack helps institutions like Heritage build structured incident response programs that hold up under examiner scrutiny. Happy to connect with a fellow practitioner. Carter'),
(i2, v_campaign, u3, 6, 'The regulatory framing is more credible than most cold emails I receive. Citing 23 NYCRR 500 specifically rather than just "compliance" shows minimal research. Still a template, but a more informed one.',
 'Hi Priya, the complexity of NYDFS 23 NYCRR 500 requirements is something I know weighs heavily on risk leaders at dual-regulated firms like Apex. ChaosTrack builds IR exercise programs designed to produce the structured evidence that examiners increasingly require. Would value your perspective. Carter'),
(i2, v_campaign, u4, 5, 'Marginally better. Still a cold email from a vendor. The "peer framing" instruction doesn''t really come through — it still reads like marketing copy.',
 'Hi James, having spent years working through NYDFS examination cycles at community banks, you understand the gap between having an IR plan and demonstrating it works. ChaosTrack helps close that gap with structured simulation exercises. Interested in connecting? Carter'),
(i2, v_campaign, u5, 5, 'More specific language but the same fundamental issue: I don''t know why you''re emailing me specifically. What do you know about Vertex Capital''s situation that made this email relevant to us vs. the other 200 NYDFS-licensed firms you''re probably emailing?',
 'Hi Nicole, NYDFS 23 NYCRR 500 compliance requirements are creating new demands for compliance technology teams at licensed asset managers. ChaosTrack provides the structured IR exercise infrastructure that makes examination defense straightforward. Happy to connect. Carter'),
(i2, v_campaign, u6, 6, 'This one actually named the regulation I''ve been trying to understand. I appreciated that. Still feels like a form letter, but at least it''s pointing at the right problem. I might have replied if there was one more specific thing.',
 'Hi David, for a fintech that just received its NYDFS license, 23 NYCRR 500 incident response requirements can feel overwhelming. ChaosTrack helps first-time compliance teams build examination-ready IR programs without starting from scratch. Let''s connect. Carter');

-- ── RESPONSES: Iteration 3 (4.8, dip — too salesy) ───────────────────────────

INSERT INTO refinery_responses (iteration_id, campaign_id, synthetic_user_id, score, feedback, personalized_content) VALUES
(i3, v_campaign, u1, 5, 'The 40% efficiency claim is the kind of statistic that makes me trust an email less, not more. Where does that number come from? This reads like a sales deck, not a peer conversation.',
 'Hi Sarah, ChaosTrack''s on-demand simulation platform delivers a documented 40% reduction in NYDFS audit prep time through automated compliance reporting and structured exercise programs. With Section 500.17 deadlines approaching, Meridian Financial can''t afford to rely on manual tabletops. Schedule a demo to see how. Carter'),
(i3, v_campaign, u2, 4, 'I hung up on a vendor last month who opened with a percentage claim like this. The 40% number is unsubstantiated and the feature list reads like a brochure. This is the kind of email that makes me not want to return calls from that area code.',
 'Hi Marcus, Heritage Community Bank''s NYDFS examination prep can be transformed with ChaosTrack: on-demand simulations, automated compliance reporting, and a proven 40% reduction in audit prep time. With social proof from 50+ regional banks, we''re the trusted choice for IR compliance. Book a demo. Carter'),
(i3, v_campaign, u3, 5, 'The specificity is an improvement in theory, but every number in here is unverifiable and the feature list is generic. "Automated NYDFS compliance reporting" — I would need to know exactly what that means before I''d respond to an email about it.',
 'Hi Priya, ChaosTrack delivers measurable compliance outcomes: automated NYDFS reporting, on-demand simulation exercises, and documented efficiency gains of up to 40%. For a firm with Apex Insurance Group''s dual regulatory obligations, this translates directly to examination defensibility. Let''s schedule time. Carter'),
(i3, v_campaign, u4, 4, 'Demo CTA in a cold email. Automated reporting claim. 40% stat with no source. This is a vendor email that doesn''t know its audience.',
 'Hi James, Sterling Savings Bank''s next NYDFS exam can be your best one yet. ChaosTrack delivers on-demand IR simulations, automated compliance documentation, and a 40% reduction in audit prep time. 50+ regional banks trust us. Ready to see it in action? Carter'),
(i3, v_campaign, u5, 5, 'The feature list is more informative than the previous version, but the demo CTA and the uncited statistics undercut any credibility the specifics might have built. I flagged this vendor for follow-up with a question mark.',
 'Hi Nicole, ChaosTrack''s compliance platform is purpose-built for NYDFS-licensed firms: on-demand simulation exercises, automated evidence packages, and a documented 40% efficiency gain in exam preparation. Given Vertex Capital''s compliance tech requirements, I''d love to walk you through the platform. Carter'),
(i3, v_campaign, u6, 5, 'I actually clicked the link to check the 40% claim. Couldn''t find it. That''s a trust-killer when you''re trying to build credibility with someone who''s new to the space and doing their due diligence on everything.',
 'Hi David, as a new CISO building Finova''s compliance program from scratch, ChaosTrack gives you a head start: automated NYDFS reporting, on-demand IR simulations, and 40% faster audit prep — exactly what a lean team needs. Let''s schedule 20 minutes. Carter');

-- ── RESPONSES: Iteration 4 (6.0, recovery) ───────────────────────────────────

INSERT INTO refinery_responses (iteration_id, campaign_id, synthetic_user_id, score, feedback, personalized_content) VALUES
(i4, v_campaign, u1, 6, 'This one caught my attention. The opening observation about the gap between documented plans and demonstrated capability is accurate and not something a generic compliance vendor would know to say. The soft CTA is appropriate for a first touch. I still don''t know why you''re emailing me specifically, but I''d probably look at your profile.',
 'Hi Sarah, most firms under NYDFS 23 NYCRR 500 have comprehensive IR plans — but examiners are increasingly asking for evidence that those plans have been tested under realistic conditions. That gap is harder to close than it looks. ChaosTrack is what some peers in your space are using to bridge it. Worth a conversation? Carter'),
(i4, v_campaign, u2, 6, 'Better. The observation about examiners asking for tested evidence is accurate — I know because I''ve been flagged on it. The peer framing works. No statistics, no feature list. This is closer to how a colleague would write.',
 'Hi Marcus, the shift in NYDFS examiner expectations — from "do you have an IR plan" to "show us it works" — has caught a lot of community banks off guard. Most are still running the same annual tabletop they''ve used for years. Some of your peers have started doing something different. Happy to share what that looks like. Carter'),
(i4, v_campaign, u3, 6, 'Credible framing. The examiner expectation shift is real and this email states it clearly without over-claiming. I appreciate the absence of statistics. The CTA is appropriately modest. I''d be willing to respond with a question.',
 'Hi Priya, NYDFS examiners under Section 500.17 are asking firms to demonstrate tested incident response capability — not just show them a documented plan. For a CRO managing dual regulatory obligations, the difference between "we have a plan" and "here''s our exercise evidence" is significant. Worth exploring how peers are handling this. Carter'),
(i4, v_campaign, u4, 5, 'This is better than the last one. No fake stats, no demo pressure. But the "peer framing" still feels thin — who are these peers? What did they do specifically? I need one more specific thing before I''d reply.',
 'Hi James, one thing I''ve noticed across NYDFS-regulated community banks: examiners are raising the bar on what counts as adequate IR exercise documentation. Annual tabletops with narrative summaries aren''t cutting it anymore. Some banks in your space have quietly changed their approach. Happy to share what that looks like if relevant. Carter'),
(i4, v_campaign, u5, 6, 'The regulatory observation is accurate and stated with appropriate precision. The peer recommendation framing is credible without making specific claims. I would respond to ask what "some peers in your space" means specifically — which is exactly the right level of curiosity to generate in a first email.',
 'Hi Nicole, the NYDFS Section 500.17 examination framework is shifting toward evidence of tested capability — not just policy documentation. For compliance technology teams building defensible IR programs, this changes what "good" looks like. Some firms in your segment are ahead of this. Happy to share how if it''s relevant to where Vertex is. Carter'),
(i4, v_campaign, u6, 7, 'This is the first cold email I''ve received that actually explained the problem I didn''t know I had. The gap between having an IR plan and proving it''s been tested — that''s exactly where I am. I would have replied to this one.',
 'Hi David, a common challenge for fintechs that have just received their NYDFS license: the 23 NYCRR 500 examination will ask you to demonstrate tested incident response capability, not just show them a documented plan. Most first-time CISOs don''t find this out until the exam. Worth a quick call to share what peers in your position have done. Carter');

-- ── RESPONSES: Iteration 5 (5.7, slight dip) ─────────────────────────────────

INSERT INTO refinery_responses (iteration_id, campaign_id, synthetic_user_id, score, feedback, personalized_content) VALUES
(i5, v_campaign, u1, 6, 'The career arc reference was interesting but landed awkwardly — it felt like a merge field that was filled in by an algorithm, not by someone who actually read my profile. The multiple angles (career background, company context, peer experiences, process question) are fighting each other for attention in under 100 words.',
 'Hi Sarah, your background moving from compliance law into security leadership gives you a distinctive lens on what NYDFS examiners actually look for vs. what most CISOs think they want. With Meridian''s audit notice pending, how are you currently thinking about your exercise documentation approach for the next review cycle? Carter'),
(i5, v_campaign, u2, 5, 'The career arc angle felt forced. I''ve been in banking IT for 20 years — that''s not a distinctive insight, that''s just a fact. The email tried to do too much and ended up not saying anything clearly.',
 'Hi Marcus, twenty years in banking security gives you a perspective on NYDFS examiner expectations that most vendors don''t understand. Given Heritage''s exam timing, how are you currently generating structured evidence from your IR exercises to support the documentation review? Carter'),
(i5, v_campaign, u3, 6, 'I can see what this is trying to do, and the instinct is right — acknowledging background context builds relevance. But the execution feels like template personalization. The question at the end is good; the setup is cluttered.',
 'Hi Priya, your actuarial background gives you a quantitative framework for operational risk that most CROs don''t have — and that lens is particularly useful when NYDFS asks for evidence of tested IR capability rather than documented plans. How is Apex currently structuring exercise evidence for examiners? Carter'),
(i5, v_campaign, u4, 5, 'I don''t like emails that try to compliment my background as an opening gambit. It feels manipulative. Just tell me the problem and why I should care.',
 'Hi James, your path from federal government security into community banking gives you a clear-eyed view of what rigorous IR testing actually requires. At Sterling''s scale, how are you currently ensuring your exercise documentation meets the bar that NYDFS examiners are setting for structured evidence? Carter'),
(i5, v_campaign, u5, 6, 'The career arc acknowledgment is relevant — my legal background genuinely does shape how I think about regulatory evidence. But combining that with the company context and the process question in one short email created too much to parse. The question alone would have been more effective.',
 'Hi Nicole, your legal background before moving in-house gives you a precise understanding of what "defensible documentation" means in a regulatory context — more precise than most compliance technology buyers. How is Vertex currently structuring the evidence output from IR exercises for NYDFS examination purposes? Carter'),
(i5, v_campaign, u6, 6, 'This one tried to personalise to my startup context and the timing question was sharp. But the career arc reference felt generic — "building from scratch" is just true of every startup CISO, it''s not specific to me.',
 'Hi David, building a compliance function from zero means every choice about tooling sets a precedent. For a first NYDFS exam cycle, how are you currently thinking about what your IR exercise documentation needs to look like to give examiners what they need? Carter');

-- ── RESPONSES: Iteration 6 (6.8, breakthrough) ───────────────────────────────

INSERT INTO refinery_responses (iteration_id, campaign_id, synthetic_user_id, score, feedback, personalized_content) VALUES
(i6, v_campaign, u1, 7, 'The Section 500.17 anchor is exactly right — that''s the amendment that''s keeping me up at night. The email doesn''t pitch anything in the opening, which immediately made me read further. The question about examiner-ready documentation exposed a gap I don''t have an answer to. I''d reply to this one.',
 'Hi Sarah, the Section 500.17 amendment shifts the NYDFS examination standard from "do you have an IR plan" to "demonstrate you''ve tested it under realistic conditions and can produce structured evidence." Most firms in your segment are still operating under the old assumption. How is Meridian''s current exercise process generating the documentation that examiners will ask for? Carter'),
(i6, v_campaign, u2, 7, 'First email in this sequence that felt like it came from someone who understands what NYDFS examiners actually look for. The 500.17 amendment framing is accurate and the question is the right one. I don''t have a clean answer to it, which means I''d probably reply.',
 'Hi Marcus, Section 500.17 of the NYDFS amendment framework is raising the bar on what financial institutions need to demonstrate — specifically, tested incident response capability with structured documentation, not just annual tabletop summaries. Heritage has navigated four NYDFS exams successfully. How are you approaching the documentation standard for this cycle? Carter'),
(i6, v_campaign, u3, 7, 'Precise regulatory framing, no over-claiming, single well-targeted question. This is how you email a CRO. The accountability reference (board reporting, examiner defensibility) shows understanding of my specific role''s pressure points. I''d respond.',
 'Hi Priya, the NYDFS Section 500.17 amendment puts a specific burden on CROs: demonstrating to examiners — and to your board — that incident response capability has been tested, not just documented. For a firm with dual regulatory oversight, that evidence standard applies twice. How is Apex currently structuring exercise output to meet that bar? Carter'),
(i6, v_campaign, u4, 6, 'The regulatory observation is accurate. The question is a good one. I still don''t know who you are or what you''re selling, but the lack of a pitch is notable. I might reply with a question of my own before committing to a conversation.',
 'Hi James, Section 500.17 is changing what NYDFS examiners accept as evidence of IR capability. Sterling has consistently passed examinations — but the standard for "demonstrated capability" is shifting away from tabletop summaries toward structured exercise documentation. How is your current process generating that evidence? Carter'),
(i6, v_campaign, u5, 7, 'The regulatory specificity is exactly right. Section 500.17 is the correct citation and the framing of "demonstrate tested capability" versus "documented plans" is the precise distinction that matters for our examination process. The question is targeted enough that I''d want to discuss how we''re approaching it. Strong email.',
 'Hi Nicole, Section 500.17 creates a specific documentation obligation: firms need to demonstrate tested incident response capability to examiners, not just show them a plan. For compliance technology leaders building NYDFS-defensible programs at licensed asset managers, the gap between those two standards is significant. How is Vertex currently generating structured evidence from IR exercises? Carter'),
(i6, v_campaign, u6, 7, 'This is the most useful cold email I''ve received since becoming a CISO. It told me something I didn''t fully understand about the examination standard I''m preparing for, and asked the question I''m actually trying to answer. I replied.',
 'Hi David, the NYDFS Section 500.17 amendment means your first examination won''t just ask whether Finova has an IR plan — it will ask you to demonstrate the plan has been tested and to produce structured evidence of that testing. Most first-time NYDFS CISOs don''t find this out until they''re in the room. How are you currently thinking about your exercise documentation approach? Carter');

-- ── RESPONSES: Iteration 7 (7.5) ─────────────────────────────────────────────

INSERT INTO refinery_responses (iteration_id, campaign_id, synthetic_user_id, score, feedback, personalized_content) VALUES
(i7, v_campaign, u1, 7, 'The opening about my legal background and how it shapes what I look for from examiners was accurate and felt observed rather than guessed. The rest of the email built on that effectively. The question is precise and maps to a real gap in how I''m currently preparing. I responded.',
 'Hi Sarah, a compliance attorney''s understanding of what "defensible" means in a regulatory context is a real asset when Section 500.17 raises the examination bar to demonstrated, tested IR capability. Most CISOs are still thinking about this as a documentation problem. With Meridian''s audit notice pending, how is your current exercise methodology generating the structured evidence package examiners will ask for? Carter'),
(i7, v_campaign, u2, 8, 'The career arc insight was genuinely accurate — twenty years in banking operations does give me a different read on examiner expectations than someone who came up through enterprise tech security. The rest of the email followed that observation logically and the question was specific without being presumptuous. Best cold email I''ve received this quarter.',
 'Hi Marcus, twenty years building security programs inside banking operations gives you a practical understanding of examiner expectations that most CISOs trained in enterprise tech don''t have — you know what "tested capability" looks like versus what gets papered over. Section 500.17 is raising that bar formally. With Heritage''s exam cycle approaching, how are you approaching exercise documentation to meet the new standard? Carter'),
(i7, v_campaign, u3, 8, 'The actuarial framing was sharp — you''re right that my background gives me a quantitative lens on what evidence of tested capability means. The email connected that insight to the regulatory requirement cleanly and without overreach. I''d meet with this person.',
 'Hi Priya, an actuarial background produces a specific kind of precision about what constitutes evidence versus assumption — and the NYDFS Section 500.17 standard requires exactly that precision when it comes to incident response testing. Most IR exercise programs produce narrative summaries, not structured evidence. Given Apex''s dual regulatory environment, how are you approaching the documentation standard for tested IR capability? Carter'),
(i7, v_campaign, u4, 7, 'The observation about federal government security background and what rigorous IR testing actually requires was accurate. It didn''t feel like flattery — it felt like a legitimate observation about why I have higher standards than most people in my role. The question was targeted. I''d at least respond with a clarifying question.',
 'Hi James, a federal security background builds high standards for what rigorous incident response testing looks like — standards that most community bank exercises don''t actually meet. Section 500.17 is moving the NYDFS examination bar toward that higher standard formally. At Sterling''s exam history, you know what examiners actually look for. How is your current exercise process generating the structured evidence they''ll ask for next cycle? Carter'),
(i7, v_campaign, u5, 7, 'The legal background observation was accurate and established credibility immediately. The email understood what ''defensible documentation'' means from a legal standpoint and connected it to the regulatory requirement without over-explaining. The question was appropriately specific. I responded.',
 'Hi Nicole, a legal background gives you a precise definition of "defensible documentation" that most compliance technology buyers don''t have — and Section 500.17 is asking firms to meet that standard for incident response evidence. The gap between a tabletop summary and an examiner-ready evidence package is significant. How is Vertex''s current IR exercise process generating documentation that would hold up under that scrutiny? Carter'),
(i7, v_campaign, u6, 7, 'The reference to building from zero and the specific knowledge gap it creates (not knowing what examiner-ready looks like) was accurate and practical. The email felt like it came from someone who has worked with first-time NYDFS CISOs before, not someone who found my LinkedIn five minutes ago.',
 'Hi David, building a compliance function from zero means you''re making decisions about IR exercise methodology without a baseline for what NYDFS examiners actually accept as structured evidence. Section 500.17 raises that bar further — demonstrated tested capability, not documented plans. How are you currently thinking about what your first examination evidence package needs to include? Carter');

-- ── RESPONSES: Iteration 8 (8.1, best) ───────────────────────────────────────

INSERT INTO refinery_responses (iteration_id, campaign_id, synthetic_user_id, score, feedback, personalized_content) VALUES
(i8, v_campaign, u1, 8, 'The opening was the most precise acknowledgment of my specific background I''ve received in a cold email — the compliance attorney to CISO transition genuinely does create a different lens on what examiner-ready means. The core message was accurate and the question was the right one. I replied within the hour.',
 'Hi Sarah, moving from compliance law to security leadership gives you a precise understanding of what "examiner-ready" actually means — the standard that Section 500.17 is now formally applying to incident response programs. Most firms in your segment are still producing tabletop summaries that generate zero structured evidence for examination review. Peers in your space are changing their approach to close that gap before it becomes a finding. How does Meridian''s current exercise process produce the documentation package your next NYDFS review will require? Carter'),
(i8, v_campaign, u2, 8, 'This is the email I''d want someone to send me. It understood my background, got the regulatory situation exactly right, didn''t pitch anything, and asked the one question I don''t have a clean answer to. I forwarded it to my team and we had a call with Carter Hayes the following week.',
 'Hi Marcus, twenty years of community banking security means you''ve watched the NYDFS examination standard evolve from paper policies to operational verification — and Section 500.17 is the next step in that direction, requiring demonstrable tested capability with structured exercise documentation. Heritage has a strong examination track record. How are you approaching the documentation standard for this cycle as examiners raise what counts as adequate evidence? Carter'),
(i8, v_campaign, u3, 9, 'Exceptional cold email. The actuarial framing for evidence standards was the most precise and accurate acknowledgment of my professional lens I''ve encountered in vendor outreach. The regulatory framing was correct without being condescending. The question was calibrated to my specific evaluation framework. This is the model for how to email a CRO.',
 'Hi Priya, an actuarial framework for evidence analysis gives you a precise understanding of the gap between narrative exercise summaries and structured capability evidence — the exact gap that Section 500.17 is asking firms to close. Most incident response programs were designed to pass the old examination standard. Peers in the asset management space are quietly updating their approach ahead of the amendment. How is Apex''s current IR exercise methodology generating the quantifiable evidence your board and examiners will ask for? Carter'),
(i8, v_campaign, u4, 8, 'I don''t reply to cold emails. I replied to this one. The federal background reference was accurate, the regulatory observation was correct, and the question exposed a real operational gap. No pitch, no demo request, no fake statistics. Just a well-observed question that I wanted to discuss.',
 'Hi James, a federal security background builds standards for incident response rigor that community bank exercise programs rarely meet — and Section 500.17 is moving NYDFS examiner expectations toward that standard formally. Sterling has consistently passed examinations, but the definition of "adequate documentation" is shifting. Peers in the community banking space are updating their exercise methodology ahead of the change. How is your current process generating structured evidence for the next examination cycle? Carter'),
(i8, v_campaign, u5, 8, 'The best cold email in this campaign. The legal background framing was accurate and precise, the regulatory context was exactly right, and the question was targeted to the specific gap in my current program. I scheduled a call. This is how you sell to compliance professionals.',
 'Hi Nicole, a legal background before moving in-house gives you a precise definition of defensible documentation — and Section 500.17 is applying that standard to incident response evidence for the first time. The gap between a tabletop exercise summary and an examiner-ready evidence package is significant, and most compliance technology programs weren''t designed to close it. Firms in your segment are adjusting their approach. How is Vertex''s current IR exercise process generating the structured documentation that will hold up under Section 500.17 scrutiny? Carter'),
(i8, v_campaign, u6, 8, 'First cold email I''ve replied to in this role. The opening acknowledged my actual situation — building from zero, which means I don''t have the institutional knowledge of what "good" looks like for NYDFS examination evidence. The question was practical and exactly where I''m stuck. Carter had a 30-minute call scheduled the same day.',
 'Hi David, building a compliance function from zero means making decisions about incident response methodology without a reference point for what NYDFS examiners actually accept as structured evidence of tested capability — and Section 500.17 raises that bar further. Most first-time NYDFS CISOs encounter this gap during the examination itself. Peers in your segment who''ve navigated this are changing their approach before that moment. What does your current plan for exercise documentation look like ahead of your first review cycle? Carter');

RAISE NOTICE 'Demo campaign created successfully. Campaign ID: %', v_campaign;
RAISE NOTICE 'Navigate to: /refinery/%', v_campaign;

END $$;
