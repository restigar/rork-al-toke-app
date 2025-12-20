import { generateObject } from "@rork-ai/toolkit-sdk";
import { z } from "zod";

export interface ModerationResult {
  isAppropriate: boolean;
  reason?: string;
  categories?: {
    sexual: boolean;
    violence: boolean;
    illegal: boolean;
    inappropriate: boolean;
  };
}

export async function moderateImageContent(
  imageUri: string
): Promise<ModerationResult> {
  try {
    console.log('🔍 Moderando contenido de imagen...');
    
    let base64Image = imageUri;
    if (!imageUri.startsWith('data:')) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    const result = await generateObject({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analiza esta imagen y determina si contiene contenido inapropiado. Verifica si hay: contenido sexual explícito o sugestivo, desnudez, violencia gráfica, contenido ilegal, o cualquier otro contenido inapropiado para una aplicación comercial. Responde con true en isAppropriate solo si la imagen es completamente apropiada para uso público.",
            },
            {
              type: "image",
              image: base64Image,
            },
          ],
        },
      ],
      schema: z.object({
        isAppropriate: z
          .boolean()
          .describe("true si la imagen es apropiada para uso público, false si no lo es"),
        reason: z
          .string()
          .describe("Razón breve de por qué la imagen es o no apropiada"),
        categories: z
          .object({
            sexual: z.boolean().describe("true si contiene contenido sexual"),
            violence: z.boolean().describe("true si contiene violencia gráfica"),
            illegal: z.boolean().describe("true si contiene contenido potencialmente ilegal"),
            inappropriate: z.boolean().describe("true si contiene otro contenido inapropiado"),
          })
          .describe("Categorías de contenido detectadas"),
      }),
    });

    console.log('✅ Resultado de moderación:', result);
    
    return {
      isAppropriate: result.isAppropriate,
      reason: result.reason,
      categories: result.categories,
    };
  } catch (error) {
    console.error('❌ Error al moderar contenido:', error);
    return {
      isAppropriate: true,
      reason: 'No se pudo analizar la imagen, se permite por defecto',
    };
  }
}

export async function moderateVideoThumbnail(
  videoUri: string
): Promise<ModerationResult> {
  console.log('🎥 Moderación de video no implementada, se permite por defecto');
  return {
    isAppropriate: true,
    reason: 'Moderación de video no implementada',
  };
}
