import type {
	ClaudeCodeJsonOutput,
	ClaudeCodeResult,
} from "../interfaces/index.js";

/**
 * Creates a default empty JSON output structure
 */
function createDefaultOutput(): ClaudeCodeJsonOutput {
	return {
		session_id: "",
		result: undefined,
		is_error: false,
	};
}

/**
 * Parses JSON output from Claude Code CLI
 */
export function parseJsonOutput(output: string): ClaudeCodeJsonOutput {
	if (!output.trim()) {
		return createDefaultOutput();
	}

	const trimmedOutput = output.trim();

	// If it starts with {, try to parse as single JSON object
	if (trimmedOutput.startsWith("{")) {
		// Find the last complete JSON object (in case of multiple lines)
		const lines = trimmedOutput.split("\n");
		let lastValidJson: ClaudeCodeJsonOutput | null = null;

		for (const line of lines) {
			const trimmedLine = line.trim();
			if (trimmedLine.startsWith("{")) {
				const parsed = JSON.parse(trimmedLine) as ClaudeCodeJsonOutput;
				lastValidJson = parsed;
			}
		}

		if (lastValidJson) {
			return lastValidJson;
		}

		// Fallback: try parsing the entire output as single JSON
		return JSON.parse(trimmedOutput) as ClaudeCodeJsonOutput;
	}

	return createDefaultOutput();
}

/**
 * Converts raw Claude Code JSON output to normalized result
 */
export function normalizeOutput(
	jsonOutput: ClaudeCodeJsonOutput,
	exitCode: number,
	duration: number,
	stderr?: string,
): ClaudeCodeResult {
	const success = exitCode === 0 && !jsonOutput.is_error;

	return {
		success,
		sessionId: jsonOutput.session_id || "",
		output: jsonOutput.result || "",
		rawOutput: jsonOutput,
		exitCode,
		duration,
		cost: jsonOutput.total_cost_usd,
		numTurns: jsonOutput.num_turns,
		usage: jsonOutput.usage
			? {
					inputTokens: jsonOutput.usage.input_tokens,
					outputTokens: jsonOutput.usage.output_tokens,
				}
			: undefined,
		error: !success ? stderr || jsonOutput.result : undefined,
	};
}

/**
 * Creates an error result
 */
export function createErrorResult(
	error: string,
	exitCode: number,
	duration: number,
): ClaudeCodeResult {
	return {
		success: false,
		sessionId: "",
		output: "",
		exitCode,
		duration,
		error,
	};
}
