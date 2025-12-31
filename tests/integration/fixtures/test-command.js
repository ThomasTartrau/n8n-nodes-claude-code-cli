#!/usr/bin/env node
/**
 * Test command that mimics Claude Code CLI argument structure.
 * Accepts -p <prompt> and other flags, executes the prompt as a shell command.
 * Used for integration testing without requiring actual Claude CLI.
 */
const args = process.argv.slice(2);

// Handle --version for testConnection
if (args.includes("--version")) {
	console.log("test-command v1.0.0");
	process.exit(0);
}
let prompt = "";
let outputFormat = "text";

// Parse arguments
for (let i = 0; i < args.length; i++) {
	if (args[i] === "-p" && args[i + 1]) {
		prompt = args[i + 1];
		i++;
	} else if (args[i] === "--output-format" && args[i + 1]) {
		outputFormat = args[i + 1];
		i++;
	}
}

// If prompt is empty, just exit successfully
if (!prompt) {
	process.exit(0);
}

// Special commands
if (prompt === "__pwd__") {
	console.log(process.cwd());
	process.exit(0);
}

if (prompt === "__env__") {
	console.log(JSON.stringify(process.env));
	process.exit(0);
}

if (prompt.startsWith("__sleep__")) {
	const ms = parseInt(prompt.split(":")[1], 10) || 100;
	setTimeout(() => process.exit(0), ms);
} else if (prompt.startsWith("__exit__")) {
	const code = parseInt(prompt.split(":")[1], 10) || 1;
	process.exit(code);
} else if (outputFormat === "json") {
	// JSON output format
	console.log(
		JSON.stringify({
			result: prompt,
			session_id: "test-session-123",
			is_error: false,
			total_cost_usd: 0.001,
			num_turns: 1,
			usage: { input_tokens: 10, output_tokens: 20 },
		}),
	);
} else {
	// Default: echo the prompt
	console.log(prompt);
}
