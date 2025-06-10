"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { CheckCircle, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
gsap.registerPlugin(ScrollTrigger)

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

  // GSAP Animations
  useEffect(() => {
    // Animate headline parts
    const headlineParts = document.querySelectorAll('.hero-title-part');
    gsap.from(headlineParts, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.3,
      ease: "power3.out"
    });

    // Animate subtitle
    gsap.from('.hero-subtitle', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      delay: 1.2,
      ease: "power2.out"
    });

    // Animate CTA buttons
    gsap.from('.hero-buttons .button', {
      scale: 0.9,
      opacity: 0,
      duration: 0.6,
      delay: 1.5,
      stagger: 0.2,
      ease: "back.out(1.7)"
    });
  }, []);

  useEffect(() => {
    // Animate feature icons
    const featureIcons = document.querySelectorAll('.feature-icon');
    featureIcons.forEach((icon) => {
      gsap.from(icon, {
        scrollTrigger: {
          trigger: icon,
          start: "top 80%",
          toggleActions: "play none none none"
        },
        scale: 0,
        opacity: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.5)"
      });
    });

    // Animate feature text
    const featureTexts = document.querySelectorAll('.feature-content');
    featureTexts.forEach((text) => {
      gsap.from(text, {
        scrollTrigger: {
          trigger: text,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        y: 20,
        opacity: 0,
        duration: 0.5,
        delay: 0.3,
        ease: "power2.out"
      });
    });
  }, []);

  useEffect(() => {
    // Animate quote icons
    gsap.from('.quote-icon', {
      scrollTrigger: {
        trigger: '.testimonials-section',
        start: "top 70%",
        toggleActions: "play none none none"
      },
      scale: 0,
      opacity: 0,
      duration: 0.6,
      stagger: 0.2,
      ease: "back.out(1.7)"
    });

    // Animate testimonial cards
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach((card, index) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
        delay: 0.1 * index,
        ease: "power3.out"
      });
    });

    // Add hover effects to testimonial cards
    testimonialCards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          y: -10,
          boxShadow: "0 22px 45px rgba(0, 0, 0, 0.1)",
          duration: 0.3,
          ease: "power2.out"
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0,
          boxShadow: "0 15px 30px rgba(0, 0, 0, 0.05)",
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });
  }, []);

  // 4. Comparison Table Animation
  useEffect(() => {
    // Animate section title
    gsap.from('.comparison-title', {
      scrollTrigger: {
        trigger: '.comparison-section',
        start: "top 75%",
        toggleActions: "play none none none"
      },
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out"
    });

    // Animate table rows
    const tableRows = document.querySelectorAll('.comparison-table tr');
    tableRows.forEach((row, index) => {
      if (index === 0) return;
      gsap.from(row, {
        scrollTrigger: {
          trigger: row,
          start: "top 90%",
          toggleActions: "play none none none"
        },
        opacity: 0,
        y: 15,
        duration: 0.4,
        delay: 0.1 * index,
        ease: "power1.out"
      });
    });

    // Animate checkmarks and X marks
    gsap.from('.comparison-table .checkmark', {
      scrollTrigger: {
        trigger: '.comparison-table',
        start: "top 80%",
        toggleActions: "play none none none"
      },
      scale: 0,
      opacity: 0,
      duration: 0.4,
      stagger: 0.1,
      ease: "back.out(1.7)"
    });
    gsap.from('.comparison-table .x-mark', {
      scrollTrigger: {
        trigger: '.comparison-table',
        start: "top 80%",
        toggleActions: "play none none none"
      },
      scale: 0,
      opacity: 0,
      duration: 0.4,
      stagger: 0.1,
      delay: 0.3,
      ease: "back.out(1.7)"
    });
  }, []);

  // 5. FAQ Section Animation
  useEffect(() => {
    gsap.from('.faq-title', {
      scrollTrigger: {
        trigger: '.faq-section',
        start: "top 75%",
        toggleActions: "play none none none"
      },
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out"
    });
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item, index) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: "top 90%",
          toggleActions: "play none none none"
        },
        y: 20,
        opacity: 0,
        duration: 0.5,
        delay: 0.1 * index,
        ease: "power2.out"
      });
    });
    // Accordion click animations
    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-question');
      const arrow = item.querySelector('.faq-arrow');
      const answer = item.querySelector('.faq-answer');
      if (question) {
        question.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          if (arrow) {
            gsap.to(arrow, {
              rotation: isOpen ? 0 : 180,
              duration: 0.3,
              ease: "power2.inOut"
            });
          }
          if (answer) {
            if (isOpen) {
              gsap.to(answer, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                ease: "power2.inOut",
                onComplete: () => {
                  item.classList.remove('open');
                }
              });
            } else {
              item.classList.add('open');
              gsap.fromTo(answer, 
                { height: 0, opacity: 0 },
                { height: "auto", opacity: 1, duration: 0.5, ease: "power2.inOut" }
              );
            }
          }
        });
      }
    });
  }, []);

  // 6. Demo Video Section Animation
  useEffect(() => {
    gsap.from('.demo-section-title', {
      scrollTrigger: {
        trigger: '.demo-section',
        start: "top 75%",
        toggleActions: "play none none none"
      },
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out"
    });
    gsap.from('.video-container', {
      scrollTrigger: {
        trigger: '.video-container',
        start: "top 80%",
        toggleActions: "play none none none"
      },
      scale: 0.95,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });
    gsap.from('.play-button', {
      scrollTrigger: {
        trigger: '.video-container',
        start: "top 80%",
        toggleActions: "play none none none"
      },
      scale: 0,
      opacity: 0,
      duration: 0.6,
      delay: 0.3,
      ease: "back.out(1.7)"
    });
    gsap.to('.play-button', {
      scale: 1.1,
      repeat: -1,
      yoyo: true,
      duration: 1.2,
      ease: "power1.inOut"
    });
    gsap.from('.try-it-button', {
      scrollTrigger: {
        trigger: '.try-it-button',
        start: "top 90%",
        toggleActions: "play none none none"
      },
      y: 20,
      opacity: 0,
      duration: 0.6,
      delay: 0.5,
      ease: "power3.out"
    });
  }, []);

  // 7. Navigation and Logo Animation
  useEffect(() => {
    gsap.from('.logo', {
      x: -20,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out"
    });
    gsap.from('.nav-items .nav-item', {
      y: -20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out"
    });
    gsap.from('.auth-buttons .button', {
      x: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      delay: 0.3,
      ease: "power2.out"
    });
    // Button hover effects
    const buttons = document.querySelectorAll('.button');
    buttons.forEach((button) => {
      button.addEventListener('mouseenter', () => {
        gsap.to(button, {
          scale: 1.05,
          duration: 0.2,
          ease: "power1.out"
        });
      });
      button.addEventListener('mouseleave', () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.2,
          ease: "power1.out"
        });
      });
    });
  }, []);

  // 8. Floating Elements Animation
  useEffect(() => {
    const floatingElements = document.querySelectorAll('.floating-element');
    floatingElements.forEach((element, index) => {
      gsap.to(element, {
        y: "random(-8, 8)",
        x: "random(-5, 5)",
        rotation: "random(-3, 3)",
        duration: "random(3, 5)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.2
      });
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                {/* <span className="hero-title-part block">AI-Powered Focus Groups.</span>
                <span className="hero-title-part accent block text-primary">Real Insights.</span>
                <span className="hero-title-part block">No Waiting.</span> */}
                 <span className="hero-title-part block">AI-Powered Focus Groups.</span>
                {/* <span className="hero-title-part block ">Directional Insights.</span> */}
                <span className="hero-title-part accent block text-primary">No Waiting.</span>
              </h1>
              <p className="mb-10 text-xl text-gray-600 hero-subtitle">
              Test discussion guides, sharpen hypotheses, and get directional insights before your real research sessions
                {/* Run simulated qualitative research with intelligent AI personas and moderators. */}
                {/* "Test discussion guides, validate hypotheses, and get directional insights before your real qualitative and quantitative research" */}

{/* 
                Headline: "AI Research Simulation Platform for Qual & Quant Studies"
                Subheadline: "Simulate focus groups and surveys, test research designs, and validate findings before investing in real fieldwork"
                Option 3: Professional Research Focus
                Headline: "Professional AI Research Simulation Platform"
                Subheadline: "From qualitative insights to quantitative validation - test your research approach before going to field" */}



              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row hero-buttons">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto button">
                    Try for Free
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto button">
                    Watch Demo
                  </Button>
                </Link>
              </div>

              {/*add later Trust indicator: "Trusted by 500+ Market Researchers" */}


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

        {/* Problem Statement Section */}
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="mx-auto max-w-6xl">
              {/* Main Problem Headline */}
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:text-4xl">
                  The Challenge: Expensive research failures, untested discussion guides, and missed insights
                </h2>
                <p className="text-lg text-gray-600 italic max-w-4xl mx-auto">
                  Sound familiar? You're not alone. 73% of researchers report that time constraints force them to make methodology compromises that impact data quality.
                </p>
              </div>

              {/* Three Pain Points Grid */}
              <div className="grid gap-8 md:grid-cols-3 mb-12">
                {/* Market Researchers */}
                <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Wasted Research Budgets</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Every failed study costs thousands in recruitment, incentives, and time. One poorly designed discussion guide can derail an entire project, leaving clients frustrated and budgets blown.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li>• Untested questions that don't generate insights</li>
                    <li>• Recruitment challenges for specific demographics</li>
                    <li>• Last-minute guide changes that compromise data quality</li>
                    <li>• Pressure to deliver actionable insights from flawed methodology</li>
                  </ul>
                </div>

                {/* UX Researchers */}
                <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Delayed Product Decisions</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Waiting weeks for user research while product deadlines loom. By the time insights arrive, the market opportunity may have passed.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li>• Sprint cycles that can't wait for traditional research timelines</li>
                    <li>• Limited research budgets for early-stage concept testing</li>
                    <li>• Difficulty recruiting specific user segments quickly</li>
                    <li>• Stakeholder pressure for immediate user feedback</li>
                  </ul>
                </div>

                {/* Insight Managers */}
                <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Missed Strategic Opportunities</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Critical business decisions made without proper research validation. Competitors move faster while you're still planning your methodology.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li>• Board meetings demanding insights you don't have yet</li>
                    <li>• Campaign launches based on assumptions, not data</li>
                    <li>• Seasonal opportunities missed due to research lead times</li>
                    <li>• Team credibility questioned when insights come too late</li>
                  </ul>
                </div>
              </div>

              {/* Closing CTA */}
              <div className="text-center">
                <p className="text-xl text-gray-700 font-medium">
                  What if you could test your approach, refine your questions, and validate your hypotheses before investing in expensive fieldwork?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Overview Section */}
        <section className="py-12 bg-white">
          <div className="container">
            <div className="mx-auto max-w-6xl">
              {/* Section Header */}
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-3 sm:text-4xl">
                  How InsightSim Enhances Your Research Process
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Don't replace your research—enhance it. Test, refine, and validate your approach before investing in expensive fieldwork.
                </p>
              </div>

              {/* Process Flow */}
              <div className="grid gap-6 md:grid-cols-8 mb-10">
                {/* Step 1: Plan */}
                <div className="text-center md:col-span-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Plan</h3>
                  <p className="text-gray-600 text-sm">
                    Create your discussion guide, define objectives, and set up AI personas that match your target audience
                  </p>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center md:col-span-1">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Step 2: Simulate */}
                <div className="text-center md:col-span-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Simulate</h3>
                  <p className="text-gray-600 text-sm">
                    Run realistic focus groups with AI participants. Test different scenarios and participant mixes instantly
                  </p>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center md:col-span-1">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Step 3: Refine */}
                <div className="text-center md:col-span-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Refine</h3>
                  <p className="text-gray-600 text-sm">
                    Identify weak questions, optimize your guide, and sharpen your hypotheses based on simulation insights
                  </p>
                </div>
              </div>

              {/* Final Step - Execute Real Research */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 text-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">4. Execute Real Research</h3>
                <p className="text-base text-gray-600 mb-2">
                  Launch your field research with confidence, knowing your methodology is tested and your questions are optimized
                </p>
                <p className="text-sm text-gray-500 italic">
                  InsightSim prepares you for success—it doesn't replace the real insights only human participants can provide
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Reduce Research Failures</h4>
                  <p className="text-sm text-gray-600">
                    Test your discussion guides before expensive field research. Catch weak questions early and optimize for better insights.
                  </p>
                </div>

                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Accelerate Decision Making</h4>
                  <p className="text-sm text-gray-600">
                    Get directional insights instantly. No more waiting weeks for recruitment—test concepts and validate approaches immediately.
                  </p>
                </div>

                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Seize Strategic Opportunities</h4>
                  <p className="text-sm text-gray-600">
                    Move faster than competitors. Get preliminary insights for board meetings and campaign planning while preparing for comprehensive research.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Features Section */}
        <section id="features" className="bg-gray-50 py-20">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold feature-content">Why InsightSim?</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "AI Participants",
                  description: "Domain-specific personas trained to simulate real consumer behavior",
                  icon: <CheckCircle className="h-6 w-6 feature-icon" />,
                },
                {
                  title: "Flexible Moderation",
                  description: "Choose between AI or human-led moderation for your research",
                  icon: <CheckCircle className="h-6 w-6 feature-icon" />,
                },
                {
                  title: "Results in Minutes",
                  description: "Get qualitative insights in minutes, not weeks",
                  icon: <CheckCircle className="h-6 w-6 feature-icon" />,
                },
                {
                  title: "Cost-Effective",
                  description: "Reduce research costs while maintaining quality insights",
                  icon: <CheckCircle className="h-6 w-6 feature-icon" />,
                },
              ].map((feature, i) => (
                <div key={i} className="rounded-lg bg-white p-6 shadow-sm feature-content">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-medium">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-20 comparison-section">
          <div className="container">
            <h2 className="mb-2 text-center text-3xl font-bold comparison-title">Why not just use ChatGPT?</h2>
            <p className="mb-12 text-center text-lg text-gray-600">
              InsightSim is purpose-built for qualitative research
            </p>
            <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border animate-element comparison-table">
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
                    <tr key={i} className="border-t animate-element">
                      <td className="p-4">{feature.name}</td>
                      <td className="p-4 text-center text-primary">
                        {feature.insightSim ? <span className="checkmark">✓</span> : <span className="x-mark">✗</span>}
                      </td>
                      <td className="p-4 text-center text-gray-500">
                        {feature.chatGpt ? <span className="checkmark">✓</span> : <span className="x-mark">✗</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section (styled like screenshot) */}
        <section className="py-20 bg-white border-t faq-section">
          <div className="container max-w-4xl mx-auto">
            <h2 className="mb-2 text-center text-3xl font-bold faq-title">Frequently Asked Questions</h2>
            <p className="mb-10 text-center text-gray-500 text-lg">Everything you need to know about InsightSim</p>
            <div className="bg-white rounded-lg shadow-sm divide-y">
              {faqList.map((item, idx) => (
                <div key={item.q} className={`faq-item${openFaq === idx ? ' open' : ''} animate-element`}>
                  <button
                    className="w-full flex items-center justify-between py-5 px-6 text-left text-lg font-medium focus:outline-none hover:bg-gray-50 transition faq-question"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    aria-expanded={openFaq === idx}
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`h-5 w-5 transition-transform faq-arrow${openFaq === idx ? ' rotate-180' : ''}`} />
                  </button>
                  <div className="px-6 pb-6 text-gray-700 text-base animate-fade-in faq-answer" style={{ display: openFaq === idx ? 'block' : 'none', height: openFaq === idx ? 'auto' : 0, overflow: 'hidden' }}>
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Loom Video Demo Section */}
        <section className="py-20 bg-white border-t demo-section">
          <div className="container max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="mb-2 text-center text-3xl font-bold demo-section-title">See How InsightSim Works</h2>
            <p className="mb-10 text-center text-gray-500 text-lg">Watch a quick demo of how to run your first AI-powered focus group</p>
            <div className="w-full flex justify-center mb-8">
              <div className="w-full max-w-2xl aspect-video rounded-lg overflow-hidden shadow bg-gray-100 flex items-center justify-center video-container animate-element">
                <iframe
                  src="https://www.loom.com/embed/3f2acb20d33541ea8236200f080f3c8b"
                  title="InsightSim Demo Video"
                  allow="autoplay; fullscreen"
                  frameBorder="0"
                  className="w-full h-full min-h-[320px]"
                  allowFullScreen
                ></iframe>
                {/* Play button overlay for animation (optional, visually hidden since Loom has its own) */}
                <div className="play-button absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white rounded-full p-4 shadow-lg cursor-pointer" style={{ pointerEvents: 'none', opacity: 0 }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="currentColor" opacity="0.2"/><polygon points="13,10 24,16 13,22" fill="currentColor"/></svg>
                </div>
              </div>
            </div>
            <Button size="lg" className="mt-2 try-it-button animate-element" asChild>
              <Link href="/signup">Try It Yourself</Link>
            </Button>
          </div>
        </section>

        {/* Review Section */}
        <section className="py-20 bg-gray-50 border-t testimonials-section">
          <div className="container max-w-5xl mx-auto">
            <h2 className="mb-12 text-center text-3xl font-bold">What Our Users Say</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {/* Review 1 */}
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center testimonial-card">
                <svg className="h-8 w-8 text-primary mb-4 quote-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m2 7H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v11a2 2 0 01-2 2z" /></svg>
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
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center testimonial-card">
                <svg className="h-8 w-8 text-primary mb-4 quote-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m2 7H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v11a2 2 0 01-2 2z" /></svg>
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
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center testimonial-card">
                <svg className="h-8 w-8 text-primary mb-4 quote-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m2 7H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v11a2 2 0 01-2 2z" /></svg>
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

      {/* Global CSS for smooth animations and reduced motion */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        .animate-element {
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  )
}
