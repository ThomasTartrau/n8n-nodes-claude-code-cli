import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		globals: false,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: [
				"nodes/ClaudeCode/utils/**/*.ts",
				"nodes/ClaudeCode/transport/**/*.ts",
			],
			exclude: [
				"nodes/ClaudeCode/utils/index.ts",
				"nodes/ClaudeCode/transport/index.ts",
			],
		},
		testTimeout: 60000,
		hookTimeout: 120000,
	},
});
