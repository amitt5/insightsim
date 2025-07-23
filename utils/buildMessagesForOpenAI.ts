// import { SimulationMessage, Persona } from "@/types";
import { Persona, SimulationMessage, Simulation, AIPersonaGeneration} from "@/utils/types";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";



export function buildMessagesForOpenAI({
  simulation,
  messages,
  personas,
}: {
  simulation: Simulation,
  messages: SimulationMessage[],
  personas: Persona[],
}, study_type: string, userInstruction?: string) {
  const { study_title, topic, discussion_questions } = simulation;
  const personaMap = Object.fromEntries(personas.map(p => [p.id, p.name]));

  const openAIMessages: ChatCompletionMessageParam[] = [];

  // SYSTEM PROMPT
  let systemPrompt = `You are simulating a realistic and insightful focus group discussion with multiple participants and a human moderator.\n\n`;

  systemPrompt += `The topic of the discussion is: "${study_title}".\n`;

  if (topic) {
    systemPrompt += `Background info: ${topic}\n`;
  }

  systemPrompt += `Here are the participants:\n`;

  personas.forEach((p) => {
    systemPrompt += `- ${p.name}`;
    if (p.gender) systemPrompt += ` (${p.gender})`;
    if (p.age) systemPrompt += `, age: ${p.age}`;
    if (p.occupation) systemPrompt += `, occupation: ${p.occupation}`;
    if (p.archetype) systemPrompt += `, archetype: ${p.archetype}`;
    if (p.traits?.length) systemPrompt += `, traits: ${p.traits.join(", ")}`;
    if (p.goal) systemPrompt += `, goal: ${p.goal}`;
    if (p.attitude) systemPrompt += `, attitude: ${p.attitude}`;
    if (p.bio) systemPrompt += `, bio: ${p.bio}`;
    systemPrompt += `\n`;
  });

  if (discussion_questions) {
    systemPrompt += `\nThe moderator has prepared the following discussion guide (questions may be asked in any order):\n`;
    discussion_questions.forEach((q, idx) => {
      if (q?.trim()) {
        systemPrompt += `${idx + 1}. ${q.trim()}\n`;
      }
    });
  }

  systemPrompt += `\nThe moderator is named "Moderator". They guide the discussion by asking questions.\n\n`;


  // Add user instruction if provided (NEW SECTION)
  if (userInstruction?.trim()) {
    systemPrompt += `USER INSTRUCTION (MUST FOLLOW):\n${userInstruction.trim()}\n\n`;
  }

  // Emphasize depth requirement EARLY
  if (study_type === "idi") {
    // systemPrompt += `IMPORTANT: Respond with a short message. Max 10 words\n`;
    // systemPrompt += `IMPORTANT: Respond with a long, detailed, descriptive message of at least 50–200 words per participant. Be reflective and realistic in tone.\n`;
  } else {
    systemPrompt += `Respond with ALL the participant messages in a natural back-and-forth. Make each message realistic and contextually aware.\n`;
  }

  

  // JSON format rules
  // Replace your current JSON format rules section with:
systemPrompt += `
RESPONSE FORMAT - CRITICAL:
You must ALWAYS respond with valid JSON in this exact format:

{
  "participants": [
    {"name": "Participant Name", "message": "Their response message"}
  ]
}

STRICT RULES:
- Return ONLY valid JSON - no other text, explanations, or markdown
- Include ALL participant responses per turn
- Never include moderator responses
- Each participant gets their own object in the array
- Messages should be detailed(50-200 words) and natural and conversational

EXAMPLE:
{
  "participants": [
    {
      "name": "Michael Rodriguez", 
      "message": "When I'm developing a new investment thesis, I start by identifying key macroeconomic trends..."
    }
  ]
}
`;


  openAIMessages.push({
    role: "system",
    content: systemPrompt.trim(),
  });

  // CONVERSATION HISTORY
  for (const m of messages) {
    let name =
      m.sender_type === "moderator"
        ? "Moderator"
        : personaMap[m.sender_id ?? ""] ?? "Unknown";

    openAIMessages.push({
      role: m.sender_type === "moderator" ? "user" : "assistant",
      content: `${name}: ${m.message}`,
    });
  }

  return openAIMessages;
}


