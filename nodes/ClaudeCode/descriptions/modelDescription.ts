import type { INodeProperties } from "n8n-workflow";

export const modelDescription: INodeProperties[] = [
	{
		displayName: "Model",
		name: "model",
		type: "options",
		options: [
			{ name: "Default (from Claude Code config)", value: "" },
			// Aliases (Latest versions)
			{ name: "Opus (Latest)", value: "opus" },
			{ name: "Sonnet (Latest)", value: "sonnet" },
			{ name: "Haiku (Latest)", value: "haiku" },
			// Claude 4.5 Series
			{ name: "Claude Opus 4.5", value: "claude-opus-4-5-20251101" },
			{ name: "Claude Sonnet 4.5", value: "claude-sonnet-4-5-20250929" },
			{ name: "Claude Haiku 4.5", value: "claude-haiku-4-5-20251001" },
			// Claude 4.x Series
			{ name: "Claude Opus 4.1", value: "claude-opus-4-1-20250805" },
			{ name: "Claude Opus 4", value: "claude-opus-4-20250514" },
			{ name: "Claude Sonnet 4", value: "claude-sonnet-4-20250514" },
			// Claude 3.7 Series
			{ name: "Claude Sonnet 3.7", value: "claude-3-7-sonnet-20250219" },
			// Claude 3.5 Series (Legacy)
			{ name: "Claude Sonnet 3.5 v2", value: "claude-3-5-sonnet-20241022" },
			{ name: "Claude Sonnet 3.5 v1", value: "claude-3-5-sonnet-20240620" },
			{ name: "Claude Haiku 3.5", value: "claude-3-5-haiku-20241022" },
			// Custom
			{ name: "Custom", value: "custom" },
		],
		default: "",
		description:
			"Model to use for execution. Leave empty to use Claude Code default.",
	},
	{
		displayName: "Custom Model ID",
		name: "customModel",
		type: "string",
		default: "",
		displayOptions: {
			show: {
				model: ["custom"],
			},
		},
		placeholder: "claude-opus-4-5-20251101",
		description:
			"Custom model ID to use. Useful for new models or specific versions.",
	},
];
