/**
 * Message processing utilities for combining fragmented messages from the same speaker
 * Used by both VAPI real-time processing and database message batch processing
 */

export interface ProcessedMessage {
  id: string;
  message: string;
  sender_type: 'respondent' | 'moderator';
  created_at: string;
  message_order?: number;
  metadata?: {
    timestamp: string;
    isVoice?: boolean;
    vapiMessageId?: string;
    rawMessage?: any;
    transcriptType?: string;
    isInterim?: boolean;
    isFinal?: boolean;
    isAccumulated?: boolean;
    lastUpdate?: string;
  };
}

/**
 * Process a batch of messages to combine consecutive messages from the same speaker
 * Used for database messages that need to be displayed as combined messages
 */
export function processMessagesBatch(messages: ProcessedMessage[]): ProcessedMessage[] {
  if (!messages || messages.length === 0) {
    return [];
  }

  // Sort messages by timestamp to ensure chronological order
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const processedMessages: ProcessedMessage[] = [];
  let currentSpeaker = '';
  let currentMessageGroup: ProcessedMessage | null = null;

  for (const message of sortedMessages) {
    const speakerType = message.sender_type;

    // If same speaker, accumulate the message
    if (currentSpeaker === speakerType && currentMessageGroup) {
      // Combine messages with proper spacing
      const combinedText = `${currentMessageGroup.message} ${message.message}`.replace(/\s+/g, ' ').trim();
      
      // Update the current message group
      currentMessageGroup = {
        id: currentMessageGroup.id,
        message: combinedText,
        sender_type: currentMessageGroup.sender_type,
        created_at: currentMessageGroup.created_at,
        message_order: currentMessageGroup.message_order,
        metadata: {
          timestamp: currentMessageGroup.metadata?.timestamp || new Date().toISOString(),
          isVoice: currentMessageGroup.metadata?.isVoice || false,
          vapiMessageId: currentMessageGroup.metadata?.vapiMessageId,
          rawMessage: currentMessageGroup.metadata?.rawMessage,
          transcriptType: currentMessageGroup.metadata?.transcriptType,
          isInterim: currentMessageGroup.metadata?.isInterim || false,
          isFinal: currentMessageGroup.metadata?.isFinal || false,
          isAccumulated: true,
          lastUpdate: new Date().toISOString(),
          // Preserve voice metadata from the latest message if available
          ...(message.metadata?.isVoice && { isVoice: true }),
          ...(message.metadata?.transcriptType && { transcriptType: message.metadata.transcriptType }),
          ...(message.metadata?.isFinal && { isFinal: message.metadata.isFinal }),
          ...(message.metadata?.isInterim && { isInterim: message.metadata.isInterim })
        }
      };
    } else {
      // Different speaker or first message, start new message group
      if (currentMessageGroup) {
        processedMessages.push(currentMessageGroup);
      }
      
      currentSpeaker = speakerType;
      currentMessageGroup = { ...message };
    }
  }

  // Add the last message group if it exists
  if (currentMessageGroup) {
    processedMessages.push(currentMessageGroup);
  }

  return processedMessages;
}

/**
 * Process a single message in real-time, updating existing messages array
 * Used by VAPI hook for real-time message processing
 */
export function processMessageInSequence(
  newMessage: ProcessedMessage,
  existingMessages: ProcessedMessage[],
  currentSpeaker: string
): { updatedMessages: ProcessedMessage[]; newCurrentSpeaker: string } {
  const speakerType = newMessage.sender_type;
  
  // If same speaker, accumulate the message
  if (currentSpeaker === speakerType) {
    // Find the last message from this speaker
    let lastMessageIndex = -1;
    for (let i = existingMessages.length - 1; i >= 0; i--) {
      if (existingMessages[i].sender_type === speakerType) {
        lastMessageIndex = i;
        break;
      }
    }
    
    if (lastMessageIndex >= 0) {
      const updated = [...existingMessages];
      const existingMessage = updated[lastMessageIndex];
      
      // Combine messages with proper spacing
      const combinedText = `${existingMessage.message} ${newMessage.message}`.replace(/\s+/g, ' ').trim();
      
      updated[lastMessageIndex] = {
        ...existingMessage,
        message: combinedText,
        metadata: {
          ...existingMessage.metadata,
          timestamp: existingMessage.metadata?.timestamp || new Date().toISOString(),
          isAccumulated: true,
          lastUpdate: new Date().toISOString(),
          // Preserve voice metadata from the new message
          ...(newMessage.metadata?.isVoice && { isVoice: true }),
          ...(newMessage.metadata?.transcriptType && { transcriptType: newMessage.metadata.transcriptType }),
          ...(newMessage.metadata?.isFinal && { isFinal: newMessage.metadata.isFinal }),
          ...(newMessage.metadata?.isInterim && { isInterim: newMessage.metadata.isInterim })
        }
      };
      
      return {
        updatedMessages: updated,
        newCurrentSpeaker: currentSpeaker
      };
    }
  }
  
  // Different speaker or first message, add as new message
  const updatedMessages = [...existingMessages, newMessage];
  
  return {
    updatedMessages,
    newCurrentSpeaker: speakerType
  };
}

/**
 * Helper function to check if a message should be combined with previous messages
 * Used for determining when to start a new message group
 */
export function shouldCombineWithPrevious(
  currentMessage: ProcessedMessage,
  previousMessage: ProcessedMessage | null,
  timeThreshold: number = 5000 // 5 seconds
): boolean {
  if (!previousMessage) {
    return false;
  }

  // Same speaker
  if (currentMessage.sender_type !== previousMessage.sender_type) {
    return false;
  }

  // Within time threshold
  const timeDiff = new Date(currentMessage.created_at).getTime() - new Date(previousMessage.created_at).getTime();
  if (timeDiff > timeThreshold) {
    return false;
  }

  // Not already accumulated (avoid double accumulation)
  if (previousMessage.metadata?.isAccumulated) {
    return false;
  }

  return true;
}
