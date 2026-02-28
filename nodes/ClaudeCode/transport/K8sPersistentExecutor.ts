import stream from "node:stream";
import type {
	IClaudeCodeExecutor,
	ClaudeCodeExecutionOptions,
	ClaudeCodeResult,
	K8sCredentials,
} from "../interfaces/index.js";
import {
	parseJsonOutput,
	normalizeOutput,
	createErrorResult,
	parseStreamJsonOutput,
	normalizeStreamOutput,
} from "../utils/index.js";
import {
	createK8sClients,
	buildPersistentPodSpec,
	buildClaudeArgs,
	waitForPodReady,
	waitForPodDeletion,
} from "./k8s/index.js";
import type { K8sClients } from "./k8s/index.js";

const PERSISTENT_POD_NAME = "claude-code-worker";

/**
 * Executor that reuses a persistent Kubernetes pod.
 * If the pod doesn't exist, it's created on-the-fly.
 * Commands are executed via `kubectl exec` (Kubernetes API exec).
 */
export class K8sPersistentExecutor implements IClaudeCodeExecutor {
	private credentials: K8sCredentials;

	constructor(credentials: unknown) {
		this.credentials = credentials as K8sCredentials;
	}

	/**
	 * Ensures the persistent worker pod exists and is running.
	 * Creates it if it doesn't exist or if it's in a terminal state.
	 */
	private ensurePodRunning(
		clients: K8sClients,
		namespace: string,
		timeoutMs: number,
	): Promise<void> {
		return clients.coreApi
			.readNamespacedPod({ name: PERSISTENT_POD_NAME, namespace })
			.then((pod) => {
				const phase = pod.status?.phase || "Unknown";

				if (phase === "Running") {
					const containers = pod.status?.containerStatuses || [];
					const allReady =
						containers.length > 0 && containers.every((c) => c.ready);
					if (allReady) {
						return;
					}
					return waitForPodReady(
						clients,
						PERSISTENT_POD_NAME,
						namespace,
						timeoutMs,
					).then(() => {});
				}

				if (phase === "Pending") {
					return waitForPodReady(
						clients,
						PERSISTENT_POD_NAME,
						namespace,
						timeoutMs,
					).then(() => {});
				}

				// Pod is in Failed/Succeeded/Unknown state - delete and recreate
				return clients.coreApi
					.deleteNamespacedPod({
						name: PERSISTENT_POD_NAME,
						namespace,
					})
					.then(() =>
						waitForPodDeletion(
							clients,
							PERSISTENT_POD_NAME,
							namespace,
							timeoutMs,
						),
					)
					.then(() => this.createAndWaitForPod(clients, namespace, timeoutMs));
			})
			.catch((error: Error & { statusCode?: number; code?: number }) => {
				const status = error.statusCode ?? error.code;
				if (status === 404) {
					return this.createAndWaitForPod(clients, namespace, timeoutMs);
				}
				return Promise.reject(error);
			});
	}

	private createAndWaitForPod(
		clients: K8sClients,
		namespace: string,
		timeoutMs: number,
	): Promise<void> {
		const podSpec = buildPersistentPodSpec(
			this.credentials,
			PERSISTENT_POD_NAME,
		);

		return clients.coreApi
			.createNamespacedPod({
				namespace,
				body: podSpec as never,
			})
			.then(() =>
				waitForPodReady(clients, PERSISTENT_POD_NAME, namespace, timeoutMs),
			)
			.then(() => {});
	}

	/**
	 * Executes a command inside the persistent pod via the Kubernetes exec API.
	 */
	private execInPod(
		clients: K8sClients,
		namespace: string,
		command: string[],
	): Promise<{ stdout: string; stderr: string; exitCode: number }> {
		return import("@kubernetes/client-node").then((k8s) => {
			const exec = new k8s.Exec(clients.kc);

			let stdout = "";
			let stderr = "";

			const stdoutStream = new stream.Writable({
				write(chunk: Buffer, _encoding: string, callback: () => void) {
					stdout += chunk.toString();
					callback();
				},
			});

			const stderrStream = new stream.Writable({
				write(chunk: Buffer, _encoding: string, callback: () => void) {
					stderr += chunk.toString();
					callback();
				},
			});

			return new Promise<{
				stdout: string;
				stderr: string;
				exitCode: number;
			}>((resolve) => {
				exec
					.exec(
						namespace,
						PERSISTENT_POD_NAME,
						"claude-code",
						command,
						stdoutStream,
						stderrStream,
						null,
						false,
						(status) => {
							const exitCode =
								status.status === "Success"
									? 0
									: Number.parseInt(
											((status as Record<string, unknown>).code as string) ||
												"1",
											10,
										);
							resolve({ stdout, stderr, exitCode });
						},
					)
					.catch((error: Error) => {
						resolve({
							stdout: "",
							stderr: error.message,
							exitCode: 1,
						});
					});
			});
		});
	}

	execute(options: ClaudeCodeExecutionOptions): Promise<ClaudeCodeResult> {
		const startTime = Date.now();
		const namespace = this.credentials.namespace || "default";
		const timeoutMs = options.timeout ? options.timeout * 1000 : 300000;

		return createK8sClients(this.credentials)
			.then((clients) => {
				return this.ensurePodRunning(clients, namespace, timeoutMs).then(() => {
					const claudePath = this.credentials.claudePath || "claude";
					const claudeArgs = buildClaudeArgs(options);
					const workDir =
						options.workingDirectory ||
						this.credentials.defaultWorkingDir ||
						"/workspace";

					// Build the full command with cd to workdir
					const envPrefix =
						options.extendedContext === false
							? "export CLAUDE_CODE_DISABLE_1M_CONTEXT=1 && "
							: "";
					const command = [
						"sh",
						"-c",
						`${envPrefix}cd ${workDir} && ${claudePath} ${claudeArgs.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(" ")}`,
					];

					return this.execInPod(clients, namespace, command).then(
						({ stdout, stderr, exitCode }) => {
							const duration = Date.now() - startTime;

							if (options.outputFormat === "json") {
								const parsed = parseJsonOutput(stdout);
								return normalizeOutput(parsed, exitCode, duration, stderr);
							}

							if (options.outputFormat === "stream-json") {
								const { events, result } = parseStreamJsonOutput(stdout);
								return normalizeStreamOutput(
									events,
									result,
									exitCode,
									duration,
									stderr,
								);
							}

							return {
								success: exitCode === 0,
								sessionId: "",
								output: stdout,
								exitCode,
								duration,
								error: exitCode !== 0 ? stderr : undefined,
							} satisfies ClaudeCodeResult;
						},
					);
				});
			})
			.catch((error: Error) => {
				const duration = Date.now() - startTime;
				return createErrorResult(
					`K8s persistent execution failed: ${error.message}`,
					1,
					duration,
				);
			});
	}

	testConnection(): Promise<boolean> {
		return createK8sClients(this.credentials)
			.then((clients) => {
				const namespace = this.credentials.namespace || "default";
				return clients.coreApi
					.listNamespacedPod({ namespace, limit: 1 })
					.then(() => true);
			})
			.catch(() => false);
	}
}
