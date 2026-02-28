import type { INodeProperties } from "n8n-workflow";

export const agentsDescription: INodeProperties[] = [
	{
		displayName: "Subagents",
		name: "agents",
		type: "fixedCollection",
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: "Add Subagent",
		},
		default: { agentsList: [] },
		displayOptions: {
			show: {
				operation: ["executePrompt", "executeWithContext"],
			},
		},
		options: [
			{
				name: "agentsList",
				displayName: "Agents",
				values: [
					{
						displayName: "Agent Name",
						name: "name",
						type: "string",
						default: "",
						required: true,
						placeholder: "code-reviewer",
						description:
							"Unique identifier for this agent. Lowercase letters, numbers, and hyphens only (3-50 chars).",
					},
					{
						displayName: "Description",
						name: "description",
						type: "string",
						typeOptions: { rows: 2 },
						default: "",
						required: true,
						placeholder:
							"Expert code reviewer. Use proactively when code changes are made.",
						description: "When Claude should delegate to this agent.",
					},
					{
						displayName: "System Prompt",
						name: "prompt",
						type: "string",
						typeOptions: { rows: 5 },
						default: "",
						required: true,
						placeholder: "You are a senior code reviewer. Focus on...",
						description: "System prompt governing this agent's behavior.",
					},
					{
						displayName: "Model",
						name: "model",
						type: "options",
						options: [
							{
								name: "Inherit (Parent Model)",
								value: "inherit",
							},
							{ name: "Sonnet", value: "sonnet" },
							{ name: "Opus", value: "opus" },
							{ name: "Haiku", value: "haiku" },
						],
						default: "inherit",
						description: "Model to use for this agent.",
					},
					{
						displayName: "Allowed Tools",
						name: "tools",
						type: "string",
						default: "",
						placeholder: "Read, Grep, Glob, Bash(git:*)",
						description:
							"Tools this agent can use (comma-separated). Leave empty to inherit all tools.",
					},
					{
						displayName: "Disallowed Tools",
						name: "disallowedTools",
						type: "string",
						default: "",
						placeholder: "Write, Edit, Bash(rm:*)",
						description:
							"Tools this agent cannot use (comma-separated). Takes precedence over allowed tools.",
					},
					{
						displayName: "Permission Mode",
						name: "permissionMode",
						type: "options",
						options: [
							{ name: "Default", value: "" },
							{ name: "Accept Edits", value: "acceptEdits" },
							{ name: "Plan (Read-Only)", value: "plan" },
							{ name: "Don't Ask", value: "dontAsk" },
							{
								name: "Bypass Permissions",
								value: "bypassPermissions",
							},
							{ name: "Delegate", value: "delegate" },
						],
						default: "",
						description:
							"Permission mode for this agent. Leave empty to use default.",
					},
					{
						displayName: "Max Turns",
						name: "maxTurns",
						type: "number",
						default: 0,
						description:
							"Maximum agentic turns before stopping. 0 = unlimited.",
					},
					{
						displayName: "Memory",
						name: "memory",
						type: "options",
						options: [
							{ name: "None", value: "" },
							{
								name: "User (Cross-Project)",
								value: "user",
							},
							{
								name: "Project (Shareable)",
								value: "project",
							},
							{
								name: "Local (Not Committed)",
								value: "local",
							},
						],
						default: "",
						description: "Memory persistence mode for this agent.",
					},
				],
			},
		],
		description:
			"Define custom subagents that Claude can delegate to during execution. Useful for specialized workflows (reviewer, debugger, architect...).",
	},
];
