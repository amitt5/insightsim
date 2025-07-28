import OpenAI from 'openai';

export function openai() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

// export function getTokenCount(model: TiktokenModel, text: string) {
//     const enc = encoding_for_model(model);
//     const tokens = enc.encode(text).length;
//     enc.free();
//     return tokens;
// }

// Define credit rates per 1000 tokens for different models
export const CREDIT_RATES = {
    'gpt-4o-mini': { input: 0.075, output: 0.3, usage: '2 credits per query' },
    'gpt-4o': { input: 1.25, output: 5.0, usage: '50 credits per query' },
    'gpt-4.1-mini': { input: 0.2, output: 0.8, usage: '8 credits per query' },
    'gpt-4.1': { input: 1.0, output: 4.0, usage: '40 credits per query' },
    'gpt-4-vision-preview': { input: 5.0, output: 15.0, usage: '150 credits per query' },
  } as const