export function buildFollowUpQuestionsPrompt({
  simulation,
  messages,
  personas,
}: {
  simulation: Simulation,
  messages: SimulationMessage[],
  personas: Persona[],
}) {
  const { study_title, topic, discussion_questions } = simulation;
  const personaMap = Object.fromEntries(personas.map(p => [p.id, p.name]));

  const openAIMessages: ChatCompletionMessageParam[] = [];

  // Get last 6-8 messages for context (adjust as needed)
  const recentMessages = messages.slice(-8);

  let systemPrompt = `You are an expert qualitative research moderator assistant with 15 years of experience. Your job is to suggest insightful follow-up questions based on the recent conversation in this ${simulation.study_type === 'idi' ? 'in-depth interview' : 'focus group discussion'}.

Study Topic: "${study_title}"
${topic ? `Background: ${topic}` : ''}

Participants:
${personas.map(p => `- ${p.name}${p.age ? ` (${p.age})` : ''}${p.occupation ? `, ${p.occupation}` : ''}${p.archetype ? `, ${p.archetype}` : ''}`).join('\n')}

Based on the recent conversation, suggest 4-5 follow-up questions that would help the moderator:
1. Probe deeper into interesting points participants made
2. Explore contradictions or differences in opinions
3. Uncover underlying motivations or emotions
4. Get more specific examples or stories
5. Challenge assumptions or explore alternative perspectives

Focus on questions that would generate rich, detailed responses and deeper insights.

Return ONLY a JSON array of question objects in this exact format:
[
  { "question": "Can you tell me more about..." },
  { "question": "What specifically made you feel..." },
  { "question": "How does that compare to..." },
  { "question": "Can you give me a specific example of..." }
]

Do not include any explanation, commentary, or text outside the JSON array.`;

  openAIMessages.push({
    role: "system",
    content: systemPrompt.trim(),
  });

  // Add recent conversation context
  let conversationContext = "Recent conversation:\n\n";
  
  for (const m of recentMessages) {
    let name = m.sender_type === "moderator" 
      ? "Moderator" 
      : personaMap[m.sender_id ?? ""] ?? "Unknown";
    
    conversationContext += `${name}: ${m.message}\n\n`;
  }

  openAIMessages.push({
    role: "user",
    content: conversationContext.trim(),
  });

  return openAIMessages;
}


/**
 * Creates a structured prompt for an AI model to generate 5 professional study titles.
 * @param userInput - The user's response to "What is the main thing you want to learn in this study?".
 * @returns A detailed prompt string ready to be sent to an LLM.
 */
export function createTitleGenerationPrompt(userInput: string): string {
  // The system prompt sets the AI's role and expertise.
  // Referencing a top agency like Kantar gives it a specific context for quality.
  const systemPrompt = `You are an expert Market Research Manager with 15 years of experience. Your specialty is taking a client's core business question and reframing it into a clear, professional, and insightful study title for qualitative research (Focus Groups or IDIs).`;

  // The task definition clearly outlines the goal and constraints.
  const taskDefinition = `Your task is to analyze the user's research goal, provided below, and generate 5 distinct, professional study titles. The titles should be concise, clear, and suitable for a formal research report.`;

  // This section provides specific guidelines on the variety and style of titles to generate.
  const styleGuidelines = `Ensure the 5 titles offer a variety of angles to give the user a good choice:
1.  **A clear, descriptive title:** The most straightforward option.
2.  **An exploratory title:** Using words like "Exploring," "Understanding," or "A Deep Dive into."
3.  **An action-oriented title:** Focusing on outcomes, like "Uncovering Drivers," "Identifying Barriers," or "Mapping the Journey."
4.  **A target-focused title:** Highlighting the specific audience being studied.
5.  **A benefit-driven title:** Focusing on the business opportunity, like "Identifying Opportunities for..."`;

  // The few-shot example provides a concrete model for the AI to follow, significantly improving output quality.
  const fewShotExample = `
EXAMPLE:
User's Research Goal: "i want to know if busy parents would subscribe to my new app that helps schedule kids' activities."
Expected JSON Output:
{
  "titles": [
    "Kids' Activity Scheduling App Concept Test",
    "Exploring the Daily Challenges of Family Activity Management",
    "Uncovering Drivers for Adopting a Kids' Scheduling App",
    "The Modern Parent's Journey in Managing Children's Schedules",
    "Identifying Opportunities for a Family-Focused Scheduling Solution"
  ]
}`;

  // The final instruction ensures the output is in a machine-readable format for easy integration.
  const outputFormatInstruction = `Provide the output as a valid JSON object with a single key "titles", which is an array of 5 strings. Do not include any other text, explanation, or preamble before or after the JSON object.`;

  // Assembling the final prompt.
  return `
${systemPrompt}

${taskDefinition}

${styleGuidelines}

${outputFormatInstruction}

${fewShotExample}

--------------------

USER'S ACTUAL RESEARCH GOAL:
"${userInput}"

JSON OUTPUT:
`;
}


 // Function to build OpenAI prompt for discussion questions
 export function buildDiscussionQuestionsPrompt(studyTitle: string, topic: string, studyType: 'focus-group' | 'idi' = 'focus-group') {
  const sessionType = studyType === 'idi' ? 'in-depth interview' : 'focus group discussion';
  
  return `You are an expert qualitative market researcher specializing in ${sessionType}s.

  Generate 6-8 strategic discussion questions for this research study:

  Study Title: "${studyTitle}"
  Topic/Context: "${topic}"
  Session Type: ${sessionType}

  Create questions that follow qualitative research best practices:
  - Use open-ended, exploratory language ("How", "What", "Why", "Describe", "Tell me about")
  - Progress from general to specific topics
  - Include both rational and emotional dimensions
  - Encourage storytelling and personal experiences
  - Avoid leading or biased phrasing
  - Include at least one projective or hypothetical scenario question

  Return your response as a JSON object with the following structure:

  {
    "questions": [
      "Question 1 text here",
      "Question 2 text here",
      "Question 3 text here"
    ]
  }

  Format each question as a moderator would naturally ask it in the session. Return only valid JSON with no additional text or explanations.`.trim();
}


