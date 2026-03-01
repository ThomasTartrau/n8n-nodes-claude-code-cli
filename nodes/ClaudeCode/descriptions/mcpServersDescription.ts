import type { INodeProperties } from "n8n-workflow";

export const mcpServersDescription: INodeProperties[] = [
	{
		displayName: "MCP Servers",
		name: "mcpServers",
		type: "fixedCollection",
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: "Add MCP Server",
		},
		default: { serversList: [] },
		displayOptions: {
			show: {
				operation: ["executePrompt", "executeWithContext"],
			},
		},
		options: [
			{
				name: "serversList",
				displayName: "Servers",
				values: [
					{
						displayName: "Server Name",
						name: "name",
						type: "string",
						default: "",
						required: true,
						placeholder: "slack",
						description: "Unique identifier for this MCP server.",
					},
					{
						displayName: "Transport Type",
						name: "serverType",
						type: "options",
						options: [
							{ name: "Stdio", value: "stdio" },
							{ name: "HTTP", value: "http" },
						],
						default: "stdio",
						description:
							"Transport protocol for communicating with the MCP server.",
					},
					{
						displayName: "Command",
						name: "command",
						type: "string",
						default: "",
						required: true,
						placeholder: "npx -y @modelcontextprotocol/server-slack",
						description:
							"Full command to launch the MCP server. Arguments after the executable are automatically extracted (e.g. 'npx -y @org/server --key val' becomes command='npx', args=['-y','@org/server','--key','val']).",
						displayOptions: {
							show: {
								serverType: ["stdio"],
							},
						},
					},
					{
						displayName: "Arguments",
						name: "args",
						type: "string",
						default: "",
						placeholder: "--port,3000,--verbose",
						description: "Comma-separated arguments to pass to the command.",
						displayOptions: {
							show: {
								serverType: ["stdio"],
							},
						},
					},
					{
						displayName: "Environment Variables",
						name: "env",
						type: "string",
						typeOptions: { rows: 2 },
						default: "",
						placeholder: '{"SLACK_TOKEN": "xoxb-..."}',
						description:
							"JSON object of environment variables for the server process.",
						displayOptions: {
							show: {
								serverType: ["stdio"],
							},
						},
					},
					{
						displayName: "URL",
						name: "url",
						type: "string",
						default: "",
						required: true,
						placeholder: "https://mcp.example.com/sse",
						description: "HTTP endpoint URL of the MCP server.",
						displayOptions: {
							show: {
								serverType: ["http"],
							},
						},
					},
					{
						displayName: "Headers",
						name: "headers",
						type: "string",
						typeOptions: { rows: 2 },
						default: "",
						placeholder: '{"Authorization": "Bearer ..."}',
						description: "JSON object of HTTP headers to send with requests.",
						displayOptions: {
							show: {
								serverType: ["http"],
							},
						},
					},
				],
			},
		],
		description:
			"Define MCP servers to inject into the Claude Code session. Servers provide external tools (Slack, GitHub, databases, etc.).",
	},
	{
		displayName: "MCP Config File Paths",
		name: "mcpConfigFilePaths",
		type: "string",
		default: "",
		placeholder: "/path/to/mcp-config.json, /path/to/another.json",
		description:
			"Comma-separated file paths to MCP configuration files. Each file is passed as a separate --mcp-config argument.",
		displayOptions: {
			show: {
				operation: ["executePrompt", "executeWithContext"],
			},
		},
	},
	{
		displayName: "MCP Strict Mode",
		name: "mcpStrictMode",
		type: "boolean",
		default: false,
		description:
			"Whether to enable strict MCP config mode. When enabled, Claude Code will fail if any MCP server cannot be started.",
		displayOptions: {
			show: {
				operation: ["executePrompt", "executeWithContext"],
			},
		},
	},
];
