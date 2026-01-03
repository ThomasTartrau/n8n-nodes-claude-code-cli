import type { ICredentialType, INodeProperties, Icon } from "n8n-workflow";

export class ClaudeCodeSshApi implements ICredentialType {
	name = "claudeCodeSshApi";
	displayName = "Claude Code SSH";
	icon: Icon = "file:../icons/claudecode.svg";
	documentationUrl =
		"https://github.com/ThomasTartrau/n8n-nodes-claude-code-cli";

	properties: INodeProperties[] = [
		{
			displayName: "Host",
			name: "host",
			type: "string",
			default: "",
			required: true,
			placeholder: "example.com or 192.168.1.100",
			description: "SSH host address",
		},
		{
			displayName: "Port",
			name: "port",
			type: "number",
			default: 22,
			description: "SSH port number",
		},
		{
			displayName: "Username",
			name: "username",
			type: "string",
			default: "",
			required: true,
			description: "SSH username",
		},
		{
			displayName: "Authentication Method",
			name: "authMethod",
			type: "options",
			options: [
				{ name: "Private Key", value: "privateKey" },
				{ name: "Password", value: "password" },
				{ name: "SSH Agent", value: "agent" },
			],
			default: "privateKey",
			description: "How to authenticate with the SSH server",
		},
		{
			displayName: "Private Key",
			name: "privateKey",
			type: "string",
			typeOptions: {
				password: true,
				rows: 5,
			},
			default: "",
			displayOptions: {
				show: {
					authMethod: ["privateKey"],
				},
			},
			description:
				"SSH private key content (PEM format). Paste the full key including BEGIN/END lines.",
		},
		{
			displayName: "Private Key Path",
			name: "privateKeyPath",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					authMethod: ["privateKey"],
				},
			},
			placeholder: "~/.ssh/id_rsa",
			description:
				"Path to SSH private key file on the n8n server. Alternative to pasting the key content.",
		},
		{
			displayName: "Passphrase",
			name: "passphrase",
			type: "string",
			typeOptions: { password: true },
			default: "",
			displayOptions: {
				show: {
					authMethod: ["privateKey"],
				},
			},
			description: "Passphrase for private key (if the key is encrypted)",
		},
		{
			displayName: "Password",
			name: "password",
			type: "string",
			typeOptions: { password: true },
			default: "",
			displayOptions: {
				show: {
					authMethod: ["password"],
				},
			},
			description: "SSH password",
		},
		{
			displayName: "Claude Code Path",
			name: "claudePath",
			type: "string",
			default: "claude",
			description: "Path to Claude Code on the remote machine",
		},
		{
			displayName: "Default Working Directory",
			name: "defaultWorkingDir",
			type: "string",
			default: "",
			placeholder: "/home/user/project",
			description:
				"Default remote working directory for Claude Code operations",
		},
	];
}
