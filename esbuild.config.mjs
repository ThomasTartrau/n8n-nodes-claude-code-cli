import esbuild from "esbuild";
import { readdirSync } from "node:fs";

const credentialEntryPoints = readdirSync("credentials")
	.filter((f) => f.endsWith(".credentials.ts"))
	.map((f) => `credentials/${f}`);

const entryPoints = [
	"index.ts",
	"nodes/ClaudeCode/ClaudeCode.node.ts",
	...credentialEntryPoints,
];

esbuild
	.build({
		entryPoints,
		bundle: true,
		platform: "node",
		target: "node18",
		format: "cjs",
		outdir: "dist",
		sourcemap: true,
		// Keep the directory structure relative to project root
		outbase: ".",
		// n8n-workflow is provided by n8n at runtime
		// ssh2 has native bindings and cannot be bundled; loaded dynamically only when SSH mode is used
		external: ["n8n-workflow", "ssh2"],
		// Suppress warnings for dynamic requires in transitive deps
		logLevel: "warning",
	})
	.then(() => {
		console.log("Build complete");
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
