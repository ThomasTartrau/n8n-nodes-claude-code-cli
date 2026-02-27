import type { ICredentialType, INodeProperties, Icon } from "n8n-workflow";
import { k8sSharedProperties } from "./k8sSharedProperties.js";

export class ClaudeCodeK8sPersistentApi implements ICredentialType {
	name = "claudeCodeK8sPersistentApi";
	displayName = "Claude Code K8s Persistent";
	icon: Icon = "file:../icons/claudecode.svg";
	documentationUrl =
		"https://github.com/ThomasTartrau/n8n-nodes-claude-code-cli";

	properties: INodeProperties[] = [...k8sSharedProperties];
}
