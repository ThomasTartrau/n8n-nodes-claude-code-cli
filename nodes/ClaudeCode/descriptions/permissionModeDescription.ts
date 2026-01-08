import type { INodeProperties } from "n8n-workflow";

export const permissionModeDescription: INodeProperties[] = [
	{
		displayName: "Permission Mode",
		name: "permissionMode",
		type: "options",
		options: [
			{
				name: "Default",
				value: "default",
				description:
					"Standard mode. Claude asks permission before each action (edits, commands, tools).",
			},
			{
				name: "Accept Edits",
				value: "acceptEdits",
				description:
					"Auto-accepts file edits, but asks permission for other operations.",
			},
			{
				name: "Plan",
				value: "plan",
				description:
					"Read-only mode. Claude analyzes and plans without modifying files or executing commands.",
			},
			{
				name: "Don't Ask",
				value: "dontAsk",
				description:
					"Uses allow/deny lists from Tool Permissions. Denies anything not explicitly allowed.",
			},
			{
				name: "Bypass Permissions",
				value: "bypassPermissions",
				description:
					"Bypasses ALL permission checks (YOLO mode). Use with caution!",
			},
			{
				name: "Delegate",
				value: "delegate",
				description:
					"Team lead mode. Limits tools to task management (TaskCreate/TaskList/TaskUpdate/TaskGet) and delegates to sub-agents.",
			},
		],
		default: "default",
		description: "Controls how Claude Code handles permission prompts",
	},
];
