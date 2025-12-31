import type { INodeProperties } from "n8n-workflow";

export const toolPermissionsDescription: INodeProperties[] = [
	{
		displayName: "Tool Permissions",
		name: "toolPermissions",
		type: "collection",
		placeholder: "Add Permission",
		default: {},
		options: [
			{
				displayName: "Allowed Tools",
				name: "allowedTools",
				type: "string",
				default: "",
				placeholder: "Read, Edit, Bash(git:*), Bash(npm run *)",
				description:
					"Tools Claude Code can use without prompting. Comma-separated. Examples: Read, Edit, Write, Bash(git:*), Bash(npm:*)",
			},
			{
				displayName: "Disallowed Tools",
				name: "disallowedTools",
				type: "string",
				default: "",
				placeholder: "Bash(rm:*), Write(.env)",
				description:
					"Tools Claude Code cannot use. Comma-separated. Examples: Bash(curl:*), Read(.env), Write",
			},
		],
	},
];
