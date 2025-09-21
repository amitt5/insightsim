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
      q: "What is Maira?",
      a: "Maira is an AI-powered qualitative research platform that simulates focus groups and in-depth interviews using intelligent personas.",
    },
    {
      q: "Who is Maira for?",
      a: "Researchers, UX professionals, and product teams who want faster insights without the need for participant recruitment every time.",
    },
    {
      q: "Do I need technical expertise to use it?",
      a: "No. Maira is built for researchers. Calibration is user-friendly, and we offer demos and support to help you through it.",
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
      a: "Maira lets you calibrate personas with transcripts or insights from real research. The more calibration you do, the more realistic the AI behavior becomes. Watch a demo or request a walkthrough—it's slightly technical but very doable with support.",
    },
    {
      q: "What is calibration, and how does it work?",
      a: "You upload past research, and Maira adjusts the persona's dialogue behavior to match real-world patterns—making responses more authentic.",
    },
    {
      q: "Can I combine AI and human moderators?",
      a: "Yes. Use full AI moderation or guide conversations yourself. Maira also learns from your moderating style over time.",
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

  const [hideForNow, setHideForNow] = useState(false);

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openNewFaq, setOpenNewFaq] = useState<number | null>(null);
  const [showMorePricing, setShowMorePricing] = useState<number | null>(null);

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

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                {/* <span className="hero-title-part block">AI-Powered Focus Groups.</span>
                <span className="hero-title-part accent block text-primary">Real Insights.</span>
                <span className="hero-title-part block">No Waiting.</span> */}
                 <span className="hero-title-part block">AI-Powered Focus Groups.</span>
                 {/* Discover Actionable Insights. Guarenteed. Today!
                 find features, discover user pain points, concerns with trying user product and possible solutions

                 contact us with yous business problem. 

                 monthly subscription. 
                 1 project/app idea - 

                 100% satisfaction guaranteed! */}
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
                {/* <Link href="#demo">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto button">
                    Watch Demo
                  </Button>
                </Link> */}
              </div>

              {/*add later Trust indicator: "Trusted by 500+ Market Researchers" */}


            </div>
          </div>
        </section>


        {/* Who Is This Product For Section */}
        <section className="min-h-screen flex items-center justify-center py-20 bg-gray-50 border-t">
          <div className="container max-w-5xl mx-auto">
            <h2 className="mb-2 text-center text-3xl font-bold">Who Is Maira For?</h2>
            <p className="mb-10 text-center text-gray-500 text-lg">Our platform is designed for professionals who need deep qualitative insights without the traditional time and cost constraints.</p>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center">
                <span className="text-4xl mb-4">🔍</span>
                <h3 className="mb-2 text-xl font-semibold text-center">Qualitative Researchers</h3>
                <p className="text-gray-600 text-center"> Test discussion guides and explore new research directions</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center">
                <span className="text-4xl mb-4">💡</span>
                <h3 className="mb-2 text-xl font-semibold text-center">Insight Managers</h3>
                <p className="text-gray-600 text-center">Get on-demand feedback to quickly validate concepts</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm flex flex-col items-center">
                <span className="text-4xl mb-4">👤</span>
                <h3 className="mb-2 text-xl font-semibold text-center">User Researchers</h3>
                <p className="text-gray-600 text-center">Identify early usability issues and preferences</p>
              </div>
            </div>
          </div>
        </section>


        {/* Loom Video Demo Section */}
        {/* <section id="demo" className="min-h-screen flex items-center justify-center py-20 bg-white border-t demo-section">
          <div className="container max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="mb-2 text-center text-3xl font-bold demo-section-title">See How Maira Works</h2>
            <p className="mb-10 text-center text-gray-500 text-lg">Watch a quick demo of how to run your first AI-powered focus group</p>
            <div className="w-full flex justify-center mb-8">
              <div className="w-full max-w-2xl aspect-video rounded-lg overflow-hidden shadow bg-gray-100 flex items-center justify-center video-container animate-element">
                <iframe
                  src="https://www.loom.com/embed/8529302263914ee9bc00e2ed0619e8ec"
                  title="Maira Demo Video"
                  allow="autoplay; fullscreen"
                  frameBorder="0"
                  className="w-full h-full min-h-[320px]"
                  allowFullScreen
                ></iframe>
                <div className="play-button absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white rounded-full p-4 shadow-lg cursor-pointer" style={{ pointerEvents: 'none', opacity: 0 }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="currentColor" opacity="0.2"/><polygon points="13,10 24,16 13,22" fill="currentColor"/></svg>
                </div>
              </div>
            </div>
            <Button size="lg" className="mt-2 try-it-button animate-element" asChild>
              <Link href="/signup">Try It Yourself</Link>
            </Button>
          </div>
        </section> */}

        {/* Problem Statement Section */}
        <section className="min-h-screen flex items-center justify-center py-20 bg-gray-50">
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
                  Poorly designed discussion guides can cost thousands in wasted resources
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li>• Questions that don't generate insights</li>
                    <li>• Wasting live sessions getting obvious insights.</li>
                    <li>• Inability to ask crucial follow-up questions after the interview.</li>
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
                  Waiting weeks for results can cause you to miss market opportunities
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li>• Limited research budgets for early-stage concept testing</li>
                    <li>• Difficulty recruiting specific users</li>
                    <li>• Non-iterative feedback loops</li>
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
                  Making critical business decisions without research validation
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    {/* <li>• Board meetings demanding insights you don't have yet</li> */}
                    <li>• Campaign launches based on assumptions, not data</li>
                    <li>• Seasonal opportunities missed due to research lead times</li>
                    <li>• Team credibility questioned when insights come too late</li>
                  </ul>
                </div>
              </div>

              {/* Closing CTA */}
              {/* <div className="text-center">
                <p className="text-xl text-gray-700 font-medium">
                  What if you could test your approach, refine your questions, and validate your hypotheses before investing in expensive fieldwork?
                </p>
              </div> */}
            </div>
          </div>
        </section>

        {/* Solution Overview Section */}
        <section className="min-h-screen flex items-center justify-center py-12 bg-white">
          <div className="container">
            <div className="mx-auto max-w-6xl">
              {/* Section Header */}
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-3 sm:text-4xl">
                  How Maira Enhances Your Research Process
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
                    Define objectives, target audience and create your discussion guide
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
                    Test different scenarios and participant mixes instantly
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
                    Identify strong/weak questions and sharpen your hypotheses
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
                    Test your discussion guides before expensive field research
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
                    Get directional insights instantly. Iterate as often as you like
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

        {/* USP Section - Why Researchers Choose Maira */}
        <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="container">
            <div className="mx-auto max-w-6xl">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:text-4xl">
                  Why Researchers Choose Maira
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Overcome the impossible challenges of traditional research with AI-powered simulation
                </p>
              </div>

              {/* USPs Grid */}
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Impossible Recruitment */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Recruit the Unreachable</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Need insights from CEOs, or niche demographics? Create AI personas of participants you could never recruit in real life.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium">Example scenarios:</p>
                    <p className="text-xs text-gray-600">• C-suite executives • Rare medical conditions • Competitors' customers</p>
                  </div>
                </div>

                {/* No Scheduling Chaos */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Zero Scheduling Nightmares</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    No more coordinating 8 busy schedules across timezones. Your AI participants are always available when you need them.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium">Traditional research:</p>
                    <p className="text-xs text-gray-600">2-3 weeks coordination → Instant simulation</p>
                  </div>
                </div>

                {/* Think Time Advantage */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Perfect Your Questions</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Thought of a brilliant question in the shower? No problem. Take your time to craft the perfect follow-up without pressure.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium">Your pace:</p>
                    <p className="text-xs text-gray-600">Instant responses or thoughtful exploration</p>
                  </div>
                </div>

                {/* Unlimited Iteration */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Test & Iterate Endlessly</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Run the same study 10 times with small tweaks to questions or personas. Perfect your methodology before expensive fieldwork.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium">Cost comparison:</p>
                    <p className="text-xs text-gray-600">10 simulations = 1 traditional focus group cost</p>
                  </div>
                </div>

                {/* Global Reach */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Unlimited Geographic Reach</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Test with personas from any country or culture without travel costs, visa requirements, or timezone coordination.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium">Global insights:</p>
                    <p className="text-xs text-gray-600">Any market, any demographic, instantly</p>
                  </div>
                </div>

                {/* Sensitive Topics */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Explore Sensitive Topics</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Test controversial or sensitive subjects without participant discomfort or social desirability bias affecting responses.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium">Safe exploration:</p>
                    <p className="text-xs text-gray-600">No judgment, no bias, authentic responses</p>
                  </div>
                </div>
              </div>

              {/* Bottom Comparison */}
              {/* <div className="mt-16 bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">Traditional Research vs. Maira</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-red-600 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Traditional Research Challenges
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 2-3 weeks recruitment time</li>
                      <li>• $3K-15K recruitment costs</li>
                      <li>• Impossible to reach niche demographics</li>
                      <li>• Scheduling conflicts and no-shows</li>
                      <li>• Geographic and travel limitations</li>
                      <li>• One chance to get it right</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Maira Advantages
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Instant simulation start</li>
                      <li>• No recruitment costs</li>
                      <li>• Any demographic, anywhere</li>
                      <li>• Perfect attendance guaranteed</li>
                      <li>• Global reach without travel</li>
                      <li>• Unlimited iterations and testing</li>
                    </ul>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </section>


        {/* Key Features & Benefits Section */}
        {hideForNow && (
        <section id="features" className="py-20 bg-gray-50">
          <div className="container">
            <div className="mx-auto max-w-6xl">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:text-4xl">
                  Key Features & Benefits
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Professional-grade research simulation tools designed for market researchers, UX researchers, and insight managers
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid gap-8 md:grid-cols-3">
                {/* AI Personas */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Personas: Realistic participant simulation</h3>
                  <ul className="text-gray-600 space-y-2 mb-4">
                    <li>• Create diverse, authentic participants that match your target demographics</li>
                    <li>• Calibrate personas using your existing research data for more accurate responses &nbsp;
                    <span className= "inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Beta</span>
                    </li>
                  </ul>
                </div>

                {/* Discussion Guide Testing */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Discussion Guide Testing: Validate questions before field</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Test question flow and identify weak spots before expensive recruitment</li>
                    <li>• Get AI-powered suggestions for follow-up questions during simulations</li>
                  </ul>
                </div>

                {/* Multiple Scenarios */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Multiple Scenarios: Test different participant mixes</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Run the same study with different demographic combinations</li>
                    <li>• Compare responses across various audience segments instantly</li>
                  </ul>
                </div>
              </div>

              {/* Stacked Upcoming Features */}
              
            </div>
          </div>
        </section>)}


        {/* Upcoming Features Section */}
        {hideForNow && (
        <section className="py-20 bg-white">
          <div className="container max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
              <p className="text-lg text-gray-600">Enhanced features to make your research even more powerful</p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="space-y-8">
                {/* Qual-to-Quant Validation */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 md:mb-0 md:mr-6">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 mr-3">Qual-to-Quant Validation</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Coming Soon - June</span>
                    </div>
                    <p className="text-gray-600 mb-3">Test patterns with simulated surveys</p>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Validate qualitative findings through simulated quantitative studies</li>
                      <li>• Bridge the gap between exploratory insights and statistical validation</li>
                    </ul>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Smart Research Integration */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 md:mb-0 md:mr-6">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 mr-3">Smart Research Integration</h3>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">Roadmap</span>
                    </div>
                    <p className="text-gray-600 mb-3">Learn from your research history</p>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Feed existing research into the system for better question suggestions</li>
                      <li>• Leverage past studies to generate more realistic participant responses</li>
                      <li>• Build on your research history for continuously improving simulations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}
    

        {/* Use Cases Section */}
        <section className="min-h-screen flex items-center justify-center py-20 bg-white">
          <div className="container">
            <div className="mx-auto max-w-6xl">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:text-4xl">
                  How Researchers Use Maira
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Real scenarios from market researchers, UX researchers, and insight managers who enhance their research process with AI simulation
                </p>
              </div>

              {/* Use Cases Grid */}
              <div className="grid gap-8 md:grid-cols-2">
                {/* Testing Discussion Guides */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
                  <div className="flex items-start mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Testing Discussion Guides Before Expensive Field Research</h3>
                      <p className="text-sm text-blue-600 font-medium mb-3">Market Research Agencies</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "Before we invest $15K in recruitment and fieldwork, we run our discussion guide through Maira with different persona mixes. Last month, we caught three weak questions that would have derailed our automotive study."
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600 font-medium mb-2">Typical Workflow:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Upload draft discussion guide</li>
                      <li>• Test with 3-4 different demographic profiles</li>
                      <li>• Identify questions that don't generate insights</li>
                      <li>• Refine guide before client presentation</li>
                    </ul>
                  </div>
                </div>

                {/* Exploring Hypotheses */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-100">
                  <div className="flex items-start mb-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Exploring Hypotheses with Different Participant Profiles</h3>
                      <p className="text-sm text-purple-600 font-medium mb-3">Consumer Insights Teams</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "We had competing hypotheses about Gen Z vs Millennial attitudes toward sustainable packaging. Maira let us test both scenarios instantly, helping us focus our real research on the most promising angles."
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-gray-600 font-medium mb-2">Typical Workflow:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Create personas for different hypotheses</li>
                      <li>• Run parallel simulations</li>
                      <li>• Compare response patterns</li>
                      <li>• Prioritize research focus areas</li>
                    </ul>
                  </div>
                </div>

                {/* Training Junior Researchers */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-100">
                  <div className="flex items-start mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Training Junior Researchers on Moderation Techniques</h3>
                      <p className="text-sm text-green-600 font-medium mb-3">Research Training & Development</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "New hires practice moderation skills with Maira before their first real focus group. They learn how to probe deeper, manage dominant participants, and keep discussions on track—all without the pressure of a live session."
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-gray-600 font-medium mb-2">Typical Workflow:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Practice with challenging persona combinations</li>
                      <li>• Learn follow-up questioning techniques</li>
                      <li>• Build confidence before client sessions</li>
                      <li>• Review and improve moderation approach</li>
                    </ul>
                  </div>
                </div>

                {/* Getting Directional Insights */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 border border-orange-100">
                  <div className="flex items-start mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Getting Directional Insights for Proposal Development</h3>
                      <p className="text-sm text-orange-600 font-medium mb-3">UX Research & Product Teams</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "When stakeholders need quick insights for sprint planning, we use Maira to test user scenarios and validate assumptions. It gives us directional data to inform decisions while we plan comprehensive user research."
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-gray-600 font-medium mb-2">Typical Workflow:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Rapid concept testing with user personas</li>
                      <li>• Generate insights for stakeholder meetings</li>
                      <li>• Validate research proposals with preliminary data</li>
                      <li>• Support business cases with directional findings</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bottom Stats/Social Proof */}
              <div className="mt-16 text-center">
                <div className="bg-gray-50 rounded-xl p-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Join Researchers Who Enhance Their Process</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-2xl font-bold text-primary mb-1">73%</p>
                      <p className="text-sm text-gray-600">Catch weak questions before fieldwork</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary mb-1">5x</p>
                      <p className="text-sm text-gray-600">Faster hypothesis validation</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary mb-1">$12K</p>
                      <p className="text-sm text-gray-600">Average savings per failed study prevented</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof & Testimonials Section */}
        {showMorePricing === 5 &&(<section className="min-h-screen flex items-center justify-center py-20 bg-gray-50">
          <div className="container">
            <div className="mx-auto max-w-6xl">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:text-4xl">
                  Trusted by Research Professionals
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  See how market researchers and UX professionals are enhancing their research process with Maira
                </p>
              </div>

              {/* Usage Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-2">500+</p>
                  <p className="text-sm text-gray-600">Active Researchers</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-2">2,500+</p>
                  <p className="text-sm text-gray-600">Simulations Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-2">85%</p>
                  <p className="text-sm text-gray-600">Improved Discussion Guides</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-2">$180K</p>
                  <p className="text-sm text-gray-600">Research Budget Saved</p>
                </div>
              </div>

              {/* Testimonials Grid */}
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
                {/* Testimonial 1 */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center mb-4">
                    <img src="https://randomuser.me/api/portraits/women/32.jpg" alt="Sarah Mitchell" className="w-12 h-12 rounded-full object-cover border mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">Sarah Mitchell</p>
                      <p className="text-sm text-gray-600">Senior Research Manager</p>
                      <p className="text-sm text-gray-500">Insights & Co.</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    "Maira saved us from a costly research failure. We caught three problematic questions in our discussion guide that would have compromised our entire automotive study. The AI personas gave us realistic responses that helped refine our approach."
                  </p>
                </div>

                {/* Testimonial 2 */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center mb-4">
                    <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="Marcus Rodriguez" className="w-12 h-12 rounded-full object-cover border mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">Marcus Rodriguez</p>
                      <p className="text-sm text-gray-600">UX Research Lead</p>
                      <p className="text-sm text-gray-500">TechFlow Solutions</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    "Perfect for rapid concept validation. When stakeholders need quick insights for sprint planning, Maira gives us directional data while we plan comprehensive user research. It's become essential to our workflow."
                  </p>
                </div>

                {/* Testimonial 3 */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center mb-4">
                    <img src="https://randomuser.me/api/portraits/women/29.jpg" alt="Jennifer Chen" className="w-12 h-12 rounded-full object-cover border mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">Jennifer Chen</p>
                      <p className="text-sm text-gray-600">Director of Consumer Insights</p>
                      <p className="text-sm text-gray-500">BrandScope Analytics</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    "We use Maira to train junior researchers on moderation techniques. They practice with challenging personas before their first real focus group. It's dramatically improved our team's confidence and skills."
                  </p>
                </div>
              </div>

              {/* Company Logos */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-6">Trusted by research teams at:</p>
                <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                  <div className="bg-gray-200 rounded px-6 py-3">
                    <span className="text-gray-600 font-semibold">Insights & Co.</span>
                  </div>
                  <div className="bg-gray-200 rounded px-6 py-3">
                    <span className="text-gray-600 font-semibold">TechFlow Solutions</span>
                  </div>
                  <div className="bg-gray-200 rounded px-6 py-3">
                    <span className="text-gray-600 font-semibold">BrandScope Analytics</span>
                  </div>
                  <div className="bg-gray-200 rounded px-6 py-3">
                    <span className="text-gray-600 font-semibold">Research Dynamics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>)}

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-gray-50">
          <div className="container">
            <div className="mx-auto max-w-7xl">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:text-4xl">
                  Simple, Transparent Pricing
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Choose the plan that fits your research needs. Start small or go big - we've got you covered.
                </p>
              </div>

              {/* Three-Tier Pricing Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                
                {/* Starter Plan */}
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200 h-full flex flex-col">
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Starter</h3>
                    <Link href="/signup?plan=starter" className="block mb-4">
                      <Button className="w-full text-lg py-3">Get Started Free</Button>
                    </Link>
                    <p className="text-gray-600 text-sm mb-6">Perfect for getting started with AI research</p>
                    <ul className="space-y-4 text-gray-600 mb-8">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">5 simulations per month</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">6 AI personas per month</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">5 active studies at a time</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Basic support</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        <span className="text-base text-gray-400">No stimulus images</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Professional Plan - Most Popular */}
                <div className="bg-white rounded-xl p-8 border-2 border-primary h-full flex flex-col relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Professional</h3>
                    <a href="mailto:renato@meetmaira.ai?subject=Professional Plan Demo Request" className="block mb-4">
                      <Button className="w-full text-lg py-3">Book a Demo</Button>
                    </a>
                    <p className="text-gray-600 text-sm mb-6">For serious researchers and insight teams</p>
                    <ul className="space-y-4 text-gray-600 mb-8">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">100 simulations per month</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">8 AI personas per month</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Unlimited active studies</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Unlimited participants</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Priority support</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Summary & themes</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Stimulus images</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Early access to beta features</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200 h-full flex flex-col">
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Enterprise</h3>
                    <a href="mailto:renato@meetmaira.ai?subject=Enterprise Plan - Let's Discuss Your Needs" className="block mb-4">
                      <Button variant="outline" className="w-full text-lg py-3">Contact Sales</Button>
                    </a>
                    <p className="text-gray-600 text-sm mb-6">For large teams and organizations</p>
                    <ul className="space-y-4 text-gray-600 mb-8">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Unlimited everything</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Multi-user accounts</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Team management</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Custom onboarding</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Dedicated account manager</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-base">Dedicated support</span>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Full Service Add-On Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Additional Offer</h3>
                  <h4 className="text-xl font-semibold text-primary">Full Service Research</h4>
                </div>
                
                <div className="max-w-4xl mx-auto">
                  <p className="text-gray-700 text-center mb-8 text-lg">
                    We conduct qualitative research using Maira and then validate findings with quantitative studies using real respondents.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h5 className="text-lg font-semibold text-gray-900 mb-4">What We Deliver:</h5>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span><span className="font-semibold">Qualitative deep-dive</span> using AI personas</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span><span className="font-semibold">Survey design</span> based on qualitative insights</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span><span className="font-semibold">Quantitative validation</span> with real respondents</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span><span className="font-semibold">Statistical analysis</span> and validation</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span><span className="font-semibold">Executive summary</span> with actionable recommendations</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span>Presentation-ready deliverables</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 border border-blue-200">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4 text-center">Investment:</h5>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 mb-2">Contact for pricing</p>
                        <p className="text-gray-600 mb-4">Tailored to your research scope</p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">
                          Pricing depends on study complexity, sample size, and research objectives
                        </p>
                      </div>
                      <div className="mt-4">
                        <a href="mailto:renato@meetmaira.ai?subject=Full Service Research - Let's Discuss Your Project" className="w-full">
                          <Button variant="outline" className="w-full">Get Proposal</Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Note */}
              <div className="text-center mt-12">
                <p className="text-sm text-gray-500">
                  All plans include secure data handling and GDPR compliance. Questions about which option is right for you? 
                  <Link href="/contact" className="text-primary hover:underline ml-1">Let's talk</Link>
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Pricing Section */}
        {showMorePricing === 5 && (<section id="pricing" className="py-20 bg-white">
          <div className="container">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:text-4xl">
                  Simple, Transparent Pricing
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Choose the plan that fits your research needs. Start free, upgrade as you grow.
                </p>
              </div>

              {/* Pricing Cards */}
              <div className="grid gap-8 md:grid-cols-3">
                {/* Free Trial */}
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200 relative">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Trial</h3>
                    <p className="text-gray-600 text-sm mb-4">Perfect for trying Maira</p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">$0</span>
                      <span className="text-gray-600">/14 days</span>
                    </div>
                    <p className="text-xs text-green-600 font-medium">No credit card required</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      3 simulations included
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Up to 5 AI participants per session
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Basic discussion guide templates
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Email support
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button className="w-full" variant="outline">
                      Start Free Trial
                    </Button>
                  </Link>
                </div>

                {/* Professional */}
                <div className="bg-white rounded-xl p-8 border-2 border-primary relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">Most Popular</span>
                  </div>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional</h3>
                    <p className="text-gray-600 text-sm mb-4">For individual researchers</p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">$49</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-xs text-gray-500">Billed monthly or annually</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited simulations
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Up to 8 AI participants per session
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced persona customization
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Export to PDF, Word, Excel
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Priority email support
                    </li>
                  </ul>
                  <Link href="/signup">
                    <Button className="w-full">
                      Start Professional Plan
                    </Button>
                  </Link>
                </div>

                {/* Enterprise */}
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200 relative">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                    <p className="text-gray-600 text-sm mb-4">For teams and agencies</p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">$149</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-xs text-gray-500">Up to 10 team members</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Everything in Professional
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Team collaboration features
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Shared persona libraries
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced analytics & reporting
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Phone & chat support
                    </li>
                  </ul>
                  <Link href="/contact">
                    <Button className="w-full" variant="outline">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Bottom Note */}
              <div className="text-center mt-12">
                <p className="text-sm text-gray-500">
                  All plans include secure data handling and GDPR compliance. Need custom features? 
                  <Link href="/contact" className="text-primary hover:underline ml-1">Contact us</Link>
                </p>
              </div>
            </div>
          </div>
        </section>)}


        {/* Pricing Section */}
        {showMorePricing === 5 && (<section className="py-20 bg-white">
          <div className="container">
            <div className="mx-auto max-w-7xl">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:text-4xl">
                  Flexible Plans for Every Researcher
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  From validating a new idea to scaling research for your entire team.
                </p>
              </div>

              {/* Pricing Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
                {/* Basic Plan */}
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200 h-full flex flex-col">
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-gray-900">Basic</h3>
                    <p className="text-gray-600 text-sm mb-6">For freelancers and solo researchers with ongoing needs.</p>
                    <div className="mb-6">
                      <p className="text-sm text-gray-500">
                        <span className="line-through">€50</span> / month
                      </p>
                      <p className="text-3xl font-bold text-gray-900">€20<span className="text-lg font-medium text-gray-600">/month</span></p>
                      <p className="text-xs text-green-600 font-medium">Introductory Offer</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Up to <span className="font-semibold">10 studies</span> per month (Qual + Quant)</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Up to 8 AI participants per session</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Premium LLM models</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Full PDF/Word/Excel summary export</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Priority email support</span>
                      </li>
                    </ul>
                  </div>
                  <Link href="/signup?plan=basic">
                    <Button className="w-full" variant="outline">Get Started</Button>
                  </Link>
                </div>

                {/* Professional Plan (Most Popular) */}
                <div className="bg-white rounded-xl p-8 border-2 border-primary relative h-full flex flex-col">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">Most Popular</span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-gray-900">Professional</h3>
                    <p className="text-gray-600 text-sm mb-6">For professional researchers and insight managers.</p>
                    <div className="mb-6">
                      <p className="text-sm text-gray-500">
                        <span className="line-through">€120</span> / month
                      </p>
                      <p className="text-3xl font-bold text-gray-900">€50<span className="text-lg font-medium text-gray-600">/month</span></p>
                      <p className="text-xs text-green-600 font-medium">Lifetime Offer for first 500 users</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start text-sm text-gray-600 font-semibold text-primary">
                        <svg className="w-4 h-4 text-primary mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Everything in Basic, plus:</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Up to <span className="font-semibold">50 studies</span> per month</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Upload docs to auto-populate guides</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Use image-based stimuli</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Presentation-ready PPT & branded PDF reports</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Social Media Insights Integration</span>
                      </li>
                    </ul>
                  </div>
                  <Link href="/signup?plan=professional">
                    <Button className="w-full">Choose Professional</Button>
                  </Link>
                </div>
                
                {/* Enterprise Plan */}
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200 h-full flex flex-col">
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-gray-900">Enterprise</h3>
                    <p className="text-gray-600 text-sm mb-6">For agencies and corporate insights teams.</p>
                    <div className="mb-6">
                      <p className="text-3xl font-bold text-gray-900">Custom</p>
                      <p className="text-xs text-gray-500 mt-4">Contact us for tailored pricing & features</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start text-sm text-gray-600 font-semibold text-primary">
                        <svg className="w-4 h-4 text-primary mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Everything in Professional, plus:</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Unlimited studies</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Team collaboration & shared libraries</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Advanced analytics dashboard</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Dedicated account manager & phone support</span>
                      </li>
                    </ul>
                  </div>
                  <Link href="/contact-sales">
                    <Button className="w-full" variant="outline">Contact Sales</Button>
                  </Link>
                </div>
              </div>

              {/* Alternative Plans Section */}
              <div className="text-center mt-16 mb-12">
                <h3 className="text-2xl font-bold text-gray-800">Just exploring or testing an idea?</h3>
                <p className="text-lg text-gray-600">These one-time and free options are perfect for getting started.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Validator Plan */}
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200 h-full flex flex-col">
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-gray-900">Validator</h3>
                    <p className="text-gray-600 text-sm mb-6">For founders and creators testing a new idea.</p>
                    <div className="mb-6">
                      <p className="text-sm text-gray-500"><span className="line-through">€50</span></p>
                      <p className="text-3xl font-bold text-gray-900">€20<span className="text-lg font-medium text-gray-600">/one-time</span></p>
                      <p className="text-xs text-green-600 font-medium">No subscription needed</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>A bundle of <span className="font-semibold">3 full studies</span> (Qual + Quant)</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Premium LLM models for higher-quality insights</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Full PDF/Word/Excel summary export (no watermark)</span>
                      </li>
                    </ul>
                  </div>
                  <Link href="/signup?plan=validator">
                    <Button className="w-full">Validate Your Idea</Button>
                  </Link>
                </div>

                {/* Explorer Plan */}
                <div className="bg-white rounded-xl p-8 border-2 border-gray-200 h-full flex flex-col">
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-gray-900">Explorer</h3>
                    <p className="text-gray-600 text-sm mb-6">Curious about AI-powered research? Start here.</p>
                    <div className="mb-6">
                      <p className="text-3xl font-bold text-gray-900">€0<span className="text-lg font-medium text-gray-600">/forever</span></p>
                      <p className="text-xs text-green-600 font-medium">No credit card required</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>1 active study at a time (Qualitative only)</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Up to 3 AI participants per session</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Access to basic LLM models</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Watermarked PDF summary export</span>
                      </li>
                    </ul>
                  </div>
                  <Link href="/signup?plan=explorer">
                    <Button className="w-full" variant="outline">Start Exploring</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>)}


 {/* FAQ Section */}
 <section id="faq" className="py-20 bg-gray-50">
   <div className="container">
     <div className="mx-auto max-w-4xl">
       {/* Section Header */}
       <div className="text-center mb-16">
         <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:text-4xl">
           Frequently Asked Questions
         </h2>
         <p className="text-lg text-gray-600">
           Everything you need to know about Maira and how it enhances your research process
         </p>
       </div>

       {/* FAQ Items */}
       <div className="space-y-4">
         {/* FAQ 1 */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
           <button
             className="w-full flex items-center justify-between py-6 px-6 text-left focus:outline-none hover:bg-gray-50 transition"
             onClick={() => setOpenNewFaq(openNewFaq === 0 ? null : 0)}
             aria-expanded={openNewFaq === 0}
           >
             <h3 className="text-lg font-semibold text-gray-900">
               Does this replace real research?
             </h3>
             <ChevronDown className={`h-5 w-5 transition-transform ${openNewFaq === 0 ? 'rotate-180' : ''}`} />
           </button>
           {openNewFaq === 0 && (
             <div className="px-6 pb-6 text-gray-600">
               No, Maira enhances your research process—it doesn't replace it. Think of it as a testing ground for your methodology. Use it to refine discussion guides, test hypotheses, and validate your approach before investing in expensive fieldwork. The insights are directional and help you prepare for more effective real research with human participants.
             </div>
           )}
         </div>

         {/* FAQ 2 */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
           <button
             className="w-full flex items-center justify-between py-6 px-6 text-left focus:outline-none hover:bg-gray-50 transition"
             onClick={() => setOpenNewFaq(openNewFaq === 1 ? null : 1)}
             aria-expanded={openNewFaq === 1}
           >
             <h3 className="text-lg font-semibold text-gray-900">
               How accurate are the AI responses?
             </h3>
             <ChevronDown className={`h-5 w-5 transition-transform ${openNewFaq === 1 ? 'rotate-180' : ''}`} />
           </button>
           {openNewFaq === 1 && (
             <div className="px-6 pb-6 text-gray-600">
               Our AI personas are trained on extensive research data and behavioral patterns to provide realistic responses. While they can't replicate the full complexity of human behavior, they're excellent for identifying weak questions, testing discussion flow, and exploring different scenarios. We recommend using insights as directional guidance to inform your real research design.
             </div>
           )}
         </div>

         {/* FAQ 3 */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
           <button
             className="w-full flex items-center justify-between py-6 px-6 text-left focus:outline-none hover:bg-gray-50 transition"
             onClick={() => setOpenNewFaq(openNewFaq === 2 ? null : 2)}
             aria-expanded={openNewFaq === 2}
           >
             <h3 className="text-lg font-semibold text-gray-900">
               What about data privacy and security?
             </h3>
             <ChevronDown className={`h-5 w-5 transition-transform ${openNewFaq === 2 ? 'rotate-180' : ''}`} />
           </button>
           {openNewFaq === 2 && (
             <div className="px-6 pb-6 text-gray-600">
               We take data security seriously. All simulation data is encrypted in transit and at rest. We're GDPR compliant and never share your research content with third parties. Your discussion guides, personas, and simulation results remain completely private to your account. We also offer enterprise-grade security features for larger teams.
             </div>
           )}
         </div>

         {/* FAQ 4 */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
           <button
             className="w-full flex items-center justify-between py-6 px-6 text-left focus:outline-none hover:bg-gray-50 transition"
             onClick={() => setOpenNewFaq(openNewFaq === 3 ? null : 3)}
             aria-expanded={openNewFaq === 3}
           >
             <h3 className="text-lg font-semibold text-gray-900">
               Can I export results and integrate with my workflow?
             </h3>
             <ChevronDown className={`h-5 w-5 transition-transform ${openNewFaq === 3 ? 'rotate-180' : ''}`} />
           </button>
           {openNewFaq === 3 && (
             <div className="px-6 pb-6 text-gray-600">
               Yes! You can export simulation transcripts, insights summaries, and participant responses in multiple formats including PDF, Word, and Excel. This makes it easy to share findings with stakeholders, include in research proposals, or integrate with your existing analysis tools. Enterprise plans include additional integration options.
             </div>
           )}
         </div>

         {/* FAQ 5 */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
           <button
             className="w-full flex items-center justify-between py-6 px-6 text-left focus:outline-none hover:bg-gray-50 transition"
             onClick={() => setOpenNewFaq(openNewFaq === 4 ? null : 4)}
             aria-expanded={openNewFaq === 4}
           >
             <h3 className="text-lg font-semibold text-gray-900">
               How do I integrate this into my current research workflow?
             </h3>
             <ChevronDown className={`h-5 w-5 transition-transform ${openNewFaq === 4 ? 'rotate-180' : ''}`} />
           </button>
           {openNewFaq === 4 && (
             <div className="px-6 pb-6 text-gray-600">
               Maira fits naturally into your existing process. Use it in the planning phase to test discussion guides, during proposal development to provide directional insights, or for training junior researchers. Many users run simulations before client presentations to anticipate questions and refine their approach. It's designed to complement, not disrupt, your established methodology.
             </div>
           )}
         </div>

         {/* FAQ 6 */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
           <button
             className="w-full flex items-center justify-between py-6 px-6 text-left focus:outline-none hover:bg-gray-50 transition"
             onClick={() => setOpenNewFaq(openNewFaq === 5 ? null : 5)}
             aria-expanded={openNewFaq === 5}
           >
             <h3 className="text-lg font-semibold text-gray-900">
               What types of research studies can I simulate?
             </h3>
             <ChevronDown className={`h-5 w-5 transition-transform ${openNewFaq === 5 ? 'rotate-180' : ''}`} />
           </button>
           {openNewFaq === 5 && (
             <div className="px-6 pb-6 text-gray-600">
               Maira supports focus groups, in-depth interviews, and concept testing scenarios. You can simulate various participant demographics, test different discussion guide approaches, and explore multiple hypotheses. Coming soon: quantitative survey simulation to validate qualitative findings and persona calibration using your existing research data.
             </div>
           )}
         </div>
       </div>

       {/* Bottom CTA */}
       <div className="text-center mt-12">
         <p className="text-gray-600 mb-4">Still have questions?</p>
         <Link href="/contact">
           <Button variant="outline">
             Contact Support
           </Button>
         </Link>
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
              <span className="text-xl font-bold">Maira</span>
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
