import { z } from "zod";
export const ConfigSchema = z.object({
    openaiApiKey: z.string().min(1, "OpenAI API key is required"),
});
export const MAX_SESSIONS = 5;
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export const MODEL_REGISTRY = {
    'gpt-image-2': {
        id: 'gpt-image-2',
        displayName: 'GPT Image 2',
        maxReferenceImages: 16,
        supportsTransparentBackground: false,
        supportsArbitrarySize: true,
        sizeOptions: ['auto', '1024x1024', '1536x1024', '1024x1536'],
        supportsInputFidelity: false,
        supportsEdits: true,
    },
    'gpt-image-1.5': {
        id: 'gpt-image-1.5',
        displayName: 'GPT Image 1.5',
        maxReferenceImages: 16,
        supportsTransparentBackground: true,
        supportsArbitrarySize: false,
        sizeOptions: ['auto', '1024x1024', '1536x1024', '1024x1536'],
        supportsInputFidelity: true,
        supportsEdits: true,
    },
};
export const DEFAULT_MODEL = 'gpt-image-2';
//# sourceMappingURL=types.js.map