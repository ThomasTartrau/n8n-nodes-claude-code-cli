import type {
	ClaudeCodeExecutionOptions,
	CommandParts,
	LocalCredentials,
	SshCredentials,
	DockerCredentials,
} from "../interfaces/index.js";

type AnyCredentials = LocalCredentials | SshCredentials | DockerCredentials;

/**
 * Builds the Claude Code CLI command parts from execution options
 */
export function buildCommand(
	options: ClaudeCodeExecutionOptions,
	credentials: AnyCredentials,
): CommandParts {
	const args: string[] = [];
	const env: Record<string, string> = {};

	// Print mode flag (headless/non-interactive)
	args.push("-p");
	args.push(options.prompt);

	// Output format
	if (options.outputFormat) {
		args.push("--output-format", options.outputFormat);
	}

	// Model selection
	if (options.model) {
		args.push("--model", options.model);
	}

	// Max turns
	if (options.maxTurns && options.maxTurns > 0) {
		args.push("--max-turns", String(options.maxTurns));
	}

	// Permission mode
	if (options.permissionMode) {
		args.push("--permission-mode", options.permissionMode);
	}

	// Session management
	if (options.session?.continueLastSession) {
		args.push("--continue");
	} else if (options.session?.sessionId) {
		args.push("--resume", options.session.sessionId);
	}

	// Tool permissions
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

	// System prompt append
	if (options.systemPrompt) {
		args.push("--append-system-prompt", options.systemPrompt);
	}

	// Context files (via --add-dir for directories containing the files)
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

	// Additional arguments
	if (options.additionalArgs && options.additionalArgs.length > 0) {
		args.push(...options.additionalArgs);
	}

	// Parse env vars from local credentials
	if ("envVars" in credentials && credentials.envVars) {
		const envVarsString = credentials.envVars as string;
		if (envVarsString && envVarsString !== "{}") {
			const parsed = JSON.parse(envVarsString) as Record<string, string>;
			Object.assign(env, parsed);
		}
	}

	const claudePath = credentials.claudePath || "claude";
	const cwd =
		options.workingDirectory || credentials.defaultWorkingDir || undefined;

	return {
		command: claudePath,
		args,
		env: Object.keys(env).length > 0 ? env : undefined,
		cwd,
	};
}

/**
 * Escapes a shell argument for safe use in SSH/Docker exec commands
 */
export function escapeShellArg(arg: string): string {
	// Single-quote the argument and escape any existing single quotes
	return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Builds a complete shell command string from parts
 */
export function buildShellCommand(parts: CommandParts): string {
	const escapedArgs = parts.args.map(escapeShellArg);
	let cmd = "";

	if (parts.cwd) {
		cmd += `cd ${escapeShellArg(parts.cwd)} && `;
	}

	cmd += `${parts.command} ${escapedArgs.join(" ")}`;

	return cmd;
}
