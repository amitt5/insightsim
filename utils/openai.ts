import OpenAI from 'openai';
import { encoding_for_model, TiktokenModel } from "@dqbd/tiktoken";

export function openai() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

export function getTokenCount(model: TiktokenModel, text: string) {
    const enc = encoding_for_model(model);
    const tokens = enc.encode(text).length;
    enc.free();
    return tokens;
}