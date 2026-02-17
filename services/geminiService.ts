
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSmartDescription = async (resourceName: string, targetAudience: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a compelling, short, high-conversion description for a digital resource named "${resourceName}" targeting "${targetAudience}". Focus on value and exclusivity. Keep it under 200 characters.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini description generation failed:", error);
    return "Failed to generate description. Please try again.";
  }
};

export const analyzeEngagement = async (stats: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `As a social media strategist, analyze these engagement stats for a content creator: ${JSON.stringify(stats)}. Provide 3 actionable tips to improve the "Unlock Rate". Return as a short bulleted list.`,
      config: {
        temperature: 0.5,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Engagement insights currently unavailable.";
  }
};
