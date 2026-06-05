import { CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ChatSession } from "./types.js";
import { ConfigManager } from "./config-manager.js";
export declare class SessionManager {
    activeSessions: Map<string, ChatSession>;
    currentSessionId: string | null;
    generateSessionId(): string;
    cleanupExpiredSessions(): void;
    getSession(sessionId?: string): ChatSession | null;
    ensureActiveSession(options?: {
        aspectRatio?: string;
        origin?: 'generate_image' | 'edit_image' | 'continue_editing';
        description?: string;
    }): Promise<string>;
}
export declare function handleStartCreativeSession(request: CallToolRequest, configMgr: ConfigManager, sessionMgr: SessionManager): Promise<CallToolResult>;
export declare function handleEndCreativeSession(request: CallToolRequest, sessionMgr: SessionManager): Promise<CallToolResult>;
export declare function handleGetSessionInfo(request: CallToolRequest, sessionMgr: SessionManager): Promise<CallToolResult>;
//# sourceMappingURL=session-manager.d.ts.map