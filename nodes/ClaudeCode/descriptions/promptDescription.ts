import type { INodeProperties } from "n8n-workflow";

export const promptDescription: INodeProperties[] = [
	{
		displayName: "Prompt",
		name: "prompt",
		type: "string",
		typeOptions: {
			rows: 6,
		},
		default: "",
		required: true,
		displayOptions: {
			show: {
				operation: [
					"executePrompt",
					"executeWithContext",
					"continueSession",
					"resumeSession",
				],
			},
		},
		placeholder: "Review this code and suggest improvements...",
		description: "The prompt to send to Claude Code. Supports n8n expressions.",
	},
];
