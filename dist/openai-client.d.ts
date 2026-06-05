import OpenAI from "openai";
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { ImageBackground, ImageQuality } from "./types.js";
import { ImageCallResult } from "./image-utils.js";
export interface ImageCallOptions {
    model: string;
    prompt: string;
    size: string;
    quality?: ImageQuality;
    background?: ImageBackground;
    inputFidelity?: 'high' | 'low';
}
export declare function callGenerateImage(client: OpenAI, opts: ImageCallOptions): Promise<ImageCallResult>;
export declare function callEditImage(client: OpenAI, opts: ImageCallOptions & {
    imagePaths: string[];
}): Promise<ImageCallResult>;
export declare function mapOpenAIError(error: unknown, context: string): McpError;
//# sourceMappingURL=openai-client.d.ts.map