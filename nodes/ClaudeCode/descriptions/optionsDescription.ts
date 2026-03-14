import type { INodeProperties } from "n8n-workflow";

export const optionsDescription: INodeProperties[] = [
	{
		displayName: "Options",
		name: "options",
		type: "collection",
		placeholder: "Add Option",
		default: {},
		options: [
			{
				displayName: "Working Directory",
				name: "workingDirectory",
				type: "string",
				default: "",
				placeholder: "/path/to/project",
				description:
					"Working directory for Claude Code execution. Overrides the default from credentials.",
			},
			{
				displayName: "Output Format",
				name: "outputFormat",
				type: "options",
				options: [
					{ name: "JSON", value: "json" },
					{ name: "Text", value: "text" },
					{ name: "Stream JSON", value: "stream-json" },
				],
				default: "json",
				description:
					"Output format for Claude Code response. Stream JSON captures all tool interactions as streaming events.",
			},
			{
				displayName: "Reasoning Effort",
				name: "effort",
				type: "options",
				options: [
					{ name: "Low", value: "low" },
					{ name: "Medium", value: "medium" },
					{ name: "High", value: "high" },
				],
				default: "high",
				description:
					"Controls the reasoning effort level. Low = fast and cheap, High = deep thinking. Useful for workflows where some tasks are simple (summary, extraction) vs complex (refactoring).",
			},
			{
				displayName: "Max Turns",
				name: "maxTurns",
				type: "number",
				default: 0,
				description:
					"Maximum number of conversation turns. 0 means unlimited. Useful for limiting API costs.",
			},
			{
				displayName: "Timeout (Seconds)",
				name: "timeout",
				type: "number",
				default: 300,
				description: "Execution timeout in seconds. Maximum: 3600 (1 hour).",
			},
			{
				displayName: "System Prompt Mode",
				name: "systemPromptMode",
				type: "options",
				options: [
					{
						name: "Append",
						value: "append",
						description: "Append to Claude Code default system prompt",
					},
					{
						name: "Replace",
						value: "replace",
						description: "Replace the entire Claude Code default system prompt",
					},
				],
				default: "append",
				description:
					"Whether to append to or replace the default Claude Code system prompt. Replace gives full control over system instructions.",
			},
			{
				displayName: "System Prompt",
				name: "systemPrompt",
				type: "string",
				typeOptions: {
					rows: 4,
				},
				default: "",
				placeholder: "You are a helpful code reviewer...",
				description:
					"System prompt text. Behavior depends on System Prompt Mode: Append adds to the default prompt, Replace overrides it entirely.",
			},
			{
				displayName: "System Prompt File",
				name: "systemPromptFile",
				type: "string",
				default: "",
				placeholder: "/path/to/system-prompt.txt",
				description:
					"Path to a file containing system prompt text. Behavior depends on System Prompt Mode: Append adds to the default prompt, Replace overrides it entirely.",
			},
			{
				displayName: "Verbose",
				name: "verbose",
				type: "boolean",
				default: false,
				description:
					"Enable verbose logging. Automatically enabled when Output Format is Stream JSON. Useful for debugging in JSON or Text output modes.",
			},
			{
				displayName: "Max Budget (USD)",
				name: "maxBudgetUsd",
				type: "number",
				default: 0,
				description:
					"Maximum dollar amount to spend before stopping execution. 0 means unlimited. Critical for controlling costs in automated workflows.",
			},
			{
				displayName: "Max Output Tokens",
				name: "maxOutputTokens",
				type: "number",
				default: 0,
				description:
					"Maximum number of tokens in the output. 0 means unlimited. Useful for controlling costs and avoiding overly long responses in automated workflows. Sets CLAUDE_CODE_MAX_OUTPUT_TOKENS environment variable.",
			},
			{
				displayName: "JSON Schema",
				name: "jsonSchema",
				type: "string",
				typeOptions: {
					rows: 4,
				},
				default: "",
				placeholder:
					'{"type":"object","properties":{"summary":{"type":"string"}}}',
				description:
					"JSON schema for validated structured output. Claude will return JSON matching this schema. Must be a valid JSON schema string.",
			},
			{
				displayName: "Fallback Model",
				name: "fallbackModel",
				type: "string",
				default: "",
				placeholder: "claude-sonnet-4-20250514",
				description:
					"Fallback model to use when the primary model is overloaded or unavailable. Improves resilience in production workflows.",
			},
			{
				displayName: "Extended Context (1M Tokens)",
				name: "extendedContext",
				type: "boolean",
				default: true,
				description:
					"Enable 1M token context window for analyzing very large codebases in a single pass. Only supported by Claude Opus 4.6, Sonnet 4.6, Sonnet 4.5, and Sonnet 4. Has no effect on other models.",
			},
			{
				displayName: "Worktree Isolation",
				name: "worktreeEnabled",
				type: "boolean",
				default: false,
				description:
					"Run Claude Code in an isolated git worktree. Each execution works on a separate copy of the repository, preventing conflicts with the main workspace. The worktree is automatically cleaned up if no changes are made.",
			},
			{
				displayName: "Worktree Name",
				name: "worktreeName",
				type: "string",
				default: "",
				placeholder: "feature-auth",
				description:
					"Optional name for the worktree. If empty, Claude Code auto-generates a unique name. The worktree is created at <repo>/.claude/worktrees/<name>/.",
				displayOptions: {
					show: {
						worktreeEnabled: [true],
					},
				},
			},
			{
				displayName: "Additional Arguments",
				name: "additionalArgs",
				type: "string",
				default: "",
				placeholder: "--verbose --no-cache",
				description:
					"Additional CLI arguments to pass to Claude Code (space-separated)",
			},
		],
	},
];
