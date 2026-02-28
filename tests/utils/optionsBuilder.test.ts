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
	singleAgentParams,
	fullAgentParams,
	multipleAgentsParams,
	emptyAgentsParams,
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

		it("should parse a single agent with minimal fields", () => {
			const context = createTestContext(singleAgentParams) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.agents).toBeDefined();
			expect(result.agents?.["code-reviewer"]).toBeDefined();
			expect(result.agents?.["code-reviewer"].description).toBe(
				"Expert code reviewer",
			);
			expect(result.agents?.["code-reviewer"].prompt).toBe(
				"You are a senior code reviewer.",
			);
			expect(result.agents?.["code-reviewer"].model).toBeUndefined();
			expect(result.agents?.["code-reviewer"].tools).toBeUndefined();
			expect(result.agents?.["code-reviewer"].maxTurns).toBeUndefined();
			expect(result.agents?.["code-reviewer"].memory).toBeUndefined();
		});

		it("should parse a fully configured agent", () => {
			const context = createTestContext(fullAgentParams) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			const agent = result.agents?.debugger;
			expect(agent).toBeDefined();
			expect(agent?.model).toBe("sonnet");
			expect(agent?.tools).toEqual(["Read", "Grep", "Glob", "Bash(git:*)"]);
			expect(agent?.disallowedTools).toEqual(["Write", "Edit"]);
			expect(agent?.permissionMode).toBe("plan");
			expect(agent?.maxTurns).toBe(15);
			expect(agent?.memory).toBe("project");
		});

		it("should parse multiple agents", () => {
			const context = createTestContext(
				multipleAgentsParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.agents).toBeDefined();
			expect(Object.keys(result.agents ?? {})).toHaveLength(2);
			expect(result.agents?.reviewer).toBeDefined();
			expect(result.agents?.architect).toBeDefined();
			expect(result.agents?.architect.model).toBe("opus");
			expect(result.agents?.architect.tools).toEqual(["Read", "Grep"]);
			expect(result.agents?.architect.permissionMode).toBe("delegate");
			expect(result.agents?.architect.maxTurns).toBe(10);
			expect(result.agents?.architect.memory).toBe("user");
		});

		it("should not include agents when agents list is empty", () => {
			const context = createTestContext(emptyAgentsParams) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.agents).toBeUndefined();
		});

		it("should not include agents when agents param is missing", () => {
			const context = createTestContext(
				defaultExecutePromptParams,
			) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.agents).toBeUndefined();
		});

		it("should omit model inherit from agent config", () => {
			const context = createTestContext(singleAgentParams) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.agents?.["code-reviewer"].model).toBeUndefined();
		});

		it("should trim and filter tools in agent config", () => {
			const params = {
				...defaultExecutePromptParams,
				agents: {
					agentsList: [
						{
							name: "test-agent",
							description: "Test",
							prompt: "Test",
							model: "inherit",
							tools: "  Read  ,  Grep  ,  ",
							disallowedTools: "  Write  ",
							permissionMode: "",
							maxTurns: 0,
							memory: "",
						},
					],
				},
			};
			const context = createTestContext(params) as IExecuteFunctions;

			const result = buildExecutionOptions(context, 0, "executePrompt");

			expect(result.agents?.["test-agent"].tools).toEqual(["Read", "Grep"]);
			expect(result.agents?.["test-agent"].disallowedTools).toEqual(["Write"]);
		});
	});
});
