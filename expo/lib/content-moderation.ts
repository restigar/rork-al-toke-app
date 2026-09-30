/**
 * Moderación de imágenes vía Toolkit V2 (Rork proxy → Vercel AI Gateway).
 * Reemplaza el `generateObject` de @rork-ai/toolkit-sdk (deprecado).
 *
 * Interpretación tolerante: solo se bloquea la imagen cuando el modelo
 * marca explícitamente una categoría grave (sexual, violencia o ilegal).
 * El contenido comercial cotidiano (comida, ofertas, precios, logos)
 * siempre se aprueba.
 */

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

const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL ?? 'https://toolkit.rork.com';
const TOOLKIT_KEY = process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY;

/** Modelo de visión económico y rápido (verificado en catálogo AI Gateway). */
const MODELO_MODERACION = 'openai/gpt-6.1-sol-fast';

const PROMPT_MODERACION = `Eres un moderador de contenido para una app comercial de ofertas y negocios locales. Analiza la imagen y responde ÚNICAMENTE un JSON válido con este formato exacto:
{"isAppropriate": boolean, "reason": "razón breve", "categories": {"sexual": boolean, "violence": boolean, "illegal": boolean, "inappropriate": boolean}}

RECHAZA (isAppropriate: false) únicamente si la imagen contiene: desnudez o contenido sexual explícito o sugestivo, violencia gráfica o gore, promoción clara de actividades ilegales, armas mostradas de forma amenazante, discurso o símbolos de odio, o material perturbador.

APRUEBA SIEMPRE el contenido comercial cotidiano: fotos de comida, bebidas, productos, comercios, logos, carteles de ofertas, precios, texto promocional, personas trabajando o en situaciones cotidianas. Un cartel de ofertas con precios y comida es contenido 100% válido y apropiado.

Ante la duda, aprueba la imagen (isAppropriate: true).`;

/** Convierte una URI local o remota a data URL base64 para enviarla al modelo. */
async function convertirABase64(imageUri: string): Promise<string> {
  if (imageUri.startsWith('data:')) {
    return imageUri;
  }
  const response = await fetch(imageUri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(blob);
  });
}

interface AnalisisModeracion {
  isAppropriate?: boolean;
  reason?: string;
  categories?: {
    sexual?: boolean;
    violence?: boolean;
    illegal?: boolean;
    inappropriate?: boolean;
  };
}

interface RespuestaChat {
  choices?: Array<{ message?: { content?: string } }>;
}

export async function moderateImageContent(
  imageUri: string
): Promise<ModerationResult> {
  try {
    console.log('🔍 Moderando contenido de imagen...');

    const base64Image = await convertirABase64(imageUri);

    const respuesta = await fetch(`${TOOLKIT_URL}/v2/vercel/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // En builds web el runtime reemplaza este valor antes de transportar.
        ...(TOOLKIT_KEY ? { Authorization: `Bearer ${TOOLKIT_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: MODELO_MODERACION,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT_MODERACION },
              { type: 'image_url', image_url: { url: base64Image } },
            ],
          },
        ],
      }),
    });

    if (!respuesta.ok) {
      throw new Error(`El servicio de moderación respondió ${respuesta.status}`);
    }

    const data = (await respuesta.json()) as RespuestaChat;
    const texto = data?.choices?.[0]?.message?.content ?? '{}';
    const analisis: AnalisisModeracion = JSON.parse(texto);

    const categories = {
      sexual: Boolean(analisis.categories?.sexual),
      violence: Boolean(analisis.categories?.violence),
      illegal: Boolean(analisis.categories?.illegal),
      inappropriate: Boolean(analisis.categories?.inappropriate),
    };

    // Tolerante: bloquea solo con categoría grave explícita (evita falsos positivos).
    const categoriaGrave = categories.sexual || categories.violence || categories.illegal;
    const isAppropriate = analisis.isAppropriate !== false || !categoriaGrave;

    console.log(
      '✅ Resultado de moderación:',
      JSON.stringify({ isAppropriate, reason: analisis.reason })
    );

    return { isAppropriate, reason: analisis.reason, categories };
  } catch (error) {
    console.log('ℹ️ Moderación no disponible, se permite la imagen:', error instanceof Error ? error.message : error);
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
