import fs from "fs/promises";
import path from "path";
import os from "os";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { ConfigManager, handleConfigureOpenAIToken, handleGetConfigurationStatus } from "./config-manager.js";
import { SessionManager, handleEndCreativeSession, handleGetSessionInfo, handleStartCreativeSession } from "./session-manager.js";
import { handleContinueEditing, handleEditImage, handleGenerateImage, handleGetLastImageInfo, handleSendCreativeMessage, } from "./image-tools.js";
import { handleGetPromptTemplate } from "./prompt-templates.js";
import { TOOL_SCHEMAS } from "./tool-schemas.js";
export class OpenAICreativeMCP {
    server;
    configMgr;
    sessionMgr;
    lastImageState;
    constructor() {
        this.server = new Server({ name: "openai-creative", version: "0.1.0" }, { capabilities: { tools: {} } });
        this.configMgr = new ConfigManager();
        this.sessionMgr = new SessionManager();
        this.lastImageState = { path: null };
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: TOOL_SCHEMAS,
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                switch (request.params.name) {
                    case "configure_openai_token":
                        return await handleConfigureOpenAIToken(request, this.configMgr);
                    case "generate_image":
                        return await handleGenerateImage(request, this.configMgr, this.sessionMgr, this.lastImageState);
                    case "edit_image":
                        return await handleEditImage(request, this.configMgr, this.sessionMgr, this.lastImageState);
                    case "get_configuration_status":
                        return await handleGetConfigurationStatus(this.configMgr);
                    case "continue_editing":
                        return await handleContinueEditing(request, this.configMgr, this.sessionMgr, this.lastImageState);
                    case "get_last_image_info":
                        return await handleGetLastImageInfo(this.lastImageState);
                    case "start_creative_session":
                        return await handleStartCreativeSession(request, this.configMgr, this.sessionMgr);
                    case "send_creative_message":
                        return await handleSendCreativeMessage(request, this.configMgr, this.sessionMgr, this.lastImageState);
                    case "end_creative_session":
                        return await handleEndCreativeSession(request, this.sessionMgr);
                    case "get_session_info":
                        return await handleGetSessionInfo(request, this.sessionMgr);
                    case "get_prompt_template":
                        return await handleGetPromptTemplate(request);
                }
            }
            catch (error) {
                if (error instanceof McpError)
                    throw error;
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        });
    }
    async run() {
        const logFile = path.join(os.homedir(), 'openai-mcp-debug.log');
        const log = (message) => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${message}\n`;
            console.error(message);
            fs.appendFile(logFile, logMessage).catch(() => { });
        };
        try {
            log('[OpenAI Creative Plugin] 🔄 Starting server...');
            await this.configMgr.loadConfig();
            if (this.configMgr.configSource === 'environment') {
                log('[OpenAI Creative Plugin] ✅ Configured via environment variable');
            }
            else if (this.configMgr.configSource === 'config_file') {
                log('[OpenAI Creative Plugin] ✅ Configured via config file');
            }
            else {
                log('[OpenAI Creative Plugin] ⚠️  Not configured - use configure_openai_token tool');
            }
            const transport = new StdioServerTransport();
            log('[OpenAI Creative Plugin] 🔌 Connecting transport...');
            await this.server.connect(transport);
            log('[OpenAI Creative Plugin] 🚀 Server started and ready for connections');
        }
        catch (error) {
            const errorMessage = `[OpenAI Creative Plugin] ❌ Failed to start server: ${error instanceof Error ? error.message : String(error)}`;
            log(errorMessage);
            if (error instanceof Error && error.stack) {
                log(`Stack trace: ${error.stack}`);
            }
            throw error;
        }
    }
}
//# sourceMappingURL=server.js.map