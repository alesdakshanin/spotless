// src/ui.ts — DOM rendering for all screens

import type { ScanSummary, UnplayableTrack } from "./types";

function getApp(): HTMLDivElement {
	const app = document.querySelector<HTMLDivElement>("#app");
	if (!app) throw new Error("Missing #app element");
	return app;
}

function h<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	attrs: Record<string, string> = {},
	...children: (string | HTMLElement)[]
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
	for (const child of children) {
		if (typeof child === "string") {
			el.appendChild(document.createTextNode(child));
		} else {
			el.appendChild(child);
		}
	}
	return el;
}

// --- Login screen (5.1) ---

export function renderLogin(onLogin: () => void): void {
	const app = getApp();
	app.innerHTML = "";

	const container = h(
		"div",
		{ class: "min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-4" },
		h("h1", { class: "text-5xl font-bold mb-2" }, "Spotless"),
		h("p", { class: "text-gray-400 mb-8" }, "Find unplayable tracks in your Spotify library"),
		h(
			"button",
			{
				class:
					"bg-green-500 hover:bg-green-400 text-black font-semibold py-3 px-8 rounded-full text-lg transition-colors cursor-pointer",
			},
			"Log in with Spotify",
		),
	);

	const button = container.querySelector("button");
	button?.addEventListener("click", onLogin);

	app.appendChild(container);
}

// --- Scan screen (5.2) ---

export function renderScanScreen(
	displayName: string,
	onScan: () => void,
	onLogout: () => void,
): void {
	const app = getApp();
	app.innerHTML = "";

	const logoutBtn = h(
		"button",
		{
			class: "text-gray-400 hover:text-white text-sm underline cursor-pointer",
		},
		"Log out",
	);
	logoutBtn.addEventListener("click", onLogout);

	const scanBtn = h(
		"button",
		{
			class:
				"bg-green-500 hover:bg-green-400 text-black font-semibold py-3 px-8 rounded-full text-lg transition-colors cursor-pointer",
		},
		"Scan Library",
	);
	scanBtn.addEventListener("click", onScan);

	const container = h(
		"div",
		{ class: "min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-4" },
		h(
			"div",
			{ class: "absolute top-4 right-4 flex items-center gap-4" },
			h("span", { class: "text-gray-300 text-sm" }, displayName),
			logoutBtn,
		),
		h("h1", { class: "text-5xl font-bold mb-2" }, "Spotless"),
		h("p", { class: "text-gray-400 mb-8" }, "Scan your library for unplayable tracks"),
		scanBtn,
	);

	app.appendChild(container);
}

// --- Progress display (5.3) ---

interface SourceRow {
	icon: HTMLSpanElement;
	name: HTMLSpanElement;
	status: HTMLSpanElement;
}

let sourceRows: SourceRow[] = [];
let sourceList: HTMLDivElement | null = null;
let unplayableCounter: HTMLParagraphElement | null = null;

export function renderProgressScreen(): void {
	const app = getApp();
	app.innerHTML = "";

	sourceList = h("div", { class: "w-full max-w-md" });
	unplayableCounter = h("p", { class: "text-gray-500 mt-6 text-sm" }, "Unplayable tracks found: 0");

	const container = h(
		"div",
		{ class: "min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-4" },
		h("h1", { class: "text-3xl font-bold mb-8 text-gray-500" }, "Spotless"),
		h("p", { class: "text-lg text-white font-medium mb-6" }, "Scanning your library..."),
		sourceList,
		unplayableCounter,
	);

	app.appendChild(container);
}

export function renderSourceList(names: string[]): void {
	if (!sourceList) return;
	sourceList.innerHTML = "";
	sourceRows = [];

	for (const name of names) {
		const icon = h("span", { class: "text-gray-600 w-5 text-center shrink-0" }, "\u00B7");
		const nameEl = h("span", { class: "text-gray-600 truncate" }, name);
		const status = h("span", { class: "text-gray-700 text-sm shrink-0" });

		const row = h("div", { class: "flex items-center gap-3 py-1.5" }, icon, nameEl, status);

		sourceList.appendChild(row);
		sourceRows.push({ icon, name: nameEl, status });
	}
}

