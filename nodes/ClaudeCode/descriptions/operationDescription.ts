import type { INodeProperties } from "n8n-workflow";

export const operationDescription: INodeProperties[] = [
	{
		displayName: "Operation",
		name: "operation",
		type: "options",
		noDataExpression: true,
		options: [
			{
				name: "Execute Prompt",
				value: "executePrompt",
				description: "Send a prompt to Claude Code and get a response",
				action: "Execute a prompt",
			},
			{
				name: "Execute with Context",
				value: "executeWithContext",
				description: "Execute a prompt with additional file context",
				action: "Execute with file context",
			},
			{
				name: "Continue Session",
				value: "continueSession",
				description: "Continue the most recent Claude Code conversation",
				action: "Continue last session",
			},
			{
				name: "Resume Session",
				value: "resumeSession",
				description: "Resume a specific Claude Code session by ID",
				action: "Resume specific session",
			},
		],
		default: "executePrompt",
	},
];
