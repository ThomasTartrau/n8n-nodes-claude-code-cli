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
 * Converts a stream result event to ClaudeCodeJsonOutput format.
 * Stream events have {type: "result", result, session_id, ...} while
 * json-format output has {session_id, result, is_error, ...}.
 */
function streamEventToJsonOutput(
	event: Record<string, unknown>,
): ClaudeCodeJsonOutput {
	return {
		session_id: (event.session_id as string) || "",
		result: event.result as string | undefined,
		is_error: event.subtype === "error" || event.subtype === "error_max_turns",
		total_cost_usd: event.total_cost_usd as number | undefined,
		total_duration_ms: event.total_duration_ms as number | undefined,
		total_duration_api_ms: event.total_duration_api_ms as number | undefined,
		num_turns: event.num_turns as number | undefined,
		usage: event.usage as
			| { input_tokens: number; output_tokens: number }
			| undefined,
	};
}

/**
 * Parses JSON output from Claude Code CLI.
 * Handles mixed output (warnings/non-JSON lines before JSON),
 * standard json-format output, and stream-json result events
 * (produced when --verbose is used with --output-format json).
 */
export function parseJsonOutput(output: string): ClaudeCodeJsonOutput {
	if (!output.trim()) {
		return createDefaultOutput();
	}

	const lines = output.trim().split("\n");
	let lastValidJson: ClaudeCodeJsonOutput | null = null;

	for (const line of lines) {
		const trimmedLine = line.trim();
		if (!trimmedLine.startsWith("{")) {
			continue;
		}

		try {
			const parsed = JSON.parse(trimmedLine) as Record<string, unknown>;

			if (parsed.type === "result") {
				lastValidJson = streamEventToJsonOutput(parsed);
			} else if ("session_id" in parsed || "result" in parsed || "is_error" in parsed) {
				lastValidJson = parsed as unknown as ClaudeCodeJsonOutput;
			}
		} catch {
			// Skip malformed JSON lines
		}
	}

	if (lastValidJson) {
		return lastValidJson;
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

		try {
			const event = JSON.parse(trimmedLine) as StreamEvent;
			events.push(event);

			if (event.type === "result") {
				resultEvent = event as StreamResultEvent;
			}
		} catch {
			// Skip malformed JSON lines (K8s warnings, MCP errors, etc.)
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
