
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
    id: string;
    simulation_id: string;
    name: string;
    occupation: string;
}

