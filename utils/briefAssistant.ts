import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export interface BriefAssistantState {
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  isReadyToGenerate: boolean;
  briefGenerated: boolean;
  requirementsMet: {
    primaryResearchQuestion: boolean;
    specificObjectives: boolean;
    targetAudienceBasics: boolean;
    howResultsWillBeUsed: boolean;
    geographicScope: boolean;
  };
  goodToHaveInfo: {
    companyBrandOverview: boolean;
    productServiceDescription: boolean;
    researchPrompt: boolean;
    successCriteria: boolean;
    competitiveContext: boolean;
    specificSegments: boolean;
    previousResearch: boolean;
    stakeholderInfo: boolean;
  };
}

export function createBriefAssistantSystemPrompt(): string {
  return `You are an experienced qualitative research consultant specializing in synthetic respondent studies. Your job is to systematically gather information to create a comprehensive research brief for online studies using AI-generated respondents.

RESEARCH CONTEXT:
This brief is for studies conducted online using synthetic respondents, so DO NOT ask about timeline, budget, or participant recruitment logistics.

MINIMUM REQUIREMENTS (Must have all 5 to generate brief):
1. Primary research question/business decision - The core question driving the research
2. Specific research objectives - What exactly you're trying to learn
3. Target audience basics - Demographics and relationship to brand (users/non-users)
4. How results will be used - Critical for determining methodology and approach
5. Geographic scope - Affects relevance and cultural considerations

GOOD TO HAVE (Ask these after minimums are met):
- Company/brand overview and market position
- Product/service description and key features
- What prompted the research need
- Success criteria and KPIs
- Competitive context and market trends
- Specific segments to compare
- Previous research findings
- Stakeholder information

NICE TO HAVE (Explore if time permits):
- Detailed psychographics
- Hypotheses and assumptions to test
- Internal politics/sensitivities
- Regulatory considerations
- Out of scope specifications
- Success metrics for research impact
- Exclusion criteria for participants

CONVERSATION APPROACH:
- Be systematic but conversational
- Focus on minimum requirements first
- Only indicate readiness when ALL 5 minimum requirements are met
- Ask one focused question at a time
- Probe for specifics when answers are vague
- Be encouraging and professional

When ALL minimum requirements are gathered, say: "Perfect! I now have all the essential information needed to create your research brief. You can generate it using the button on the right."

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
  
  // Add requirement tracking context
  const requirementsStatus = getRequirementsStatus(state);
  conversationContext += `CURRENT REQUIREMENTS STATUS:\n${requirementsStatus}\n\n`;
  console.log(state.isReadyToGenerate, state.isReadyToGenerate);
  // Add context about readiness
  if (state.isReadyToGenerate) {
    conversationContext += "NOTE: All minimum requirements have been met. The user can now generate the brief.\n\n";
  }
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n${conversationContext}\n\nFocus on gathering the missing minimum requirements first. Only indicate readiness when ALL 5 minimum requirements are met.`
    }
  ];
  
  return messages;
}

function getRequirementsStatus(state: BriefAssistantState): string {
  const { requirementsMet } = state;
  
  let status = "MINIMUM REQUIREMENTS:\n";
  status += `1. Primary research question: ${requirementsMet.primaryResearchQuestion ? '✓' : '✗'}\n`;
  status += `2. Specific objectives: ${requirementsMet.specificObjectives ? '✓' : '✗'}\n`;
  status += `3. Target audience basics: ${requirementsMet.targetAudienceBasics ? '✓' : '✗'}\n`;
  status += `4. How results will be used: ${requirementsMet.howResultsWillBeUsed ? '✓' : '✗'}\n`;
  status += `5. Geographic scope: ${requirementsMet.geographicScope ? '✓' : '✗'}\n\n`;
  
  const allMinimumsMet = Object.values(requirementsMet).every(met => met);
  status += `All minimum requirements met: ${allMinimumsMet ? 'YES' : 'NO'}\n\n`;
  
  if (allMinimumsMet) {
    status += "GOOD TO HAVE INFO:\n";
    const { goodToHaveInfo } = state;
    status += `- Company/brand overview: ${goodToHaveInfo.companyBrandOverview ? '✓' : '✗'}\n`;
    status += `- Product/service description: ${goodToHaveInfo.productServiceDescription ? '✓' : '✗'}\n`;
    status += `- Research prompt: ${goodToHaveInfo.researchPrompt ? '✓' : '✗'}\n`;
    status += `- Success criteria: ${goodToHaveInfo.successCriteria ? '✓' : '✗'}\n`;
    status += `- Competitive context: ${goodToHaveInfo.competitiveContext ? '✓' : '✗'}\n`;
    status += `- Specific segments: ${goodToHaveInfo.specificSegments ? '✓' : '✗'}\n`;
    status += `- Previous research: ${goodToHaveInfo.previousResearch ? '✓' : '✗'}\n`;
    status += `- Stakeholder info: ${goodToHaveInfo.stakeholderInfo ? '✓' : '✗'}\n`;
  }
  
  return status;
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
  
  // Update requirements based on conversation content
  updateRequirementsFromConversation(newState, userMessage, assistantResponse);
  
  // Check if all minimum requirements are met
  const allMinimumsMet = Object.values(newState.requirementsMet).every(met => met);
  newState.isReadyToGenerate = allMinimumsMet;
  
  return newState;
}

