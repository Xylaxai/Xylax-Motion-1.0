
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { AspectRatio } from '../types';

interface ImageInput {
  imageBytes: string;
  mimeType: string;
}

const VEO_MODEL = 'veo-3.1-fast-generate-preview';
const VEO_EXTEND_MODEL = 'veo-3.1-generate-preview';
const PRO_MODEL = 'gemini-2.5-pro';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Helper function to create a new Gemini instance
const getGeminiAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- VIDEO GENERATION ---

const processVideoOperation = async (operation: any) => {
    const ai = getGeminiAI();
    let currentOperation = operation;

    while (!currentOperation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
    }

    const operationResponse = currentOperation.response;
    const downloadLink = operationResponse?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download the generated video (status: ${response.status}). Please try again.`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    return { blobUrl, operationResponse };
};


export const generateVideo = async (
  prompt: string,
  aspectRatio: AspectRatio,
  image?: ImageInput
) => {
  const ai = getGeminiAI();
  try {
    const initialOperation = await ai.models.generateVideos({
      model: VEO_MODEL,
      prompt,
      image,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      },
    });
    return await processVideoOperation(initialOperation);
  } catch (error) {
    console.error("Error generating video:", error);
    if (error instanceof Error && error.message.includes("Requested entity was not found.")) {
      throw new Error("API key not found. Please select a valid API key.");
    }
    throw new Error("Failed to generate video. Please check the console for details.");
  }
};

export const extendVideo = async (
    videoObject: any,
    prompt: string,
    aspectRatio: AspectRatio
) => {
    const ai = getGeminiAI();
    try {
        const initialOperation = await ai.models.generateVideos({
            model: VEO_EXTEND_MODEL,
            prompt,
            video: videoObject,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        });
        return await processVideoOperation(initialOperation);
    } catch (error) {
        console.error("Error extending video:", error);
        if (error instanceof Error && error.message.includes("Requested entity was not found.")) {
            throw new Error("API key not found. Please select a valid API key.");
        }
        throw new Error("Failed to extend video. Please check the console for details.");
    }
};


// --- PROMPT & ANALYSIS ---

export const analyzeVideoPrompt = async (prompt: string): Promise<string> => {
    const ai = getGeminiAI();
    const analysisPrompt = `Provide a detailed shot-by-shot analysis and creative critique for a video generated from the following prompt: "${prompt}"`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: PRO_MODEL,
            contents: analysisPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing video prompt:", error);
        throw new Error("Failed to analyze video prompt.");
    }
};

export const getCreativePrompt = async (idea: string): Promise<string> => {
    const ai = getGeminiAI();
    const systemInstruction = `You are a world-class visual director. Based on the user's idea, create a detailed, vivid, and cinematic prompt for an AI video generator. Describe camera angles, lighting, mood, character actions, and environmental details to produce a breathtaking result. Output only the prompt itself.`;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: PRO_MODEL,
            contents: idea,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error getting creative prompt:", error);
        throw new Error("Failed to generate creative prompt.");
    }
};

export const generateShotList = async (idea: string): Promise<string[]> => {
    const ai = getGeminiAI();
    const systemInstruction = `You are a film director creating a shot list. Based on the user's concept, generate a list of 3-5 distinct shots. Each shot should be a concise, actionable prompt for an AI video generator. Start each shot with a shot type (e.g., WIDE SHOT:, MEDIUM SHOT:, CLOSE-UP:). Output each shot on a new line. Do not add any extra explanations or titles.
    Example input: a detective finds a clue in a rainy alley.
    Example output:
    WIDE SHOT: A gritty, rain-slicked alley at night, neon signs reflecting in puddles.
    MEDIUM SHOT: A detective in a trench coat kneels down, inspecting something on the ground.
    CLOSE-UP: The detective's gloved hand picks up a small, glistening object from a puddle.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: PRO_MODEL,
            contents: idea,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        // Split by newline and filter out any empty lines
        return response.text.split('\n').filter(line => line.trim() !== '');
    } catch (error) {
        console.error("Error generating shot list:", error);
        throw new Error("Failed to generate shot list.");
    }
};


// --- AUDIO GENERATION ---

function pcmToWav(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    new Uint8Array(buffer, 44).set(pcmData);

    return new Blob([view], { type: 'audio/wav' });
}

function decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getGeminiAI();
    try {
        const response = await ai.models.generateContent({
            model: TTS_MODEL,
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("Audio generation failed, no data returned.");
        }
        
        const pcmData = decodeBase64(base64Audio);
        // The API returns 24kHz, 1 channel, 16-bit PCM
        const wavBlob = pcmToWav(pcmData, 24000, 1, 16);
        return URL.createObjectURL(wavBlob);

    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech.");
    }
};
