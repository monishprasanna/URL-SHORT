import { GoogleGenAI, Type } from "@google/genai";
import { AliasSuggestion } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateSmartAliases = async (url: string): Promise<AliasSuggestion[]> => {
  if (!ai) {
    console.warn("Gemini API Key is missing.");
    return [
      { alias: "missing-api-key", reason: "Please configure API_KEY to use AI features." }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this URL: "${url}". Generate 3 short, creative, and memorable slug aliases for a URL shortener. 
      The aliases should be URL-safe (hyphens allowed, no spaces, lowercase).
      Explain the reasoning for each briefly.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              alias: { type: Type.STRING, description: "The suggested short slug" },
              reason: { type: Type.STRING, description: "Why this alias fits the content" }
            },
            required: ["alias", "reason"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AliasSuggestion[];
    }
    return [];

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return [];
  }
};
