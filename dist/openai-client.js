import fs from "fs";
import path from "path";
import OpenAI, { toFile } from "openai";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { getMimeType } from "./image-utils.js";
function buildRequestParams(opts) {
    return {
        model: opts.model,
        prompt: opts.prompt,
        size: opts.size,
        n: 1,
        ...(opts.quality ? { quality: opts.quality } : {}),
        ...(opts.background ? { background: opts.background } : {}),
        ...(opts.background === 'transparent' ? { output_format: 'png' } : {}),
    };
}
function toResult(response) {
    const images = (response.data ?? [])
        .filter((d) => typeof d.b64_json === 'string' && d.b64_json.length > 0)
        .map((d) => ({ b64: d.b64_json }));
    return { images };
}
export async function callGenerateImage(client, opts) {
    const response = await client.images.generate(buildRequestParams(opts));
    return toResult(response);
}
export async function callEditImage(client, opts) {
    const files = await Promise.all(opts.imagePaths.map((p) => toFile(fs.createReadStream(p), path.basename(p), { type: getMimeType(p) })));
    const response = await client.images.edit({
        ...buildRequestParams(opts),
        image: files,
        ...(opts.inputFidelity ? { input_fidelity: opts.inputFidelity } : {}),
    });
    return toResult(response);
}
export function mapOpenAIError(error, context) {
    if (error instanceof McpError)
        return error;
    if (error instanceof OpenAI.APIError) {
        const message = error.message ?? '';
        if (error.status === 401) {
            return new McpError(ErrorCode.InvalidRequest, `OpenAI API key rejected (401). Fix OPENAI_API_KEY or re-run configure_openai_token. [${context}]`);
        }
        if (error.status === 403 && /verif/i.test(message)) {
            return new McpError(ErrorCode.InvalidRequest, `Your OpenAI organization must complete Organization Verification before using GPT Image models. ` +
                `Visit platform.openai.com → Settings → Organization → Verification. [${context}]`);
        }
        if (/billing|insufficient.?quota|hard limit/i.test(message)) {
            return new McpError(ErrorCode.InvalidRequest, `OpenAI billing/quota limit reached: ${message} Add credits or raise the usage limit at ` +
                `platform.openai.com → Settings → Billing. [${context}]`);
        }
        if (error.status === 400 && /background/i.test(message)) {
            return new McpError(ErrorCode.InvalidParams, `This model rejected the background parameter (${message}). Transparent backgrounds require ` +
                `model 'gpt-image-1.5'. [${context}]`);
        }
        if (error.status === 400 && /(moderation|safety|content policy)/i.test(message)) {
            return new McpError(ErrorCode.InvalidParams, `Prompt or image blocked by OpenAI moderation: ${message}. Rephrase the prompt. [${context}]`);
        }
        return new McpError(ErrorCode.InternalError, `OpenAI API error (${error.status ?? 'unknown'}): ${message} [${context}]`);
    }
    return new McpError(ErrorCode.InternalError, `${context} failed: ${error instanceof Error ? error.message : String(error)}`);
}
//# sourceMappingURL=openai-client.js.map