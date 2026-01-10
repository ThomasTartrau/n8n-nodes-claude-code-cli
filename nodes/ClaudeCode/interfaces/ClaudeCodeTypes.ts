/**
 * Connection mode types for Claude Code execution
 */
export type ConnectionMode = "local" | "ssh" | "docker";

/**
 * Output format types supported by Claude Code CLI
 */
export type OutputFormat = "json" | "text" | "stream-json";

/**
 * Permission mode types for Claude Code CLI
 */
export type PermissionMode =
	| "default"
	| "acceptEdits"
	| "plan"
	| "dontAsk"
	| "bypassPermissions"
	| "delegate";

/**
 * Available operations for the Claude Code node
 */
export type ClaudeCodeOperation =
	| "executePrompt"
	| "executeWithContext"
	| "continueSession"
	| "resumeSession";

/**
 * Tool permission configuration
 */
export interface ToolPermissions {
	allowedTools?: string[];
	disallowedTools?: string[];
}

/**
 * Session configuration for conversation management
 */
export interface SessionConfig {
	sessionId?: string;
	continueLastSession?: boolean;
}

/**
 * Context file for execution with context
 */
export interface ContextFile {
	path: string;
	content?: string;
}

/**
 * Claude Code execution options
 */
export interface ClaudeCodeExecutionOptions {
	prompt: string;
	workingDirectory?: string;
	outputFormat: OutputFormat;
	model?: string;
	maxTurns?: number;
	permissionMode?: PermissionMode;
	toolPermissions?: ToolPermissions;
	session?: SessionConfig;
	contextFiles?: ContextFile[];
	additionalArgs?: string[];
	timeout?: number;
	systemPrompt?: string;
}

/**
 * Executor interface for different connection modes
 */
export interface IClaudeCodeExecutor {
	execute(options: ClaudeCodeExecutionOptions): Promise<ClaudeCodeResult>;
	testConnection(): Promise<boolean>;
}

/**
 * Claude Code JSON output structure from CLI
 */
export interface ClaudeCodeJsonOutput {
	session_id: string;
	result?: string;
	is_error?: boolean;
	total_cost_usd?: number;
	total_duration_ms?: number;
	total_duration_api_ms?: number;
	num_turns?: number;
	usage?: {
		input_tokens: number;
		output_tokens: number;
	};
}

/**
 * Normalized result structure
 */
export interface ClaudeCodeResult {
	success: boolean;
	sessionId: string;
	output: string;
	rawOutput?: ClaudeCodeJsonOutput;
	error?: string;
	exitCode: number;
	duration?: number;
	cost?: number;
	usage?: {
		inputTokens: number;
		outputTokens: number;
	};
	numTurns?: number;
	streamEvents?: StreamEvent[];
}

/**
 * Stream-JSON event types from Claude CLI
 */
export type StreamEventType = "system" | "assistant" | "user" | "result";

/**
 * Base stream event structure
 */
export interface StreamEvent {
	type: StreamEventType;
	subtype?: string;
	session_id?: string;
	[key: string]: unknown;
}

/**
 * System init event from stream-json
 */
export interface StreamSystemEvent extends StreamEvent {
	type: "system";
	subtype: "init";
	session_id: string;
	tools?: string[];
	model?: string;
	cwd?: string;
}

/**
 * Assistant message content item
 */
export interface StreamContentItem {
	type: "text" | "tool_use";
	text?: string;
	id?: string;
	name?: string;
	input?: Record<string, unknown>;
}

/**
 * Tool result content item
 */
export interface StreamToolResultItem {
	type: "tool_result";
	tool_use_id: string;
	content: string;
	is_error?: boolean;
}

/**
 * Assistant message event from stream-json
 */
export interface StreamAssistantEvent extends StreamEvent {
	type: "assistant";
	message: {
		content: StreamContentItem[];
	};
}

/**
 * User/tool result event from stream-json
 */
export interface StreamUserEvent extends StreamEvent {
	type: "user";
	message: {
		content: StreamToolResultItem[];
	};
}

/**
 * Final result event from stream-json
 */
export interface StreamResultEvent extends StreamEvent {
	type: "result";
	subtype: "success" | "error" | "error_max_turns";
	result?: string;
	session_id?: string;
	total_cost_usd?: number;
	total_duration_ms?: number;
	num_turns?: number;
	usage?: {
		input_tokens: number;
		output_tokens: number;
	};
}

/**
 * Local connection credentials
 */
export interface LocalCredentials {
	claudePath: string;
	defaultWorkingDir: string;
	envVars: string;
}

/**
 * SSH connection credentials
 */
export interface SshCredentials {
	host: string;
	port: number;
	username: string;
	authMethod: "privateKey" | "password" | "agent";
	privateKey?: string;
	privateKeyPath?: string;
	passphrase?: string;
	password?: string;
	claudePath: string;
	defaultWorkingDir: string;
}

/**
 * Docker exec credentials
 */
export interface DockerCredentials {
	containerIdentifier: "name" | "id";
	containerName?: string;
	containerId?: string;
	dockerHost: string;
	user: string;
	claudePath: string;
	defaultWorkingDir: string;
}

/**
 * Command builder result
 */
export interface CommandParts {
	command: string;
	args: string[];
	env?: Record<string, string>;
	cwd?: string;
}

/**
 * Execution context passed to executors
 */
export interface ExecutionContext {
	connectionMode: ConnectionMode;
	credentials: LocalCredentials | SshCredentials | DockerCredentials;
	options: ClaudeCodeExecutionOptions;
}
