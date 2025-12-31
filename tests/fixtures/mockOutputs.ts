import type {
	ClaudeCodeJsonOutput,
	LocalCredentials,
} from "../../nodes/ClaudeCode/interfaces/index.js";

/**
 * Valid JSON output samples from Claude Code CLI
 */
export const validJsonOutputs: Record<string, string> = {
	simple: '{"session_id":"abc123","result":"Hello!"}',

	withUsage: JSON.stringify({
		session_id: "sess-with-usage",
		result: "Task completed",
		is_error: false,
		total_cost_usd: 0.05,
		num_turns: 3,
		usage: {
			input_tokens: 1500,
			output_tokens: 800,
		},
	}),

	error: JSON.stringify({
		session_id: "sess-error",
		result: "Error: Something went wrong",
		is_error: true,
	}),

	multiLine: `{"session_id":"first","result":"line1"}
{"session_id":"second","result":"line2"}`,

	withUnicode: '{"session_id":"unicode","result":"Hello 世界"}',

	complete: JSON.stringify({
		session_id: "sess-complete",
		result: "All done",
		is_error: false,
		total_cost_usd: 0.123,
		total_duration_ms: 5000,
		total_duration_api_ms: 4500,
		num_turns: 5,
		usage: {
			input_tokens: 2000,
			output_tokens: 1000,
		},
	}),
};

/**
 * Invalid JSON output samples
 */
export const invalidJsonOutputs: Record<string, string> = {
	empty: "",
	whitespace: "   \n\t   ",
	malformed: '{"broken": ',
	notJson: "Error: Command not found",
	partialJson: '{"session_id":"test"',
};

/**
 * Sample credentials for testing
 */
export const sampleCredentials: Record<string, LocalCredentials> = {
	local: {
		claudePath: "/usr/local/bin/claude",
		defaultWorkingDir: "/home/user/projects",
		envVars: '{"ANTHROPIC_API_KEY":"sk-test-123"}',
	},
	localDefault: {
		claudePath: "claude",
		defaultWorkingDir: "",
		envVars: "{}",
	},
	localNoEnv: {
		claudePath: "claude",
		defaultWorkingDir: "/tmp",
		envVars: "",
	},
};

/**
 * Parsed JSON output samples for normalizeOutput tests
 */
export const parsedOutputs: Record<string, ClaudeCodeJsonOutput> = {
	success: {
		session_id: "sess-success",
		result: "Task completed successfully",
		is_error: false,
		total_cost_usd: 0.05,
		num_turns: 2,
		usage: {
			input_tokens: 500,
			output_tokens: 200,
		},
	},
	errorFlag: {
		session_id: "sess-error-flag",
		result: "An error occurred",
		is_error: true,
	},
	minimal: {
		session_id: "sess-minimal",
	},
	noSession: {
		session_id: "",
		result: "No session",
	},
};
