// src/main.ts — App entry point, screen routing, OAuth callback handling

import { get } from "./api";
import { clearTokens, handleCallback, loadTokens, login, saveTokens } from "./auth";
import { mountPicker, unmountPicker } from "./picker/mount";
import { fetchOwnedPlaylists, scan } from "./scanner";
import { mountTriageView, unmountTriageView } from "./triage/mount";
import type { ScanConfig, ScanSummary, SpotifyUser } from "./types";
import {
	markSourceComplete,
	renderError,
	renderLogin,
	renderProgressScreen,
	renderScanScreen,
	renderSourceList,
	renderSpotless,
	updateSourceProgress,
} from "./ui";

function getApp(): HTMLDivElement {
	const app = document.querySelector<HTMLDivElement>("#app");
	if (!app) throw new Error("Missing #app element");
	return app;
}

function showTriageView(summary: ScanSummary): void {
	const app = getApp();
	app.innerHTML = "";
	mountTriageView(app, summary, () => {
		unmountTriageView(app);
		showScanScreen();
	});
}

async function showScanScreen(): Promise<void> {
	const user = await get<SpotifyUser>("/me");
	const displayName = user.display_name ?? "Spotify User";
	const playlists = await fetchOwnedPlaylists(user.id);

	const pickerContainer = renderScanScreen(displayName, handleLogout);
	mountPicker(pickerContainer, playlists, startScan);
}

async function startScan(config: ScanConfig): Promise<void> {
	const app = getApp();
	unmountTriageView(app);
	unmountPicker(app);
	renderProgressScreen();
	let unplayableCount = 0;
	let lastSource = "";
	let lastScanned = 0;

	try {
		for await (const event of scan(config)) {
			if (event.type === "sources") {
				renderSourceList(event.names);
			}
			if (event.type === "progress") {
				if (lastSource && lastSource !== event.source) {
					markSourceComplete(lastSource, lastScanned);
				}
				lastSource = event.source;
				lastScanned = event.scanned;
				updateSourceProgress(event.source, event.scanned, event.total, unplayableCount);
			}
			if (event.type === "found") {
				unplayableCount++;
				updateSourceProgress(lastSource, lastScanned, 0, unplayableCount);
			}
			if (event.type === "done") {
				if (lastSource) {
					markSourceComplete(lastSource, lastScanned);
				}
				if (event.summary.unplayable.length === 0) {
					renderSpotless(event.summary.totalScanned, () => showScanScreen());
				} else {
					showTriageView(event.summary);
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
