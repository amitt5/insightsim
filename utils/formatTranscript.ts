/**
 * Utility functions to format transcript data into readable text format
 * for uploading to Google File Search Store
 */

interface TranscriptMessage {
  role: string;
  text: string;
  turn?: number;
  createdAt?: string;
}

interface SyntheticSimulation {
  simulationId: string;
  messages: TranscriptMessage[];
}

interface HumanInterview {
  respondentId: string;
  name?: string;
  email?: string;
  age?: number | null;
  gender?: string;
  messages: TranscriptMessage[];
  source?: string;
}

/**
 * Format a synthetic simulation transcript to text
 */
export function formatSyntheticTranscript(simulation: SyntheticSimulation): string {
  let text = `=== SYNTHETIC SIMULATION TRANSCRIPT ===\n\n`;
  text += `Simulation ID: ${simulation.simulationId}\n`;
  text += `\n--- Conversation ---\n\n`;

  for (const message of simulation.messages) {
    const roleLabel = message.role === 'moderator' ? 'MODERATOR' : 'PARTICIPANT';
    const turnInfo = message.turn ? `[Turn ${message.turn}]` : '';
    const timestamp = message.createdAt 
      ? new Date(message.createdAt).toLocaleString() 
      : '';
    
    text += `${roleLabel} ${turnInfo}${timestamp ? ` (${timestamp})` : ''}:\n`;
    text += `${message.text}\n\n`;
  }

  return text;
}

/**
 * Format a human interview transcript to text
 */
export function formatHumanTranscript(interview: HumanInterview): string {
  let text = `=== HUMAN INTERVIEW TRANSCRIPT ===\n\n`;
  text += `Interview ID: ${interview.respondentId}\n`;
  
  if (interview.name) {
    text += `Participant: ${interview.name}\n`;
  }
  if (interview.email) {
    text += `Email: ${interview.email}\n`;
  }
  if (interview.age) {
    text += `Age: ${interview.age}\n`;
  }
  if (interview.gender) {
    text += `Gender: ${interview.gender}\n`;
  }
  if (interview.source) {
    text += `Source: ${interview.source}\n`;
  }
  
  text += `\n--- Conversation ---\n\n`;

  for (const message of interview.messages) {
    const roleLabel = message.role === 'moderator' ? 'MODERATOR' : 'RESPONDENT';
    const turnInfo = message.turn ? `[Turn ${message.turn}]` : '';
    const timestamp = message.createdAt 
      ? new Date(message.createdAt).toLocaleString() 
      : '';
    
    text += `${roleLabel} ${turnInfo}${timestamp ? ` (${timestamp})` : ''}:\n`;
    text += `${message.text}\n\n`;
  }

  return text;
}

/**
 * Convert text string to a File-like object for upload
 */
export function textToFile(text: string, filename: string, mimeType: string = 'text/plain'): File {
  const blob = new Blob([text], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

