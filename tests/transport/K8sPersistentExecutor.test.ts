import { describe, it, expect } from "vitest";
import { escapeShellValue } from "../../nodes/ClaudeCode/utils/commandBuilder.js";

/**
 * Tests for escapeShellValue — the real function used by
 * K8sPersistentExecutor to escape env var values in shell export statements.
 */

function buildEnvExport(key: string, value: string): string {
	return `export ${key}='${escapeShellValue(value)}'`;
}

function buildEnvPrefix(envVars: Record<string, string>): string {
	let envPrefix = "";
	for (const [key, value] of Object.entries(envVars)) {
		envPrefix += `export ${key}='${escapeShellValue(value)}' && `;
	}
	return envPrefix;
}

describe("K8sPersistentExecutor envVar shell escaping", () => {
	describe("single export statement", () => {
		it("should handle a simple value", () => {
			expect(buildEnvExport("FOO", "bar")).toBe("export FOO='bar'");
		});

		it("should handle an empty value", () => {
			expect(buildEnvExport("FOO", "")).toBe("export FOO=''");
		});

		it("should handle a value with spaces", () => {
			expect(buildEnvExport("FOO", "hello world")).toBe(
				"export FOO='hello world'",
			);
		});

		it("should escape a value containing a single quote", () => {
			expect(buildEnvExport("FOO", "it's")).toBe("export FOO='it'\\''s'");
		});

		it("should escape a value with multiple single quotes", () => {
			expect(buildEnvExport("FOO", "it's a 'test'")).toBe(
				"export FOO='it'\\''s a '\\''test'\\'''",
			);
		});

		it("should safely contain dollar signs (no variable expansion)", () => {
			expect(buildEnvExport("FOO", "$HOME")).toBe("export FOO='$HOME'");
		});

		it("should safely contain backticks (no command substitution)", () => {
			expect(buildEnvExport("FOO", "`whoami`")).toBe(
				"export FOO='`whoami`'",
			);
		});

		it("should safely contain $() command substitution syntax", () => {
			expect(buildEnvExport("FOO", "$(rm -rf /)")).toBe(
				"export FOO='$(rm -rf /)'",
			);
		});

		it("should safely contain double quotes", () => {
			expect(buildEnvExport("FOO", 'say "hello"')).toBe(
				"export FOO='say \"hello\"'",
			);
		});

		it("should safely contain shell operators", () => {
			expect(buildEnvExport("FOO", "$HOME && rm -rf /")).toBe(
				"export FOO='$HOME && rm -rf /'",
			);
		});

		it("should safely contain semicolons", () => {
			expect(buildEnvExport("FOO", "value; rm -rf /")).toBe(
				"export FOO='value; rm -rf /'",
			);
		});

		it("should safely contain pipe operators", () => {
			expect(buildEnvExport("FOO", "value | cat /etc/passwd")).toBe(
				"export FOO='value | cat /etc/passwd'",
			);
		});

		it("should safely contain newlines", () => {
			expect(buildEnvExport("FOO", "line1\nline2")).toBe(
				"export FOO='line1\nline2'",
			);
		});

		it("should safely contain backslashes", () => {
			expect(buildEnvExport("FOO", "path\\to\\file")).toBe(
				"export FOO='path\\to\\file'",
			);
		});

		it("should handle a complex realistic value (JSON string)", () => {
			const jsonValue = '{"key":"value","nested":{"a":1}}';
			expect(buildEnvExport("CONFIG", jsonValue)).toBe(
				`export CONFIG='${jsonValue}'`,
			);
		});

		it("should handle a value with only single quotes", () => {
			const result = buildEnvExport("FOO", "'''");
			expect(result).toBe("export FOO=''\\'''\\'''\\'''");
		});
	});

	describe("envPrefix construction (multiple vars)", () => {
		it("should chain multiple exports with ' && '", () => {
			const result = buildEnvPrefix({ FOO: "bar", BAZ: "qux" });
			expect(result).toBe("export FOO='bar' && export BAZ='qux' && ");
		});

		it("should return empty string when no envVars", () => {
			const result = buildEnvPrefix({});
			expect(result).toBe("");
		});

		it("should handle mixed simple and complex values", () => {
			const result = buildEnvPrefix({
				SIMPLE: "hello",
				QUOTED: "it's",
				EMPTY: "",
			});
			expect(result).toBe(
				"export SIMPLE='hello' && export QUOTED='it'\\''s' && export EMPTY='' && ",
			);
		});
	});

	describe("extendedContext prefix integration", () => {
		it("should prepend CLAUDE_CODE_DISABLE_1M_CONTEXT when extendedContext is false", () => {
			let envPrefix = "export CLAUDE_CODE_DISABLE_1M_CONTEXT=1 && ";
			const envVars = { API_KEY: "secret-value" };
			for (const [key, value] of Object.entries(envVars)) {
				envPrefix += `export ${key}='${escapeShellValue(value)}' && `;
			}
			expect(envPrefix).toBe(
				"export CLAUDE_CODE_DISABLE_1M_CONTEXT=1 && export API_KEY='secret-value' && ",
			);
		});
	});
});
