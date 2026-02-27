import type { INodeProperties } from "n8n-workflow";

export const connectionModeDescription: INodeProperties[] = [
	{
		displayName: "Connection Mode",
		name: "connectionMode",
		type: "options",
		options: [
			{
				name: "Local",
				value: "local",
				description:
					"Claude Code installed on the same machine/container as n8n",
			},
			{
				name: "SSH Remote",
				value: "ssh",
				description: "Claude Code on a remote machine accessible via SSH",
			},
			{
				name: "Docker Exec",
				value: "docker",
				description: "Claude Code running in another Docker container",
			},
			{
				name: "Kubernetes Ephemeral Pod",
				value: "k8sEphemeral",
				description:
					"Creates a new pod for each execution, then deletes it. Full isolation per run.",
			},
			{
				name: "Kubernetes Persistent Pod",
				value: "k8sPersistent",
				description:
					"Reuses a long-running worker pod via exec. Creates it on-the-fly if needed.",
			},
		],
		default: "local",
		description: "How to connect to the Claude Code CLI",
	},
];
