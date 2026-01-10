import { spawn } from "node:child_process";
import type {
	IClaudeCodeExecutor,
	ClaudeCodeExecutionOptions,
	ClaudeCodeResult,
	LocalCredentials,
} from "../interfaces/index.js";
import {
	buildCommand,
	parseJsonOutput,
	normalizeOutput,
	createErrorResult,
	parseStreamJsonOutput,
	normalizeStreamOutput,
} from "../utils/index.js";

/**
 * Executor for local Claude Code CLI execution
 * Uses child_process.spawn to run Claude Code on the same machine as n8n
 */
export class LocalExecutor implements IClaudeCodeExecutor {
	private credentials: LocalCredentials;

	constructor(credentials: unknown) {
		this.credentials = credentials as LocalCredentials;
	}

	/**
	 * Execute a Claude Code command and wait for the result
	 */
	execute(options: ClaudeCodeExecutionOptions): Promise<ClaudeCodeResult> {
		return new Promise((resolve) => {
			const { command, args, env, cwd } = buildCommand(
				options,
				this.credentials,
			);

			const startTime = Date.now();
			let stdout = "";
			let stderr = "";

			const timeoutMs = options.timeout ? options.timeout * 1000 : 300000;

			const proc = spawn(command, args, {
				cwd: cwd || process.cwd(),
				env: { ...process.env, ...env },
				timeout: timeoutMs,
				shell: false,
				stdio: ["ignore", "pipe", "pipe"],
			});

			proc.stdout.on("data", (data: Buffer) => {
				stdout += data.toString();
			});

			proc.stderr.on("data", (data: Buffer) => {
				stderr += data.toString();
			});

			proc.on("close", (code: number | null) => {
				const duration = Date.now() - startTime;
				const exitCode = code ?? 0;

				if (options.outputFormat === "json") {
					const parsed = parseJsonOutput(stdout);
					resolve(normalizeOutput(parsed, exitCode, duration, stderr));
				} else if (options.outputFormat === "stream-json") {
					const { events, result } = parseStreamJsonOutput(stdout);
					resolve(
						normalizeStreamOutput(events, result, exitCode, duration, stderr),
					);
				} else {
					// Text format
					resolve({
						success: exitCode === 0,
						sessionId: "",
						output: stdout,
						exitCode,
						duration,
						error: exitCode !== 0 ? stderr : undefined,
					});
				}
			});

			proc.on("error", (error: Error) => {
				const duration = Date.now() - startTime;
				resolve(
					createErrorResult(
						`Failed to execute Claude Code: ${error.message}`,
						1,
						duration,
					),
				);
			});
		});
	}

	/**
	 * Test if Claude Code is accessible
	 */
	testConnection(): Promise<boolean> {
		return new Promise((resolve) => {
			const claudePath = this.credentials.claudePath || "claude";

			const proc = spawn(claudePath, ["--version"], {
				timeout: 10000,
				stdio: ["ignore", "pipe", "pipe"],
			});

			proc.on("close", (code: number | null) => {
				resolve(code === 0);
			});

			proc.on("error", () => {
				resolve(false);
			});
		});
	}
}
