import { describe, it, expect } from "vitest";
import {
	normalizePrivateKey,
	validatePrivateKey,
} from "../../nodes/ClaudeCode/utils/sshKeyUtils.js";

// Sample valid RSA private key (test key only, not real)
const VALID_RSA_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3hFyRrH5w1234567890abcdefghijklmnopqr
-----END RSA PRIVATE KEY-----`;

// Sample valid OpenSSH private key (test key only, not real)
const VALID_OPENSSH_KEY = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAA
-----END OPENSSH PRIVATE KEY-----`;

describe("sshKeyUtils", () => {
	describe("normalizePrivateKey", () => {
		it("should produce properly structured output for valid key", () => {
			const result = normalizePrivateKey(VALID_RSA_KEY);
			// Should have proper header, content, and footer
			expect(result.startsWith("-----BEGIN RSA PRIVATE KEY-----\n")).toBe(true);
			expect(result.endsWith("\n-----END RSA PRIVATE KEY-----")).toBe(true);
			// Should preserve the base64 content
			expect(result).toContain("MIIEowIBAAKCAQEA0Z3hFyRrH5w1234567890");
		});

		it("should convert literal backslash-n to actual newlines", () => {
			const keyWithLiteralNewlines =
				"-----BEGIN RSA PRIVATE KEY-----\\nMIIEowIBAAKCAQEA0Z3hFyRrH5w\\n-----END RSA PRIVATE KEY-----";
			const result = normalizePrivateKey(keyWithLiteralNewlines);
			expect(result).toContain("\n");
			expect(result).not.toContain("\\n");
			expect(result).toMatch(/^-----BEGIN RSA PRIVATE KEY-----\n/);
		});

		it("should handle Windows line endings (CRLF)", () => {
			const keyWithCRLF =
				"-----BEGIN RSA PRIVATE KEY-----\r\nMIIEowIBAAKCAQEA\r\n-----END RSA PRIVATE KEY-----";
			const result = normalizePrivateKey(keyWithCRLF);
			expect(result).not.toContain("\r");
			expect(result.split("\n").length).toBeGreaterThan(1);
		});

		it("should handle old Mac line endings (CR)", () => {
			const keyWithCR =
				"-----BEGIN RSA PRIVATE KEY-----\rMIIEowIBAAKCAQEA\r-----END RSA PRIVATE KEY-----";
			const result = normalizePrivateKey(keyWithCR);
			expect(result).not.toContain("\r");
		});

		it("should trim leading and trailing whitespace", () => {
			const keyWithWhitespace = `
${VALID_RSA_KEY}
   `;
			const result = normalizePrivateKey(keyWithWhitespace);
			// Should have proper structure without leading/trailing whitespace
			expect(result.startsWith("-----BEGIN RSA PRIVATE KEY-----\n")).toBe(true);
			expect(result.endsWith("\n-----END RSA PRIVATE KEY-----")).toBe(true);
			expect(result).not.toMatch(/^\s/);
			expect(result).not.toMatch(/\s$/);
		});

		it("should handle spaces replacing newlines in base64 content", () => {
			const keyWithSpaces =
				"-----BEGIN RSA PRIVATE KEY----- MIIEowIBAAKCAQEA0Z3h ABCDEF -----END RSA PRIVATE KEY-----";
			const result = normalizePrivateKey(keyWithSpaces);
			expect(result).toMatch(/^-----BEGIN RSA PRIVATE KEY-----\n/);
			expect(result).toMatch(/\n-----END RSA PRIVATE KEY-----$/);
			// Base64 content should be on separate lines
			expect(result.split("\n").length).toBeGreaterThanOrEqual(3);
		});

		it("should properly wrap long base64 content at 64 characters", () => {
			const longBase64 = "A".repeat(200);
			const keyWithLongContent = `-----BEGIN RSA PRIVATE KEY-----${longBase64}-----END RSA PRIVATE KEY-----`;
			const result = normalizePrivateKey(keyWithLongContent);

			const lines = result.split("\n");
			// Check that content lines (excluding header/footer) are max 64 chars
			for (let i = 1; i < lines.length - 1; i++) {
				expect(lines[i].length).toBeLessThanOrEqual(64);
			}
		});

		it("should handle single-line key (all content on one line)", () => {
			const singleLineKey =
				"-----BEGIN RSA PRIVATE KEY-----MIIEowIBAAKCAQEA0Z3hFyRrH5w1234567890-----END RSA PRIVATE KEY-----";
			const result = normalizePrivateKey(singleLineKey);

			expect(result.startsWith("-----BEGIN RSA PRIVATE KEY-----\n")).toBe(true);
			expect(result.endsWith("\n-----END RSA PRIVATE KEY-----")).toBe(true);
		});

		it("should handle OpenSSH key format", () => {
			const result = normalizePrivateKey(VALID_OPENSSH_KEY);
			expect(result.startsWith("-----BEGIN OPENSSH PRIVATE KEY-----\n")).toBe(
				true,
			);
			expect(result.endsWith("\n-----END OPENSSH PRIVATE KEY-----")).toBe(true);
		});

		it("should handle PKCS#8 key format", () => {
			const pkcs8Key = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
-----END PRIVATE KEY-----`;
			const result = normalizePrivateKey(pkcs8Key);
			expect(result.startsWith("-----BEGIN PRIVATE KEY-----\n")).toBe(true);
			expect(result.endsWith("\n-----END PRIVATE KEY-----")).toBe(true);
		});

		it("should handle EC key format", () => {
			const ecKey = `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIIBYKFFuA6I5P5gSzP8pNvBKQnl6Zh27FftqUrEOoF5noAcGBSuBBAAK
-----END EC PRIVATE KEY-----`;
			const result = normalizePrivateKey(ecKey);
			expect(result.startsWith("-----BEGIN EC PRIVATE KEY-----\n")).toBe(true);
			expect(result.endsWith("\n-----END EC PRIVATE KEY-----")).toBe(true);
		});

		it("should handle DSA key format", () => {
			const dsaKey = `-----BEGIN DSA PRIVATE KEY-----
MIIBuwIBAAKBgQD3ZtSYSEWVyJQQ
-----END DSA PRIVATE KEY-----`;
			const result = normalizePrivateKey(dsaKey);
			expect(result.startsWith("-----BEGIN DSA PRIVATE KEY-----\n")).toBe(true);
			expect(result.endsWith("\n-----END DSA PRIVATE KEY-----")).toBe(true);
		});

		it("should handle mixed issues (literal newlines + spaces + CRLF)", () => {
			const messyKey =
				"-----BEGIN RSA PRIVATE KEY-----\\r\\n  MIIEowIBA AKCA \\n ABCD  \\r\\n-----END RSA PRIVATE KEY-----";
			const result = normalizePrivateKey(messyKey);

			// Should have proper structure
			expect(result.startsWith("-----BEGIN RSA PRIVATE KEY-----\n")).toBe(true);
			expect(result.endsWith("\n-----END RSA PRIVATE KEY-----")).toBe(true);
			// Content should be clean (no extra spaces)
			const lines = result.split("\n");
			for (let i = 1; i < lines.length - 1; i++) {
				expect(lines[i]).not.toContain(" ");
			}
		});

		it("should return basic normalization for malformed key without proper header", () => {
			const malformedKey = "not-a-key";
			const result = normalizePrivateKey(malformedKey);
			expect(result).toBe("not-a-key");
		});

		it("should handle key with extra whitespace between lines", () => {
			const keyWithExtraWhitespace = `-----BEGIN RSA PRIVATE KEY-----

  MIIEowIBAAKCAQEA0Z3h

  ABCDEFGHIJ

-----END RSA PRIVATE KEY-----`;
			const result = normalizePrivateKey(keyWithExtraWhitespace);
			// All whitespace in base64 content should be removed
			const lines = result.split("\n");
			for (let i = 1; i < lines.length - 1; i++) {
				expect(lines[i].trim()).toBe(lines[i]);
			}
		});
	});

	describe("validatePrivateKey", () => {
		it("should return valid for proper RSA key", () => {
			const result = validatePrivateKey(VALID_RSA_KEY);
			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should return valid for proper OpenSSH key", () => {
			const result = validatePrivateKey(VALID_OPENSSH_KEY);
			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should return invalid for empty key", () => {
			const result = validatePrivateKey("");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Private key is empty");
		});

		it("should return invalid for whitespace-only key", () => {
			const result = validatePrivateKey("   \n\t  ");
			expect(result.valid).toBe(false);
			expect(result.error).toBe("Private key is empty");
		});

		it("should return invalid for public key", () => {
			const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
-----END PUBLIC KEY-----`;
			const result = validatePrivateKey(publicKey);
			expect(result.valid).toBe(false);
			expect(result.error).toContain("public key");
		});

		it("should return invalid for RSA public key", () => {
			const publicKey = `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA
-----END RSA PUBLIC KEY-----`;
			const result = validatePrivateKey(publicKey);
			expect(result.valid).toBe(false);
			expect(result.error).toContain("public key");
		});

		it("should return invalid for key without BEGIN marker", () => {
			const result = validatePrivateKey("MIIEowIBAAKCAQEA");
			expect(result.valid).toBe(false);
			expect(result.error).toContain("must start with");
		});

		it("should return invalid for unsupported key type", () => {
			const unsupportedKey = `-----BEGIN UNKNOWN PRIVATE KEY-----
MIIEowIBAAKCAQEA
-----END UNKNOWN PRIVATE KEY-----`;
			const result = validatePrivateKey(unsupportedKey);
			expect(result.valid).toBe(false);
			expect(result.error).toContain("Unsupported key format");
		});

		it("should return invalid for key without END marker", () => {
			const incompleteKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA`;
			const result = validatePrivateKey(incompleteKey);
			expect(result.valid).toBe(false);
			expect(result.error).toContain("Missing");
		});

		it("should validate key with literal newlines after normalization", () => {
			const keyWithLiteralNewlines =
				"-----BEGIN RSA PRIVATE KEY-----\\nMIIEowIBAAKCAQEA\\n-----END RSA PRIVATE KEY-----";
			const result = validatePrivateKey(keyWithLiteralNewlines);
			expect(result.valid).toBe(true);
		});

		it("should validate key with Windows line endings after normalization", () => {
			const keyWithCRLF =
				"-----BEGIN RSA PRIVATE KEY-----\r\nMIIEowIBAAKCAQEA\r\n-----END RSA PRIVATE KEY-----";
			const result = validatePrivateKey(keyWithCRLF);
			expect(result.valid).toBe(true);
		});

		it("should validate PKCS#8 key format", () => {
			const pkcs8Key = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
-----END PRIVATE KEY-----`;
			const result = validatePrivateKey(pkcs8Key);
			expect(result.valid).toBe(true);
		});

		it("should validate EC key format", () => {
			const ecKey = `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIIBYKFFuA6I5P5gSzP8pNvBKQnl6Zh27FftqUrEOoF5noAcGBSuBBAAK
-----END EC PRIVATE KEY-----`;
			const result = validatePrivateKey(ecKey);
			expect(result.valid).toBe(true);
		});

		it("should validate DSA key format", () => {
			const dsaKey = `-----BEGIN DSA PRIVATE KEY-----
MIIBuwIBAAKBgQD3ZtSYSEWVyJQQ
-----END DSA PRIVATE KEY-----`;
			const result = validatePrivateKey(dsaKey);
			expect(result.valid).toBe(true);
		});
	});
});
