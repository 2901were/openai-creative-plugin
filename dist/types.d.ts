import { z } from "zod";
export declare const ConfigSchema: z.ZodObject<{
    openaiApiKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    openaiApiKey: string;
}, {
    openaiApiKey: string;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export type ImageQuality = 'low' | 'medium' | 'high' | 'auto';
export type ImageBackground = 'transparent' | 'opaque' | 'auto';
export interface ChatSession {
    id: string;
    description?: string;
    createdAt: Date;
    lastActivityAt: Date;
    messageCount: number;
    generatedImages: string[];
    config: {
        model: string;
        aspectRatio?: string;
        outputDirectory?: string;
        quality?: ImageQuality;
        background?: ImageBackground;
        size?: string;
    };
    isTemporary?: boolean;
    origin?: 'manual' | 'generate_image' | 'edit_image' | 'continue_editing';
}
export declare const MAX_SESSIONS = 5;
export declare const SESSION_TIMEOUT_MS: number;
export interface ModelCapabilities {
    id: string;
    displayName: string;
    maxReferenceImages: number;
    supportsTransparentBackground: boolean;
    supportsArbitrarySize: boolean;
    sizeOptions: string[];
    supportsInputFidelity: boolean;
    supportsEdits: boolean;
}
export declare const MODEL_REGISTRY: Record<string, ModelCapabilities>;
export declare const DEFAULT_MODEL = "gpt-image-2";
export interface LastImageState {
    path: string | null;
}
//# sourceMappingURL=types.d.ts.map