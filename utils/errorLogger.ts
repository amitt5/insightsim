/**
 * Utility for logging errors to the database
 */

/**
 * Log an error to the database
 * @param source Source of the error (e.g. component or function name)
 * @param errorMessage Error message to log
 * @param responseString Any response string associated with the error
 * @param metadata Additional metadata to store with the error
 * @param userId Optional user ID to associate with the error
 */
export async function logError(
  source: string,
  errorMessage: string | Error,
  responseString?: string,
  metadata?: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    const errorMsg = errorMessage instanceof Error ? errorMessage.message : errorMessage;
    
    await fetch('/api/error-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source,
        error_message: errorMsg,
        response_string: responseString,
        user_id: userId,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      })
    });
  } catch (error) {
    console.error('Failed to log error to database:', error);
  }
}

/**
 * Log an error without awaiting the result (non-blocking)
 */
export function logErrorNonBlocking(
  source: string,
  errorMessage: string | Error,
  responseString?: string,
  metadata?: Record<string, any>,
  userId?: string
): void {
  void logError(source, errorMessage, responseString, metadata, userId);
} 