function updateRequirementsFromConversation(
  state: BriefAssistantState, 
  userMessage: string, 
  assistantResponse: string
): void {
  const combinedText = `${userMessage} ${assistantResponse}`.toLowerCase();
  
  // Check for minimum requirements
  if (containsResearchQuestion(combinedText)) {
    state.requirementsMet.primaryResearchQuestion = true;
  }
  
  if (containsObjectives(combinedText)) {
    state.requirementsMet.specificObjectives = true;
  }
  
  if (containsTargetAudience(combinedText)) {
    state.requirementsMet.targetAudienceBasics = true;
  }
  
  if (containsResultsUsage(combinedText)) {
    state.requirementsMet.howResultsWillBeUsed = true;
  }
  
  if (containsGeographicScope(combinedText)) {
    state.requirementsMet.geographicScope = true;
  }
  
  // Check for good-to-have information
  if (containsCompanyBrandInfo(combinedText)) {
    state.goodToHaveInfo.companyBrandOverview = true;
  }
  
  if (containsProductServiceInfo(combinedText)) {
    state.goodToHaveInfo.productServiceDescription = true;
  }
  
  if (containsResearchPrompt(combinedText)) {
    state.goodToHaveInfo.researchPrompt = true;
  }
  
  if (containsSuccessCriteria(combinedText)) {
    state.goodToHaveInfo.successCriteria = true;
  }
  
  if (containsCompetitiveContext(combinedText)) {
    state.goodToHaveInfo.competitiveContext = true;
  }
  
  if (containsSpecificSegments(combinedText)) {
    state.goodToHaveInfo.specificSegments = true;
  }
  
  if (containsPreviousResearch(combinedText)) {
    state.goodToHaveInfo.previousResearch = true;
  }
  
  if (containsStakeholderInfo(combinedText)) {
    state.goodToHaveInfo.stakeholderInfo = true;
  }
}

// Helper functions to detect requirement content
function containsResearchQuestion(text: string): boolean {
  return text.includes('research question') || text.includes('business decision') || 
         text.includes('what do you want to learn') || text.includes('primary question');
}

function containsObjectives(text: string): boolean {
  return text.includes('objectives') || text.includes('goals') || text.includes('what are you trying to learn');
}

function containsTargetAudience(text: string): boolean {
  return text.includes('target audience') || text.includes('demographics') || 
         text.includes('users') || text.includes('customers') || text.includes('age') || 
         text.includes('gender') || text.includes('location');
}

function containsResultsUsage(text: string): boolean {
  return text.includes('how will you use') || text.includes('results will be used') || 
         text.includes('decision making') || text.includes('actionable insights');
}

function containsGeographicScope(text: string): boolean {
  return text.includes('geographic') || text.includes('country') || text.includes('region') || 
         text.includes('market') || text.includes('location') || text.includes('global') || 
         text.includes('local') || text.includes('national');
}

function containsCompanyBrandInfo(text: string): boolean {
  return text.includes('company') || text.includes('brand') || text.includes('organization') || 
         text.includes('market position') || text.includes('business');
}

function containsProductServiceInfo(text: string): boolean {
  return text.includes('product') || text.includes('service') || text.includes('features') || 
         text.includes('offering');
}

function containsResearchPrompt(text: string): boolean {
  return text.includes('prompted') || text.includes('triggered') || text.includes('need for research') || 
         text.includes('why now');
}

function containsSuccessCriteria(text: string): boolean {
  return text.includes('success criteria') || text.includes('kpis') || text.includes('metrics') || 
         text.includes('measure success');
}

function containsCompetitiveContext(text: string): boolean {
  return text.includes('competitor') || text.includes('competitive') || text.includes('market trends') || 
         text.includes('industry');
}

function containsSpecificSegments(text: string): boolean {
  return text.includes('segments') || text.includes('compare') || text.includes('different groups');
}

function containsPreviousResearch(text: string): boolean {
  return text.includes('previous research') || text.includes('past studies') || 
         text.includes('earlier findings');
}

function containsStakeholderInfo(text: string): boolean {
  return text.includes('stakeholder') || text.includes('decision maker') || text.includes('team');
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
      content: `You are an expert market research consultant specializing in synthetic respondent studies. Based on the conversation below, create a comprehensive, professional research brief for an online study using AI-generated respondents.

IMPORTANT: This is for a SYNTHETIC RESPONDENT STUDY conducted online. DO NOT include any sections about timeline, budget, participant recruitment, or logistics.

The brief should include:
- Project Overview & Business Context
- Primary Research Question & Business Decision
- Specific Research Objectives
- Target Audience Profile (for synthetic respondent generation)
- Key Research Questions
- Methodology (focused on online synthetic respondent approach)
- Geographic Scope & Cultural Considerations
- How Results Will Be Used
- Success Metrics & KPIs
- Additional Context (company info, competitive landscape, etc. if provided)

Format the brief professionally with clear headings and bullet points where appropriate. Focus on information that will help generate appropriate synthetic respondents and conduct meaningful online research.

CONVERSATION:
${conversationText}

IMPORTANT: You must respond with valid JSON in this exact format:
{
  "brief": "Your comprehensive research brief here"
}

The "brief" field should contain the complete, formatted research brief optimized for synthetic respondent studies.`
    }
  ];
}

export function createInitialBriefAssistantState(): BriefAssistantState {
  return {
    conversationHistory: [
      {
        role: 'assistant',
        content: "Hello! I'm your AI Brief Assistant, specializing in synthetic respondent studies. I'll help you create a comprehensive research brief for your online study. Let's start with the most important question: What is the primary research question or business decision you need to make?"
      }
    ],
    isReadyToGenerate: false,
    briefGenerated: false,
    requirementsMet: {
      primaryResearchQuestion: false,
      specificObjectives: false,
      targetAudienceBasics: false,
      howResultsWillBeUsed: false,
      geographicScope: false
    },
    goodToHaveInfo: {
      companyBrandOverview: false,
      productServiceDescription: false,
      researchPrompt: false,
      successCriteria: false,
      competitiveContext: false,
      specificSegments: false,
      previousResearch: false,
      stakeholderInfo: false
    }
  };
}
