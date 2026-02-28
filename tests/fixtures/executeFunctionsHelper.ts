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