/**
 * Creates a structured prompt for an AI model to extract a single professional study title 
 * and research topic from a complete research brief.
 * @param briefText - The full research brief text uploaded by the user.
 * @returns A detailed prompt string ready to be sent to an LLM.
 */
export function createBriefExtractionPrompt(briefText: string, studyType: 'focus-group' | 'idi' = 'focus-group'): string {
  // The system prompt establishes AI expertise in brief analysis
  const systemPrompt = `You are an expert Market Research Manager with 15 years of experience at top agencies like Kantar, Ipsos, and Nielsen. Your specialty is analyzing research briefs and extracting the core study title, research topic, and discussion questions for qualitative research execution.`;

  // Task definition for triple extraction
  const taskDefinition = `Your task is to analyze the provided research brief and extract:
1. ONE professional study title that captures the essence of the research objectives
2. ONE clear research topic/stimulus description
3. 6-8 strategic discussion questions for the ${studyType === 'idi' ? 'in-depth interview' : 'focus group discussion'}`;

  // Guidelines for title extraction
  const titleGuidelines = `For the TITLE:
- Extract or create a concise, professional title (maximum 8 words)
- Focus on the primary research objective or business question
- Use industry-standard qualitative research terminology
- Make it suitable for executive presentations and formal reports`;

  // Guidelines for topic extraction
  const topicGuidelines = `For the TOPIC:
- Create a neutral research topic description (1-2 sentences, maximum 50 words)
- Use third-person, objective language - avoid "we," "you," or direct address
- Focus on the single most important research area from the brief
- Write as a research subject statement, not a participant introduction
- Avoid listing multiple research areas - pick the primary focus
- Make it suitable for executive presentations and formal reports
- Keep it professional and suitable for research documentation`;

  // Guidelines for discussion questions
  const questionsGuidelines = `For the DISCUSSION QUESTIONS:
- Create 6-8 strategic questions that address the research objectives from the brief
- Use open-ended, exploratory language ("How", "What", "Why", "Describe", "Tell me about")
- Progress from general to specific topics
- Include both rational and emotional dimensions
- Encourage storytelling and personal experiences
- Avoid leading or biased phrasing
- Include at least one projective or hypothetical scenario question
- Format each question as a moderator would naturally ask it in the session`;

  // Few-shot example using a realistic brief scenario
  const fewShotExample = `
EXAMPLE:
Research Brief: "BAT is experiencing market disruption as traditional cigarette consumption declines while next-generation products show growth. We need to understand adult smokers' motivations and barriers when choosing between traditional cigarettes and NGPs. The research should explore emotional drivers, usage occasions, and brand perceptions to inform our 2026 product strategy and increase market share by 3%."

Expected JSON Output:
{
  "title": "Adult Smoker Product Choice Drivers Study",
  "topic": "Drivers for adult smoker decision-making when choosing between traditional cigarettes and next-generation tobacco products, including evolving preferences and brand perceptions.",
  "questions": [
    "Tell me about your typical smoking routine and how it fits into your daily life.",
    "What factors do you consider when choosing a tobacco product?",
    "How do you feel about the different types of tobacco products available today?",
    "Describe a time when you tried a new tobacco product - what influenced that decision?",
    "What barriers, if any, prevent you from trying next-generation products?",
    "How do your friends and social circle influence your product choices?",
    "If you could design the perfect tobacco product for yourself, what would it look like?",
    "What role do brands play in your decision-making process?"
  ]
}`;

  // Output format specification
  const outputFormatInstruction = `Provide the output as a valid JSON object with three keys:
- "title": A single string containing the study title
- "topic": A single string containing the research topic description
- "questions": An array of strings containing the discussion questions

Do not include any other text, explanation, or preamble before or after the JSON object.`;

  // Assembling the complete prompt
  return `
${systemPrompt}

${taskDefinition}

${titleGuidelines}

${topicGuidelines}

${questionsGuidelines}

${outputFormatInstruction}

${fewShotExample}

--------------------

RESEARCH BRIEF TO ANALYZE:
"${briefText}"

JSON OUTPUT:
`;
}



