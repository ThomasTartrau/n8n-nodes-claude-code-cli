import { Client, type ConnectConfig } from "ssh2";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import type {
	IClaudeCodeExecutor,
	ClaudeCodeExecutionOptions,
	ClaudeCodeResult,
	SshCredentials,
} from "../interfaces/index.js";
import {
	buildCommand,
	buildShellCommand,
	parseJsonOutput,
	normalizeOutput,
	createErrorResult,
	normalizePrivateKey,
	validatePrivateKey,
	parseStreamJsonOutput,
	normalizeStreamOutput,
} from "../utils/index.js";

/**
 * Executor for remote Claude Code CLI execution via SSH
 */
export class SshExecutor implements IClaudeCodeExecutor {
	private credentials: SshCredentials;

	constructor(credentials: unknown) {
		this.credentials = credentials as SshCredentials;
	}

	/**
	 * Build SSH connection configuration
	 */
	private buildSshConfig(): ConnectConfig {
		const config: ConnectConfig = {
			host: this.credentials.host,
			port: this.credentials.port || 22,
			username: this.credentials.username,
		};

		if (this.credentials.authMethod === "password") {
			config.password = this.credentials.password;
		} else if (this.credentials.authMethod === "privateKey") {
			let privateKey: string | Buffer | undefined;

			if (this.credentials.privateKey) {
				const validation = validatePrivateKey(this.credentials.privateKey);
				if (!validation.valid) {
					throw new Error(`SSH private key error: ${validation.error}`);
				}
				privateKey = normalizePrivateKey(this.credentials.privateKey);
			} else if (this.credentials.privateKeyPath) {
				// Expand ~ to home directory
				const keyPath = this.credentials.privateKeyPath.replace(
					/^~/,
					homedir(),
				);
				privateKey = readFileSync(keyPath);
			}

			if (privateKey) {
				config.privateKey = privateKey;
			}

			if (this.credentials.passphrase) {
				config.passphrase = this.credentials.passphrase;
			}
		}
		// For 'agent' method, ssh2 will automatically use the SSH agent

		return config;
	}

	/**
	 * Build the remote command to execute
	 */
	private buildRemoteCommand(options: ClaudeCodeExecutionOptions): string {
		const commandParts = buildCommand(options, this.credentials);
		return buildShellCommand(commandParts);
	}

	/**
	 * Execute a Claude Code command via SSH
	 */
	execute(options: ClaudeCodeExecutionOptions): Promise<ClaudeCodeResult> {
		return new Promise((resolve) => {
			const startTime = Date.now();
			const remoteCmd = this.buildRemoteCommand(options);

			let sshConfig: ConnectConfig;
			try {
				sshConfig = this.buildSshConfig();
			} catch (err) {
				const duration = Date.now() - startTime;
				resolve(createErrorResult((err as Error).message, 1, duration));
				return;
			}

			const timeoutMs = options.timeout ? options.timeout * 1000 : 300000;

			let stdout = "";
			let stderr = "";
			let connectionClosed = false;

			const conn = new Client();

			// Set connection timeout
			const connectionTimeout = setTimeout(() => {
				if (!connectionClosed) {
					connectionClosed = true;
					conn.end();
					const duration = Date.now() - startTime;
					resolve(createErrorResult("SSH connection timeout", 1, duration));
				}
			}, timeoutMs);

			conn.on("ready", () => {
				// Explicitly disable PTY allocation for non-interactive execution
				conn.exec(remoteCmd, { pty: false }, (err, stream) => {
					if (err) {
						clearTimeout(connectionTimeout);
						connectionClosed = true;
						conn.end();
						const duration = Date.now() - startTime;
						resolve(
							createErrorResult(`SSH exec error: ${err.message}`, 1, duration),
						);
						return;
					}

					let exitCode: number | null = null;
					let streamClosed = false;

					const handleCompletion = () => {
						if (streamClosed && exitCode !== null && !connectionClosed) {
							clearTimeout(connectionTimeout);
							connectionClosed = true;
							conn.end();

							const duration = Date.now() - startTime;
							const code = exitCode ?? 0;

							if (options.outputFormat === "json") {
								const parsed = parseJsonOutput(stdout);
								resolve(normalizeOutput(parsed, code, duration, stderr));
							} else if (options.outputFormat === "stream-json") {
								const { events, result } = parseStreamJsonOutput(stdout);
								resolve(
									normalizeStreamOutput(events, result, code, duration, stderr),
								);
							} else {
								resolve({
									success: code === 0,
									sessionId: "",
									output: stdout,
									exitCode: code,
									duration,
									error: code !== 0 ? stderr : undefined,
								});
							}
						}
					};

					stream.on("exit", (code: number) => {
						exitCode = code ?? 0;
						handleCompletion();
					});

					stream.on("close", () => {
						streamClosed = true;
						// If exit wasn't received, use 0 as default
						if (exitCode === null) {
							exitCode = 0;
						}
						handleCompletion();
					});

					stream.on("data", (data: Buffer) => {
						stdout += data.toString();
					});

					stream.stderr.on("data", (data: Buffer) => {
						stderr += data.toString();
					});

					// Close stdin immediately to signal no input will be sent
					// This is critical for non-interactive commands like Claude Code with -p flag
					stream.end();
				});
			});

			conn.on("error", (err: Error) => {
				clearTimeout(connectionTimeout);
				if (!connectionClosed) {
					connectionClosed = true;
					const duration = Date.now() - startTime;
					resolve(
						createErrorResult(
							`SSH connection error: ${err.message}`,
							1,
							duration,
						),
					);
				}
			});

			conn.connect(sshConfig);
		});
	}

	/**
	 * Test SSH connection and Claude Code availability
	 */
	testConnection(): Promise<boolean> {
		return new Promise((resolve) => {
			let sshConfig: ConnectConfig;
			try {
				sshConfig = this.buildSshConfig();
			} catch {
				resolve(false);
				return;
			}

			const conn = new Client();
			let resolved = false;

			const timeout = setTimeout(() => {
				if (!resolved) {
					resolved = true;
					conn.end();
					resolve(false);
				}
			}, 10000);

			conn.on("ready", () => {
				const claudePath = this.credentials.claudePath || "claude";
				// Explicitly disable PTY allocation
				conn.exec(`${claudePath} --version`, { pty: false }, (err, stream) => {
					if (err) {
						clearTimeout(timeout);
						if (!resolved) {
							resolved = true;
							conn.end();
							resolve(false);
						}
						return;
					}

					stream.on("exit", (code: number) => {
						clearTimeout(timeout);
						if (!resolved) {
							resolved = true;
							conn.end();
							resolve(code === 0);
						}
					});

					stream.on("close", () => {
						clearTimeout(timeout);
						if (!resolved) {
							resolved = true;
							conn.end();
							resolve(true); // Assume success if close without exit
						}
					});

					// Close stdin immediately
					stream.end();
				});
			});

			conn.on("error", () => {
				clearTimeout(timeout);
				if (!resolved) {
					resolved = true;
					resolve(false);
				}
			});

			conn.connect(sshConfig);
		});
	}
}
