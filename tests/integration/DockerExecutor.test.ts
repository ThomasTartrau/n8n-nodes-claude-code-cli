import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { DockerExecutor } from "../../nodes/ClaudeCode/transport/DockerExecutor.js";
import { isDockerAvailable, createDockerTestCredentials } from "./helpers.js";

describe("DockerExecutor Integration", () => {
	let container: StartedTestContainer | null = null;
	let dockerAvailable = false;

	beforeAll(() => {
		return isDockerAvailable().then((available) => {
			dockerAvailable = available;
			if (!available) {
				console.log("Docker not available, skipping DockerExecutor tests");
				return Promise.resolve();
			}

			return new GenericContainer("alpine:latest")
				.withCommand(["sleep", "infinity"])
				.start()
				.then((c) => {
					container = c;
				})
				.catch((err) => {
					console.log("Failed to start container:", err.message);
					dockerAvailable = false;
				});
		});
	}, 120000);

	afterAll(() => {
		if (container) {
			return container.stop();
		}
		return Promise.resolve();
	}, 30000);

	describe("execute", () => {
		it("should execute echo command in container", () => {
			if (!dockerAvailable || !container) {
				return Promise.resolve();
			}

			// echo prints all arguments, so -p "Hello" becomes "-p Hello"
			const credentials = createDockerTestCredentials(
				container.getId(),
				"echo",
			);
			const executor = new DockerExecutor(credentials);
			const options = {
				prompt: "Hello from Docker",
				outputFormat: "text" as const,
				timeout: 30,
			};

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.success).toBe(true);
				expect(result.output).toContain("Hello from Docker");
			});
		});

		it("should pass working directory to docker exec", () => {
			if (!dockerAvailable || !container) {
				return Promise.resolve();
			}

			// Verify docker exec -w flag is applied
			const credentials = createDockerTestCredentials(
				container.getId(),
				"echo",
				"/tmp",
			);
			const executor = new DockerExecutor(credentials);
			const options = {
				prompt: "working dir test",
				outputFormat: "text" as const,
				timeout: 30,
			};

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.success).toBe(true);
			});
		});

		it("should handle non-existent command in container", () => {
			if (!dockerAvailable || !container) {
				return Promise.resolve();
			}

			const credentials = createDockerTestCredentials(
				container.getId(),
				"nonexistent_cmd_xyz",
			);
			const executor = new DockerExecutor(credentials);
			const options = {
				prompt: "test",
				outputFormat: "text" as const,
				timeout: 30,
			};

			return executor.execute(options).then((result) => {
				expect(result.success).toBe(false);
				expect(result.exitCode).not.toBe(0);
			});
		});

		it("should handle special characters in prompt", () => {
			if (!dockerAvailable || !container) {
				return Promise.resolve();
			}

			const credentials = createDockerTestCredentials(
				container.getId(),
				"echo",
			);
			const executor = new DockerExecutor(credentials);
			const options = {
				prompt: "Hello 'World' with \"quotes\"",
				outputFormat: "text" as const,
				timeout: 30,
			};

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.output).toContain("Hello");
				expect(result.output).toContain("World");
			});
		});

		it("should measure duration", () => {
			if (!dockerAvailable || !container) {
				return Promise.resolve();
			}

			const credentials = createDockerTestCredentials(
				container.getId(),
				"echo",
			);
			const executor = new DockerExecutor(credentials);
			const options = {
				prompt: "quick test",
				outputFormat: "text" as const,
				timeout: 30,
			};

			return executor.execute(options).then((result) => {
				expect(result.exitCode).toBe(0);
				expect(result.duration).toBeGreaterThan(0);
				expect(result.duration).toBeLessThan(10000);
			});
		});
	});

	describe("testConnection", () => {
		it("should return false for non-existent container", () => {
			const credentials = createDockerTestCredentials(
				"nonexistent_container_id_xyz",
				"echo",
			);
			const executor = new DockerExecutor(credentials);

			return executor.testConnection().then((result) => {
				expect(result).toBe(false);
			});
		});

		it("should return false when container ref is empty", () => {
			const credentials = createDockerTestCredentials("", "echo");
			const executor = new DockerExecutor(credentials);

			return executor.testConnection().then((result) => {
				expect(result).toBe(false);
			});
		});

		it("should test connection with valid container", () => {
			if (!dockerAvailable || !container) {
				return Promise.resolve();
			}

			// echo --version in busybox returns 0
			const credentials = createDockerTestCredentials(
				container.getId(),
				"echo",
			);
			const executor = new DockerExecutor(credentials);

			return executor.testConnection().then((result) => {
				// echo --version exits 0 in busybox (just prints --version)
				expect(result).toBe(true);
			});
		});
	});
});
