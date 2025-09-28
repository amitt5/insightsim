import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export interface BriefAssistantState {
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  isReadyToGenerate: boolean;
  briefGenerated: boolean;
}

export function createBriefAssistantSystemPrompt(): string {
  return `You are an experienced qualitative research consultant with 15+ years of experience at top agencies like Kantar, Ipsos, and Nielsen. Your job is to understand the user's research needs through natural conversation and create a comprehensive brief when you have sufficient information.

Use your judgment to:
- Ask relevant follow-up questions based on what the user shares
- Determine when you have enough information to create a comprehensive brief
- Signal when ready to generate the brief by saying "I have enough information to create your research brief. Would you like me to generate it now?"
- Adapt your questions to the user's expertise level and research context
- Be conversational, professional, and encouraging
- Probe deeper when answers are vague or incomplete
- Build on previous answers to create context and flow

CONVERSATION APPROACH:
- Start naturally - ask what they're working on or what they want to learn
- Follow their lead while ensuring you gather key information
- Cover essential areas: objectives, target audience, research questions, methodology, timeline, success metrics
- But be flexible about the order and depth based on their responses
- Don't force a rigid structure - let the conversation flow naturally

When you have sufficient information to create a comprehensive research brief, clearly indicate that you're ready to generate it.

IMPORTANT: You must respond with valid JSON in this exact format:
{
  "response": "Your conversational response here"
}

The "response" field should contain your natural, conversational reply to the user.`;
}

export function createBriefAssistantPrompt(
  userMessage: string,
  state: BriefAssistantState
): ChatCompletionMessageParam[] {
  const systemPrompt = createBriefAssistantSystemPrompt();
  
  // Build conversation context
  let conversationContext = "CONVERSATION HISTORY:\n";
  state.conversationHistory.slice(-10).forEach(msg => {
    conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
  });
  
  conversationContext += `User's latest message: "${userMessage}"\n\n`;
  
  // Add context about readiness
  if (state.isReadyToGenerate) {
    conversationContext += "NOTE: You previously indicated you have enough information to generate a brief. The user may be asking for the brief or providing additional information.\n\n";
  }
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n${conversationContext}\n\nRespond naturally and conversationally. If you determine you have enough information to create a comprehensive brief, clearly indicate this and ask if they'd like you to generate it now.`
    }
  ];
  
  return messages;
}

export function updateBriefAssistantState(
  currentState: BriefAssistantState,
  userMessage: string,
  assistantResponse: string
): BriefAssistantState {
  const newState = { ...currentState };
  
  // Add to conversation history
  newState.conversationHistory.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: assistantResponse }
  );
  
  // Keep only last 30 messages to avoid token limits
  if (newState.conversationHistory.length > 30) {
    newState.conversationHistory = newState.conversationHistory.slice(-30);
  }
  
  // Check if assistant indicated readiness to generate brief
  const lowerResponse = assistantResponse.toLowerCase();
  if (lowerResponse.includes('enough information') && 
      (lowerResponse.includes('generate') || lowerResponse.includes('create') || lowerResponse.includes('brief'))) {
    newState.isReadyToGenerate = true;
  }
  
  // Check if user is asking for the brief to be generated
  const lowerUserMessage = userMessage.toLowerCase();
  if (lowerUserMessage.includes('generate') || lowerUserMessage.includes('create') || 
      lowerUserMessage.includes('brief') || lowerUserMessage.includes('yes') ||
      lowerUserMessage.includes('please') || lowerUserMessage.includes('go ahead')) {
    newState.isReadyToGenerate = true;
  }
  
  return newState;
}

export function generateBriefFromState(state: BriefAssistantState): string {
  const { conversationHistory } = state;
  
  // Create a prompt for the AI to generate a brief from the conversation
  const conversationText = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
  
  return `# Research Brief

*This brief was generated based on the following conversation:*

---

${conversationText}

---

*Please review and refine this brief as needed. The AI assistant has extracted key information from the conversation above to create this structured brief.*`;
}

export function createBriefGenerationPrompt(conversationHistory: Array<{role: 'user' | 'assistant'; content: string}>): ChatCompletionMessageParam[] {
  const conversationText = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  return [
    {
      role: "system",
      content: `You are an expert market research consultant. Based on the conversation below, create a comprehensive, professional research brief.

The brief should include:
- Project Overview & Business Context
- Research Objectives
- Target Audience
- Key Research Questions
- Proposed Methodology
- Timeline & Resources
- Success Metrics

Format the brief professionally with clear headings and bullet points where appropriate. Extract and organize the key information from the conversation into a structured brief that could be used by a research team.

CONVERSATION:
${conversationText}

IMPORTANT: You must respond with valid JSON in this exact format:
{
  "brief": "Your comprehensive research brief here"
}

The "brief" field should contain the complete, formatted research brief.`
    }
  ];
}

export function createInitialBriefAssistantState(): BriefAssistantState {
  return {
    conversationHistory: [
      {
        role: 'assistant',
        content: "Hello! I'm your AI Brief Assistant, an experienced qualitative research consultant. I'm here to help you create a comprehensive research brief through natural conversation. What are you working on, or what would you like to learn through your research?"
      }
    ],
    isReadyToGenerate: false,
    briefGenerated: false
  };
}
