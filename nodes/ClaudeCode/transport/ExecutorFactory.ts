import type {
	ConnectionMode,
	IClaudeCodeExecutor,
} from "../interfaces/index.js";
import { LocalExecutor } from "./LocalExecutor.js";
import { SshExecutor } from "./SshExecutor.js";
import { DockerExecutor } from "./DockerExecutor.js";
import { K8sEphemeralExecutor } from "./K8sEphemeralExecutor.js";
import { K8sPersistentExecutor } from "./K8sPersistentExecutor.js";

/**
 * Create an executor for the specified connection mode
 */
export function createExecutor(
	mode: ConnectionMode,
	credentials: unknown,
): IClaudeCodeExecutor {
	switch (mode) {
		case "local":
			return new LocalExecutor(credentials);
		case "ssh":
			return new SshExecutor(credentials);
		case "docker":
			return new DockerExecutor(credentials);
		case "k8sEphemeral":
			return new K8sEphemeralExecutor(credentials);
		case "k8sPersistent":
			return new K8sPersistentExecutor(credentials);
		default:
			throw new Error(`Unsupported connection mode: ${mode}`);
	}
}
