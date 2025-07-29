"use client"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { logErrorNonBlocking } from "@/utils/errorLogger";

export async function runSimulationAPI(prompt: ChatCompletionMessageParam[], model: string = 'gpt-4o-mini'): Promise<{ reply: string, usage: any, creditInfo: { remaining_credits: number } }> {
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
        
        if (!response.ok) {
            const errorData = await response.json();
            
            // Log API response error
            logErrorNonBlocking(
                'simulation_api_response_error',
                errorData.error || `HTTP ${response.status}`,
                JSON.stringify(errorData),
                {
                    status: response.status,
                    model,
                    prompt_length: prompt.length
                }
            );
            
            throw new Error(errorData.error || 'Failed to run simulation');
        }
        
        const data = await response.json();
        console.log('API Response:', data);

        // Call deduct-credits endpoint after successful simulation
        // const deductResponse = await fetch('/api/deduct-credits', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({
        //         model: model,
        //         input_tokens: data.usage?.prompt_tokens || 0,
        //         output_tokens: data.usage?.completion_tokens || 0
        //     }),
        // });

        // let creditInfo = { remaining_credits: 0, credits_deducted: 0 };
        // if (!deductResponse.ok) {
        //     const deductErrorData = await deductResponse.json();
        //     console.error('Failed to deduct credits:', deductErrorData);
            
        //     // Log credit deduction error
        //     logErrorNonBlocking(
        //         'credit_deduction_api_error',
        //         deductErrorData.error || `HTTP ${deductResponse.status}`,
        //         JSON.stringify(deductErrorData),
        //         {
        //             status: deductResponse.status,
        //             model,
        //             input_tokens: data.usage?.prompt_tokens || 0,
        //             output_tokens: data.usage?.completion_tokens || 0
        //         }
        //     );
            
        //     // Continue with the response even if credit deduction fails
        // } else {
        //     creditInfo = await deductResponse.json();
        // }

        return {
            ...data,
            // creditInfo
        };
    } catch (error) {
        console.error('Error in runSimulationAPI:', error);
        
        // Log the API utility error
        logErrorNonBlocking(
            'simulation_api_utility_error',
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