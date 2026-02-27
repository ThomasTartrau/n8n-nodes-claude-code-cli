import type { INodeProperties } from "n8n-workflow";

export const k8sSharedProperties: INodeProperties[] = [
	{
		displayName: "Authentication Method",
		name: "authMethod",
		type: "options",
		options: [
			{
				name: "In-Cluster (Service Account)",
				value: "inCluster",
				description:
					"Auto-detect credentials from the pod service account. Use when n8n runs inside the same Kubernetes cluster.",
			},
			{
				name: "KubeConfig File",
				value: "kubeConfigFile",
				description: "Path to a kubeconfig file on the n8n host",
			},
			{
				name: "KubeConfig Inline",
				value: "kubeConfigInline",
				description: "Paste the kubeconfig YAML content directly",
			},
		],
		default: "inCluster",
		description: "How to authenticate with the Kubernetes API",
	},
	{
		displayName: "KubeConfig Path",
		name: "kubeConfigPath",
		type: "string",
		default: "",
		required: true,
		displayOptions: {
			show: {
				authMethod: ["kubeConfigFile"],
			},
		},
		placeholder: "/home/user/.kube/config",
		description: "Absolute path to the kubeconfig file",
	},
	{
		displayName: "KubeConfig Content",
		name: "kubeConfigContent",
		type: "string",
		typeOptions: {
			rows: 10,
		},
		default: "",
		required: true,
		displayOptions: {
			show: {
				authMethod: ["kubeConfigInline"],
			},
		},
		placeholder: "apiVersion: v1\nclusters:\n- cluster: ...",
		description:
			"Full kubeconfig YAML content. Credentials are encrypted at rest by n8n.",
	},
	{
		displayName: "Context",
		name: "kubeContext",
		type: "string",
		default: "",
		displayOptions: {
			show: {
				authMethod: ["kubeConfigFile", "kubeConfigInline"],
			},
		},
		placeholder: "my-cluster-context",
		description:
			"Kubernetes context to use from the kubeconfig. Leave empty for current context.",
	},
	{
		displayName: "Namespace",
		name: "namespace",
		type: "string",
		default: "default",
		description: "Kubernetes namespace where pods will be created or managed",
	},
	{
		displayName: "Container Image",
		name: "image",
		type: "string",
		default: "",
		required: true,
		placeholder: "my-registry/claude-code:latest",
		description:
			"Docker image containing Claude Code CLI. Must have the claude binary available.",
	},
	{
		displayName: "Claude Code Path",
		name: "claudePath",
		type: "string",
		default: "claude",
		description: "Path to Claude Code CLI inside the container",
	},
	{
		displayName: "Default Working Directory",
		name: "defaultWorkingDir",
		type: "string",
		default: "/workspace",
		description: "Default working directory inside the pod container",
	},
	{
		displayName: "Claude OAuth Credentials",
		name: "claudeOAuthCredentials",
		type: "string",
		typeOptions: {
			rows: 6,
		},
		default: "",
		placeholder:
			'{"claudeAiOauth":{"accessToken":"sk-ant-oat01-...","refreshToken":"sk-ant-ort01-...","expiresAt":...}}',
		hint: 'macOS: run security find-generic-password -s "Claude Code-credentials" -w',
		description:
			"Contents of ~/.claude/.credentials.json for OAuth-based authentication (Pro/Max subscriptions). Paste the full JSON. Encrypted at rest by n8n. Leave empty to use API key from environment variables instead.",
	},
	{
		displayName: "Environment Variables",
		name: "envVars",
		type: "json",
		default: "{}",
		description:
			'Environment variables for the pod as JSON (e.g., {"ANTHROPIC_API_KEY": "sk-..."})',
	},
	{
		displayName: "Image Pull Secret",
		name: "imagePullSecret",
		type: "string",
		default: "",
		placeholder: "my-registry-secret",
		description:
			"Name of the Kubernetes secret for pulling the container image. Leave empty if public.",
	},
	{
		displayName: "Service Account Name",
		name: "serviceAccountName",
		type: "string",
		default: "",
		placeholder: "claude-code-sa",
		description:
			"Service account to assign to the pod. Leave empty for namespace default.",
	},
	{
		displayName: "CPU Limit",
		name: "cpuLimit",
		type: "string",
		default: "1",
		description: "CPU resource limit for the pod container (e.g., 0.5, 1, 2)",
	},
	{
		displayName: "Memory Limit",
		name: "memoryLimit",
		type: "string",
		default: "2Gi",
		description:
			"Memory resource limit for the pod container (e.g., 512Mi, 1Gi, 2Gi)",
	},
	{
		displayName: "Node Selector (JSON)",
		name: "nodeSelector",
		type: "json",
		default: "{}",
		description:
			'Node selector for pod scheduling as JSON (e.g., {"kubernetes.io/arch": "amd64"})',
	},
];
