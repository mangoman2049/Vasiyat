import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FloorPlan } from "../types";

// Initialize Gemini API
// Note: In a real app, this should be in an environment variable
// For this demo, we'll ask the user to input it or use a placeholder
let genAI: GoogleGenerativeAI | null = null;

export const initializeGemini = (apiKey: string) => {
    genAI = new GoogleGenerativeAI(apiKey);
};

export const processFloorplanImage = async (file: File, realWidth?: number, unit: 'm' | 'ft' = 'm'): Promise<FloorPlan> => {
    if (!genAI) {
        throw new Error("Gemini API not initialized. Please provide an API key.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert file to base64
    const base64Data = await fileToGenerativePart(file);

    // Get image dimensions to calculate scale
    const imageDimensions = await getImageDimensions(file);

    const prompt = `
    Analyze this floor plan image and extract its structure into a JSON format.
    The JSON should match this TypeScript interface:
    
    interface FloorPlan {
      corners: Record<string, { id: string; x: number; y: number; wallIds: string[] }>;
      walls: Record<string, { id: string; startCornerId: string; endCornerId: string; thickness: number; height: number; type: 'interior' | 'exterior' }>;
      openings: Record<string, { id: string; wallId: string; type: 'door' | 'window'; distanceFromStart: number; width: number; height: number }>;
      rooms: Record<string, { id: string; name: string; type: string; labelPosition: { x: number; y: number } }>;
    }

    Return ONLY the JSON object. Do not include markdown formatting.
    Ensure all IDs are unique strings.
    Coordinates (x, y) should be in pixels relative to the image top-left.
    Dimensions:
    - thickness: in centimeters (e.g., 20 for 20cm). Default to 20 if unknown.
    - width/height (openings): in centimeters.
    - distanceFromStart: in pixels (distance along the wall from start corner).
  `;

    const result = await model.generateContent([prompt, base64Data]);
    const response = await result.response;
    const text = response.text();

    try {
        // Clean up markdown if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        // Calculate scale
        let pixelsPerMeter = 50; // Default
        if (realWidth) {
            const widthInMeters = unit === 'ft' ? realWidth * 0.3048 : realWidth;
            pixelsPerMeter = imageDimensions.width / widthInMeters;
        }

        return {
            ...data,
            id: crypto.randomUUID(),
            name: file.name.replace(/\.[^/.]+$/, ""),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            scale: {
                pixelsPerMeter,
                unit
            }
        };
    } catch (error) {
        console.error("Failed to parse Gemini response:", text);
        throw new Error("Failed to parse floor plan data.");
    }
};

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
            URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
    });
}

async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}
