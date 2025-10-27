# Voice Database Integration - Phase 1

## Overview
This document describes the database schema changes made to support VAPI voice transcripts in the InsightSim platform.

## Database Changes

### New Columns in `human_conversations` Table

#### 1. `message_type` (text)
- **Purpose**: Distinguish between text and voice messages
- **Type**: `text` with CHECK constraint
- **Values**: `'text'` (default) or `'voice'`
- **Default**: `'text'` (maintains backward compatibility)
- **Index**: `human_conversations_message_type_idx`

#### 2. `voice_session_id` (uuid)
- **Purpose**: Group voice messages by interview session
- **Type**: `uuid` (nullable)
- **Usage**: Links multiple voice messages from the same interview session
- **Index**: `human_conversations_voice_session_id_idx`

#### 3. `voice_metadata` (jsonb)
- **Purpose**: Store VAPI-specific metadata and transcript details
- **Type**: `jsonb` with default empty object
- **Content**: VAPI message details, transcript types, confidence scores, etc.
- **Index**: GIN index for efficient JSON queries

## Migration Files

### Forward Migration
- **File**: `migrations/add_voice_support_to_human_conversations.sql`
- **Purpose**: Add voice support columns to existing table
- **Safety**: Uses DEFAULT values to maintain backward compatibility

### Rollback Migration
- **File**: `migrations/rollback_voice_support_from_human_conversations.sql`
- **Purpose**: Remove voice support columns if needed
- **Safety**: Uses `IF EXISTS` to prevent errors

## TypeScript Definitions

### Enhanced Interface
The `HumanConversation` interface now includes:
```typescript
interface HumanConversation {
  // Existing fields...
  message_type: 'text' | 'voice';
  voice_session_id?: string;
  voice_metadata: VoiceMetadata;
}
```

### Voice Metadata Structure
```typescript
interface VoiceMetadata {
  transcriptType?: 'partial' | 'final';
  isInterim?: boolean;
  isFinal?: boolean;
  isAccumulated?: boolean;
  vapiMessageId?: string;
  rawMessage?: any;
  confidence?: number;
  // ... additional fields
}
```

## Backward Compatibility

### Existing Data
- All existing messages will have `message_type = 'text'`
- `voice_session_id` will be `NULL` for existing messages
- `voice_metadata` will be empty object `{}` for existing messages

### Existing API Endpoints
- Current API endpoints continue to work unchanged
- New fields are optional in API requests
- Default values ensure existing functionality is preserved

## Performance Considerations

### Indexes Added
1. **message_type_idx**: Fast filtering by message type
2. **voice_session_id_idx**: Efficient session-based queries
3. **voice_metadata_idx**: GIN index for JSONB queries

### Query Optimization
- Voice messages can be filtered efficiently using `message_type = 'voice'`
- Session-based queries use the `voice_session_id` index
- JSONB queries on voice metadata use the GIN index

## Usage Examples

### Inserting a Voice Message
```sql
INSERT INTO human_conversations (
  project_id, 
  human_respondent_id, 
  sender_type, 
  message, 
  message_order,
  message_type,
  voice_session_id,
  voice_metadata
) VALUES (
  'project-uuid',
  'respondent-uuid',
  'respondent',
  'Hello, this is my voice response',
  1,
  'voice',
  'session-uuid',
  '{"transcriptType": "final", "confidence": 0.95, "isAccumulated": true}'
);
```

### Querying Voice Messages by Session
```sql
SELECT * FROM human_conversations 
WHERE voice_session_id = 'session-uuid' 
ORDER BY created_at ASC;
```

### Querying All Voice Messages
```sql
SELECT * FROM human_conversations 
WHERE message_type = 'voice' 
ORDER BY created_at ASC;
```

## Next Steps (Phase 2+)

1. **API Endpoint Updates**: Modify existing endpoints to handle voice messages
2. **VAPI Integration**: Update useVapi hook to save messages to database
3. **Session Management**: Implement voice session tracking
4. **Batch Processing**: Add efficient batch message saving
5. **Error Handling**: Implement retry logic and offline storage

## Testing

### Migration Testing
1. Run forward migration on test database
2. Verify existing data is unchanged
3. Test inserting voice messages
4. Verify indexes are created
5. Test rollback migration

### Compatibility Testing
1. Verify existing API endpoints still work
2. Test with existing message data
3. Confirm default values are applied correctly
4. Test query performance with new indexes
