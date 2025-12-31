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
				conn.exec(remoteCmd, (err, stream) => {
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

					stream.on("close", (code: number) => {
						clearTimeout(connectionTimeout);
						if (!connectionClosed) {
							connectionClosed = true;
							conn.end();

							const duration = Date.now() - startTime;
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
						}
					});

					stream.on("data", (data: Buffer) => {
						stdout += data.toString();
					});

					stream.stderr.on("data", (data: Buffer) => {
						stderr += data.toString();
					});

					// Close stdin to signal no input will be sent
					// This prevents the remote process from waiting for input
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
				conn.exec(`${claudePath} --version`, (err, stream) => {
					if (err) {
						clearTimeout(timeout);
						if (!resolved) {
							resolved = true;
							conn.end();
							resolve(false);
						}
						return;
					}

					stream.on("close", (code: number) => {
						clearTimeout(timeout);
						if (!resolved) {
							resolved = true;
							conn.end();
							resolve(code === 0);
						}
					});

					// Close stdin to signal no input will be sent
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