/**
 * Creates a structured prompt for an AI model to generate 5 personas.
 * @param details - The AIPersonaGeneration object with user inputs.
 * @returns A detailed prompt string ready for an LLM.
 */
export function createPersonaGenerationPrompt(details: AIPersonaGeneration): string {
  // 1. Set the role and expertise for the AI.
  const systemPrompt = `You are an expert persona generator for a market research platform called Insightsim. You specialize in creating realistic, diverse, and insightful user personas based on initial project details. Your output must be a valid JSON array.`;

  // 2. Clearly define the task and constraints.
  const taskDefinition = `Your task is to analyze the user's input and generate an array of 5 distinct personas that fit the target audience. Each persona should represent a different facet or archetype within the target group. The persona's 'goal' field MUST directly reflect the user's stated 'primaryGoals'.`;

  // 3. Provide the user's raw input as clear context.
  const userInputContext = `
---
USER INPUT CONTEXT:
- Problem the Product Solves: "${details.problemSolved}"
- Key Competitors: "${details.competitors}"
- Target Audience Description: "${details.targetDescription}"
- Target Location: "${details.location}"
- User's Primary Goal: "${details.primaryGoals}"
- User's Frustrations: "${details.frustrations}"
---
`;

  // 4. Specify the exact output format using the TypeScript interface and a JSON structure.
  const outputFormatInstruction = `
Your response MUST be a single, valid JSON array containing exactly 5 persona objects. The structure of each object must conform to the following TypeScript interface:
\`\`\`typescript
interface Persona {
  name: string; // e.g., "Alex Chen"
  age?: number; // e.g., 34
  occupation?: string; // e.g., "Project Manager"
  location?: string; // e.g., "New York, USA"
  traits?: string[]; // e.g., ["Organized", "Tech-Savvy", "Time-Poor"]
  archetype?: string; // e.g., "The Overwhelmed Organizer"
  gender?: string; // e.g., "Male"
  bio?: string; // A 1-2 sentence narrative combining their role and key frustrations.
  goal?: string; // This MUST be a version of the user's Primary Goal.
  attitude?: string; // Their general outlook, e.g., "Optimistic but cautious about new apps."
  family_status?: string; // e.g., "Single, living independently"
  education_level?: string; // e.g., "Bachelor's Degree in Communications"
  income_level?: string; // e.g., "PHP 25,000 - 40,000 per month"
  lifestyle?: string; // A brief narrative describing hobbies, routines, and values
  category_products?: string[]; // e.g., ["Metrobank Rewards Visa", "GCash", "BDO Amex"]
  product_relationship?: string; // Qualitative relationship with products used
  category_habits?: string; // Specific behaviors and routines related to product category
}
\`\`\`

The final output should be a JSON array like this: \`[ {persona1}, {persona2}, {persona3}, {persona4}, {persona5} ]\`.
Do not include any other text, explanations, or markdown formatting before or after the JSON array.
`;

  // Assembling the final prompt.
  return `${systemPrompt}\n\n${taskDefinition}\n${userInputContext}\n${outputFormatInstruction}`;
}


