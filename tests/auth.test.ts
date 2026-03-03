import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearTokens,
	generateCodeChallenge,
	generateCodeVerifier,
	handleCallback,
	isTokenExpired,
	loadTokens,
	saveTokens,
	type TokenResponse,
} from "../src/auth";

// --- PKCE helpers ---

describe("generateCodeVerifier", () => {
	it("returns a base64url string with no padding", () => {
		const verifier = generateCodeVerifier();
		expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(verifier.length).toBeGreaterThan(0);
	});

	it("returns different values on each call", () => {
		const a = generateCodeVerifier();
		const b = generateCodeVerifier();
		expect(a).not.toBe(b);
	});
});

describe("generateCodeChallenge", () => {
	it("produces a base64url-encoded SHA-256 hash", async () => {
		const challenge = await generateCodeChallenge("test_verifier");
		expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	it("is deterministic for the same input", async () => {
		const a = await generateCodeChallenge("same_input");
		const b = await generateCodeChallenge("same_input");
		expect(a).toBe(b);
	});

	it("produces different output for different input", async () => {
		const a = await generateCodeChallenge("input_a");
		const b = await generateCodeChallenge("input_b");
		expect(a).not.toBe(b);
	});
});

// --- Token storage ---

describe("token storage", () => {
	const mockResponse: TokenResponse = {
		access_token: "access_123",
		refresh_token: "refresh_456",
		expires_in: 3600,
	};

	beforeEach(() => {
		sessionStorage.clear();
	});

	afterEach(() => {
		sessionStorage.clear();
	});

	it("saveTokens + loadTokens round-trips correctly", () => {
		saveTokens(mockResponse);
		const tokens = loadTokens();
		expect(tokens).not.toBeNull();
		expect(tokens?.accessToken).toBe("access_123");
		expect(tokens?.refreshToken).toBe("refresh_456");
		expect(tokens?.expiresAt).toBeGreaterThan(Date.now());
	});

	it("loadTokens returns null when nothing is stored", () => {
		expect(loadTokens()).toBeNull();
	});

	it("clearTokens removes all stored tokens", () => {
		saveTokens(mockResponse);
		clearTokens();
		expect(loadTokens()).toBeNull();
	});

	it("loadTokens returns null if any key is missing", () => {
		sessionStorage.setItem("spotify_access_token", "access_123");
		// missing refresh_token and expires_at
		expect(loadTokens()).toBeNull();
	});
});

describe("isTokenExpired", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	afterEach(() => {
		sessionStorage.clear();
	});

	it("returns true when no tokens exist", () => {
		expect(isTokenExpired()).toBe(true);
	});

	it("returns false for a fresh token", () => {
		saveTokens({
			access_token: "a",
			refresh_token: "r",
			expires_in: 3600,
		});
		expect(isTokenExpired()).toBe(false);
	});

	it("returns true for an expired token", () => {
		saveTokens({
			access_token: "a",
			refresh_token: "r",
			expires_in: 3600,
		});
		// Manually set expiry to the past
		sessionStorage.setItem("spotify_expires_at", String(Date.now() - 1000));
		expect(isTokenExpired()).toBe(true);
	});

	it("returns true when token expires within 60s buffer", () => {
		saveTokens({
			access_token: "a",
			refresh_token: "r",
			expires_in: 3600,
		});
		// Set expiry to 30s from now (within the 60s buffer)
		sessionStorage.setItem("spotify_expires_at", String(Date.now() + 30_000));
		expect(isTokenExpired()).toBe(true);
	});
});

// --- Callback handling ---

describe("handleCallback", () => {
	beforeEach(() => {
		sessionStorage.clear();
		vi.stubEnv("VITE_SPOTIFY_CLIENT_ID", "test_client_id");
	});

	afterEach(() => {
		sessionStorage.clear();
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it("throws if no code verifier is stored", async () => {
		await expect(handleCallback("auth_code")).rejects.toThrow("Missing PKCE code verifier");
	});

	it("exchanges code for tokens and cleans up verifier", async () => {
		sessionStorage.setItem("pkce_code_verifier", "test_verifier");

		const mockTokens: TokenResponse = {
			access_token: "new_access",
			refresh_token: "new_refresh",
			expires_in: 3600,
		};

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockTokens),
			}),
		);

		const result = await handleCallback("auth_code");

		expect(result.access_token).toBe("new_access");
		expect(result.refresh_token).toBe("new_refresh");
		expect(sessionStorage.getItem("pkce_code_verifier")).toBeNull();

		const fetchCall = vi.mocked(fetch).mock.calls[0];
		expect(fetchCall).toBeDefined();
		const body = fetchCall?.[1]?.body as URLSearchParams;
		expect(body.get("grant_type")).toBe("authorization_code");
		expect(body.get("code")).toBe("auth_code");
		expect(body.get("code_verifier")).toBe("test_verifier");
	});

	it("throws on failed token exchange", async () => {
		sessionStorage.setItem("pkce_code_verifier", "test_verifier");

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
			}),
		);

		await expect(handleCallback("bad_code")).rejects.toThrow("Token exchange failed: 400");
	});
});
