import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	LocalCredentials,
	DockerCredentials,
} from "../../nodes/ClaudeCode/interfaces/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Path to the test command script that mimics Claude CLI
 */
export const TEST_COMMAND_PATH = resolve(
	__dirname,
	"fixtures",
	"test-command.js",
);

/**
 * Check if Docker is available on the system
 */
export function isDockerAvailable(): Promise<boolean> {
	return new Promise((resolve) => {
		const proc = spawn("docker", ["version"], {
			timeout: 5000,
		});

		proc.on("close", (code: number | null) => {
			resolve(code === 0);
		});

		proc.on("error", () => {
			resolve(false);
		});
	});
}

/**
 * Create test credentials for LocalExecutor
 * Uses the test command by default, or a custom command
 */
export function createLocalTestCredentials(
	command?: string,
	workingDir = "/tmp",
	envVars: Record<string, string> = {},
): LocalCredentials {
	return {
		claudePath: command || TEST_COMMAND_PATH,
		defaultWorkingDir: workingDir,
		envVars: JSON.stringify(envVars),
	};
}

/**
 * Create test credentials for DockerExecutor
 */
export function createDockerTestCredentials(
	containerId: string,
	command = "echo",
	workingDir = "/",
): DockerCredentials {
	return {
		containerIdentifier: "id",
		containerId,
		containerName: undefined,
		dockerHost: "",
		user: "",
		claudePath: command,
		defaultWorkingDir: workingDir,
	};
}

/**
 * Create minimal execution options for testing
 */
export function createTestOptions(prompt: string, timeout = 30) {
	return {
		prompt,
		outputFormat: "text" as const,
		timeout,
	};
}
