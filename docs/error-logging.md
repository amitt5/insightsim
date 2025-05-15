# Error Logging System

This document explains the error logging system implemented in InsightSim to track and debug issues in the application.

## Database Structure

Errors are stored in the `error_logs` table with the following schema:

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source VARCHAR(255) NOT NULL,
  error_message TEXT,
  response_string TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- `id`: Unique identifier for the error log
- `user_id`: ID of the user who encountered the error (if authenticated)
- `source`: Where the error occurred (e.g., component name, function, etc.)
- `error_message`: The actual error message
- `response_string`: Any response data associated with the error (e.g., API response)
- `metadata`: Additional context data stored as JSON (e.g., simulation ID, params, etc.)
- `created_at`: When the error occurred

## How to Log Errors

### Method 1: Using the Utility Functions

```typescript
import { logError, logErrorNonBlocking } from "@/utils/errorLogger";

// Blocking version (awaits the API call)
try {
  // Your code
} catch (error) {
  await logError(
    'component_name', 
    error instanceof Error ? error : String(error),
    responseData,
    { additionalContext: 'value' },
    userId // Optional: explicitly pass a user ID
  );
}

// Non-blocking version (fire and forget)
try {
  // Your code
} catch (error) {
  logErrorNonBlocking(
    'component_name', 
    error instanceof Error ? error : String(error),
    responseData,
    { additionalContext: 'value' },
    userId // Optional: explicitly pass a user ID
  );
}
```

### Method 2: Direct API Call

```typescript
try {
  // Your code
} catch (error) {
  fetch('/api/error-logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'component_name',
      error_message: error instanceof Error ? error.message : String(error),
      response_string: responseData,
      user_id: userId, // Optional: explicitly provide a user ID
      metadata: {
        additionalContext: 'value',
        timestamp: new Date().toISOString()
      }
    })
  });
}
```

## User ID Handling

The system handles user identification in three ways:

1. **Automatic (Server-Side)**: If the user is authenticated and no user_id is provided, the system will use the authenticated user's ID.

2. **Explicit**: You can explicitly provide a user_id in your logging call to associate logs with a specific user.

3. **Anonymous**: If no user_id is provided and there's no authenticated user, the log will be stored without a user association.

## Retrieving Error Logs

Users can retrieve their own error logs via the API:

```typescript
// Get all logs
const response = await fetch('/api/error-logs');
const logs = await response.json();

// Filter by source and limit results
const response = await fetch('/api/error-logs?source=simulation_parser&limit=10');
const logs = await response.json();
```

## Best Practices

1. **Include Source**: Always specify a meaningful source to make it easier to locate where errors occur.

2. **Include Context**: Add relevant metadata like IDs, parameters, or state values to help with debugging.

3. **Sanitize Sensitive Data**: Don't log passwords, auth tokens, or other sensitive information.

4. **Use Non-Blocking When Appropriate**: In user-facing functions where performance matters, use `logErrorNonBlocking`.

5. **Check Response Data Size**: Be careful not to log extremely large response strings that could bloat the database.

6. **User ID Management**: When working in contexts where the user might not be authenticated through the normal flow, consider explicitly providing a user ID. 