import fs from "fs/promises";
import path from "path";
import os from "os";
import { randomUUID } from "node:crypto";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { MODEL_REGISTRY, } from "./types.js";
export async function validateImagePath(filePath) {
    try {
        await fs.access(filePath);
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) {
            return { valid: false, error: "Path is a directory, not a file" };
        }
        const ext = path.extname(filePath).toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        if (!validExtensions.includes(ext)) {
            return {
                valid: false,
                error: `Unsupported format '${ext}'. Supported: ${validExtensions.join(', ')}`,
            };
        }
        return { valid: true };
    }
    catch {
        return { valid: false, error: "File not found or inaccessible" };
    }
}
export function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.webp':
            return 'image/webp';
        default:
            return 'image/jpeg';
    }
}
export function getExtensionFromMimeType(mimeType) {
    switch (mimeType) {
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
        case 'image/webp':
            return '.webp';
        default:
            return '.jpg';
    }
}
export function detectImageFormat(buffer) {
    if (buffer.length >= 3 &&
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8 &&
        buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    if (buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A) {
        return 'image/png';
    }
    if (buffer.length >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50) {
        return 'image/webp';
    }
    return 'image/jpeg';
}
export function validateOutputDirectory(dirPath) {
    if (!path.isAbsolute(dirPath)) {
        throw new McpError(ErrorCode.InvalidParams, `Output directory must be an absolute path. Received: ${dirPath}`);
    }
    const tmpDir = os.tmpdir();
    if (dirPath === tmpDir || dirPath.startsWith(tmpDir + path.sep)) {
        const resolved = path.resolve(dirPath);
        if (resolved !== dirPath) {
            console.warn(`[validateOutputDirectory] Path normalized: ${dirPath} -> ${resolved}`);
        }
        return resolved;
    }
    const dangerous = [
        '/',
        '/System',
        '/usr',
        '/bin',
        '/sbin',
        '/etc',
        '/var',
        '/Library',
        'C:\\Windows',
        'C:\\Program Files',
        'C:\\Program Files (x86)',
    ];
    const normalizedPath = dirPath.toLowerCase();
    for (const dangerousDir of dangerous) {
        if (normalizedPath === dangerousDir.toLowerCase() ||
            normalizedPath.startsWith(dangerousDir.toLowerCase() + path.sep)) {
            throw new McpError(ErrorCode.InvalidParams, `Cannot use system directory as output: ${dirPath}`);
        }
    }
    const resolved = path.resolve(dirPath);
    if (resolved !== dirPath) {
        console.warn(`[validateOutputDirectory] Path normalized: ${dirPath} -> ${resolved}`);
    }
    return resolved;
}
export function getImagesDirectory(session) {
    if (session?.config?.outputDirectory) {
        return session.config.outputDirectory;
    }
    const platform = os.platform();
    const homeDir = os.homedir();
    if (platform === 'win32') {
        return path.join(homeDir, 'Documents', 'openai-creative-images');
    }
    else {
        return path.join(homeDir, 'openai-creative-images');
    }
}
export function getModelCapabilities(modelId) {
    const capabilities = MODEL_REGISTRY[modelId];
    if (!capabilities) {
        const availableModels = Object.keys(MODEL_REGISTRY).join(', ');
        throw new McpError(ErrorCode.InvalidParams, `Unknown model: ${modelId}. Available models: ${availableModels}`);
    }
    return capabilities;
}
export const ASPECT_RATIOS = {
    '1:1': 1,
    '2:3': 2 / 3,
    '3:2': 3 / 2,
    '3:4': 3 / 4,
    '4:3': 4 / 3,
    '4:5': 4 / 5,
    '5:4': 5 / 4,
    '9:16': 9 / 16,
    '16:9': 16 / 9,
    '21:9': 21 / 9,
};
const PRESET_FOR_RATIO = {
    '1:1': '1024x1024',
    '3:2': '1536x1024',
    '2:3': '1024x1536',
};
const SIZE_RE = /^(\d+)x(\d+)$/;
const MAX_EDGE = 3840;
const MAX_PIXELS = 8_294_400;
const MIN_PIXELS = 655_360;
const ARBITRARY_TARGET_PIXELS = 1_048_576;
const round16 = (n) => Math.max(16, Math.round(n / 16) * 16);
export function resolveImageSize(modelId, opts) {
    const caps = getModelCapabilities(modelId);
    if (opts.size) {
        if (opts.size === 'auto' || caps.sizeOptions.includes(opts.size))
            return opts.size;
        if (!caps.supportsArbitrarySize) {
            throw new McpError(ErrorCode.InvalidParams, `Model ${caps.displayName} supports only preset sizes: ${caps.sizeOptions.join(', ')}. ` +
                `For arbitrary WxH sizes use gpt-image-2.`);
        }
        const m = SIZE_RE.exec(opts.size);
        const w = m ? Number(m[1]) : NaN;
        const h = m ? Number(m[2]) : NaN;
        const ratio = w / h;
        if (!m || w % 16 !== 0 || h % 16 !== 0 ||
            ratio > 3 || ratio < 1 / 3 ||
            w > MAX_EDGE || h > MAX_EDGE ||
            w * h > MAX_PIXELS || w * h < MIN_PIXELS) {
            throw new McpError(ErrorCode.InvalidParams, `Invalid size '${opts.size}' for ${caps.displayName}. Rules: WIDTHxHEIGHT, both divisible by 16, ` +
                `aspect ratio between 1:3 and 3:1, max edge ${MAX_EDGE}px, total pixels ${MIN_PIXELS}–${MAX_PIXELS}.`);
        }
        return opts.size;
    }
    if (!opts.aspectRatio)
        return 'auto';
    const ratio = ASPECT_RATIOS[opts.aspectRatio];
    if (ratio === undefined) {
        throw new McpError(ErrorCode.InvalidParams, `Unknown aspect ratio '${opts.aspectRatio}'. Supported: ${Object.keys(ASPECT_RATIOS).join(', ')}.`);
    }
    const preset = PRESET_FOR_RATIO[opts.aspectRatio];
    if (preset)
        return preset;
    if (!caps.supportsArbitrarySize) {
        if (ratio > 1)
            return '1536x1024';
        if (ratio < 1)
            return '1024x1536';
        return '1024x1024';
    }
    const w = round16(Math.sqrt(ARBITRARY_TARGET_PIXELS * ratio));
    const h = round16(Math.sqrt(ARBITRARY_TARGET_PIXELS / ratio));
    return `${w}x${h}`;
}
export function validateModelSpecificParams(modelId, params) {
    const capabilities = getModelCapabilities(modelId);
    if (params.background === 'transparent' && !capabilities.supportsTransparentBackground) {
        throw new McpError(ErrorCode.InvalidParams, `Model ${capabilities.displayName} does not support transparent backgrounds. ` +
            `Use model 'gpt-image-1.5' for background: "transparent" (output is PNG with alpha).`);
    }
    if (params.forEditing && !capabilities.supportsEdits) {
        throw new McpError(ErrorCode.InvalidParams, `Model ${capabilities.displayName} is not available on the image-edits endpoint. ` +
            `Use model 'gpt-image-1.5' for editing and reference-image workflows.`);
    }
    if (params.referenceImageCount !== undefined &&
        params.referenceImageCount > capabilities.maxReferenceImages) {
        throw new McpError(ErrorCode.InvalidParams, `Too many reference images (${params.referenceImageCount}). Model ${capabilities.displayName} ` +
            `supports max ${capabilities.maxReferenceImages} input images.`);
    }
}
export function coerceStringArray(raw) {
    if (raw === undefined)
        return undefined;
    if (Array.isArray(raw))
        return raw;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) &&
            parsed.every((x) => typeof x === 'string')) {
            return parsed;
        }
        return [raw];
    }
    catch {
        return [raw];
    }
}
export async function saveImageResult(result, session, lastImageState, overrideOutputDirectory) {
    const savedFiles = [];
    const imagesDir = overrideOutputDirectory ?? getImagesDirectory(session);
    await fs.mkdir(imagesDir, { recursive: true, mode: 0o755 });
    for (const image of result.images) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const randomId = randomUUID().slice(0, 8);
        const buffer = Buffer.from(image.b64, 'base64');
        const detectedMimeType = detectImageFormat(buffer);
        const ext = getExtensionFromMimeType(detectedMimeType);
        const fileName = `${session.id}-${timestamp}-${randomId}${ext}`;
        const filePath = path.join(imagesDir, fileName);
        await fs.writeFile(filePath, buffer);
        savedFiles.push(filePath);
        session.generatedImages.push(filePath);
        lastImageState.path = filePath;
    }
    return { savedFiles };
}
//# sourceMappingURL=image-utils.js.map