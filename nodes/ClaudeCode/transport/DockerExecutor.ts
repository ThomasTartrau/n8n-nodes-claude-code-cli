import { spawn } from "node:child_process";
import type {
	IClaudeCodeExecutor,
	ClaudeCodeExecutionOptions,
	ClaudeCodeResult,
	DockerCredentials,
} from "../interfaces/index.js";
import {
	buildCommand,
	parseJsonOutput,
	normalizeOutput,
	createErrorResult,
} from "../utils/index.js";

/**
 * Executor for Claude Code CLI execution via Docker exec
 */
export class DockerExecutor implements IClaudeCodeExecutor {
	private credentials: DockerCredentials;

	constructor(credentials: unknown) {
		this.credentials = credentials as DockerCredentials;
	}

	/**
	 * Get the container reference (name or ID)
	 */
	private getContainerRef(): string {
		return this.credentials.containerIdentifier === "id"
			? this.credentials.containerId || ""
			: this.credentials.containerName || "";
	}

	/**
	 * Build docker exec arguments
	 */
	private buildDockerExecArgs(options: ClaudeCodeExecutionOptions): string[] {
		const args: string[] = ["exec"];

		// Note: Don't use -i or -t flags for headless execution
		// Claude Code with -p flag works without interactive input

		// User to run as
		if (this.credentials.user) {
			args.push("-u", this.credentials.user);
		}

		// Working directory inside container
		const workDir =
			options.workingDirectory || this.credentials.defaultWorkingDir;
		if (workDir) {
			args.push("-w", workDir);
		}

		// Container reference
		args.push(this.getContainerRef());

		return args;
	}

	/**
	 * Get environment for docker command
	 */
	private getDockerEnv(): NodeJS.ProcessEnv {
		if (this.credentials.dockerHost) {
			return { ...process.env, DOCKER_HOST: this.credentials.dockerHost };
		}
		return process.env;
	}

	/**
	 * Execute a Claude Code command via Docker exec
	 */
	execute(options: ClaudeCodeExecutionOptions): Promise<ClaudeCodeResult> {
		return new Promise((resolve) => {
			const startTime = Date.now();
			const dockerArgs = this.buildDockerExecArgs(options);
			const { command: claudePath, args: claudeArgs } = buildCommand(
				options,
				this.credentials,
			);

			// Add Claude Code command and args
			dockerArgs.push(claudePath, ...claudeArgs);

			const timeoutMs = options.timeout ? options.timeout * 1000 : 300000;
			let stdout = "";
			let stderr = "";
			let killed = false;
			let resolved = false;

			const proc = spawn("docker", dockerArgs, {
				env: this.getDockerEnv(),
				stdio: ["ignore", "pipe", "pipe"],
			});

			// Manual timeout handling
			const timeoutHandle = setTimeout(() => {
				if (!resolved) {
					killed = true;
					proc.kill("SIGTERM");
					// Force kill after 5 seconds if SIGTERM doesn't work
					setTimeout(() => {
						if (!resolved) {
							proc.kill("SIGKILL");
						}
					}, 5000);
				}
			}, timeoutMs);

			proc.stdout.on("data", (data: Buffer) => {
				stdout += data.toString();
			});

			proc.stderr.on("data", (data: Buffer) => {
				stderr += data.toString();
			});

			proc.on("close", (code: number | null) => {
				clearTimeout(timeoutHandle);
				if (resolved) return;
				resolved = true;

				const duration = Date.now() - startTime;

				// Check if process was killed due to timeout
				if (killed) {
					resolve(
						createErrorResult(
							`Execution timed out after ${options.timeout} seconds`,
							124,
							duration,
						),
					);
					return;
				}

				const exitCode = code ?? 0;

				if (options.outputFormat === "json") {
					const parsed = parseJsonOutput(stdout);
					resolve(normalizeOutput(parsed, exitCode, duration, stderr));
				} else {
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
				clearTimeout(timeoutHandle);
				if (resolved) return;
				resolved = true;

				const duration = Date.now() - startTime;
				resolve(
					createErrorResult(
						`Docker exec failed: ${error.message}`,
						1,
						duration,
					),
				);
			});
		});
	}

	/**
	 * Test Docker connection and Claude Code availability
	 */
	testConnection(): Promise<boolean> {
		return new Promise((resolve) => {
			const containerRef = this.getContainerRef();
			if (!containerRef) {
				resolve(false);
				return;
			}

			const claudePath = this.credentials.claudePath || "claude";
			const args = ["exec", containerRef, claudePath, "--version"];

			const proc = spawn("docker", args, {
				env: this.getDockerEnv(),
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
