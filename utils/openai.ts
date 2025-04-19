import OpenAI from 'openai';

export function openai() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}