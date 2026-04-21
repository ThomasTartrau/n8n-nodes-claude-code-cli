import { describe, it, expect } from "vitest";
import { buildEphemeralPodSpec, buildClaudeArgs } from "../../nodes/ClaudeCode/transport/k8s/podSpecBuilder.js";
import type {
	K8sCredentials,
	ClaudeCodeExecutionOptions,
} from "../../nodes/ClaudeCode/interfaces/index.js";

describe("podSpecBuilder", () => {
	const defaultK8sCredentials: K8sCredentials = {
		authMethod: "inCluster",
		namespace: "default",
		image: "claude-code:latest",
		claudePath: "claude",
		defaultWorkingDir: "/workspace",
		envVars: "{}",
	};

	describe("buildEphemeralPodSpec", () => {
		it("should include per-execution envVars in pod env", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				envVars: { CUSTOM: "value" },
			};

			const result = buildEphemeralPodSpec(
				defaultK8sCredentials,
				options,
				"test-pod",
			);

			const container = result.spec.containers[0];
			expect(container.env).toBeDefined();
			expect(container.env).toContainEqual({
				name: "CUSTOM",
				value: "value",
			});
		});

		it("should override credential envVars with per-execution envVars", () => {
			const credentials: K8sCredentials = {
				...defaultK8sCredentials,
				envVars: '{"KEY":"cred"}',
			};
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				envVars: { KEY: "exec" },
			};

			const result = buildEphemeralPodSpec(credentials, options, "test-pod");

			const container = result.spec.containers[0];
			expect(container.env).toBeDefined();
			const keyEntry = container.env?.find((e) => e.name === "KEY");
			expect(keyEntry).toBeDefined();
			expect(keyEntry?.value).toBe("exec");
			// Ensure no duplicate
			const keyEntries = container.env?.filter((e) => e.name === "KEY");
			expect(keyEntries).toHaveLength(1);
		});

		it("should merge credential and execution envVars", () => {
			const credentials: K8sCredentials = {
				...defaultK8sCredentials,
				envVars: '{"A":"1"}',
			};
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				envVars: { B: "2" },
			};

			const result = buildEphemeralPodSpec(credentials, options, "test-pod");

			const container = result.spec.containers[0];
			expect(container.env).toBeDefined();
			expect(container.env).toContainEqual({ name: "A", value: "1" });
			expect(container.env).toContainEqual({ name: "B", value: "2" });
		});

		it("should set CLAUDE_CODE_MAX_OUTPUT_TOKENS env var when maxOutputTokens > 0", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				maxOutputTokens: 4096,
			};

			const result = buildEphemeralPodSpec(
				defaultK8sCredentials,
				options,
				"test-pod",
			);

			const container = result.spec.containers[0];
			expect(container.env).toContainEqual({
				name: "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
				value: "4096",
			});
		});
	});

	describe("buildClaudeArgs", () => {
		it("should include --json-schema when options.jsonSchema is set", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				jsonSchema: '{"type":"object"}',
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--json-schema");
			expect(args[args.indexOf("--json-schema") + 1]).toBe('{"type":"object"}');
		});

		it('should include --effort when set to "medium"', () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				effort: "medium",
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--effort");
			expect(args[args.indexOf("--effort") + 1]).toBe("medium");
		});

		it('should NOT include --effort when set to "high"', () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				effort: "high",
			};

			const args = buildClaudeArgs(options);
			expect(args).not.toContain("--effort");
		});

		it('should include --verbose when verbose is true and outputFormat is "json"', () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				verbose: true,
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--verbose");
		});

		it('should NOT include explicit --verbose when outputFormat is "stream-json"', () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "stream-json",
				verbose: true,
			};

			const args = buildClaudeArgs(options);
			// stream-json adds --verbose automatically; the explicit verbose guard should not double it
			const verboseCount = args.filter((a) => a === "--verbose").length;
			expect(verboseCount).toBe(1);
		});

		it("should include --max-budget-usd when maxBudgetUsd > 0", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				maxBudgetUsd: 1.5,
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--max-budget-usd");
			expect(args[args.indexOf("--max-budget-usd") + 1]).toBe("1.5");
		});

		it("should include --fallback-model when set", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				fallbackModel: "claude-sonnet-4-20250514",
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--fallback-model");
			expect(args[args.indexOf("--fallback-model") + 1]).toBe(
				"claude-sonnet-4-20250514",
			);
		});

		it("should include bare --worktree when worktree is empty string", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				worktree: "",
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--worktree");
			// bare flag: the next arg should NOT be an empty string value
			const idx = args.indexOf("--worktree");
			expect(idx).toBeGreaterThan(-1);
			// Nothing follows or the next element is another flag
			const next = args[idx + 1];
			expect(next === undefined || next.startsWith("-")).toBe(true);
		});

		it("should include --worktree <path> when worktree has a value", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				worktree: "/tmp/my-worktree",
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--worktree");
			expect(args[args.indexOf("--worktree") + 1]).toBe("/tmp/my-worktree");
		});

		it('should include --system-prompt when systemPromptMode is "replace"', () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				systemPrompt: "You are a helpful assistant.",
				systemPromptMode: "replace",
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--system-prompt");
			expect(args).not.toContain("--append-system-prompt");
			expect(args[args.indexOf("--system-prompt") + 1]).toBe(
				"You are a helpful assistant.",
			);
		});

		it("should include --append-system-prompt when systemPromptMode is not replace", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				systemPrompt: "Extra instructions.",
				systemPromptMode: "append",
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--append-system-prompt");
			expect(args).not.toContain("--system-prompt");
			expect(args[args.indexOf("--append-system-prompt") + 1]).toBe(
				"Extra instructions.",
			);
		});

		it('should include --system-prompt-file when systemPromptFile set with replace mode', () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				systemPromptFile: "/tmp/system.txt",
				systemPromptMode: "replace",
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--system-prompt-file");
			expect(args).not.toContain("--append-system-prompt-file");
			expect(args[args.indexOf("--system-prompt-file") + 1]).toBe(
				"/tmp/system.txt",
			);
		});

		it("should include --append-system-prompt-file when systemPromptFile set with append mode", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				systemPromptFile: "/tmp/system.txt",
				systemPromptMode: "append",
			};

			const args = buildClaudeArgs(options);
			expect(args).toContain("--append-system-prompt-file");
			expect(args).not.toContain("--system-prompt-file");
			expect(args[args.indexOf("--append-system-prompt-file") + 1]).toBe(
				"/tmp/system.txt",
			);
		});
	});
});
