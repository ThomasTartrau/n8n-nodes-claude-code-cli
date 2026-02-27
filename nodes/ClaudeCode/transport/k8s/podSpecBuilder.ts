import type {
	K8sCredentials,
	ClaudeCodeExecutionOptions,
} from "../../interfaces/index.js";

interface V1EnvVar {
	name: string;
	value: string;
}

interface V1Container {
	name: string;
	image: string;
	command?: string[];
	args?: string[];
	env?: V1EnvVar[];
	workingDir?: string;
	resources?: {
		limits?: Record<string, string>;
		requests?: Record<string, string>;
	};
}

interface V1PodSpec {
	metadata: {
		name: string;
		namespace: string;
		labels: Record<string, string>;
	};
	spec: {
		restartPolicy: string;
		containers: V1Container[];
		imagePullSecrets?: Array<{ name: string }>;
		serviceAccountName?: string;
		nodeSelector?: Record<string, string>;
	};
}

/**
 * Escapes a string for safe use inside single quotes in a shell command.
 * Replaces each single quote with '\'' (end quote, escaped quote, start quote).
 */
function escapeShellArg(arg: string): string {
	return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Returns a shell prefix that writes OAuth credentials to ~/.claude/.credentials.json
 * and unsets the env var so it doesn't leak to child processes.
 * Returns an empty string when no OAuth credentials are configured.
 */
function buildCredentialInjectionPrefix(credentials: K8sCredentials): string {
	if (!credentials.claudeOAuthCredentials) {
		return "";
	}
	return (
		"mkdir -p ~/.claude" +
		' && echo "$__CLAUDE_OAUTH_CREDENTIALS" > ~/.claude/.credentials.json' +
		" && chmod 600 ~/.claude/.credentials.json" +
		" && echo '{\"hasCompletedOnboarding\":true}' > ~/.claude/.claude.json" +
		" && unset __CLAUDE_OAUTH_CREDENTIALS && "
	);
}

/**
 * Builds environment variables from credentials
 */
function buildEnvVars(credentials: K8sCredentials): V1EnvVar[] {
	const envVars: V1EnvVar[] = [];

	if (credentials.claudeOAuthCredentials) {
		envVars.push({
			name: "__CLAUDE_OAUTH_CREDENTIALS",
			value: credentials.claudeOAuthCredentials,
		});
	}

	if (credentials.envVars && credentials.envVars !== "{}") {
		const parsed = JSON.parse(credentials.envVars) as Record<string, string>;
		for (const [key, value] of Object.entries(parsed)) {
			envVars.push({ name: key, value: String(value) });
		}
	}

	return envVars;
}

/**
 * Builds resource limits from credentials
 */
function buildResourceLimits(
	credentials: K8sCredentials,
): Record<string, string> | undefined {
	const limits: Record<string, string> = {};

	if (credentials.cpuLimit) {
		limits.cpu = credentials.cpuLimit;
	}
	if (credentials.memoryLimit) {
		limits.memory = credentials.memoryLimit;
	}

	return Object.keys(limits).length > 0 ? limits : undefined;
}

/**
 * Builds a pod spec for ephemeral (run-to-completion) execution.
 * The pod runs the claude CLI command directly and exits.
 */
export function buildEphemeralPodSpec(
	credentials: K8sCredentials,
	options: ClaudeCodeExecutionOptions,
	podName: string,
): V1PodSpec {
	const claudePath = credentials.claudePath || "claude";
	const workDir =
		options.workingDirectory || credentials.defaultWorkingDir || "/workspace";

	const claudeArgs = buildClaudeArgs(options);
	const envVars = buildEnvVars(credentials);
	const limits = buildResourceLimits(credentials);

	const credentialPrefix = buildCredentialInjectionPrefix(credentials);

	const container: V1Container = credentialPrefix
		? {
				name: "claude-code",
				image: credentials.image,
				command: ["sh", "-c"],
				args: [
					credentialPrefix +
						escapeShellArg(claudePath) +
						" " +
						claudeArgs.map(escapeShellArg).join(" "),
				],
				workingDir: workDir,
				env: envVars.length > 0 ? envVars : undefined,
				resources: limits ? { limits } : undefined,
			}
		: {
				name: "claude-code",
				image: credentials.image,
				command: [claudePath],
				args: claudeArgs,
				workingDir: workDir,
				env: envVars.length > 0 ? envVars : undefined,
				resources: limits ? { limits } : undefined,
			};

	const spec: V1PodSpec = {
		metadata: {
			name: podName,
			namespace: credentials.namespace || "default",
			labels: {
				app: "claude-code-ephemeral",
				"managed-by": "n8n-claude-code",
			},
		},
		spec: {
			restartPolicy: "Never",
			containers: [container],
		},
	};

	if (credentials.imagePullSecret) {
		spec.spec.imagePullSecrets = [{ name: credentials.imagePullSecret }];
	}

	if (credentials.serviceAccountName) {
		spec.spec.serviceAccountName = credentials.serviceAccountName;
	}

	if (credentials.nodeSelector && credentials.nodeSelector !== "{}") {
		spec.spec.nodeSelector = JSON.parse(credentials.nodeSelector) as Record<
			string,
			string
		>;
	}

	return spec;
}

/**
 * Builds a pod spec for persistent (long-running) worker pod.
 * The pod runs `sleep infinity` and commands are executed via exec.
 */
export function buildPersistentPodSpec(
	credentials: K8sCredentials,
	podName: string,
): V1PodSpec {
	const workDir = credentials.defaultWorkingDir || "/workspace";
	const envVars = buildEnvVars(credentials);
	const limits = buildResourceLimits(credentials);

	const credentialPrefix = buildCredentialInjectionPrefix(credentials);
	const sleepLoop =
		"trap 'exit 0' TERM; while true; do sleep 3600 & wait; done";

	const container: V1Container = {
		name: "claude-code",
		image: credentials.image,
		command: ["sh", "-c", credentialPrefix + sleepLoop],
		workingDir: workDir,
		env: envVars.length > 0 ? envVars : undefined,
		resources: limits ? { limits } : undefined,
	};

	const spec: V1PodSpec = {
		metadata: {
			name: podName,
			namespace: credentials.namespace || "default",
			labels: {
				app: "claude-code-persistent",
				"managed-by": "n8n-claude-code",
			},
		},
		spec: {
			restartPolicy: "Always",
			containers: [container],
		},
	};

	if (credentials.imagePullSecret) {
		spec.spec.imagePullSecrets = [{ name: credentials.imagePullSecret }];
	}

	if (credentials.serviceAccountName) {
		spec.spec.serviceAccountName = credentials.serviceAccountName;
	}

	if (credentials.nodeSelector && credentials.nodeSelector !== "{}") {
		spec.spec.nodeSelector = JSON.parse(credentials.nodeSelector) as Record<
			string,
			string
		>;
	}

	return spec;
}

/**
 * Builds Claude CLI arguments from execution options
 */
export function buildClaudeArgs(options: ClaudeCodeExecutionOptions): string[] {
	const args: string[] = [];

	args.push("-p");
	args.push(options.prompt);

	if (options.outputFormat) {
		args.push("--output-format", options.outputFormat);
		if (options.outputFormat === "stream-json") {
			args.push("--verbose");
		}
	}

	if (options.model) {
		args.push("--model", options.model);
	}

	if (options.maxTurns && options.maxTurns > 0) {
		args.push("--max-turns", String(options.maxTurns));
	}

	if (options.permissionMode) {
		args.push("--permission-mode", options.permissionMode);
	}

	if (options.session?.continueLastSession) {
		args.push("--continue");
	} else if (options.session?.sessionId) {
		args.push("--resume", options.session.sessionId);
	}

	if (
		options.toolPermissions?.allowedTools &&
		options.toolPermissions.allowedTools.length > 0
	) {
		args.push("--allowedTools", options.toolPermissions.allowedTools.join(","));
	}
	if (
		options.toolPermissions?.disallowedTools &&
		options.toolPermissions.disallowedTools.length > 0
	) {
		args.push(
			"--disallowedTools",
			options.toolPermissions.disallowedTools.join(","),
		);
	}

	if (options.systemPrompt) {
		args.push("--append-system-prompt", options.systemPrompt);
	}

	if (options.contextFiles && options.contextFiles.length > 0) {
		const uniqueDirs = new Set<string>();
		options.contextFiles.forEach((file) => {
			const lastSlash = file.path.lastIndexOf("/");
			if (lastSlash > 0) {
				uniqueDirs.add(file.path.substring(0, lastSlash));
			}
		});
		uniqueDirs.forEach((dir) => {
			args.push("--add-dir", dir);
		});
	}

	if (options.additionalArgs && options.additionalArgs.length > 0) {
		args.push(...options.additionalArgs);
	}

	return args;
}
