import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function generate() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A high-quality, realistic photo of a well-dressed delivery agent at a clean home entrance. A customer is handing over a neatly packed box to the agent. Both have a subtle smile, showing a professional and friendly interaction. Natural lighting, modern home exterior, cinematic quality.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        fs.writeFileSync('agent_pickup_base64.txt', base64Data);
        console.log('SUCCESS');
        return;
      }
    }
    console.log('No image part found');
  } catch (error) {
    console.error('Error generating image:', error);
  }
}

generate();
