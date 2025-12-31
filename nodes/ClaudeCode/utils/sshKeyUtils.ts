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
 * Normalize SSH private key content
 * Fixes common issues from copy/paste operations:
 * - Windows line endings (\r\n)
 * - Old Mac line endings (\r)
 * - Leading/trailing whitespace
 */
export function normalizePrivateKey(key: string): string {
	return key.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
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
