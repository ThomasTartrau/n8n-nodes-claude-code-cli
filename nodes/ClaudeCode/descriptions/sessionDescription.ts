import type { INodeProperties } from "n8n-workflow";

export const sessionDescription: INodeProperties[] = [
	{
		displayName: "Session ID",
		name: "sessionId",
		type: "string",
		default: "",
		required: true,
		displayOptions: {
			show: {
				operation: ["resumeSession"],
			},
		},
		placeholder: "abc123-def456-ghi789",
		description:
			"The session ID to resume. This is returned from previous Claude Code executions.",
	},
];
