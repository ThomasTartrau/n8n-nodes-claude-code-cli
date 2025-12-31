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
