
export interface SimulationMessage {
    id: string;
    simulation_id: string;
    sender_type: 'moderator' | 'participant';
    sender_id: string | null;
    message: string;
    turn_number: number;
    created_at: string;
}

export interface Persona {
    id: string
    name: string
    age?: number
    occupation?: string
    traits?: string[] | string
    archetype?: string
    gender?: string
    bio?: string
    goal?: string
    attitude?: string;
    user_id?: string;
    editable?: boolean;
}