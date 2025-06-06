"use client"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export async function runSimulationAPI(prompt: ChatCompletionMessageParam[], model: string = 'gpt-4o-mini'): Promise<{ reply: string, usage: any, creditInfo: { remaining_credits: number, credits_deducted: number } }> {
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
            throw new Error(errorData.error || 'Failed to run simulation');
        }
        
        const data = await response.json();
        console.log('API Response:', data);

        // Call deduct-credits endpoint after successful simulation
        const deductResponse = await fetch('/api/deduct-credits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                input_tokens: data.usage?.prompt_tokens || 0,
                output_tokens: data.usage?.completion_tokens || 0
            }),
        });

        let creditInfo = { remaining_credits: 0, credits_deducted: 0 };
        if (!deductResponse.ok) {
            console.error('Failed to deduct credits:', await deductResponse.json());
            // Continue with the response even if credit deduction fails
        } else {
            creditInfo = await deductResponse.json();
        }

        return {
            ...data,
            creditInfo
        };
    } catch (error) {
        console.error('Error in runSimulationAPI:', error);
        throw error;
    }
} 