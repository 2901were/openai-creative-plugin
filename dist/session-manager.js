import fs from "fs/promises";
import { randomUUID } from "node:crypto";
import { ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { DEFAULT_MODEL, MAX_SESSIONS, SESSION_TIMEOUT_MS, } from "./types.js";
import { getModelCapabilities, resolveImageSize, validateModelSpecificParams, validateOutputDirectory, } from "./image-utils.js";
import path from "path";
export class SessionManager {
    activeSessions = new Map();
    currentSessionId = null;
    generateSessionId() {
        const randomPart = randomUUID().slice(0, 8);
        return `sess_${randomPart}`;
    }
    cleanupExpiredSessions() {
        const now = new Date();
        const expiredSessions = [];
        for (const [sessionId, session] of this.activeSessions.entries()) {
            const timeSinceLastActivity = now.getTime() - session.lastActivityAt.getTime();
            if (timeSinceLastActivity > SESSION_TIMEOUT_MS) {
                expiredSessions.push(sessionId);
            }
        }
        for (const sessionId of expiredSessions) {
            this.activeSessions.delete(sessionId);
            if (this.currentSessionId === sessionId) {
                this.currentSessionId = null;
            }
        }
    }
    getSession(sessionId) {
        this.cleanupExpiredSessions();
        const targetId = sessionId || this.currentSessionId;
        if (!targetId)
            return null;
        return this.activeSessions.get(targetId) || null;
    }
    async ensureActiveSession(options) {
        this.cleanupExpiredSessions();
        if (this.currentSessionId && this.activeSessions.has(this.currentSessionId)) {
            console.error(`[AUTO] Using current session: ${this.currentSessionId}`);
            return this.currentSessionId;
        }
        if (this.activeSessions.size >= MAX_SESSIONS) {
            throw new McpError(ErrorCode.InvalidRequest, `Maximum number of sessions (${MAX_SESSIONS}) reached. Please end an existing session first using end_creative_session.`);
        }
        const sessionId = this.generateSessionId();
        const now = new Date();
        const session = {
            id: sessionId,
            description: options?.description || 'Auto-created session',
            createdAt: now,
            lastActivityAt: now,
            messageCount: 0,
            generatedImages: [],
            config: {
                model: DEFAULT_MODEL,
                aspectRatio: options?.aspectRatio,
            },
            isTemporary: true,
            origin: options?.origin || 'generate_image',
        };
        this.activeSessions.set(sessionId, session);
        this.currentSessionId = sessionId;
        console.error(`[AUTO] Created temporary session: ${sessionId} (origin: ${options?.origin})`);
        return sessionId;
    }
}
export async function handleStartCreativeSession(request, configMgr, sessionMgr) {
    if (!configMgr.ensureConfigured()) {
        throw new McpError(ErrorCode.InvalidRequest, "OpenAI API token not configured. Use configure_openai_token first.");
    }
    sessionMgr.cleanupExpiredSessions();
    if (sessionMgr.activeSessions.size >= MAX_SESSIONS) {
        throw new McpError(ErrorCode.InvalidRequest, `Maximum number of sessions (${MAX_SESSIONS}) reached. Please end an existing session first using end_creative_session.`);
    }
    const { model, aspectRatio, description, outputDirectory, quality, background, size, } = request.params.arguments;
    const selectedModel = model || DEFAULT_MODEL;
    getModelCapabilities(selectedModel);
    validateModelSpecificParams(selectedModel, { background });
    resolveImageSize(selectedModel, { aspectRatio, size });
    let resolvedOutputDir;
    if (outputDirectory) {
        resolvedOutputDir = validateOutputDirectory(outputDirectory);
        try {
            await fs.mkdir(resolvedOutputDir, { recursive: true, mode: 0o755 });
            const testFile = path.join(resolvedOutputDir, '.test-write-access');
            await fs.writeFile(testFile, '');
            await fs.unlink(testFile);
        }
        catch (error) {
            throw new McpError(ErrorCode.InvalidParams, `Cannot write to output directory ${resolvedOutputDir}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    try {
        const modelCapabilities = getModelCapabilities(selectedModel);
        const sessionId = sessionMgr.generateSessionId();
        const now = new Date();
        const session = {
            id: sessionId,
            description,
            createdAt: now,
            lastActivityAt: now,
            messageCount: 0,
            generatedImages: [],
            config: {
                model: selectedModel,
                aspectRatio,
                outputDirectory: resolvedOutputDir,
                quality,
                background,
                size,
            },
            origin: 'manual',
        };
        sessionMgr.activeSessions.set(sessionId, session);
        sessionMgr.currentSessionId = sessionId;
        let responseText = `✅ Creative session started successfully\n\nSession ID: ${sessionId}`;
        if (description) {
            responseText += `\nDescription: "${description}"`;
        }
        responseText += `\nModel: ${modelCapabilities.displayName}\nAspect Ratio: ${aspectRatio || "default (1:1)"}`;
        if (quality || background || size) {
            responseText += `\n\n⚡ OpenAI Image Settings:`;
            if (quality)
                responseText += `\n  Quality: ${quality}`;
            if (background)
                responseText += `\n  Background: ${background}`;
            if (size)
                responseText += `\n  Size: ${size}`;
        }
        if (resolvedOutputDir) {
            responseText += `\nOutput Directory: ${resolvedOutputDir}`;
        }
        responseText += `\n\n💡 Use send_creative_message to generate images in this session.\n💡 The session will expire after 30 minutes of inactivity.`;
        if (resolvedOutputDir) {
            responseText += `\n💡 All images will be saved to your custom directory.`;
        }
        return {
            content: [{ type: "text", text: responseText }],
        };
    }
    catch (error) {
        if (error instanceof McpError)
            throw error;
        throw new McpError(ErrorCode.InternalError, `Failed to start session: ${error instanceof Error ? error.message : String(error)}`);
    }
}
export async function handleEndCreativeSession(request, sessionMgr) {
    const { sessionId } = request.params.arguments;
    const targetId = sessionId || sessionMgr.currentSessionId;
    if (!targetId) {
        throw new McpError(ErrorCode.InvalidRequest, "No active session to end.");
    }
    const session = sessionMgr.activeSessions.get(targetId);
    if (!session) {
        throw new McpError(ErrorCode.InvalidRequest, `Session not found: ${targetId}`);
    }
    const duration = new Date().getTime() - session.createdAt.getTime();
    const durationMinutes = Math.round(duration / 60000);
    sessionMgr.activeSessions.delete(targetId);
    if (sessionMgr.currentSessionId === targetId) {
        sessionMgr.currentSessionId = null;
    }
    return {
        content: [
            {
                type: "text",
                text: `✅ Session ended: ${targetId}\n\nSession Summary:\n- Duration: ${durationMinutes} minute(s)\n- Messages: ${session.messageCount}\n- Images generated: ${session.generatedImages.length}\n\n💡 Use start_creative_session to start a new session.`,
            },
        ],
    };
}
export async function handleGetSessionInfo(request, sessionMgr) {
    const { sessionId } = request.params.arguments;
    sessionMgr.cleanupExpiredSessions();
    if (sessionId) {
        const session = sessionMgr.activeSessions.get(sessionId);
        if (!session) {
            throw new McpError(ErrorCode.InvalidRequest, `Session not found: ${sessionId}`);
        }
        const duration = new Date().getTime() - session.createdAt.getTime();
        const durationMinutes = Math.round(duration / 60000);
        const timeSinceActivity = new Date().getTime() - session.lastActivityAt.getTime();
        const minutesSinceActivity = Math.round(timeSinceActivity / 60000);
        let detailedInfo = `📊 Session Information\n\nSession ID: ${session.id}`;
        if (session.description) {
            detailedInfo += `\nDescription: "${session.description}"`;
        }
        detailedInfo += `\nStatus: ${session.id === sessionMgr.currentSessionId ? "Active (current)" : "Active"}\nModel: ${session.config.model}\nAspect Ratio: ${session.config.aspectRatio || "default"}`;
        if (session.config.quality)
            detailedInfo += `\nQuality: ${session.config.quality}`;
        if (session.config.background)
            detailedInfo += `\nBackground: ${session.config.background}`;
        if (session.config.size)
            detailedInfo += `\nSize: ${session.config.size}`;
        detailedInfo += `\n\nActivity:\n- Created: ${session.createdAt.toLocaleString()}\n- Last activity: ${session.lastActivityAt.toLocaleString()} (${minutesSinceActivity} min ago)\n- Duration: ${durationMinutes} minute(s)\n- Messages: ${session.messageCount}\n- Images generated: ${session.generatedImages.length}\n\nExpires in: ${30 - minutesSinceActivity} minute(s)`;
        return {
            content: [{ type: "text", text: detailedInfo }],
        };
    }
    else {
        if (sessionMgr.activeSessions.size === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "📊 No active sessions\n\n💡 Use start_creative_session to start a new session.",
                    },
                ],
            };
        }
        let statusText = `📊 Active Sessions (${sessionMgr.activeSessions.size}/${MAX_SESSIONS})\n\n`;
        for (const [id, session] of sessionMgr.activeSessions.entries()) {
            const isCurrent = id === sessionMgr.currentSessionId;
            const duration = new Date().getTime() - session.createdAt.getTime();
            const durationMin = Math.round(duration / 60000);
            const sessionLabel = session.description ? `${id} - "${session.description}"` : id;
            statusText += `${isCurrent ? "▶ " : "  "}${sessionLabel}\n`;
            statusText += `  Messages: ${session.messageCount} | Images: ${session.generatedImages.length} | Duration: ${durationMin}min\n\n`;
        }
        statusText += `💡 Use get_session_info with sessionId for detailed information.`;
        return {
            content: [{ type: "text", text: statusText }],
        };
    }
}
//# sourceMappingURL=session-manager.js.map