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
				displayName: "System Prompt",
				name: "systemPrompt",
				type: "string",
				typeOptions: {
					rows: 4,
				},
				default: "",
				placeholder: "You are a helpful code reviewer...",
				description:
					"Additional system prompt to append to Claude Code default system prompt",
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
