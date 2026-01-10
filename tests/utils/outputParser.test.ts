import { describe, it, expect } from "vitest";
import {
	parseJsonOutput,
	normalizeOutput,
	createErrorResult,
	parseStreamJsonOutput,
	normalizeStreamOutput,
} from "../../nodes/ClaudeCode/utils/outputParser.js";
import {
	validJsonOutputs,
	invalidJsonOutputs,
	parsedOutputs,
	validStreamJsonOutputs,
} from "../fixtures/mockOutputs.js";

describe("outputParser", () => {
	describe("parseJsonOutput", () => {
		it("should parse valid simple JSON output", () => {
			const result = parseJsonOutput(validJsonOutputs.simple);

			expect(result.session_id).toBe("abc123");
			expect(result.result).toBe("Hello!");
		});

		it("should parse JSON with usage data", () => {
			const result = parseJsonOutput(validJsonOutputs.withUsage);

			expect(result.session_id).toBe("sess-with-usage");
			expect(result.result).toBe("Task completed");
			expect(result.is_error).toBe(false);
			expect(result.total_cost_usd).toBe(0.05);
			expect(result.num_turns).toBe(3);
			expect(result.usage?.input_tokens).toBe(1500);
			expect(result.usage?.output_tokens).toBe(800);
		});

		it("should parse complete JSON with all fields", () => {
			const result = parseJsonOutput(validJsonOutputs.complete);

			expect(result.session_id).toBe("sess-complete");
			expect(result.result).toBe("All done");
			expect(result.is_error).toBe(false);
			expect(result.total_cost_usd).toBe(0.123);
			expect(result.total_duration_ms).toBe(5000);
			expect(result.total_duration_api_ms).toBe(4500);
			expect(result.num_turns).toBe(5);
			expect(result.usage?.input_tokens).toBe(2000);
			expect(result.usage?.output_tokens).toBe(1000);
		});

		it("should parse JSON with is_error flag", () => {
			const result = parseJsonOutput(validJsonOutputs.error);

			expect(result.session_id).toBe("sess-error");
			expect(result.is_error).toBe(true);
			expect(result.result).toBe("Error: Something went wrong");
		});

		it("should handle unicode in result", () => {
			const result = parseJsonOutput(validJsonOutputs.withUnicode);

			expect(result.session_id).toBe("unicode");
			expect(result.result).toBe("Hello 世界");
		});

		it("should return last valid JSON when multiple lines present", () => {
			const result = parseJsonOutput(validJsonOutputs.multiLine);

			expect(result.session_id).toBe("second");
			expect(result.result).toBe("line2");
		});

		it("should return default output for empty string", () => {
			const result = parseJsonOutput(invalidJsonOutputs.empty);

			expect(result.session_id).toBe("");
			expect(result.result).toBeUndefined();
			expect(result.is_error).toBe(false);
		});

		it("should return default output for whitespace-only input", () => {
			const result = parseJsonOutput(invalidJsonOutputs.whitespace);

			expect(result.session_id).toBe("");
			expect(result.result).toBeUndefined();
			expect(result.is_error).toBe(false);
		});

		it("should return default output for non-JSON text", () => {
			const result = parseJsonOutput(invalidJsonOutputs.notJson);

			expect(result.session_id).toBe("");
			expect(result.result).toBeUndefined();
		});

		it("should throw on malformed JSON", () => {
			expect(() => parseJsonOutput(invalidJsonOutputs.malformed)).toThrow(
				SyntaxError,
			);
		});

		it("should throw on partial JSON", () => {
			expect(() => parseJsonOutput(invalidJsonOutputs.partialJson)).toThrow(
				SyntaxError,
			);
		});

		it("should handle JSON with extra whitespace around it", () => {
			const input = '  \n  {"session_id":"trimmed","result":"ok"}  \n  ';
			const result = parseJsonOutput(input);

			expect(result.session_id).toBe("trimmed");
			expect(result.result).toBe("ok");
		});

		it("should handle JSON with nested objects", () => {
			const input = JSON.stringify({
				session_id: "nested",
				result: "done",
				usage: {
					input_tokens: 100,
					output_tokens: 50,
				},
			});

			const result = parseJsonOutput(input);

			expect(result.session_id).toBe("nested");
			expect(result.usage?.input_tokens).toBe(100);
		});
	});

	describe("normalizeOutput", () => {
		it("should mark as success when exitCode is 0 and no error flag", () => {
			const result = normalizeOutput(parsedOutputs.success, 0, 1000);

			expect(result.success).toBe(true);
			expect(result.sessionId).toBe("sess-success");
			expect(result.output).toBe("Task completed successfully");
			expect(result.error).toBeUndefined();
			expect(result.exitCode).toBe(0);
			expect(result.duration).toBe(1000);
		});

		it("should mark as failure when exitCode is non-zero", () => {
			const result = normalizeOutput(
				parsedOutputs.success,
				1,
				500,
				"Command failed",
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Command failed");
			expect(result.exitCode).toBe(1);
		});

		it("should mark as failure when is_error is true", () => {
			const result = normalizeOutput(parsedOutputs.errorFlag, 0, 500);

			expect(result.success).toBe(false);
			expect(result.error).toBe("An error occurred");
		});

		it("should use result as error when is_error true and no stderr", () => {
			const result = normalizeOutput(parsedOutputs.errorFlag, 0, 500);

			expect(result.error).toBe("An error occurred");
		});

		it("should prefer stderr over result for error message", () => {
			const result = normalizeOutput(
				parsedOutputs.errorFlag,
				1,
				500,
				"Stderr message",
			);

			expect(result.error).toBe("Stderr message");
		});

		it("should convert usage to camelCase", () => {
			const result = normalizeOutput(parsedOutputs.success, 0, 100);

			expect(result.usage?.inputTokens).toBe(500);
			expect(result.usage?.outputTokens).toBe(200);
		});

		it("should handle output without usage", () => {
			const result = normalizeOutput(parsedOutputs.minimal, 0, 100);

			expect(result.usage).toBeUndefined();
		});

		it("should include cost when present", () => {
			const result = normalizeOutput(parsedOutputs.success, 0, 100);

			expect(result.cost).toBe(0.05);
		});

		it("should include numTurns when present", () => {
			const result = normalizeOutput(parsedOutputs.success, 0, 100);

			expect(result.numTurns).toBe(2);
		});

		it("should handle empty session_id", () => {
			const result = normalizeOutput(parsedOutputs.noSession, 0, 100);

			expect(result.sessionId).toBe("");
		});

		it("should handle undefined result", () => {
			const result = normalizeOutput(parsedOutputs.minimal, 0, 100);

			expect(result.output).toBe("");
		});

		it("should include rawOutput", () => {
			const result = normalizeOutput(parsedOutputs.success, 0, 100);

			expect(result.rawOutput).toBeDefined();
			expect(result.rawOutput?.session_id).toBe("sess-success");
		});

		it("should handle high exit codes", () => {
			const result = normalizeOutput(parsedOutputs.minimal, 255, 100);

			expect(result.success).toBe(false);
			expect(result.exitCode).toBe(255);
		});
	});

	describe("createErrorResult", () => {
		it("should create error result with all fields", () => {
			const result = createErrorResult("Connection timeout", 124, 30000);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Connection timeout");
			expect(result.exitCode).toBe(124);
			expect(result.duration).toBe(30000);
			expect(result.sessionId).toBe("");
			expect(result.output).toBe("");
		});

		it("should handle empty error message", () => {
			const result = createErrorResult("", 1, 0);

			expect(result.success).toBe(false);
			expect(result.error).toBe("");
		});

		it("should handle zero duration", () => {
			const result = createErrorResult("Error", 1, 0);

			expect(result.duration).toBe(0);
		});

		it("should handle high exit code", () => {
			const result = createErrorResult("Killed", 137, 1000);

			expect(result.exitCode).toBe(137);
		});

		it("should not include optional fields", () => {
			const result = createErrorResult("Error", 1, 100);

			expect(result.cost).toBeUndefined();
			expect(result.usage).toBeUndefined();
			expect(result.numTurns).toBeUndefined();
			expect(result.rawOutput).toBeUndefined();
		});
	});

	describe("parseStreamJsonOutput", () => {
		it("should parse simple stream output", () => {
			const { events, result } = parseStreamJsonOutput(
				validStreamJsonOutputs.simple,
			);

			expect(events.length).toBe(3);
			expect(events[0].type).toBe("system");
			expect(result).not.toBeNull();
			expect(result?.subtype).toBe("success");
		});

		it("should capture all tool use events", () => {
			const { events } = parseStreamJsonOutput(
				validStreamJsonOutputs.withToolUse,
			);

			const toolUseEvent = events.find(
				(e) =>
					e.type === "assistant" &&
					(e as { message?: { content?: Array<{ type: string }> } }).message
						?.content?.[0]?.type === "tool_use",
			);
			expect(toolUseEvent).toBeDefined();

			const toolResultEvent = events.find((e) => e.type === "user");
			expect(toolResultEvent).toBeDefined();
		});

		it("should handle empty input", () => {
			const { events, result } = parseStreamJsonOutput("");

			expect(events.length).toBe(0);
			expect(result).toBeNull();
		});

		it("should handle whitespace-only input", () => {
			const { events, result } = parseStreamJsonOutput("   \n  \n   ");

			expect(events.length).toBe(0);
			expect(result).toBeNull();
		});

		it("should skip non-JSON lines", () => {
			const input = [
				'{"type":"system","subtype":"init","session_id":"test"}',
				"some log output",
				'{"type":"result","subtype":"success","result":"done"}',
			].join("\n");

			const { events, result } = parseStreamJsonOutput(input);

			expect(events.length).toBe(2);
			expect(result?.result).toBe("done");
		});
	});

	describe("normalizeStreamOutput", () => {
		it("should extract session_id from init event", () => {
			const { events, result } = parseStreamJsonOutput(
				validStreamJsonOutputs.simple,
			);
			const normalized = normalizeStreamOutput(events, result, 0, 1000);

			expect(normalized.sessionId).toBe("stream-1");
		});

		it("should mark as success when result subtype is success", () => {
			const { events, result } = parseStreamJsonOutput(
				validStreamJsonOutputs.simple,
			);
			const normalized = normalizeStreamOutput(events, result, 0, 1000);

			expect(normalized.success).toBe(true);
		});

		it("should mark as failure when result subtype is error", () => {
			const { events, result } = parseStreamJsonOutput(
				validStreamJsonOutputs.errorResult,
			);
			const normalized = normalizeStreamOutput(events, result, 0, 500);

			expect(normalized.success).toBe(false);
		});

		it("should include all stream events in result", () => {
			const { events, result } = parseStreamJsonOutput(
				validStreamJsonOutputs.withToolUse,
			);
			const normalized = normalizeStreamOutput(events, result, 0, 1000);

			expect(normalized.streamEvents).toBeDefined();
			expect(normalized.streamEvents?.length).toBe(4);
		});

		it("should extract cost and usage from result event", () => {
			const { events, result } = parseStreamJsonOutput(
				validStreamJsonOutputs.withToolUse,
			);
			const normalized = normalizeStreamOutput(events, result, 0, 1000);

			expect(normalized.cost).toBe(0.01);
			expect(normalized.usage?.inputTokens).toBe(100);
			expect(normalized.usage?.outputTokens).toBe(50);
		});

		it("should handle missing result event", () => {
			const events = [
				{ type: "system" as const, subtype: "init", session_id: "test" },
			];
			const normalized = normalizeStreamOutput(events, null, 0, 1000);

			expect(normalized.success).toBe(true);
			expect(normalized.output).toBe("");
		});
	});
});
