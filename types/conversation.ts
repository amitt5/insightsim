export type ConversationRole = 'assistant' | 'user' | 'system';

export interface ConversationTurn {
  role: ConversationRole;
  content: string;
  timestamp?: string;
}

export type ConversationTranscript = ConversationTurn[];


