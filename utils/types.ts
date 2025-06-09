
export interface SimulationMessage {
    id: string;
    simulation_id: string;
    sender_type: 'moderator' | 'participant';
    sender_id: string | null;
    message: string;
    turn_number: number;
    created_at: string;
}

export interface Simulation {
    id: string;
    user_id: string;
    study_title: string;
    study_type: "focus-group" | "idi";
    mode: "ai-both" | "human-mod";
    topic?: string;
    stimulus_media_url?: string;
    discussion_questions?: string[];
    turn_based: boolean;
    num_turns: number;
    status: "Draft" | "Running" | "Completed";
    created_at: string;
    user_instructions?: string;
  }
  
  export interface CalibrationSession {
    id?: string; // UUID
    user_id: string;
    title?: string;
    topic?: string;
    notes?: string;
    transcript_text?: string;
    discussion_questions?: string[];
    stimulus_media_url?: string;
    selected_persona_ids?: string[]; // UUID[]
    transcript_participants?: string[];
    persona_mapping?: Record<string, string>; // e.g. { "Emma Chen": "persona_123" }
    simulated_transcript?: any; // could be JSON or a structured type
    comparison_summary?: string[];
    persona_feedback?: any; // structured feedback, or keep as `any` if freeform JSON
    status: 'in_progress' | 'completed' | string;
    created_at?: string; // ISO timestamp
  }
  
  

export interface Persona {
    id: string
    name: string
    age?: number
    occupation?: string
    traits?: string[]
    archetype?: string
    gender?: string
    bio?: string
    goal?: string
    attitude?: string;
    user_id?: string;
    editable?: boolean;
}


// types/survey.ts

export enum StudyStatus {
  BRIEFING = 'BRIEFING',
  QUESTIONNAIRE_GENERATED = 'QUESTIONNAIRE_GENERATED',
  FIELDWORK_COMPLETE = 'FIELDWORK_COMPLETE',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  RATING_SCALE = 'RATING_SCALE',
  RANKING = 'RANKING',
  OPEN_ENDED = 'OPEN_ENDED',
  YES_NO = 'YES_NO'
}

export interface TargetGroup {
  demographics: {
    ageRange: { min: number; max: number };
    gender: string[];
    income: string[];
    location: string[];
    education: string[];
  };
  psychographics: {
    interests: string[];
    values: string[];
    lifestyle: string[];
  };
  behavioral: {
    purchaseFrequency: string;
    brandLoyalty: string;
    decisionFactors: string[];
  };
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
  order: number;
}

export interface SurveyResponse {
  respondentId: string;
  questionId: string;
  answer: string | number | string[];
  timestamp: Date;
}

export interface Respondent {
  id: string;
  demographics: Record<string, any>;
  psychographics: Record<string, any>;
  behavioral: Record<string, any>;
  isActive: boolean;
}

export interface Survey {
  id: string;
  user_id?: string;
  status?: StudyStatus;
  current_step?: number;
  created_at?: Date;
  updated_at?: Date;
  
  // Product/Service Details
  productName?: string;
  productDescription?: string;
  keyFeatures?: string[];
  primaryBenefit?: string;
  productConfirmed?: boolean;
  
  // Research Objective
  objective?: string;
  successMetrics?: string[];
  objectiveConfirmed?: boolean;
  
  // Market Context
  locations?: string[];
  marketType?: string;
  competitorContext?: string;
  
  // Target Group
  primaryTG?: TargetGroup;
  secondaryTG?: TargetGroup;
  exclusionCriteria?: string;
  tgConfirmed?: boolean;
  
  // Sample Design
  sampleSize?: number;
  confidenceLevel?: number;
  marginOfError?: number;
  demographicSplits?: Record<string, number>;
  
  // Generated Content
  questions?: Question[];
  respondents?: string[]; // Array of respondent IDs
  responses?: SurveyResponse[];
  
  // Analysis Results
  results?: {
    summary?: Record<string, any>;
    demographics?: Record<string, any>;
    verbatims?: Array<{
      questionId?: string;
      respondentId?: string;
      answer?: string;
    }>;
  };
}

export interface BriefingStep {
  step: number;
  title: string;
  isComplete: boolean;
  data: any;
}
