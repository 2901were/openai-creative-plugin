import { CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { LastImageState } from "./types.js";
import { ConfigManager } from "./config-manager.js";
import { SessionManager } from "./session-manager.js";
export declare function handleGenerateImage(request: CallToolRequest, configMgr: ConfigManager, sessionMgr: SessionManager, lastImageState: LastImageState): Promise<CallToolResult>;
export declare function handleEditImage(request: CallToolRequest, configMgr: ConfigManager, sessionMgr: SessionManager, lastImageState: LastImageState): Promise<CallToolResult>;
export declare function handleContinueEditing(request: CallToolRequest, configMgr: ConfigManager, sessionMgr: SessionManager, lastImageState: LastImageState): Promise<CallToolResult>;
export declare function handleGetLastImageInfo(lastImageState: LastImageState): Promise<CallToolResult>;
export declare function handleSendCreativeMessage(request: CallToolRequest, configMgr: ConfigManager, sessionMgr: SessionManager, lastImageState: LastImageState): Promise<CallToolResult>;
//# sourceMappingURL=image-tools.d.ts.map