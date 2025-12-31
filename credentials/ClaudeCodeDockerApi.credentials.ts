import type { ICredentialType, INodeProperties, Icon } from "n8n-workflow";

export class ClaudeCodeDockerApi implements ICredentialType {
	name = "claudeCodeDockerApi";
	displayName = "Claude Code Docker";
	icon: Icon = { light: "file:claudecode.svg", dark: "file:claudecode.svg" };
	documentationUrl =
		"https://github.com/ThomasTartrau/n8n-nodes-claude-code-cli";

	properties: INodeProperties[] = [
		{
			displayName: "Container Identifier Type",
			name: "containerIdentifier",
			type: "options",
			options: [
				{ name: "Container Name", value: "name" },
				{ name: "Container ID", value: "id" },
			],
			default: "name",
			description: "How to identify the Docker container",
		},
		{
			displayName: "Container Name",
			name: "containerName",
			type: "string",
			default: "",
			required: true,
			displayOptions: {
				show: {
					containerIdentifier: ["name"],
				},
			},
			placeholder: "claude-code-container",
			description: "Name of the Docker container running Claude Code",
		},
		{
			displayName: "Container ID",
			name: "containerId",
			type: "string",
			default: "",
			required: true,
			displayOptions: {
				show: {
					containerIdentifier: ["id"],
				},
			},
			placeholder: "abc123def456",
			description: "ID of the Docker container running Claude Code",
		},
		{
			displayName: "Docker Host",
			name: "dockerHost",
			type: "string",
			default: "",
			placeholder: "unix:///var/run/docker.sock or tcp://localhost:2375",
			description: "Docker host URL. Leave empty for local Docker socket.",
		},
		{
			displayName: "User",
			name: "user",
			type: "string",
			default: "",
			placeholder: "root or node",
			description:
				"User to run commands as inside the container. Leave empty for default user.",
		},
		{
			displayName: "Claude Code Path",
			name: "claudePath",
			type: "string",
			default: "claude",
			description: "Path to Claude Code inside the container",
		},
		{
			displayName: "Default Working Directory",
			name: "defaultWorkingDir",
			type: "string",
			default: "/workspace",
			description: "Default working directory inside the container",
		},
	];
}
