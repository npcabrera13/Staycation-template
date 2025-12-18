import { GoogleGenAI } from "@google/genai";
import { MOCK_ROOMS } from "../constants";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getConciergeResponse = async (userMessage: string): Promise<string> => {
  if (!apiKey) {
    return "I'm sorry, my AI brain isn't connected right now (Missing API Key). But I can tell you our rooms are lovely!";
  }

  const roomContext = MOCK_ROOMS.map(r => `${r.name}: ${r.description}, Amenities: ${r.amenities.map(a => a.name).join(', ')}`).join('\n');

  const systemPrompt = `
    You are the Virtual Concierge for 'Serenity Staycation'. 
    Your tone is warm, luxurious, and helpful.
    
    Here is the data about our available rooms:
    ${roomContext}

    Answer the guest's questions about our rooms, amenities, or general hospitality. 
    If they ask about location, invent some beautiful scenic details consistent with a luxury staycation.
    Keep answers concise (under 100 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I'm having trouble thinking right now. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I seem to be momentarily unavailable. Please contact the front desk.";
  }
};
