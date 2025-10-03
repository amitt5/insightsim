
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
    status: "Draft" | "Active" | "Running" | "Completed";
    active_step?: 1 | 2 | 3 | 4;
    created_at: string;
    user_instructions?: string;
    brief_text?: string;
    project_id?: string; 
    brief_source?: 'upload' | 'playing-around' | null;
  }

  export interface Project {
    id: string;
    user_id: string;
    name: string;
    study_title: string;
    topic?: string;
    objective?: string;
    target_group?: string;
    product?: string;
    brief_text?: string;
    discussion_questions?: string[];
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at?: string;
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
    location?: string
    bio?: string
    goal?: string
    attitude?: string;
    user_id?: string;
    editable?: boolean;
    family_status?: string;
    education_level?: string;
    income_level?: string;
    lifestyle?: string;
    category_products?: string[];
    product_relationship?: string;
    category_habits?: string;
    tags?: string[];
}

export interface AIPersonaGeneration {
  problemSolved: string;
  competitors: string;
  targetDescription: string;
  location: string;
  primaryGoals: string;
  frustrations: string;
}


// Main analysis interface
export interface FocusGroupAnalysis {
  analysis_overview: AnalysisOverview;
  summary_themes: SummaryTheme[];
  key_insights: KeyInsight[];
  research_recommendations: string[];
}

// Analysis overview section
export interface AnalysisOverview {
  summary: string;
  participant_count: number;
  session_topic: string;
  analysis_date: string;
}

// Summary themes section
export interface SummaryTheme {
  theme_title: string;
  theme_description: string;
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  participant_perspectives: ParticipantPerspective[];
}

export interface ParticipantPerspective {
  participant: string;
  perspective: string;
  emotion: 'confident' | 'frustrated' | 'excited' | 'concerned' | 'neutral' | 'surprised' | 'disappointed' | 'hopeful';
}

// Key insights section
export interface KeyInsight {
  insight: string;
  category: 'Behavioral Patterns' | 'Pain Points' | 'Unexpected Findings' | 'Misconceptions' | 'Attitudes';
  supporting_evidence: string[];
  recommended_action: string;
  priority: 'high' | 'medium' | 'low';
}

// RAG Document interfaces
export interface RagDocument {
  id: string;
  project_id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  created_at: string;
  updated_at: string;
}

export interface RagDocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  chunk_embedding?: number[]; // 1536-dimensional vector
  metadata?: Record<string, any>;
  created_at: string;
}

export interface RagDocumentUploadRequest {
  file: File;
  projectId: string;
}

export interface RagDocumentUploadResponse {
  success: boolean;
  document?: RagDocument;
  error?: string;
}

export interface RagDocumentListResponse {
  documents: RagDocument[];
  total: number;
}
