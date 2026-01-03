import type { ICredentialType, INodeProperties, Icon } from "n8n-workflow";

export class ClaudeCodeLocalApi implements ICredentialType {
	name = "claudeCodeLocalApi";
	displayName = "Claude Code Local";
	icon: Icon = "file:../icons/claudecode.svg";
	documentationUrl =
		"https://github.com/ThomasTartrau/n8n-nodes-claude-code-cli";

	properties: INodeProperties[] = [
		{
			displayName: "Claude Code Path",
			name: "claudePath",
			type: "string",
			default: "claude",
			description:
				'Path to Claude Code CLI executable. Leave as "claude" if it is in your PATH.',
		},
		{
			displayName: "Default Working Directory",
			name: "defaultWorkingDir",
			type: "string",
			default: "",
			placeholder: "/path/to/project",
			description:
				"Default working directory for Claude Code operations. Can be overridden per operation.",
		},
		{
			displayName: "Environment Variables",
			name: "envVars",
			type: "json",
			default: "{}",
			description:
				'Additional environment variables as JSON object (e.g., {"ANTHROPIC_API_KEY": "sk-..."})',
		},
	];
}
