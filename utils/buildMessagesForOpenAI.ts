// import { SimulationMessage, Persona } from "@/types";
import { Persona, SimulationMessage, Simulation, Project,AIPersonaGeneration} from "@/utils/types";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";



export function buildMessagesForOpenAI({
  simulation,
  messages,
  personas,
}: {
  simulation: Simulation,
  messages: SimulationMessage[],
  personas: Persona[],
}, study_type: string, userInstruction?: string, attachedImages?: {url: string, name: string}[], documentTexts?: {id: string, filename: string, text: string, text_length: number}[]) {
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

  // Add image analysis instructions
  systemPrompt += `IMAGE ANALYSIS CAPABILITIES:
When the moderator shares images (photos, documents, screenshots, etc.), participants should:
- Carefully examine and describe what they see in the image
- Relate the image content to the discussion topic
- Share their thoughts, reactions, and opinions about what's shown
- Draw connections between the image and their personal experiences
- Discuss how the image relates to the main research questions
- Be specific about visual details they notice
- Express authentic reactions as their persona would respond

`;

  // Add image analysis instructions
  systemPrompt += `IMAGE ANALYSIS CAPABILITIES:
When the moderator shares images (photos, documents, screenshots, etc.), participants should:
- Carefully examine and describe what they see in the image
- Relate the image content to the discussion topic
- Share their thoughts, reactions, and opinions about what's shown
- Draw connections between the image and their personal experiences
- Discuss how the image relates to the main research questions
- Be specific about visual details they notice
- Express authentic reactions as their persona would respond

`;


  // Add document context if provided (CAG - Context-Augmented Generation)
  if (documentTexts && documentTexts.length > 0) {
    systemPrompt += `ADDITIONAL KNOWLEDGE BASE:
The following information is available to inform your responses naturally:

`;
    
    documentTexts.forEach((doc, index) => {
      systemPrompt += `${doc.text}\n\n`;
    });
    
    systemPrompt += `Use this information naturally in your responses without explicitly mentioning sources or documents.`;

  }

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
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    let name =
      m.sender_type === "moderator"
        ? "Moderator"
        : personaMap[m.sender_id ?? ""] ?? "Unknown";

    // Check if this is the last moderator message and we have attached images or documents
    const isLastMessage = i === messages.length - 1;
    const isModeratorMessage = m.sender_type === "moderator";
    const hasAttachedImages = attachedImages && Array.isArray(attachedImages) && attachedImages.length > 0;
    const hasDocumentTexts = documentTexts && Array.isArray(documentTexts) && documentTexts.length > 0;

    if (isLastMessage && isModeratorMessage && (hasAttachedImages || hasDocumentTexts)) {
      // Format the last moderator message with images and/or document context
      let messageText = `${name}: ${m.message}`;
      
      // Document context is already included in the system prompt as additional knowledge base
      // No need to explicitly mention documents in the message
      
      const content: any[] = [
        { type: "text", text: messageText }
      ];

      // Add each attached image
      if (hasAttachedImages) {
        for (const image of attachedImages) {
          if (image && image.url) {
            content.push({
              type: "image_url",
              image_url: {
                url: image.url
              }
            });
          }
        }
      }

      openAIMessages.push({
        role: "user",
        content: content,
      });
    } else {
      // Regular text-only message
      openAIMessages.push({
        role: m.sender_type === "moderator" ? "user" : "assistant",
        content: `${name}: ${m.message}`,
      });
    }
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
3. Elicit constructive ideas and potential solutions, especially when problems, pain points, or areas for improvement are discussed.
4. Uncover underlying motivations or emotions
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

// Function to build OpenAI prompt for discussion questions from project brief
export function buildDiscussionQuestionsFromBrief(projectBrief: string) {
  return `You are an expert qualitative market researcher.

Generate 6-8 strategic discussion questions for this research study based on the project brief:

Project Brief:
"${projectBrief}"

Create questions that are suitable for qualitative research (focus group discussions or in-depth interviews):
- Use open-ended, exploratory language ("How", "What", "Why", "Describe", "Tell me about")
- Progress from general to specific topics
- Include both rational and emotional dimensions
- Encourage storytelling and personal experiences
- Avoid leading or biased phrasing
- Include at least one projective or hypothetical scenario question
- Extract and respond to the key research objectives, target audience, and product/service context from the brief

Return your response as a JSON object with the following structure:

{
  "questions": [
    "Question 1 text here",
    "Question 2 text here",
    "Question 3 text here"
  ]
}

Format each question as a moderator would naturally ask it in a qualitative research session. Return only valid JSON with no additional text or explanations.`.trim();
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
export function createBriefPersonaGenerationPrompt(simulation: Simulation | Project, selectedSegments?: string[]): string {
  const briefText: string = simulation.brief_text || '';
  const title: string = simulation.study_title || '';
  const topic: string = simulation.topic || '';
  const questions: string[] = simulation.discussion_questions || [];
  
  // 1. Set the role and expertise for the AI with brief analysis focus
  const systemPrompt = `You are an expert persona generator for qualitative market research with 15 years of experience at top agencies like Kantar and Ipsos. You specialize in analyzing research briefs and creating realistic, diverse personas that represent the target audience described in the brief. Your output must be a valid JSON array.`;

  // 2. Define the task with brief-specific context
  let taskDefinition = `Your task is to analyze the provided research brief and generate ${selectedSegments && selectedSegments.length > 0 ? selectedSegments.length : 3} distinct personas that represent different segments within the target audience. Each persona should be relevant to the research objectives and capable of providing meaningful insights during the qualitative sessions. The personas should reflect the diversity needed to address all research questions effectively.`;

  // Add segment-specific guidance if segments are provided
  if (selectedSegments && selectedSegments.length > 0) {
    taskDefinition += `\n\nIMPORTANT: Focus specifically on creating personas that represent the following selected target segments: ${selectedSegments.join(', ')}. Each persona should clearly embody the characteristics and behaviors of one of these segments.`;
  }

  // 3. Provide the research context
  const researchContext = `
  ---
  RESEARCH STUDY CONTEXT:
  - Study Title: "${title}"
  - Research Topic: "${topic}"
  - Research Brief: "${briefText}"
  - Key Discussion Areas: ${questions.map((q, i) => `${i + 1}. ${q}`).join('\n  ')}
  ${selectedSegments && selectedSegments.length > 0 ? `- Selected Target Segments: ${selectedSegments.join(', ')}` : ''}
  ---
  `;

    // 4. Provide persona creation guidelines specific to brief analysis
    let personaGuidelines = `
  PERSONA CREATION GUIDELINES:
  - Extract target audience characteristics from the brief's background and objectives sections
  - Create personas that span different attitudes, behaviors, and demographics within the target group
  - Ensure each persona can meaningfully contribute to discussions about the research topic
  - Include relevant demographic details, motivations, and behavioral patterns mentioned in the brief
  - Make personas realistic and relatable for moderators to work with during sessions
  - Align persona goals and frustrations with the research objectives outlined in the brief`;

  // Add segment-specific guidelines if segments are provided
  if (selectedSegments && selectedSegments.length > 0) {
    personaGuidelines += `
  - Each persona should represent one of the selected target segments: ${selectedSegments.join(', ')}
  - Ensure personas capture the unique characteristics, motivations, and behaviors of their respective segments
  - Make sure the personas are distinct and represent different aspects of the selected segments
  - Align persona traits, goals, and attitudes with the segment they represent`;
  }

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

/**
 * Creates a structured prompt for an AI model to generate target segments from a research brief.
 * @param briefText - The research brief text to analyze
 * @returns A detailed prompt string ready for an LLM.
 */
export function createTargetSegmentGenerationPrompt(briefText: string): string {
  // 1. Set the role and expertise for the AI
  const systemPrompt = `You are an expert market researcher with 15 years of experience at top agencies like Kantar, Ipsos, and Nielsen. You specialize in analyzing research briefs and identifying distinct target audience segments for qualitative research studies.`;

  // 2. Define the task
  const taskDefinition = `Your task is to analyze the provided research brief and generate 4-6 distinct target audience segments that would be relevant for persona creation. Each segment should represent a different facet of the target audience with unique characteristics, motivations, or behaviors.`;

  // 3. Provide guidelines for segment creation
  const segmentGuidelines = `
SEGMENT CREATION GUIDELINES:
- Each segment should be distinct and non-overlapping
- Focus on behavioral, attitudinal, or demographic differences
- Use clear, concise segment names (2-4 words)
- Ensure segments are relevant to the research objectives
- Consider different user needs, pain points, or motivations
- Make segments actionable for persona creation

EXAMPLES OF GOOD SEGMENT NAMES:
- "Health-conscious millennials"
- "Budget-conscious parents"
- "Busy professionals"
- "Sustainability-focused consumers"
- "Tech-savvy early adopters"
- "Price-sensitive traditionalists"
`;

  // 4. Specify the output format
  const outputFormatInstruction = `
Return your response as a valid JSON object with the following structure:

{
  "segments": [
    "Segment Name 1",
    "Segment Name 2",
    "Segment Name 3",
    "Segment Name 4",
    "Segment Name 5",
    "Segment Name 6"
  ]
}

Provide exactly 4-6 segments. Return only valid JSON with no additional text, explanations, or markdown formatting.`;

  // 5. Provide the brief context
  const briefContext = `
RESEARCH BRIEF TO ANALYZE:
"${briefText}"
`;

  // Assembling the final prompt
  return `${systemPrompt}\n\n${taskDefinition}\n${segmentGuidelines}\n${outputFormatInstruction}\n\n${briefContext}\n\nJSON OUTPUT:`;
}

/**
 * Creates a structured prompt for AI to analyze requirements for persona generation.
 * @param briefText - The research brief text to analyze
 * @param selectedSegments - Array of selected target segments
 * @returns A detailed prompt string ready for an LLM.
 */
export function createRequirementsAnalysisPrompt(briefText: string, selectedSegments: string[]): string {
  const systemPrompt = `You are an expert market researcher and consumer psychologist with 15 years of experience at top agencies like Kantar, Ipsos, and Nielsen. You specialize in analyzing target audiences and identifying the psychological, behavioral, and contextual factors that drive their decision-making and discussions.`;

  const taskDefinition = `Your task is to analyze the provided research brief and selected target segments to identify the key psychographic factors, discussion platforms, and search behaviors that would be most relevant for understanding these audiences. This analysis will be used to guide data collection and persona creation.`;

  const researchContext = `
---
RESEARCH CONTEXT:
- Research Brief: "${briefText}"
- Selected Target Segments: ${selectedSegments.join(', ')}
---

ANALYSIS REQUIREMENTS:
For each selected segment, identify:

1. PSYCHOGRAPHIC FACTORS:
   - Core values and beliefs
   - Lifestyle priorities and motivations
   - Attitudes toward the research topic/category
   - Decision-making drivers and pain points
   - Emotional triggers and aspirations

2. DISCUSSION PLATFORMS:
   - Where these people actively discuss relevant topics
   - Online communities, forums, and social platforms
   - Offline gathering places and events
   - Professional networks and associations

3. SEARCH BEHAVIORS:
   - Common search terms and queries they use
   - Information-seeking patterns
   - Content consumption preferences
   - Research and comparison behaviors
`;

  const outputFormat = `
Your response MUST be a valid JSON object with this structure:
\`\`\`json
{
  "psychographics": [
    "Factor 1: Description of psychological driver",
    "Factor 2: Description of behavioral pattern",
    "Factor 3: Description of attitudinal element"
  ],
  "discussionPlatforms": [
    "Platform 1: Description of where discussions happen",
    "Platform 2: Description of community engagement",
    "Platform 3: Description of information sharing"
  ],
  "searchTerms": [
    "Search term 1: Context of when/how used",
    "Search term 2: Context of when/how used",
    "Search term 3: Context of when/how used"
  ]
}
\`\`\`

Focus on insights that are:
- Specific to the research topic and brief
- Relevant to the selected target segments
- Actionable for data collection and persona creation
- Based on real consumer behavior patterns

Do not include any other text, explanations, or markdown formatting before or after the JSON object.
`;

  return `${systemPrompt}\n\n${taskDefinition}\n${researchContext}\n${outputFormat}`;
}

/**
 * Creates a structured prompt for AI to identify specific sources for data collection.
 * @param briefText - The research brief text
 * @param selectedSegments - Array of selected target segments
 * @param analysis - The requirements analysis results
 * @returns A detailed prompt string ready for an LLM.
 */
export function createSourceIdentificationPrompt(briefText: string, selectedSegments: string[], analysis: any): string {
  const systemPrompt = `You are an expert digital ethnographer and social listening specialist with 15 years of experience at agencies like Brandwatch, Sprout Social, and Hootsuite. You specialize in identifying the most valuable online sources for understanding consumer behavior, opinions, and authentic voice.`;

  const taskDefinition = `Your task is to identify specific, actionable sources where we can collect authentic data about the target segments. Based on the requirements analysis, recommend concrete Reddit communities, app review platforms, forums, and search strategies that will yield the most relevant insights for persona creation.`;

  const researchContext = `
---
RESEARCH CONTEXT:
- Research Brief: "${briefText}"
- Selected Target Segments: ${selectedSegments.join(', ')}
- Requirements Analysis: ${JSON.stringify(analysis, null, 2)}
---

SOURCE IDENTIFICATION REQUIREMENTS:
For each selected segment, identify specific sources:

1. REDDIT COMMUNITIES:
   - Exact subreddit names (e.g., r/fitness, r/EatCheapAndHealthy)
   - Why this community is relevant
   - What type of discussions to look for

2. APP REVIEW PLATFORMS:
   - Specific apps they likely use
   - Review platforms (App Store, Google Play, etc.)
   - What to look for in reviews

3. FORUMS & COMMUNITIES:
   - Specific forum names and URLs if possible
   - Professional networks or associations
   - Niche communities relevant to the topic

4. SEARCH STRATEGIES:
   - Specific search queries to use
   - Platforms to search (Google, YouTube, TikTok, etc.)
   - Content types to focus on
`;

  const outputFormat = `
Your response MUST be a valid JSON array with this structure:
\`\`\`json
[
  {
    "segment": "Segment Name",
    "redditCommunities": [
      {
        "name": "r/communityname",
        "relevance": "Why this community is valuable",
        "discussionTypes": "What discussions to look for"
      }
    ],
    "appReviews": [
      {
        "appName": "App Name",
        "platform": "App Store/Google Play/etc",
        "relevance": "Why these reviews matter"
      }
    ],
    "forums": [
      {
        "name": "Forum/Community Name",
        "relevance": "Why this source is valuable",
        "contentTypes": "What content to focus on"
      }
    ],
    "searchQueries": [
      {
        "query": "exact search term",
        "platform": "Google/YouTube/TikTok/etc",
        "context": "When/how this query is used"
      }
    ]
  }
]
\`\`\`

Requirements:
- Be specific and actionable (exact subreddit names, app names, etc.)
- Focus on sources where authentic, unfiltered opinions are shared
- Prioritize sources with active, engaged communities
- Consider both positive and negative sentiment sources
- Include sources that reflect real user experiences and pain points

Do not include any other text, explanations, or markdown formatting before or after the JSON array.
`;

  return `${systemPrompt}\n\n${taskDefinition}\n${researchContext}\n${outputFormat}`;
}
