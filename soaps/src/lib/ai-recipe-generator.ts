import { GoogleGenAI } from "@google/genai";
import { Ingredient } from "@/lib/generated/prisma";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Schema for the expected JSON output
const recipeSchema = {
    type: "OBJECT",
    properties: {
        name: { type: "STRING", description: "A creative name for the soap recipe" },
        notes: { type: "STRING", description: "Description of the scent profile and mood" },
        ingredients: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING", description: "Name of the ingredient (should match inventory if possible)" },
                    quantity: { type: "NUMBER", description: "Quantity in grams" },
                    unit: { type: "STRING", description: "Unit of measurement (default to g)" },
                    reason: { type: "STRING", description: "Why this ingredient was chosen" },
                },
                required: ["name", "quantity", "unit"],
            },
        },
    },
    required: ["name", "notes", "ingredients"],
};

export async function generateRecipeSuggestion(
    userPrompt: string,
    inventory: Ingredient[]
) {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const inventoryList = inventory
        .map((i) => `- ${i.name} (${i.quantity} ${i.unit} available) [${i.type}]`)
        .join("\n");

    const systemPrompt = `
    You are an expert soap maker and perfumer. 
    Your task is to create a "Style" recipe for soap making based on a user's mood or description.
    A "Style" recipe consists mainly of essential oils, fragrances, and additives (clays, botanicals) added to a base soap.
    
    Here is the current inventory of ingredients available:
    ${inventoryList}
    
    GUIDELINES:
    1. PRIORITIZE using ingredients from the inventory.
    2. If a specific scent or effect is requested that cannot be achieved with current inventory, you MAY suggest new ingredients, but please minimize this.
    3. The recipe should be safe for cold process soap making.
    4. Typical usage rates for essential oils in a ~1000g batch are 30-50g total, but adjust based on the specific oils (some are strong).
    5. Output valid JSON matching the schema.
  `;

    try {
        const result = await genAI.models.generateContent({
            model: process.env.GEMINI_TEXT_MODEL || "gemini-flash-latest",
            contents: [
                {
                    role: "system",
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: "user",
                    parts: [{ text: `Create a soap style recipe for this mood/description: "${userPrompt}"` }]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
            },
        });

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
            throw new Error("No response from AI");
        }

        return JSON.parse(responseText);
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error("Failed to generate recipe");
    }
}
