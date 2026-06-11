import fs from "fs/promises";
import { ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { DEFAULT_MODEL } from "./types.js";
import { coerceStringArray, getModelCapabilities, resolveImageSize, saveImageResult, validateImagePath, validateModelSpecificParams, validateOutputDirectory, } from "./image-utils.js";
import { callEditImage, callGenerateImage, mapOpenAIError } from "./openai-client.js";
export async function handleGenerateImage(request, configMgr, sessionMgr, lastImageState) {
    if (!configMgr.ensureConfigured()) {
        throw new McpError(ErrorCode.InvalidRequest, "OpenAI API token not configured. Use configure_openai_token first.");
    }
    const { prompt, aspectRatio, model, quality, background, size, referenceImages: rawRefImages, inputFidelity, outputDirectory: rawOutputDirectory, } = request.params.arguments;
    const referenceImages = coerceStringArray(rawRefImages) ?? [];
    const hasRefs = referenceImages.length > 0;
    const selectedModel = model || DEFAULT_MODEL;
    getModelCapabilities(selectedModel);
    validateModelSpecificParams(selectedModel, {
        background,
        forEditing: hasRefs,
        referenceImageCount: hasRefs ? referenceImages.length : undefined,
    });
    if (inputFidelity && !hasRefs) {
        throw new McpError(ErrorCode.InvalidParams, "inputFidelity requires referenceImages on generate_image — it controls fidelity to reference images. Omit it for pure text generation.");
    }
    if (inputFidelity && !getModelCapabilities(selectedModel).supportsInputFidelity) {
        throw new McpError(ErrorCode.InvalidParams, `Model ${selectedModel} does not accept inputFidelity (always high-fidelity). Omit the param or use gpt-image-1.5.`);
    }
    if (hasRefs) {
        const validations = await Promise.all(referenceImages.map((p) => validateImagePath(p)));
        const firstInvalid = validations.findIndex((v) => !v.valid);
        if (firstInvalid !== -1) {
            throw new McpError(ErrorCode.InvalidParams, `Reference image error: ${validations[firstInvalid].error ?? "Unknown error"} (${referenceImages[firstInvalid]})`);
        }
    }
    const resolvedSize = resolveImageSize(selectedModel, { aspectRatio, size, context: 'generate' });
    const overrideOutputDir = rawOutputDirectory ? validateOutputDirectory(rawOutputDirectory) : undefined;
    try {
        const sessionId = await sessionMgr.ensureActiveSession({
            aspectRatio,
            origin: 'generate_image',
            description: 'Auto-created from generate_image',
        });
        const session = sessionMgr.getSession(sessionId);
        const result = hasRefs
            ? await callEditImage(configMgr.openai, {
                model: selectedModel,
                prompt,
                size: resolvedSize,
                quality,
                background,
                inputFidelity,
                imagePaths: referenceImages,
            })
            : await callGenerateImage(configMgr.openai, {
                model: selectedModel,
                prompt,
                size: resolvedSize,
                quality,
                background,
            });
        const { savedFiles } = await saveImageResult(result, session, lastImageState, overrideOutputDir);
        if (savedFiles.length > 0) {
            session.lastActivityAt = new Date();
            session.messageCount += savedFiles.length;
        }
        let statusText = `✅ Image generated successfully`;
        if (aspectRatio)
            statusText += `\nAspect Ratio: ${aspectRatio} (size: ${resolvedSize})`;
        else if (resolvedSize !== 'auto')
            statusText += `\nSize: ${resolvedSize}`;
        if (quality)
            statusText += `\nQuality: ${quality}`;
        if (background)
            statusText += `\nBackground: ${background}`;
        if (hasRefs)
            statusText += `\n✅ Reference images used: ${referenceImages.length}`;
        if (savedFiles.length > 0) {
            statusText += `\n\n📁 Saved to:\n${savedFiles.join('\n')}`;
        }
        else {
            statusText += `\n\n⚠️ No image returned by the API`;
        }
        if (session?.isTemporary) {
            statusText += `\n\n💡 Auto-session created (${sessionId}). Images tracked for organization.`;
        }
        return { content: [{ type: "text", text: statusText }] };
    }
    catch (error) {
        throw mapOpenAIError(error, 'generate_image');
    }
}
export async function handleEditImage(request, configMgr, sessionMgr, lastImageState) {
    if (!configMgr.ensureConfigured()) {
        throw new McpError(ErrorCode.InvalidRequest, "OpenAI API token not configured. Use configure_openai_token first.");
    }
    const { imagePath, prompt, referenceImages: rawRefImages, aspectRatio, model, quality, background, inputFidelity, size, outputDirectory: rawOutputDirectory, } = request.params.arguments;
    const referenceImages = coerceStringArray(rawRefImages);
    const selectedModel = model || DEFAULT_MODEL;
    getModelCapabilities(selectedModel);
    const resolvedSize = resolveImageSize(selectedModel, { aspectRatio, size, context: 'edit' });
    const overrideOutputDir = rawOutputDirectory ? validateOutputDirectory(rawOutputDirectory) : undefined;
    const mainImageValidation = await validateImagePath(imagePath);
    if (!mainImageValidation.valid) {
        throw new McpError(ErrorCode.InvalidParams, `Main image error: ${mainImageValidation.error} (${imagePath})`);
    }
    try {
        const sessionId = await sessionMgr.ensureActiveSession({
            aspectRatio,
            origin: 'edit_image',
            description: 'Auto-created from edit_image',
        });
        const session = sessionMgr.getSession(sessionId);
        const validReferenceImages = [];
        const skippedReferenceImages = [];
        if (referenceImages && referenceImages.length > 0) {
            const validations = await Promise.all(referenceImages.map((refPath) => validateImagePath(refPath)));
            validations.forEach((validation, i) => {
                const refPath = referenceImages[i];
                if (validation.valid) {
                    validReferenceImages.push(refPath);
                }
                else {
                    skippedReferenceImages.push({ path: refPath, reason: validation.error || "Unknown error" });
                }
            });
        }
        validateModelSpecificParams(selectedModel, {
            background,
            forEditing: true,
            referenceImageCount: (validReferenceImages.length || 0) + 1,
        });
        if (inputFidelity && !getModelCapabilities(selectedModel).supportsInputFidelity) {
            throw new McpError(ErrorCode.InvalidParams, `Model ${selectedModel} does not accept inputFidelity (always high-fidelity). Omit the param or use gpt-image-1.5.`);
        }
        const result = await callEditImage(configMgr.openai, {
            model: selectedModel,
            prompt,
            size: resolvedSize,
            quality,
            background,
            inputFidelity,
            imagePaths: [imagePath, ...validReferenceImages],
        });
        const { savedFiles } = await saveImageResult(result, session, lastImageState, overrideOutputDir);
        if (savedFiles.length > 0) {
            session.lastActivityAt = new Date();
            session.messageCount += savedFiles.length;
        }
        let statusText = `✅ Image edited successfully`;
        if (aspectRatio)
            statusText += `\nAspect Ratio: ${aspectRatio} (size: ${resolvedSize})`;
        else if (resolvedSize !== 'auto')
            statusText += `\nSize: ${resolvedSize}`;
        if (quality)
            statusText += `\nQuality: ${quality}`;
        if (background)
            statusText += `\nBackground: ${background}`;
        if (validReferenceImages.length > 0)
            statusText += `\n✅ Reference images used: ${validReferenceImages.length}`;
        if (skippedReferenceImages.length > 0)
            statusText += `\n⚠️ Reference images skipped: ${skippedReferenceImages.length}`;
        if (savedFiles.length > 0) {
            statusText += `\n\n📁 Saved to:\n${savedFiles.join('\n')}`;
        }
        else {
            statusText += `\n\n⚠️ No image returned by the API`;
        }
        if (session?.isTemporary) {
            statusText += `\n\n💡 Auto-session created (${sessionId}). Images tracked for organization.`;
        }
        return { content: [{ type: "text", text: statusText }] };
    }
    catch (error) {
        throw mapOpenAIError(error, 'edit_image');
    }
}
export async function handleContinueEditing(request, configMgr, sessionMgr, lastImageState) {
    if (!configMgr.ensureConfigured()) {
        throw new McpError(ErrorCode.InvalidRequest, "OpenAI API token not configured. Use configure_openai_token first.");
    }
    if (!lastImageState.path) {
        throw new McpError(ErrorCode.InvalidRequest, "No previous image found. Please generate or edit an image first, then use continue_editing for subsequent edits.");
    }
    const { prompt, referenceImages: rawRefImagesCE, outputDirectory } = request.params.arguments;
    const referenceImages = coerceStringArray(rawRefImagesCE);
    try {
        await fs.access(lastImageState.path);
    }
    catch {
        throw new McpError(ErrorCode.InvalidRequest, `Last image file not found at: ${lastImageState.path}. Please generate a new image first.`);
    }
    return handleEditImage({
        method: "tools/call",
        params: {
            name: "edit_image",
            arguments: {
                imagePath: lastImageState.path,
                prompt,
                referenceImages,
                outputDirectory,
            },
        },
    }, configMgr, sessionMgr, lastImageState);
}
export async function handleGetLastImageInfo(lastImageState) {
    if (!lastImageState.path) {
        return {
            content: [
                {
                    type: "text",
                    text: "📷 No previous image found.\n\nPlease generate or edit an image first, then this command will show information about your last image.",
                },
            ],
        };
    }
    try {
        await fs.access(lastImageState.path);
        const stats = await fs.stat(lastImageState.path);
        return {
            content: [
                {
                    type: "text",
                    text: `📷 Last Image Information:\n\nPath: ${lastImageState.path}\nFile Size: ${Math.round(stats.size / 1024)} KB\nLast Modified: ${stats.mtime.toLocaleString()}`,
                },
            ],
        };
    }
    catch {
        return {
            content: [
                {
                    type: "text",
                    text: `📷 Last Image Information:\n\nPath: ${lastImageState.path}\nStatus: ❌ File not found\n\n💡 The image file may have been moved or deleted. Please generate a new image.`,
                },
            ],
        };
    }
}
export async function handleSendCreativeMessage(request, configMgr, sessionMgr, lastImageState) {
    if (!configMgr.ensureConfigured()) {
        throw new McpError(ErrorCode.InvalidRequest, "OpenAI API token not configured. Use configure_openai_token first.");
    }
    const { prompt, images: rawImages, sessionId } = request.params.arguments;
    const images = coerceStringArray(rawImages);
    const session = sessionMgr.getSession(sessionId);
    if (!session) {
        const targetId = sessionId || "current";
        throw new McpError(ErrorCode.InvalidRequest, `No active session found (${targetId}). Use start_creative_session first.`);
    }
    const validatedImages = [];
    if (images && images.length > 0) {
        for (const imagePath of images) {
            const validation = await validateImagePath(imagePath);
            if (!validation.valid) {
                throw new McpError(ErrorCode.InvalidParams, `Invalid image: ${validation.error} (${imagePath})`);
            }
            validatedImages.push(imagePath);
        }
    }
    const cfg = session.config;
    const resolvedSize = resolveImageSize(cfg.model, { aspectRatio: cfg.aspectRatio, size: cfg.size, context: validatedImages.length > 0 ? 'edit' : 'generate' });
    validateModelSpecificParams(cfg.model, {
        background: cfg.background,
        forEditing: validatedImages.length > 0,
        referenceImageCount: validatedImages.length > 0 ? validatedImages.length : undefined,
    });
    try {
        const callOpts = {
            model: cfg.model,
            prompt,
            size: resolvedSize,
            quality: cfg.quality,
            background: cfg.background,
        };
        const result = validatedImages.length > 0
            ? await callEditImage(configMgr.openai, { ...callOpts, imagePaths: validatedImages })
            : await callGenerateImage(configMgr.openai, callOpts);
        const { savedFiles } = await saveImageResult(result, session, lastImageState);
        session.lastActivityAt = new Date();
        session.messageCount++;
        let statusText = `✅ Message processed in session ${session.id}`;
        statusText += `\nMessage #${session.messageCount}`;
        if (savedFiles.length > 0) {
            statusText += `\n\n📁 Generated images:\n${savedFiles.join("\n")}`;
        }
        else {
            statusText += `\n\n⚠️ No image returned by the API`;
        }
        return {
            content: [{ type: "text", text: statusText }],
        };
    }
    catch (error) {
        throw mapOpenAIError(error, 'send_creative_message');
    }
}
//# sourceMappingURL=image-tools.js.map