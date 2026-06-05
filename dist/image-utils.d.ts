import { ChatSession, ImageBackground, LastImageState, ModelCapabilities } from "./types.js";
export declare function validateImagePath(filePath: string): Promise<{
    valid: boolean;
    error?: string;
}>;
export declare function getMimeType(filePath: string): string;
export declare function getExtensionFromMimeType(mimeType: string): string;
export declare function detectImageFormat(buffer: Buffer): string;
export declare function validateOutputDirectory(dirPath: string): string;
export declare function getImagesDirectory(session?: ChatSession | null): string;
export declare function getModelCapabilities(modelId: string): ModelCapabilities;
export declare const ASPECT_RATIOS: Record<string, number>;
export declare function resolveImageSize(modelId: string, opts: {
    aspectRatio?: string;
    size?: string;
    context?: 'generate' | 'edit';
}): string;
export declare function validateModelSpecificParams(modelId: string, params: {
    background?: ImageBackground;
    referenceImageCount?: number;
    forEditing?: boolean;
}): void;
export declare function coerceStringArray(raw: string[] | string | undefined): string[] | undefined;
export interface ImageCallResult {
    images: Array<{
        b64: string;
    }>;
}
export interface SavedImageResponse {
    savedFiles: string[];
}
export declare function saveImageResult(result: ImageCallResult, session: ChatSession, lastImageState: LastImageState, overrideOutputDirectory?: string): Promise<SavedImageResponse>;
//# sourceMappingURL=image-utils.d.ts.map