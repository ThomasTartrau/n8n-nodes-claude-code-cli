import type { IExecuteFunctions } from "n8n-workflow";
import type {
	AgentDefinition,
	ClaudeCodeExecutionOptions,
	ClaudeCodeOperation,
	ToolPermissions,
	OutputFormat,
	PermissionMode,
	SessionConfig,
	ContextFile,
} from "../interfaces/index.js";

/**
 * Builds execution options from n8n node parameters
 */
export function buildExecutionOptions(
	context: IExecuteFunctions,
	itemIndex: number,
	operation: ClaudeCodeOperation,
): ClaudeCodeExecutionOptions {
	const prompt = context.getNodeParameter("prompt", itemIndex, "") as string;
	const options = context.getNodeParameter("options", itemIndex, {}) as Record<
		string,
		unknown
	>;

	// Parse tool permissions
	const toolPermsRaw = context.getNodeParameter(
		"toolPermissions",
		itemIndex,
		{},
	) as Record<string, string>;
	const toolPermissions: ToolPermissions = {
		allowedTools: toolPermsRaw.allowedTools
			? toolPermsRaw.allowedTools
					.split(",")
					.map((t: string) => t.trim())
					.filter(Boolean)
			: undefined,
		disallowedTools: toolPermsRaw.disallowedTools
			? toolPermsRaw.disallowedTools
					.split(",")
					.map((t: string) => t.trim())
					.filter(Boolean)
			: undefined,
	};

	// Parse additional args
	const additionalArgsStr = (options.additionalArgs as string) || "";
	const additionalArgs = additionalArgsStr.split(" ").filter(Boolean);

	// Build session config based on operation
	let session: SessionConfig | undefined;
	if (operation === "continueSession") {
		session = { continueLastSession: true };
	} else if (operation === "resumeSession") {
		const sessionId = context.getNodeParameter(
			"sessionId",
			itemIndex,
			"",
		) as string;
		session = { sessionId };
	}

	// Parse context files for executeWithContext operation
	let contextFiles: ContextFile[] | undefined;
	if (operation === "executeWithContext") {
		const filesData = context.getNodeParameter("contextFiles", itemIndex, {
			files: [],
		}) as {
			files: Array<{ path: string }>;
		};
		contextFiles = filesData.files?.map((f) => ({ path: f.path })) || [];

		// Also add additional directories
		const additionalDirs = context.getNodeParameter(
			"additionalDirs",
			itemIndex,
			"",
		) as string;
		if (additionalDirs) {
			const dirs = additionalDirs
				.split(",")
				.map((d) => d.trim())
				.filter(Boolean);
			dirs.forEach((dir) => {
				contextFiles?.push({ path: dir });
			});
		}
	}

	// Determine output format
	let outputFormat: OutputFormat = "json";
	if (options.outputFormat) {
		outputFormat = options.outputFormat as OutputFormat;
	}

	// Handle model selection (now at root level, not in options)
	let model = context.getNodeParameter("model", itemIndex, "") as string;
	if (model === "custom") {
		model = context.getNodeParameter("customModel", itemIndex, "") as string;
	}
	if (!model) {
		model = undefined as unknown as string;
	}

	// Handle permission mode
	const permissionModeRaw = context.getNodeParameter(
		"permissionMode",
		itemIndex,
		"default",
	) as string;
	const permissionMode: PermissionMode | undefined =
		permissionModeRaw && permissionModeRaw !== "default"
			? (permissionModeRaw as PermissionMode)
			: undefined;

	// Parse agents (subagents)
	const agentsData = context.getNodeParameter("agents", itemIndex, {
		agentsList: [],
	}) as {
		agentsList: Array<{
			name: string;
			description: string;
			prompt: string;
			model: string;
			tools: string;
			disallowedTools: string;
			permissionMode: string;
			maxTurns: number;
			memory: string;
		}>;
	};

	let agents: Record<string, AgentDefinition> | undefined;
	if (agentsData.agentsList && agentsData.agentsList.length > 0) {
		agents = {};
		for (const agent of agentsData.agentsList) {
			const def: AgentDefinition = {
				description: agent.description,
				prompt: agent.prompt,
			};

			if (agent.tools) {
				def.tools = agent.tools
					.split(",")
					.map((t: string) => t.trim())
					.filter(Boolean);
			}
			if (agent.disallowedTools) {
				def.disallowedTools = agent.disallowedTools
					.split(",")
					.map((t: string) => t.trim())
					.filter(Boolean);
			}

			if (agent.model && agent.model !== "inherit") {
				def.model = agent.model;
			}

			if (agent.permissionMode) {
				def.permissionMode = agent.permissionMode;
			}

			if (agent.maxTurns && agent.maxTurns > 0) {
				def.maxTurns = agent.maxTurns;
			}

			if (agent.memory) {
				def.memory = agent.memory;
			}

			agents[agent.name] = def;
		}
	}

	return {
		prompt,
		workingDirectory: options.workingDirectory as string | undefined,
		outputFormat,
		model,
		maxTurns: (options.maxTurns as number) || undefined,
		permissionMode,
		toolPermissions,
		session,
		contextFiles,
		additionalArgs: additionalArgs.length > 0 ? additionalArgs : undefined,
		timeout: (options.timeout as number) || 300,
		systemPrompt: (options.systemPrompt as string) || undefined,
		systemPromptFile: (options.systemPromptFile as string) || undefined,
		verbose: (options.verbose as boolean) || undefined,
		maxBudgetUsd: (options.maxBudgetUsd as number) || undefined,
		jsonSchema: (options.jsonSchema as string) || undefined,
		fallbackModel: (options.fallbackModel as string) || undefined,
		agents,
		extendedContext: options.extendedContext !== false,
		worktree: options.worktreeEnabled
			? (options.worktreeName as string) || ""
			: undefined,
	};
}
