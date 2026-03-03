// src/main.ts — App entry point, screen routing, OAuth callback handling

import { get } from "./api";
import { clearTokens, handleCallback, loadTokens, login, saveTokens } from "./auth";
import { scan } from "./scanner";
import type { SpotifyUser } from "./types";
import {
	renderError,
	renderLogin,
	renderProgress,
	renderResults,
	renderScanScreen,
	renderSpotless,
	updateProgress,
} from "./ui";

async function showScanScreen(): Promise<void> {
	const user = await get<SpotifyUser>("/me");
	const displayName = user.display_name ?? "Spotify User";

	renderScanScreen(displayName, startScan, handleLogout);
}

async function startScan(): Promise<void> {
	renderProgress();
	let unplayableCount = 0;

	try {
		for await (const event of scan()) {
			if (event.type === "progress") {
				updateProgress(event.source, event.scanned, event.total, unplayableCount);
			}
			if (event.type === "found") {
				unplayableCount++;
				updateProgress("", 0, 0, unplayableCount);
			}
			if (event.type === "done") {
				if (event.summary.unplayable.length === 0) {
					renderSpotless(event.summary.totalScanned, startScan);
				} else {
					renderResults(event.summary, startScan);
				}
			}
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		renderError(message, () => showLogin());
	}
}

function handleLogout(): void {
	clearTokens();
	showLogin();
}

function showLogin(): void {
	renderLogin(() => login());
}

async function init(): Promise<void> {
	// Handle OAuth callback
	const params = new URLSearchParams(window.location.search);
	const code = params.get("code");
	const error = params.get("error");

	if (error) {
		// User denied access or other OAuth error
		window.history.replaceState({}, "", window.location.pathname);
		renderError(`Authorization denied: ${error}`, () => showLogin());
		return;
	}

	if (code) {
		// Clean URL
		window.history.replaceState({}, "", window.location.pathname);
		try {
			const tokens = await handleCallback(code);
			saveTokens(tokens);
			await showScanScreen();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Login failed";
			renderError(message, () => showLogin());
		}
		return;
	}

	// Check existing session
	const tokens = loadTokens();
	if (tokens) {
		try {
			await showScanScreen();
		} catch {
			// Session invalid, show login
			clearTokens();
			showLogin();
		}
		return;
	}

	showLogin();
}

init();