/**
 * Creates a structured prompt for an AI model to generate 3-5 personas from a research brief.
 * @param briefText - The original research brief text
 * @param title - The extracted study title
 * @param topic - The extracted research topic
 * @param questions - Array of discussion questions
 * @returns A detailed prompt string ready for an LLM.
 */
export function createBriefPersonaGenerationPrompt(simulation: Simulation): string {
  const briefText: string = simulation.brief_text || '';
  const title: string = simulation.study_title || '';
  const topic: string = simulation.topic || '';
  const questions: string[] = simulation.discussion_questions || [];
  
  // 1. Set the role and expertise for the AI with brief analysis focus
  const systemPrompt = `You are an expert persona generator for qualitative market research with 15 years of experience at top agencies like Kantar and Ipsos. You specialize in analyzing research briefs and creating realistic, diverse personas that represent the target audience described in the brief. Your output must be a valid JSON array.`;

  // 2. Define the task with brief-specific context
  const taskDefinition = `Your task is to analyze the provided research brief and generate 3 distinct personas that represent different segments within the target audience. Each persona should be relevant to the research objectives and capable of providing meaningful insights during the qualitative sessions. The personas should reflect the diversity needed to address all research questions effectively.`;

  // 3. Provide the research context
  const researchContext = `
  ---
  RESEARCH STUDY CONTEXT:
  - Study Title: "${title}"
  - Research Topic: "${topic}"
  - Research Brief: "${briefText}"
  - Key Discussion Areas: ${questions.map((q, i) => `${i + 1}. ${q}`).join('\n  ')}
  ---
  `;

    // 4. Provide persona creation guidelines specific to brief analysis
    const personaGuidelines = `
  PERSONA CREATION GUIDELINES:
  - Extract target audience characteristics from the brief's background and objectives sections
  - Create personas that span different attitudes, behaviors, and demographics within the target group
  - Ensure each persona can meaningfully contribute to discussions about the research topic
  - Include relevant demographic details, motivations, and behavioral patterns mentioned in the brief
  - Make personas realistic and relatable for moderators to work with during sessions
  - Align persona goals and frustrations with the research objectives outlined in the brief
  `;

    // 5. Specify the exact output format
    const outputFormatInstruction = `
  Your response MUST be a single, valid JSON array containing 3-5 persona objects. The structure of each object must conform to the following TypeScript interface:
  \`\`\`typescript
  interface Persona {
    name: string; // e.g., "Sarah Mitchell"
    age?: number; // e.g., 32
    occupation?: string; // e.g., "Marketing Manager"
    location?: string; // e.g., "San Francisco, USA"
    traits?: string[]; // e.g., ["Brand-Conscious", "Price-Sensitive", "Early Adopter"]
    archetype?: string; // e.g., "The Cautious Switcher"
    gender?: string; // e.g., "Female"
    bio?: string; // A 2-3 sentence narrative about their background and relevance to the research
    goal?: string; // Their primary goal related to the research topic
    attitude?: string; // Their perspective on the research topic/category
    family_status?: string; // e.g., "Married with two young children (ages 3 and 5)"
    education_level?: string; // e.g., "Master of Business Administration (MBA)"
    income_level?: string; // e.g., "Upper-middle income bracket"
    lifestyle?: string; // A brief narrative describing hobbies, routines, and values
    category_products?: string[]; // e.g., ["Sunsilk Damage Repair", "Head & Shoulders Cool Menthol"]
    product_relationship?: string; // Qualitative relationship with products used
    category_habits?: string; // Specific behaviors and routines related to product category
  }
  \`\`\`

  The final output should be a JSON array like this: \`[ {persona1}, {persona2}, {persona3}, {persona4}, {persona5} ]\`.
  Do not include any other text, explanations, or markdown formatting before or after the JSON array.
  `;

  // Assembling the final prompt
  return `${systemPrompt}\n\n${taskDefinition}\n${researchContext}\n${personaGuidelines}\n${outputFormatInstruction}`;
}
