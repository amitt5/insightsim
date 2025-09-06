export function extractAndParseJSON(response: string) {
    try {
      return JSON.parse(response);
    } catch {
      // Find JSON boundaries first
      const firstBrace = response.indexOf('{');
      const lastBrace = response.lastIndexOf('}');
      
      if (firstBrace === -1) {
        throw new Error('No JSON object found in response');
      }
      
      // Extract just the JSON part
      let jsonString = response.substring(firstBrace, lastBrace + 1);
      
      // Minimal cleaning on the extracted JSON
      jsonString = jsonString.trim();
      
      // Handle truncation by counting braces and brackets
      let braceCount = 0;
      let bracketCount = 0;
      let lastValidIndex = jsonString.length;
      let inString = false;
      let escaped = false;
      
      // More sophisticated parsing that respects string boundaries
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        
        if (escaped) {
          escaped = false;
          continue;
        }
        
        if (char === '\\' && inString) {
          escaped = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        // Only count structural characters when not inside strings
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          if (char === '[') bracketCount++;
          if (char === ']') bracketCount--;
          
          // If we have balanced braces and brackets, this could be a valid endpoint
          if (braceCount === 0 && bracketCount === 0) {
            lastValidIndex = i + 1;
          }
        }
      }
      
      // If structures aren't balanced (truncated response)
      if (braceCount > 0 || bracketCount > 0) {
        console.warn(`Response appears truncated, missing ${braceCount} closing braces and ${bracketCount} closing brackets`);
        // Truncate to last valid position if we found one
        jsonString = jsonString.substring(0, lastValidIndex);
        // Add missing closing characters
        jsonString += ']'.repeat(bracketCount) + '}'.repeat(braceCount);
      }
      
      // Clean up common JSON formatting issues
      jsonString = cleanupJSONString(jsonString);
      
      console.log('cleaned JSON:', jsonString);
      return JSON.parse(jsonString);
    }
  }
  
  function cleanupJSONString(jsonStr: string): string {
    let cleaned = jsonStr;
    
    // Remove trailing commas before closing brackets/braces
    cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');
    
    // Fix missing commas between array elements (basic pattern matching)
    // This is tricky because we need to avoid strings, but handle common cases
    cleaned = cleaned.replace(/}(\s*)(?=[{\[])/g, '},$1');
    cleaned = cleaned.replace(/](\s*)(?=[{\[])/g, '],$1');
    cleaned = cleaned.replace(/"(\s*)(?="[^"]*":)/g, '",$1');
    
    // Handle cases where objects/arrays end abruptly
    if (!cleaned.endsWith('}') && !cleaned.endsWith(']')) {
      console.warn('Response appears to end abruptly, attempting to close structure');
      
      // Look for the last complete structure
      const lastCompleteObject = cleaned.lastIndexOf('}');
      const lastCompleteArray = cleaned.lastIndexOf(']');
      const lastComplete = Math.max(lastCompleteObject, lastCompleteArray);
      
      if (lastComplete > 0) {
        cleaned = cleaned.substring(0, lastComplete + 1);
      }
    }
    
    return cleaned;
  }
  
  // Alternative approach: Try parsing in chunks to isolate the error
  export function extractAndParseJSONSafe(response: string) {
    try {
      return extractAndParseJSON(response);
    } catch (error) {
      console.warn('Standard extraction failed, trying chunk-based approach:', error);
      
      // Find the JSON boundaries
      const firstBrace = response.indexOf('{');
      const lastBrace = response.lastIndexOf('}');
      
      if (firstBrace === -1) {
        throw new Error('No JSON object found in response');
      }
      
      let jsonString = response.substring(firstBrace, lastBrace + 1);
      
      // Try to find where the error occurs and fix incrementally
      const lines = jsonString.split('\n');
      let validJson = '';
      
      for (let i = 0; i < lines.length; i++) {
        const testJson = validJson + lines[i] + (i < lines.length - 1 ? '\n' : '');
        
        // Try to create a valid JSON by properly closing structures
        const testComplete = ensureValidJSON(testJson);
        
        try {
          JSON.parse(testComplete);
          validJson = testJson;
        } catch (e) {
          // If this line causes an error, try to fix it
          console.warn(`Error at line ${i + 1}: ${lines[i]}`);
          
          // If we have valid JSON so far, try to close it properly
          if (validJson) {
            const finalJson = ensureValidJSON(validJson);
            try {
              return JSON.parse(finalJson);
            } catch {
              // Continue trying with next lines
            }
          }
          break;
        }
      }
      
      // Final attempt with what we have
      const finalJson = ensureValidJSON(validJson);
      return JSON.parse(finalJson);
    }
  }
  
  function ensureValidJSON(jsonStr: string): string {
    let result = jsonStr.trim();
    
    // Count unclosed structures
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < result.length; i++) {
      const char = result[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }
    }
    
    // Close unclosed structures
    result += ']'.repeat(bracketCount) + '}'.repeat(braceCount);
    
    // Clean up formatting issues
    result = result.replace(/,(\s*[\]}])/g, '$1'); // Remove trailing commas
    
    return result;
  }