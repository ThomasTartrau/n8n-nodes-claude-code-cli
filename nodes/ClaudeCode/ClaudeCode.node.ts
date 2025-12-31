import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";

import {
	connectionModeDescription,
	operationDescription,
	promptDescription,
	contextDescription,
	sessionDescription,
	toolPermissionsDescription,
	modelDescription,
	optionsDescription,
} from "./descriptions/index.js";

import { createExecutor } from "./transport/index.js";
import { buildExecutionOptions } from "./utils/index.js";
import type {
	ConnectionMode,
	ClaudeCodeOperation,
	LocalCredentials,
	SshCredentials,
	DockerCredentials,
} from "./interfaces/index.js";

export class ClaudeCode implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Claude Code",
		name: "claudeCode",
		icon: "file:../../icons/claudecode.svg",
		group: ["transform"],
		version: 1.0,
		subtitle: '={{$parameter["operation"]}}',
		description:
			"Execute Claude Code CLI commands for AI-assisted development tasks",
		defaults: {
			name: "Claude Code",
		},
		inputs: ["main"],
		outputs: ["main"],
		usableAsTool: true,
		credentials: [
			{
				name: "claudeCodeLocalApi",
				required: true,
				displayOptions: {
					show: {
						connectionMode: ["local"],
					},
				},
			},
			{
				name: "claudeCodeSshApi",
				required: true,
				displayOptions: {
					show: {
						connectionMode: ["ssh"],
					},
				},
			},
			{
				name: "claudeCodeDockerApi",
				required: true,
				displayOptions: {
					show: {
						connectionMode: ["docker"],
					},
				},
			},
		],
		properties: [
			// Connection Mode Selection
			...connectionModeDescription,

			// Operation Selection
			...operationDescription,

			// Prompt input
			...promptDescription,

			// Context files (for executeWithContext)
			...contextDescription,

			// Session ID (for resumeSession)
			...sessionDescription,

			// Tool permissions
			...toolPermissionsDescription,

			// Model selection
			...modelDescription,

			// Additional options
			...optionsDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const connectionMode = this.getNodeParameter(
				"connectionMode",
				itemIndex,
			) as ConnectionMode;
			const operation = this.getNodeParameter(
				"operation",
				itemIndex,
			) as ClaudeCodeOperation;

			// Get credentials based on connection mode
			let credentials: LocalCredentials | SshCredentials | DockerCredentials;
			switch (connectionMode) {
				case "local":
					credentials = await this.getCredentials(
						"claudeCodeLocalApi",
						itemIndex,
					);
					break;
				case "ssh":
					credentials = await this.getCredentials(
						"claudeCodeSshApi",
						itemIndex,
					);
					break;
				case "docker":
					credentials = await this.getCredentials(
						"claudeCodeDockerApi",
						itemIndex,
					);
					break;
				default:
					throw new NodeOperationError(
						this.getNode(),
						`Unsupported connection mode: ${connectionMode}`,
						{ itemIndex },
					);
			}

			// Create executor for the connection mode
			const executor = createExecutor(connectionMode, credentials);

			// Build execution options from parameters
			const executionOptions = buildExecutionOptions(
				this,
				itemIndex,
				operation,
			);

			// Execute Claude Code
			const result = await executor.execute(executionOptions);

			// Handle errors
			if (!result.success && !this.continueOnFail()) {
				throw new NodeOperationError(
					this.getNode(),
					result.error || "Claude Code execution failed",
					{ itemIndex },
				);
			}

			// Build output JSON
			const outputJson: IDataObject = {
				success: result.success,
				sessionId: result.sessionId,
				output: result.output,
				exitCode: result.exitCode,
				duration: result.duration,
				cost: result.cost,
				numTurns: result.numTurns,
				error: result.error,
			};

			// Add usage info if present
			if (result.usage) {
				outputJson.usage = result.usage as IDataObject;
			}

			// Add raw output if present
			if (result.rawOutput) {
				outputJson.rawOutput = result.rawOutput as unknown as IDataObject;
			}

			// Format output
			returnData.push({
				json: outputJson,
				pairedItem: { item: itemIndex },
			});
		}

		return [returnData];
	}
}
