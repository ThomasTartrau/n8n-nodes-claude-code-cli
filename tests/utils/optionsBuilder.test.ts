import { describe, it, expect } from "vitest";
import { buildExecutionOptions } from "../../nodes/ClaudeCode/utils/optionsBuilder.js";
import type { IExecuteFunctions } from "n8n-workflow";
import {
	createTestContext,
	defaultExecutePromptParams,
	executeWithContextParams,
	continueSessionParams,
	resumeSessionParams,
	customModelParams,
	toolPermissionsParams,
} from "../fixtures/executeFunctionsHelper.js";

describe("optionsBuilder", () => {
	describe("buildExecutionOptions", () => {
		it("should build minimal options for executePrompt", () => {
			const context = createTestContext(
				defaultExecutePromptParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.prompt).toBe("Hello, Claude!");
			expect(result.outputFormat).toBe("json");
			expect(result.timeout).toBe(300);
		});

		it("should handle custom model selection", () => {
			const context = createTestContext(customModelParams) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.model).toBe("claude-custom-model");
		});

		it("should handle standard model selection", () => {
			const params = {
				...defaultExecutePromptParams,
				model: "claude-sonnet-4-20250514",
			};
			const context = createTestContext(params) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.model).toBe("claude-sonnet-4-20250514");
		});

		it("should set model to undefined when empty", () => {
			const context = createTestContext(
				defaultExecutePromptParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.model).toBeUndefined();
		});

		it("should parse allowed tools from comma-separated string", () => {
			const context = createTestContext(
				toolPermissionsParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.toolPermissions?.allowedTools).toEqual([
				"Read",
				"Write",
				"Bash",
			]);
		});

		it("should parse disallowed tools from comma-separated string", () => {
			const context = createTestContext(
				toolPermissionsParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.toolPermissions?.disallowedTools).toEqual(["WebFetch"]);
		});

		it("should filter empty tool strings", () => {
			const params = {
				...defaultExecutePromptParams,
				toolPermissions: {
					allowedTools: "",
					disallowedTools: "",
				},
			};
			const context = createTestContext(params) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.toolPermissions?.allowedTools).toBeUndefined();
			expect(result.toolPermissions?.disallowedTools).toBeUndefined();
		});

		it("should trim tool names", () => {
			const params = {
				...defaultExecutePromptParams,
				toolPermissions: {
					allowedTools: "  Read  ,  Write  ,  ",
				},
			};
			const context = createTestContext(params) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.toolPermissions?.allowedTools).toEqual(["Read", "Write"]);
		});

		it("should set continueLastSession for continueSession operation", () => {
			const context = createTestContext(
				continueSessionParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "continueSession");

			expect(result.session?.continueLastSession).toBe(true);
			expect(result.session?.sessionId).toBeUndefined();
		});

		it("should set sessionId for resumeSession operation", () => {
			const context = createTestContext(
				resumeSessionParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "resumeSession");

			expect(result.session?.sessionId).toBe("sess-abc123");
			expect(result.session?.continueLastSession).toBeUndefined();
		});

		it("should not set session for executePrompt operation", () => {
			const context = createTestContext(
				defaultExecutePromptParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.session).toBeUndefined();
		});

		it("should parse context files for executeWithContext", () => {
			const context = createTestContext(
				executeWithContextParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executeWithContext");

			expect(result.contextFiles).toHaveLength(3);
			expect(result.contextFiles?.[0].path).toBe("/project/src/main.ts");
			expect(result.contextFiles?.[1].path).toBe("/project/src/utils.ts");
			expect(result.contextFiles?.[2].path).toBe("/project/tests");
		});

		it("should not include context files for other operations", () => {
			const context = createTestContext(
				defaultExecutePromptParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.contextFiles).toBeUndefined();
		});

		it("should parse working directory from options", () => {
			const context = createTestContext(
				executeWithContextParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executeWithContext");

			expect(result.workingDirectory).toBe("/project");
		});

		it("should parse output format from options", () => {
			const context = createTestContext(
				executeWithContextParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executeWithContext");

			expect(result.outputFormat).toBe("json");
		});

		it("should default output format to json", () => {
			const context = createTestContext(
				defaultExecutePromptParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.outputFormat).toBe("json");
		});

		it("should parse maxTurns from options", () => {
			const context = createTestContext(
				executeWithContextParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executeWithContext");

			expect(result.maxTurns).toBe(10);
		});

		it("should parse systemPrompt from options", () => {
			const context = createTestContext(
				executeWithContextParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executeWithContext");

			expect(result.systemPrompt).toBe("Be concise");
		});

		it("should parse additional arguments", () => {
			const params = {
				...defaultExecutePromptParams,
				options: {
					additionalArgs: "--verbose --debug",
				},
			};
			const context = createTestContext(params) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.additionalArgs).toEqual(["--verbose", "--debug"]);
		});

		it("should filter empty additional arguments", () => {
			const params = {
				...defaultExecutePromptParams,
				options: {
					additionalArgs: "",
				},
			};
			const context = createTestContext(params) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.additionalArgs).toBeUndefined();
		});

		it("should use custom timeout from options", () => {
			const params = {
				...defaultExecutePromptParams,
				options: {
					timeout: 600,
				},
			};
			const context = createTestContext(params) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.timeout).toBe(600);
		});

		it("should default timeout to 300 seconds", () => {
			const context = createTestContext(
				defaultExecutePromptParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.timeout).toBe(300);
		});

		it("should handle empty context files gracefully", () => {
			const params = {
				...defaultExecutePromptParams,
				contextFiles: { files: [] },
				additionalDirs: "",
			};
			const context = createTestContext(params) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executeWithContext");

			expect(result.contextFiles).toEqual([]);
		});

		it("should use different itemIndex", () => {
			const params = {
				prompt: "Item specific prompt",
				model: "",
				toolPermissions: {},
				options: {},
			};
			const context = createTestContext(params) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 5, "executePrompt");

			expect(result.prompt).toBe("Item specific prompt");
		});
	});
});