export function updateSourceProgress(
	source: string,
	scanned: number,
	total: number,
	unplayableCount: number,
): void {
	for (const row of sourceRows) {
		if (row.name.textContent === source) {
			row.icon.textContent = "\u25CF";
			row.icon.className = "text-green-400 w-5 text-center shrink-0 animate-pulse";
			row.name.className = "text-white truncate";
			row.status.textContent = `${scanned} / ${total}`;
			row.status.className = "text-gray-400 text-sm shrink-0";
		}
	}

	if (unplayableCounter) {
		unplayableCounter.textContent = `Unplayable tracks found: ${unplayableCount}`;
	}
}

export function markSourceComplete(source: string, scanned: number): void {
	for (const row of sourceRows) {
		if (row.name.textContent === source) {
			row.icon.textContent = "\u2713";
			row.icon.className = "text-green-400 w-5 text-center shrink-0";
			row.name.className = "text-gray-300 truncate";
			row.status.textContent = `${scanned} tracks`;
			row.status.className = "text-gray-500 text-sm shrink-0";
		}
	}
}

// --- Results display (5.4) ---

export function renderResults(summary: ScanSummary, onScanAgain: () => void): void {
	const app = getApp();
	app.innerHTML = "";

	const scanAgainBtn = h(
		"button",
		{
			class:
				"bg-green-500 hover:bg-green-400 text-black font-semibold py-3 px-8 rounded-full text-lg transition-colors cursor-pointer",
		},
		"Scan Again",
	);
	scanAgainBtn.addEventListener("click", onScanAgain);

	const children: HTMLElement[] = [
		h("h1", { class: "text-3xl font-bold mb-6 text-gray-500" }, "Spotless"),
		h("h2", { class: "text-2xl font-bold mb-2 text-white" }, "Scan Results"),
		h(
			"p",
			{ class: "text-gray-400 mb-6" },
			`Scanned ${summary.totalScanned} tracks — found ${summary.unplayable.length} unplayable`,
		),
	];

	if (summary.unplayable.length > 0) {
		children.push(renderTrackList(summary.unplayable));
	}

	children.push(h("div", { class: "mt-8" }, scanAgainBtn));

	const container = h(
		"div",
		{
			class: "min-h-screen flex flex-col items-center bg-gray-950 text-white px-4 py-12",
		},
		...children,
	);

	app.appendChild(container);
}

function renderTrackList(tracks: UnplayableTrack[]): HTMLDivElement {
	const rows = tracks.map((track) =>
		h(
			"div",
			{
				class:
					"flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-b border-gray-800",
			},
			h(
				"div",
				{ class: "flex-1 min-w-0" },
				h("p", { class: "text-white font-medium truncate" }, track.name),
				h("p", { class: "text-gray-400 text-sm truncate" }, track.artists.join(", ")),
			),
			h("span", { class: "text-gray-500 text-sm shrink-0" }, track.source),
			h("span", { class: "text-red-400 text-sm shrink-0" }, track.reason),
		),
	);

	return h("div", { class: "w-full max-w-2xl" }, ...rows);
}

// --- Spotless happy path (5.5) ---

export function renderSpotless(totalScanned: number, onScanAgain: () => void): void {
	const app = getApp();
	app.innerHTML = "";

	const scanAgainBtn = h(
		"button",
		{
			class:
				"bg-green-500 hover:bg-green-400 text-black font-semibold py-3 px-8 rounded-full text-lg transition-colors cursor-pointer",
		},
		"Scan Again",
	);
	scanAgainBtn.addEventListener("click", onScanAgain);

	const container = h(
		"div",
		{ class: "min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-4" },
		h("h1", { class: "text-5xl font-bold mb-4" }, "Your library is spotless!"),
		h("p", { class: "text-gray-400 mb-8" }, `Scanned ${totalScanned} tracks — all playable`),
		scanAgainBtn,
	);

	app.appendChild(container);
}

// --- Error display ---

export function renderError(message: string, onBack: () => void): void {
	const app = getApp();
	app.innerHTML = "";

	const backBtn = h(
		"button",
		{
			class: "text-green-400 hover:text-green-300 underline cursor-pointer",
		},
		"Back to login",
	);
	backBtn.addEventListener("click", onBack);

	const container = h(
		"div",
		{ class: "min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-4" },
		h("h1", { class: "text-3xl font-bold mb-4 text-red-400" }, "Something went wrong"),
		h("p", { class: "text-gray-400 mb-6" }, message),
		backBtn,
	);

	app.appendChild(container);
}
