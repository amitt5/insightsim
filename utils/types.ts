
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
    discussion_questions: string[];
    turn_based: boolean;
    num_turns: number;
    status: "Draft" | "Running" | "Completed";
    created_at: string;
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