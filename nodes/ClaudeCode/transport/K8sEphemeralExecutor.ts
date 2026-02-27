import { randomUUID } from "node:crypto";
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
	buildEphemeralPodSpec,
	waitForPodCompletion,
} from "./k8s/index.js";

/**
 * Executor that creates a new Kubernetes pod for each execution.
 * The pod runs the Claude Code CLI command, captures output via logs,
 * then the pod is deleted.
 */
export class K8sEphemeralExecutor implements IClaudeCodeExecutor {
	private credentials: K8sCredentials;

	constructor(credentials: unknown) {
		this.credentials = credentials as K8sCredentials;
	}

	execute(options: ClaudeCodeExecutionOptions): Promise<ClaudeCodeResult> {
		const startTime = Date.now();
		const namespace = this.credentials.namespace || "default";
		const podName = `claude-code-${randomUUID().slice(0, 8)}`;
		const timeoutMs = options.timeout ? options.timeout * 1000 : 300000;

		return createK8sClients(this.credentials)
			.then((clients) => {
				const podSpec = buildEphemeralPodSpec(
					this.credentials,
					options,
					podName,
				);

				return clients.coreApi
					.createNamespacedPod({
						namespace,
						body: podSpec as never,
					})
					.then(() =>
						waitForPodCompletion(clients, podName, namespace, timeoutMs),
					)
					.then((phase) => {
						return clients.coreApi
							.readNamespacedPodLog({
								name: podName,
								namespace,
								container: "claude-code",
							})
							.then((logOutput) => {
								const duration = Date.now() - startTime;
								const stdout =
									typeof logOutput === "string" ? logOutput : String(logOutput);
								const exitCode = phase === "Succeeded" ? 0 : 1;

								if (options.outputFormat === "json") {
									const parsed = parseJsonOutput(stdout);
									return normalizeOutput(parsed, exitCode, duration);
								}

								if (options.outputFormat === "stream-json") {
									const { events, result } = parseStreamJsonOutput(stdout);
									return normalizeStreamOutput(
										events,
										result,
										exitCode,
										duration,
									);
								}

								return {
									success: exitCode === 0,
									sessionId: "",
									output: stdout,
									exitCode,
									duration,
									error:
										exitCode !== 0
											? `Pod finished with phase: ${phase}`
											: undefined,
								} satisfies ClaudeCodeResult;
							});
					})
					.finally(() => {
						clients.coreApi
							.deleteNamespacedPod({ name: podName, namespace })
							.catch(() => {});
					});
			})
			.catch((error: Error) => {
				const duration = Date.now() - startTime;
				return createErrorResult(
					`K8s ephemeral execution failed: ${error.message}`,
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
