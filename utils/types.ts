
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
    brief_source?: 'upload' | 'playing-around' | null;
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
}

export interface AIPersonaGeneration {
  problemSolved: string;
  competitors: string;
  targetDescription: string;
  location: string;
  primaryGoals: string;
  frustrations: string;
}
