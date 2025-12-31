import type { INodeProperties } from "n8n-workflow";

export const contextDescription: INodeProperties[] = [
	{
		displayName: "Context Files",
		name: "contextFiles",
		type: "fixedCollection",
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: "Add Context File",
		},
		default: { files: [] },
		displayOptions: {
			show: {
				operation: ["executeWithContext"],
			},
		},
		options: [
			{
				name: "files",
				displayName: "Files",
				values: [
					{
						displayName: "File Path",
						name: "path",
						type: "string",
						default: "",
						required: true,
						placeholder: "/path/to/file.ts",
						description: "Path to the file to include as context",
					},
				],
			},
		],
		description: "Files to include as context for the prompt",
	},
	{
		displayName: "Additional Directories",
		name: "additionalDirs",
		type: "string",
		default: "",
		displayOptions: {
			show: {
				operation: ["executeWithContext"],
			},
		},
		placeholder: "/path/to/dir1, /path/to/dir2",
		description:
			"Additional directories to add as context (comma-separated paths)",
	},
];
