import { describe, it, expect } from "vitest";
import { LocalExecutor } from "../../nodes/ClaudeCode/transport/LocalExecutor.js";
import { createLocalTestCredentials, createTestOptions } from "./helpers.js";

describe("LocalExecutor Integration", () => {
	describe("execute", () => {
		it("should execute command and capture output", () => {
			const credentials = createLocalTestCredentials();
			const executor = new LocalExecutor(credentials);
			const options = createTestOptions("Hello World");

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.success).toBe(true);
				expect(result.output).toContain("Hello World");
			});
		});

		it("should respect working directory", () => {
			const credentials = createLocalTestCredentials(undefined, "/var");
			const executor = new LocalExecutor(credentials);
			const options = createTestOptions("__pwd__");

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.output.trim()).toContain("/var");
			});
		});

		it("should handle non-existent command", () => {
			const credentials = createLocalTestCredentials(
				"nonexistent_command_xyz_12345",
			);
			const executor = new LocalExecutor(credentials);
			const options = createTestOptions("test");

			return executor.execute(options).then((result) => {
				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});
		});

		it("should pass environment variables", () => {
			const credentials = createLocalTestCredentials(undefined, "/tmp", {
				TEST_VAR_XYZ: "test_value_123",
			});
			const executor = new LocalExecutor(credentials);
			const options = createTestOptions("__env__");

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.output).toContain("TEST_VAR_XYZ");
				expect(result.output).toContain("test_value_123");
			});
		});

		it("should handle exit code from command", () => {
			const credentials = createLocalTestCredentials();
			const executor = new LocalExecutor(credentials);
			const options = createTestOptions("__exit__:42");

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(42);
				expect(result.success).toBe(false);
			});
		});

		it("should handle special characters in prompt", () => {
			const credentials = createLocalTestCredentials();
			const executor = new LocalExecutor(credentials);
			const options = createTestOptions("Hello 'World' with \"quotes\"");

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.output).toContain("Hello");
				expect(result.output).toContain("World");
				expect(result.output).toContain("quotes");
			});
		});

		it("should measure duration", () => {
			const credentials = createLocalTestCredentials();
			const executor = new LocalExecutor(credentials);
			const options = createTestOptions("__sleep__:100");

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.duration).toBeGreaterThan(80);
				expect(result.duration).toBeLessThan(5000);
			});
		});

		it("should handle JSON output format", () => {
			const credentials = createLocalTestCredentials();
			const executor = new LocalExecutor(credentials);
			const options = {
				prompt: "test prompt",
				outputFormat: "json" as const,
				timeout: 30,
			};

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.success).toBe(true);
				expect(result.sessionId).toBe("test-session-123");
				expect(result.cost).toBe(0.001);
			});
		});

		it("should handle stream-json output format", () => {
			const credentials = createLocalTestCredentials();
			const executor = new LocalExecutor(credentials);
			const options = {
				prompt: "test streaming",
				outputFormat: "stream-json" as const,
				timeout: 30,
			};

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.success).toBe(true);
				expect(result.sessionId).toBe("test-stream-session-456");
				expect(result.streamEvents).toBeDefined();
				expect(result.streamEvents?.length).toBeGreaterThan(0);

				// Verify event types present
				const eventTypes = result.streamEvents?.map((e) => e.type);
				expect(eventTypes).toContain("system");
				expect(eventTypes).toContain("assistant");
				expect(eventTypes).toContain("user");
				expect(eventTypes).toContain("result");

				// Verify cost and usage
				expect(result.cost).toBe(0.002);
				expect(result.usage?.inputTokens).toBe(50);
				expect(result.usage?.outputTokens).toBe(100);
			});
		});
	});

	describe("testConnection", () => {
		it("should return true for test command", () => {
			const credentials = createLocalTestCredentials();
			const executor = new LocalExecutor(credentials);

			return executor.testConnection().then((result) => {
				expect(result).toBe(true);
			});
		});

		it("should return false for non-existent command", () => {
			const credentials = createLocalTestCredentials(
				"nonexistent_cmd_xyz_99999",
			);
			const executor = new LocalExecutor(credentials);

			return executor.testConnection().then((result) => {
				expect(result).toBe(false);
			});
		});
	});
});
