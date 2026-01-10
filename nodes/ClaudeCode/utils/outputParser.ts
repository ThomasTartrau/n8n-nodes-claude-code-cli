import type {
	ClaudeCodeJsonOutput,
	ClaudeCodeResult,
	StreamEvent,
	StreamResultEvent,
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

/**
 * Parses NDJSON stream output from Claude Code CLI (stream-json format)
 * Returns array of all events and extracts final result
 */
export function parseStreamJsonOutput(output: string): {
	events: StreamEvent[];
	result: StreamResultEvent | null;
} {
	const events: StreamEvent[] = [];
	let resultEvent: StreamResultEvent | null = null;

	if (!output.trim()) {
		return { events, result: null };
	}

	const lines = output.trim().split("\n");

	for (const line of lines) {
		const trimmedLine = line.trim();
		if (!trimmedLine || !trimmedLine.startsWith("{")) {
			continue;
		}

		const event = JSON.parse(trimmedLine) as StreamEvent;
		events.push(event);

		if (event.type === "result") {
			resultEvent = event as StreamResultEvent;
		}
	}

	return { events, result: resultEvent };
}

/**
 * Converts stream-json output to normalized result with events
 */
export function normalizeStreamOutput(
	events: StreamEvent[],
	resultEvent: StreamResultEvent | null,
	exitCode: number,
	duration: number,
	stderr?: string,
): ClaudeCodeResult {
	const success =
		exitCode === 0 &&
		resultEvent?.subtype !== "error" &&
		resultEvent?.subtype !== "error_max_turns";

	let sessionId = "";
	const initEvent = events.find(
		(e) => e.type === "system" && e.subtype === "init",
	);
	if (initEvent?.session_id) {
		sessionId = initEvent.session_id;
	} else if (resultEvent?.session_id) {
		sessionId = resultEvent.session_id;
	}

	let output = "";
	if (resultEvent?.result) {
		output = resultEvent.result;
	}

	return {
		success,
		sessionId,
		output,
		exitCode,
		duration,
		cost: resultEvent?.total_cost_usd,
		numTurns: resultEvent?.num_turns,
		usage: resultEvent?.usage
			? {
					inputTokens: resultEvent.usage.input_tokens,
					outputTokens: resultEvent.usage.output_tokens,
				}
			: undefined,
		error: !success ? stderr || resultEvent?.result : undefined,
		streamEvents: events,
	};
}
