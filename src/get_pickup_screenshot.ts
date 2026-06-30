import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';

async function main() {
  const fileId = '1VbHq1O-l0b0o8GFefCGoLXprMhJnzSXV';
  const downloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
  
  try {
    console.log('Downloading image from Google Drive...');
    const res = await axios.get(downloadUrl, { 
      responseType: 'arraybuffer', 
      headers: { 'User-Agent': 'Mozilla/5.0' } 
    });
    console.log('Download succeeded!');
    
    const base64Data = Buffer.from(res.data).toString('base64');
    
    console.log('Initializing GoogleGenAI client...');
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    const prompt = `
You are analyzing a screenshot of a "Schedule Doorstep Pickup" page in a mobile view.
Please:
1. Describe exactly what you see in this doorstep pickup page image: the headers, buttons, cards, styles, texts, icons, colors, inputs, fields, layout, etc.
2. Note all field inputs, titles, colors, layout patterns, and details.
3. Provide the detailed analysis.
    `;
    
    console.log('Calling Gemini model (gemini-3.5-flash)...');
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png'
          }
        },
        {
          text: prompt
        }
      ]
    });
    
    console.log('Gemini analysis complete!');
    fs.writeFileSync('pickup_analysis.txt', response.text || '');
    console.log('Analysis saved to pickup_analysis.txt');
  } catch (err: any) {
    console.error('Error in main:', err.message);
  }
}

main();
