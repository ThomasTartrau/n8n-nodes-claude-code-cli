import type { IExecuteFunctions } from "n8n-workflow";

/**
 * Creates a minimal IExecuteFunctions-like object for testing.
 * This is NOT a mock - it's a real implementation with controlled data.
 *
 * @param params - Record of parameter names to values
 * @returns An object that implements the getNodeParameter method
 */
export function createTestContext(
	params: Record<string, unknown>,
): Pick<IExecuteFunctions, "getNodeParameter"> {
	return {
		getNodeParameter(
			parameterName: string,
			_itemIndex: number,
			fallbackValue?: unknown,
		): unknown {
			if (parameterName in params) {
				return params[parameterName];
			}
			return fallbackValue;
		},
	} as Pick<IExecuteFunctions, "getNodeParameter">;
}

/**
 * Default test parameters for executePrompt operation
 */
export const defaultExecutePromptParams: Record<string, unknown> = {
	prompt: "Hello, Claude!",
	model: "",
	toolPermissions: {},
	options: {},
};

/**
 * Parameters for executeWithContext operation
 */
export const executeWithContextParams: Record<string, unknown> = {
	prompt: "Analyze this code",
	model: "claude-sonnet-4-20250514",
	toolPermissions: {
		allowedTools: "Read,Write",
	},
	contextFiles: {
		files: [
			{ path: "/project/src/main.ts" },
			{ path: "/project/src/utils.ts" },
		],
	},
	additionalDirs: "/project/tests",
	options: {
		outputFormat: "json",
		workingDirectory: "/project",
		maxTurns: 10,
		systemPrompt: "Be concise",
	},
};

/**
 * Parameters for continueSession operation
 */
export const continueSessionParams: Record<string, unknown> = {
	prompt: "Continue from where we left off",
	model: "",
	toolPermissions: {},
	options: {},
};

/**
 * Parameters for resumeSession operation
 */
export const resumeSessionParams: Record<string, unknown> = {
	prompt: "Resume this specific session",
	sessionId: "sess-abc123",
	model: "",
	toolPermissions: {},
	options: {},
};

/**
 * Parameters with custom model
 */
export const customModelParams: Record<string, unknown> = {
	prompt: "Test prompt",
	model: "custom",
	customModel: "claude-custom-model",
	toolPermissions: {},
	options: {},
};

/**
 * Parameters with tool permissions
 */
export const toolPermissionsParams: Record<string, unknown> = {
	prompt: "Test with tools",
	model: "",
	toolPermissions: {
		allowedTools: "Read, Write, Bash",
		disallowedTools: "WebFetch",
	},
	options: {},
};

/**
 * Parameters with a single subagent (minimal fields)
 */
export const singleAgentParams: Record<string, unknown> = {
	prompt: "Test with agents",
	model: "",
	toolPermissions: {},
	options: {},
	agents: {
		agentsList: [
			{
				name: "code-reviewer",
				description: "Expert code reviewer",
				prompt: "You are a senior code reviewer.",
				model: "inherit",
				tools: "",
				disallowedTools: "",
				permissionMode: "",
				maxTurns: 0,
				memory: "",
			},
		],
	},
};

/**
 * Parameters with a fully configured subagent
 */
export const fullAgentParams: Record<string, unknown> = {
	prompt: "Test with full agent",
	model: "",
	toolPermissions: {},
	options: {},
	agents: {
		agentsList: [
			{
				name: "debugger",
				description: "Expert debugger for tracing issues",
				prompt: "You are a debugging specialist.",
				model: "sonnet",
				tools: "Read, Grep, Glob, Bash(git:*)",
				disallowedTools: "Write, Edit",
				permissionMode: "plan",
				maxTurns: 15,
				memory: "project",
			},
		],
	},
};

/**
 * Parameters with multiple subagents
 */
export const multipleAgentsParams: Record<string, unknown> = {
	prompt: "Test with multiple agents",
	model: "",
	toolPermissions: {},
	options: {},
	agents: {
		agentsList: [
			{
				name: "reviewer",
				description: "Reviews code",
				prompt: "You review code.",
				model: "inherit",
				tools: "",
				disallowedTools: "",
				permissionMode: "",
				maxTurns: 0,
				memory: "",
			},
			{
				name: "architect",
				description: "Designs architecture",
				prompt: "You design systems.",
				model: "opus",
				tools: "Read, Grep",
				disallowedTools: "",
				permissionMode: "delegate",
				maxTurns: 10,
				memory: "user",
			},
		],
	},
};

/**
 * Parameters with empty agents list
 */
export const emptyAgentsParams: Record<string, unknown> = {
	prompt: "Test without agents",
	model: "",
	toolPermissions: {},
	options: {},
	agents: { agentsList: [] },
};

/**
 * Parameters with new CLI flags (system prompt file, verbose, max budget, json schema, fallback model)
 */
export const newFlagsParams: Record<string, unknown> = {
	prompt: "Test with new flags",
	model: "",
	toolPermissions: {},
	options: {
		systemPromptFile: "/path/to/system-prompt.txt",
		verbose: true,
		maxBudgetUsd: 10.5,
		jsonSchema: '{"type":"object","properties":{"result":{"type":"string"}}}',
		fallbackModel: "claude-sonnet-4-20250514",
	},
};

/**
 * Parameters with partial new CLI flags
 */
export const partialNewFlagsParams: Record<string, unknown> = {
	prompt: "Test with partial flags",
	model: "",
	toolPermissions: {},
	options: {
		maxBudgetUsd: 2.0,
		fallbackModel: "claude-haiku-4-20250414",
	},
};

