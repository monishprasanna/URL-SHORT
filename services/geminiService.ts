import { GoogleGenAI, Type } from "@google/genai";
import { AliasSuggestion } from "../types";

export const generateSmartAliases = async (url: string): Promise<AliasSuggestion[]> => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is not set. Skipping Smart Aliases.");
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 3 short, creative, and memorable aliases for this URL: ${url}. The aliases should be URL-safe and concise.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              alias: {
                type: Type.STRING,
                description: 'The suggested short alias (slug).',
              },
              reason: {
                type: Type.STRING,
                description: 'A very short reason why this alias is good.',
              },
            },
            required: ['alias', 'reason'],
          },
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as AliasSuggestion[];
    }
    return [];
  } catch (error) {
    console.error("Error generating aliases:", error);
    return [];
  }
};