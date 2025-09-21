"use client"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { logErrorNonBlocking } from "@/utils/errorLogger";

export async function runSimulationAPI(prompt: ChatCompletionMessageParam[], model: string = 'gpt-4o-mini', step?:string): Promise<{ reply: string, usage: any, creditInfo: { remaining_credits: number } }> {
    try {
        const response = await fetch('/api/run-simulation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: prompt,
                model: model
            }),
        });
        
        // Get the raw text first to inspect it
        const text = await response.text();
        // console.log('Raw response:', text.substring(0, 200)); // Log first 200 chars
        
        // Check if response starts with HTML (Vercel error page)
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.trim().startsWith('An error')) {
            console.error('🚨 Received HTML/error page instead of JSON');
            console.error('Full response:', text);
            
            logErrorNonBlocking(
                'simulation_api_html_response',
                'Received non-JSON response (likely timeout)',
                text.substring(0, 500),
                {
                    status: response.status,
                    model,
                    prompt_length: prompt.length,
                    response_started_with: text.substring(0, 50)
                }
            );
            
            throw new Error('Server error: Request likely timed out. Try using a faster model or reducing your prompt length.');
        }
        
        // Now try to parse as JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', text.substring(0, 200));
            
            logErrorNonBlocking(
                'simulation_api_json_parse_error',
                parseError instanceof Error ? parseError.message : String(parseError),
                text.substring(0, 500),
                {
                    status: response.status,
                    model,
                    prompt_length: prompt.length
                }
            );
            
            throw new Error('Invalid response from server. Please try again.');
        }
        
        // Check if response.ok AFTER we know we have valid data
        if (!response.ok) {
            logErrorNonBlocking(
                'simulation_api_response_error',
                data.error || `HTTP ${response.status}`,
                JSON.stringify(data),
                {
                    status: response.status,
                    model,
                    prompt_length: prompt.length
                }
            );
            
            throw new Error(data.error || 'Failed to run simulation');
        }
        
        console.log('API Response:', data);
        
        return {
            ...data,
        };
    } catch (error) {
        console.error('Error in runSimulationAPI:', error);
        
        logErrorNonBlocking(
            'simulation_api_utility_error:' + step,
            error instanceof Error ? error : String(error),
            undefined,
            {
                model,
                prompt_length: prompt.length,
                error_type: error instanceof Error ? error.name : 'unknown_error'
            }
        );
        
        throw error;
    }
}