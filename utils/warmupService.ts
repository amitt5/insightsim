/**
 * Warm-up utility for PDF processing service
 * Pings the service to prevent cold starts when users are likely to upload documents
 */

const warmUpService = async (): Promise<void> => {
  try {
    const pythonServiceUrl = process.env.NEXT_PUBLIC_PYTHON_PDF_SERVICE_URL || 'http://localhost:8000';
    
    // Fire and forget - don't wait for response
    fetch(`${pythonServiceUrl}/health`, {
      method: 'GET',
      // Add a short timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    }).catch((error) => {
      // Silent fail - don't show errors to user
      console.log('Warm-up ping failed (this is normal):', error.message);
    });
    
    console.log('PDF service warm-up ping sent');
  } catch (error) {
    // Silent fail - don't show errors to user
    console.log('Warm-up ping failed (this is normal):', error);
  }
};

export default warmUpService;
