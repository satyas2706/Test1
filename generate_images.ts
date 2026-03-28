import { GoogleGenAI } from "@google/genai";

async function generateImages() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  console.log("Generating Jiffex Store image...");
  const storeResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A high-quality, professional lifestyle photograph of a curated collection of Indian products: elegant fashion jewellery, colorful return gift boxes, traditional Indian sweets in a box, savory snacks (namkeen), and a cricket bat and ball. The items are arranged beautifully on a clean, white organic textured surface. Soft natural lighting, premium and authentic feel.',
        },
      ],
    },
  });

  console.log("Generating Agent Pickup image...");
  const pickupResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A professional delivery person in a clean uniform collecting a cardboard shipping package from a customer at the doorstep of a modern home. The delivery person is smiling and professional. High quality, realistic photography, bright and trustworthy atmosphere.',
        },
      ],
    },
  });

  console.log("Generating Warehouse image...");
  const warehouseResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A modern, clean logistics warehouse in India with organized shelves and packages being consolidated for international shipping. Workers are carefully handling boxes. Bright, professional, and efficient atmosphere.',
        },
      ],
    },
  });

  const images = {
    store: "",
    pickup: "",
    warehouse: ""
  };

  for (const part of storeResponse.candidates[0].content.parts) {
    if (part.inlineData) images.store = `data:image/png;base64,${part.inlineData.data}`;
  }
  for (const part of pickupResponse.candidates[0].content.parts) {
    if (part.inlineData) images.pickup = `data:image/png;base64,${part.inlineData.data}`;
  }
  for (const part of warehouseResponse.candidates[0].content.parts) {
    if (part.inlineData) images.warehouse = `data:image/png;base64,${part.inlineData.data}`;
  }

  console.log(JSON.stringify(images));
}

generateImages();
