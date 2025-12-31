import { describe, it, expect } from "vitest";
import {
	buildCommand,
	escapeShellArg,
	buildShellCommand,
} from "../../nodes/ClaudeCode/utils/commandBuilder.js";
import type {
	ClaudeCodeExecutionOptions,
	LocalCredentials,
	CommandParts,
} from "../../nodes/ClaudeCode/interfaces/index.js";
import { sampleCredentials } from "../fixtures/mockOutputs.js";

describe("commandBuilder", () => {
	describe("escapeShellArg", () => {
		it("should wrap simple string in single quotes", () => {
			const result = escapeShellArg("hello");
			expect(result).toBe("'hello'");
		});

		it("should handle empty string", () => {
			const result = escapeShellArg("");
			expect(result).toBe("''");
		});

		it("should wrap string with spaces in single quotes", () => {
			const result = escapeShellArg("hello world");
			expect(result).toBe("'hello world'");
		});

		it("should escape single quotes within the string", () => {
			const result = escapeShellArg("it's");
			expect(result).toBe("'it'\\''s'");
		});

		it("should escape multiple single quotes", () => {
			const result = escapeShellArg("it's a 'test'");
			expect(result).toBe("'it'\\''s a '\\''test'\\'''");
		});

		it("should preserve shell special characters safely", () => {
			const result = escapeShellArg("$HOME;rm -rf /");
			expect(result).toBe("'$HOME;rm -rf /'");
		});

		it("should handle backticks to prevent command injection", () => {
			const result = escapeShellArg("`whoami`");
			expect(result).toBe("'`whoami`'");
		});

		it("should handle double quotes", () => {
			const result = escapeShellArg('"quoted"');
			expect(result).toBe("'\"quoted\"'");
		});

		it("should handle newlines", () => {
			const result = escapeShellArg("line1\nline2");
			expect(result).toBe("'line1\nline2'");
		});

		it("should handle pipe and redirect characters", () => {
			const result = escapeShellArg("cat file | grep pattern > output");
			expect(result).toBe("'cat file | grep pattern > output'");
		});

		it("should handle ampersand for background execution", () => {
			const result = escapeShellArg("command &");
			expect(result).toBe("'command &'");
		});

		it("should handle parentheses for subshells", () => {
			const result = escapeShellArg("$(evil)");
			expect(result).toBe("'$(evil)'");
		});
	});

	describe("buildCommand", () => {
		const defaultCredentials: LocalCredentials = sampleCredentials.localDefault;

		it("should build minimal command with just prompt", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Hello",
				outputFormat: "json",
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.command).toBe("claude");
			expect(result.args).toContain("-p");
			expect(result.args).toContain("Hello");
		});

		it("should include output format flag", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).toContain("--output-format");
			expect(result.args).toContain("json");
		});

		it("should include model flag when specified", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				model: "claude-sonnet-4-20250514",
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).toContain("--model");
			expect(result.args).toContain("claude-sonnet-4-20250514");
		});

		it("should not include model flag when model is empty", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				model: "",
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).not.toContain("--model");
		});

		it("should include max-turns flag when specified", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				maxTurns: 5,
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).toContain("--max-turns");
			expect(result.args).toContain("5");
		});

		it("should not include max-turns when zero", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				maxTurns: 0,
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).not.toContain("--max-turns");
		});

		it("should include --continue flag for continueLastSession", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Continue",
				outputFormat: "json",
				session: { continueLastSession: true },
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).toContain("--continue");
			expect(result.args).not.toContain("--resume");
		});

		it("should include --resume flag with session ID", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Resume",
				outputFormat: "json",
				session: { sessionId: "sess-abc123" },
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).toContain("--resume");
			expect(result.args).toContain("sess-abc123");
			expect(result.args).not.toContain("--continue");
		});

		it("should include allowed tools", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				toolPermissions: {
					allowedTools: ["Read", "Write", "Bash"],
				},
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).toContain("--allowedTools");
			expect(result.args).toContain("Read,Write,Bash");
		});

		it("should include disallowed tools", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				toolPermissions: {
					disallowedTools: ["WebFetch", "Edit"],
				},
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).toContain("--disallowedTools");
			expect(result.args).toContain("WebFetch,Edit");
		});

		it("should not include empty tool permissions", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				toolPermissions: {
					allowedTools: [],
					disallowedTools: [],
				},
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).not.toContain("--allowedTools");
			expect(result.args).not.toContain("--disallowedTools");
		});

		it("should include system prompt", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				systemPrompt: "Be concise and helpful",
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).toContain("--append-system-prompt");
			expect(result.args).toContain("Be concise and helpful");
		});

		it("should extract unique directories from context files", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				contextFiles: [
					{ path: "/project/src/file1.ts" },
					{ path: "/project/src/file2.ts" },
					{ path: "/project/tests/test.ts" },
				],
			};

			const result = buildCommand(options, defaultCredentials);

			const addDirIndices: number[] = [];
			result.args.forEach((arg, i) => {
				if (arg === "--add-dir") {
					addDirIndices.push(i);
				}
			});

			expect(addDirIndices.length).toBe(2);
			expect(result.args).toContain("/project/src");
			expect(result.args).toContain("/project/tests");
		});

		it("should handle context files without directory", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				contextFiles: [{ path: "file.ts" }],
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).not.toContain("--add-dir");
		});

		it("should include additional arguments", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				additionalArgs: ["--verbose", "--debug"],
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.args).toContain("--verbose");
			expect(result.args).toContain("--debug");
		});

		it("should parse environment variables from credentials", () => {
			const credentials: LocalCredentials = sampleCredentials.local;
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
			};

			const result = buildCommand(options, credentials);

			expect(result.env).toBeDefined();
			expect(result.env?.ANTHROPIC_API_KEY).toBe("sk-test-123");
		});

		it("should not include env when empty JSON object", () => {
			const credentials: LocalCredentials = sampleCredentials.localDefault;
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
			};

			const result = buildCommand(options, credentials);

			expect(result.env).toBeUndefined();
		});

		it("should not include env when empty string", () => {
			const credentials: LocalCredentials = sampleCredentials.localNoEnv;
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
			};

			const result = buildCommand(options, credentials);

			expect(result.env).toBeUndefined();
		});

		it("should use custom claude path from credentials", () => {
			const credentials: LocalCredentials = sampleCredentials.local;
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
			};

			const result = buildCommand(options, credentials);

			expect(result.command).toBe("/usr/local/bin/claude");
		});

		it("should set working directory from options", () => {
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				workingDirectory: "/custom/path",
			};

			const result = buildCommand(options, defaultCredentials);

			expect(result.cwd).toBe("/custom/path");
		});

		it("should fallback to credentials working directory", () => {
			const credentials: LocalCredentials = sampleCredentials.local;
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
			};

			const result = buildCommand(options, credentials);

			expect(result.cwd).toBe("/home/user/projects");
		});

		it("should prefer options working directory over credentials", () => {
			const credentials: LocalCredentials = sampleCredentials.local;
			const options: ClaudeCodeExecutionOptions = {
				prompt: "Test",
				outputFormat: "json",
				workingDirectory: "/override/path",
			};

			const result = buildCommand(options, credentials);

			expect(result.cwd).toBe("/override/path");
		});
	});

	describe("buildShellCommand", () => {
		it("should build command string with escaped arguments", () => {
			const parts: CommandParts = {
				command: "claude",
				args: ["-p", "Hello world"],
			};

			const result = buildShellCommand(parts);

			expect(result).toBe("claude '-p' 'Hello world'");
		});

		it("should prepend cd command when cwd is specified", () => {
			const parts: CommandParts = {
				command: "claude",
				args: ["-p", "Test"],
				cwd: "/my/project",
			};

			const result = buildShellCommand(parts);

			expect(result).toBe("cd '/my/project' && claude '-p' 'Test'");
		});

		it("should escape cwd path", () => {
			const parts: CommandParts = {
				command: "claude",
				args: ["-p", "Test"],
				cwd: "/path/with 'quotes'",
			};

			const result = buildShellCommand(parts);

			expect(result).toContain("cd '/path/with '\\''quotes'\\'''");
		});

		it("should handle empty args", () => {
			const parts: CommandParts = {
				command: "claude",
				args: [],
			};

			const result = buildShellCommand(parts);

			expect(result).toBe("claude ");
		});

		it("should properly escape complex prompt", () => {
			const parts: CommandParts = {
				command: "claude",
				args: ["-p", "Write a function that says 'Hello'"],
			};

			const result = buildShellCommand(parts);

			expect(result).toBe(
				"claude '-p' 'Write a function that says '\\''Hello'\\'''",
			);
		});
	});
});
