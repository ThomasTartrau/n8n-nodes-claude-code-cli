/**
 * Supported private key format headers
 */
const SUPPORTED_KEY_HEADERS = [
	"-----BEGIN RSA PRIVATE KEY-----",
	"-----BEGIN OPENSSH PRIVATE KEY-----",
	"-----BEGIN PRIVATE KEY-----",
	"-----BEGIN EC PRIVATE KEY-----",
	"-----BEGIN DSA PRIVATE KEY-----",
];

/**
 * PEM line length for base64 content
 */
const PEM_LINE_LENGTH = 64;

/**
 * Normalize SSH private key content
 * Fixes common issues from copy/paste operations:
 * - Literal backslash-n sequences (\\n) that should be newlines
 * - Windows line endings (\r\n)
 * - Old Mac line endings (\r)
 * - Leading/trailing whitespace
 * - Spaces that replaced newlines when pasting
 * - Improper line wrapping in base64 content
 */
export function normalizePrivateKey(key: string): string {
	// Step 1: Convert literal \n sequences to actual newlines
	// This handles cases where JSON/env vars contain literal "\\n"
	let normalized = key.replace(/\\n/g, "\n");

	// Step 2: Normalize Windows and old Mac line endings
	normalized = normalized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

	// Step 3: Trim overall whitespace
	normalized = normalized.trim();

	// Step 4: Extract header and footer
	const headerMatch = normalized.match(/(-----BEGIN [A-Z0-9 ]+ KEY-----)/);
	const footerMatch = normalized.match(/(-----END [A-Z0-9 ]+ KEY-----)/);

	if (!headerMatch || !footerMatch) {
		// Can't properly parse, return as-is with basic normalization
		return normalized;
	}

	const header = headerMatch[1];
	const footer = footerMatch[1];

	// Step 5: Extract the base64 content between header and footer
	const headerIndex = normalized.indexOf(header);
	const footerIndex = normalized.indexOf(footer);

	if (headerIndex === -1 || footerIndex === -1 || footerIndex <= headerIndex) {
		return normalized;
	}

	let base64Content = normalized.slice(
		headerIndex + header.length,
		footerIndex,
	);

	// Step 6: Clean up the base64 content
	// Remove all whitespace (spaces, newlines, tabs) from the base64 content
	base64Content = base64Content.replace(/\s+/g, "");

	// Step 7: Rewrap base64 content at 64 characters per line (PEM standard)
	const wrappedContent = wrapBase64(base64Content, PEM_LINE_LENGTH);

	// Step 8: Reconstruct the key with proper formatting
	return `${header}\n${wrappedContent}\n${footer}`;
}

/**
 * Wrap a base64 string at specified line length
 */
function wrapBase64(base64: string, lineLength: number): string {
	const lines: string[] = [];
	for (let i = 0; i < base64.length; i += lineLength) {
		lines.push(base64.slice(i, i + lineLength));
	}
	return lines.join("\n");
}

/**
 * Validate SSH private key format
 * Returns validation result with error message if invalid
 */
export function validatePrivateKey(key: string): {
	valid: boolean;
	error?: string;
} {
	if (!key || key.trim() === "") {
		return { valid: false, error: "Private key is empty" };
	}

	const normalized = normalizePrivateKey(key);

	const hasValidHeader = SUPPORTED_KEY_HEADERS.some((header) =>
		normalized.startsWith(header),
	);

	if (!hasValidHeader) {
		if (normalized.includes("PUBLIC KEY")) {
			return {
				valid: false,
				error: "This appears to be a public key. Please provide a private key.",
			};
		}
		if (!normalized.startsWith("-----BEGIN")) {
			return {
				valid: false,
				error:
					"Invalid key format. Key must start with -----BEGIN ... PRIVATE KEY-----",
			};
		}
		return {
			valid: false,
			error:
				"Unsupported key format. Supported formats: RSA, OpenSSH, PKCS#8, EC, DSA",
		};
	}

	if (!normalized.includes("-----END")) {
		return {
			valid: false,
			error: "Key is incomplete. Missing -----END ... PRIVATE KEY----- footer.",
		};
	}

	return { valid: true };
}
