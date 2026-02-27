import type { ICredentialType, INodeProperties, Icon } from "n8n-workflow";
import { k8sSharedProperties } from "./k8sSharedProperties.js";

export class ClaudeCodeK8sApi implements ICredentialType {
	name = "claudeCodeK8sApi";
	displayName = "Claude Code K8s Ephemeral";
	icon: Icon = "file:../icons/claudecode.svg";
	documentationUrl =
		"https://github.com/ThomasTartrau/n8n-nodes-claude-code-cli";

	properties: INodeProperties[] = [...k8sSharedProperties];
}