/**
 * Parameters with worktree enabled and custom name
 */
export const worktreeWithNameParams: Record<string, unknown> = {
	prompt: "Test with worktree",
	model: "",
	toolPermissions: {},
	options: {
		worktreeEnabled: true,
		worktreeName: "feature-auth",
	},
};

/**
 * Parameters with worktree enabled but no name (auto-generate)
 */
export const worktreeAutoNameParams: Record<string, unknown> = {
	prompt: "Test with auto worktree",
	model: "",
	toolPermissions: {},
	options: {
		worktreeEnabled: true,
		worktreeName: "",
	},
};

/**
 * Parameters with worktree disabled
 */
export const worktreeDisabledParams: Record<string, unknown> = {
	prompt: "Test without worktree",
	model: "",
	toolPermissions: {},
	options: {
		worktreeEnabled: false,
	},
};

/**
 * Parameters with a single stdio MCP server
 */
export const singleMcpStdioServerParams: Record<string, unknown> = {
	prompt: "Test with MCP stdio",
	model: "",
	toolPermissions: {},
	options: {},
	agents: { agentsList: [] },
	mcpServers: {
		serversList: [
			{
				name: "slack",
				serverType: "stdio",
				command: "npx -y @modelcontextprotocol/server-slack",
				args: "--port,3000",
				env: '{"SLACK_TOKEN":"xoxb-test-123"}',
				url: "",
				headers: "",
			},
		],
	},
	mcpConfigFilePaths: "",
	mcpStrictMode: false,
};

/**
 * Parameters with a single HTTP MCP server
 */
export const singleMcpHttpServerParams: Record<string, unknown> = {
	prompt: "Test with MCP http",
	model: "",
	toolPermissions: {},
	options: {},
	agents: { agentsList: [] },
	mcpServers: {
		serversList: [
			{
				name: "remote-api",
				serverType: "http",
				command: "",
				args: "",
				env: "",
				url: "https://mcp.example.com/sse",
				headers: '{"Authorization":"Bearer token-123"}',
			},
		],
	},
	mcpConfigFilePaths: "",
	mcpStrictMode: false,
};

/**
 * Parameters with multiple MCP servers (mixed types)
 */
export const multipleMcpServersParams: Record<string, unknown> = {
	prompt: "Test with multiple MCP",
	model: "",
	toolPermissions: {},
	options: {},
	agents: { agentsList: [] },
	mcpServers: {
		serversList: [
			{
				name: "slack",
				serverType: "stdio",
				command: "npx -y @modelcontextprotocol/server-slack",
				args: "",
				env: '{"SLACK_TOKEN":"xoxb-test"}',
				url: "",
				headers: "",
			},
			{
				name: "remote",
				serverType: "http",
				command: "",
				args: "",
				env: "",
				url: "https://mcp.example.com/sse",
				headers: "",
			},
		],
	},
	mcpConfigFilePaths: "",
	mcpStrictMode: false,
};

/**
 * Parameters with MCP config file paths only
 */
export const mcpConfigFilePathsParams: Record<string, unknown> = {
	prompt: "Test with MCP config files",
	model: "",
	toolPermissions: {},
	options: {},
	agents: { agentsList: [] },
	mcpServers: { serversList: [] },
	mcpConfigFilePaths: "/path/to/mcp.json, /path/to/other.json",
	mcpStrictMode: false,
};

/**
 * Parameters with MCP strict mode only
 */
export const mcpStrictModeParams: Record<string, unknown> = {
	prompt: "Test with MCP strict",
	model: "",
	toolPermissions: {},
	options: {},
	agents: { agentsList: [] },
	mcpServers: { serversList: [] },
	mcpConfigFilePaths: "",
	mcpStrictMode: true,
};

/**
 * Parameters with empty MCP servers (no MCP config should be set)
 */
export const emptyMcpServersParams: Record<string, unknown> = {
	prompt: "Test without MCP",
	model: "",
	toolPermissions: {},
	options: {},
	agents: { agentsList: [] },
	mcpServers: { serversList: [] },
	mcpConfigFilePaths: "",
	mcpStrictMode: false,
};

/**
 * Parameters with full MCP config (inline + file paths + strict)
 */
export const fullMcpConfigParams: Record<string, unknown> = {
	prompt: "Test full MCP config",
	model: "",
	toolPermissions: {},
	options: {},
	agents: { agentsList: [] },
	mcpServers: {
		serversList: [
			{
				name: "slack",
				serverType: "stdio",
				command: "npx -y @modelcontextprotocol/server-slack",
				args: "--verbose",
				env: '{"SLACK_TOKEN":"xoxb-test"}',
				url: "",
				headers: "",
			},
		],
	},
	mcpConfigFilePaths: "/path/to/extra.json",
	mcpStrictMode: true,
};

/**
 * Parameters with a command that includes inline args (split test)
 */
export const mcpCommandWithInlineArgsParams: Record<string, unknown> = {
	prompt: "Test MCP command splitting",
	model: "",
	toolPermissions: {},
	options: {},
	agents: { agentsList: [] },
	mcpServers: {
		serversList: [
			{
				name: "context7",
				serverType: "stdio",
				command: "npx -y @upstash/context7-mcp --api-key sk-123",
				args: "",
				env: "",
				url: "",
				headers: "",
			},
		],
	},
	mcpConfigFilePaths: "",
	mcpStrictMode: false,
};
