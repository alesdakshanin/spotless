// src/ui.ts — DOM rendering for all screens

import { addTrack, removeTrack, sourceFromUnplayable } from "./actions";
import { searchReplacements } from "./replacements";
import type { ReplacementCandidate, ScanSummary, UnplayableTrack } from "./types";

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
		{
			class:
				"min-h-screen flex flex-col items-center justify-center bg-app-gradient text-app-text px-4",
		},
		h("h1", { class: "text-[52px] font-bold tracking-[-2px] mb-2" }, "Spotless"),
		h(
			"p",
			{ class: "text-app-muted text-[13px] mb-4" },
			"Find unplayable tracks in your Spotify library",
		),
		h(
			"button",
			{
				class:
					"bg-accent hover:bg-accent/85 text-black font-bold py-3.5 px-9 rounded text-[13px] transition-colors cursor-pointer",
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
			class: "text-app-muted hover:text-app-text text-[13px] underline cursor-pointer",
		},
		"Log out",
	);
	logoutBtn.addEventListener("click", onLogout);

	const scanBtn = h(
		"button",
		{
			class:
				"bg-accent hover:bg-accent/85 text-black font-bold py-3.5 px-9 rounded text-[13px] transition-colors cursor-pointer",
		},
		"Scan Library",
	);
	scanBtn.addEventListener("click", onScan);

	const container = h(
		"div",
		{
			class:
				"min-h-screen flex flex-col items-center justify-center bg-app-gradient text-app-text px-4",
		},
		h(
			"div",
			{ class: "absolute top-4 right-4 flex items-center gap-4" },
			h("span", { class: "text-app-text/80 text-[13px]" }, displayName),
			logoutBtn,
		),
		h("h1", { class: "text-[52px] font-bold tracking-[-2px] mb-2" }, "Spotless"),
		h("p", { class: "text-app-muted text-[13px] mb-4" }, "Scan your library for unplayable tracks"),
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
	unplayableCounter = h(
		"p",
		{ class: "text-app-muted mt-6 text-[13px]" },
		"Unplayable tracks found: 0",
	);

	const container = h(
		"div",
		{
			class:
				"min-h-screen flex flex-col items-center justify-center bg-app-gradient text-app-text px-4",
		},
		h("h1", { class: "text-[34px] font-bold tracking-[-2px] mb-8 text-app-muted" }, "Spotless"),
		h("p", { class: "text-base text-app-text font-medium mb-6" }, "Scanning your library..."),
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
		const icon = h("span", { class: "text-app-muted/60 w-5 text-center shrink-0" }, "\u00B7");
		const nameEl = h("span", { class: "text-app-muted/60 truncate" }, name);
		const status = h("span", { class: "text-app-muted/50 text-[11px] shrink-0" });

		const row = h("div", { class: "flex items-center gap-2 py-1.5" }, icon, nameEl, status);

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
			row.icon.className = "text-accent w-5 text-center shrink-0 animate-pulse";
			row.name.className = "text-app-text truncate";
			row.status.textContent = `${scanned} / ${total}`;
			row.status.className = "text-app-muted text-[11px] shrink-0";
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
			row.icon.className = "text-accent w-5 text-center shrink-0";
			row.name.className = "text-app-text/80 truncate";
			row.status.textContent = `${scanned} tracks`;
			row.status.className = "text-app-muted text-[11px] shrink-0";
		}
	}
}

// --- Results display (5.4) ---

// Shared audio element for preview playback (only one plays at a time)
let sharedAudio: HTMLAudioElement | null = null;
let activePlayBtn: HTMLButtonElement | null = null;

function stopPreview(): void {
	if (sharedAudio) {
		sharedAudio.pause();
		sharedAudio.src = "";
	}
	if (activePlayBtn) {
		activePlayBtn.textContent = "\u25B6";
		activePlayBtn = null;
	}
}

export function renderResults(summary: ScanSummary, onScanAgain: () => void): void {
	const app = getApp();
	app.innerHTML = "";
	stopPreview();

	const scanAgainBtn = h(
		"button",
		{
			class:
				"bg-accent hover:bg-accent/85 text-black font-bold py-3.5 px-9 rounded text-[13px] transition-colors cursor-pointer",
		},
		"Scan Again",
	);
	scanAgainBtn.addEventListener("click", onScanAgain);

	const children: HTMLElement[] = [
		h("h1", { class: "text-[34px] font-bold tracking-[-2px] mb-6 text-app-muted" }, "Spotless"),
		h("h2", { class: "text-2xl font-bold mb-2 text-app-text" }, "Scan Results"),
		h(
			"p",
			{ class: "text-app-muted text-[13px] mb-6" },
			`Scanned ${summary.totalScanned} tracks — found ${summary.unplayable.length} unplayable`,
		),
	];

	if (summary.unplayable.length > 0) {
		// Create shared audio element
		sharedAudio = document.createElement("audio");
		sharedAudio.addEventListener("ended", () => stopPreview());

		children.push(renderTrackList(summary.unplayable));
	}

	children.push(h("div", { class: "mt-8" }, scanAgainBtn));

	const container = h(
		"div",
		{
			class: "min-h-screen flex flex-col items-center bg-app-gradient text-app-text px-4 py-12",
		},
		...children,
	);

	app.appendChild(container);
}

function renderPlaceholder(): HTMLDivElement {
	return h("div", {
		class: "w-9 h-9 rounded-[2px] bg-app-surface shrink-0",
	});
}

function renderThumbnail(url?: string): HTMLElement {
	if (!url) return renderPlaceholder();

	const img = h("img", {
		src: url,
		alt: "",
		class: "w-9 h-9 rounded-[2px] object-cover shrink-0",
	});
	img.onerror = () => {
		img.replaceWith(renderPlaceholder());
	};
	return img;
}

// Per-track state for the accordion
interface TrackRowState {
	expanded: boolean;
	candidates: ReplacementCandidate[] | null; // null = not yet fetched
	loading: boolean;
	added: Set<string>; // URIs of candidates that were added
	removed: boolean;
}

// Currently expanded row reference (for single-open accordion)
let expandedRow: { collapse: () => void } | null = null;

function renderTrackList(tracks: UnplayableTrack[]): HTMLDivElement {
	const container = h("div", { class: "w-full max-w-2xl" });

	for (const track of tracks) {
		const state: TrackRowState = {
			expanded: false,
			candidates: null,
			loading: false,
			added: new Set(),
			removed: false,
		};

		const expansionPanel = h("div", { class: "hidden" });
		const reasonOrStatus = h(
			"span",
			{ class: "text-app-error text-[11px] shrink-0" },
			track.reason,
		);
		const chevron = h("span", { class: "text-app-muted text-[11px] shrink-0 ml-1" }, "\u25BC");

		const headerRow = h(
			"div",
			{
				class:
					"flex items-center gap-2 py-2.5 border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.02] transition-colors",
			},
			renderThumbnail(track.thumbnailUrl),
			h(
				"div",
				{ class: "flex-1 min-w-0" },
				h("p", { class: "text-app-text text-[13px] font-medium truncate" }, track.name),
				h("p", { class: "text-app-muted text-[11px] truncate" }, track.artists.join(", ")),
			),
			h("span", { class: "text-app-muted text-[11px] shrink-0 hidden sm:inline" }, track.source),
			reasonOrStatus,
			chevron,
		);

		function updateCollapsedStatus(): void {
			const badges: string[] = [];
			if (state.added.size > 0) badges.push("\u2713 Replaced");
			if (state.removed) badges.push("\u2713 Removed");

			if (badges.length > 0) {
				reasonOrStatus.textContent = badges.join("  ");
				reasonOrStatus.className = "text-accent text-[11px] shrink-0";
			} else {
				reasonOrStatus.textContent = track.reason;
				reasonOrStatus.className = "text-app-error text-[11px] shrink-0";
			}
		}

		function collapse(): void {
			state.expanded = false;
			expansionPanel.className = "hidden";
			chevron.textContent = "\u25BC";
			updateCollapsedStatus();
			stopPreview();
		}

		async function expand(): Promise<void> {
			// Close any currently expanded row
			if (expandedRow) {
				expandedRow.collapse();
			}

			state.expanded = true;
			expansionPanel.className = "pb-3 border-b border-white/[0.06]";
			chevron.textContent = "\u25B2";
			expandedRow = { collapse };

			if (state.candidates !== null) {
				renderExpansionContent(expansionPanel, track, state);
				return;
			}

			// Show loading state
			state.loading = true;
			expansionPanel.innerHTML = "";
			expansionPanel.appendChild(
				h("p", { class: "text-app-muted text-[12px] py-3 pl-11" }, "Searching for replacements..."),
			);

			try {
				state.candidates = await searchReplacements(track);
			} catch {
				state.candidates = [];
			}
			state.loading = false;

			if (state.expanded) {
				renderExpansionContent(expansionPanel, track, state);
			}
		}

		headerRow.addEventListener("click", () => {
			if (state.expanded) {
				collapse();
				expandedRow = null;
			} else {
				expand();
			}
		});

		container.appendChild(headerRow);
		container.appendChild(expansionPanel);
	}

	return container;
}

function renderExpansionContent(
	panel: HTMLDivElement,
	track: UnplayableTrack,
	state: TrackRowState,
): void {
	panel.innerHTML = "";

	const candidates = state.candidates ?? [];

	if (candidates.length === 0) {
		panel.appendChild(
			h("p", { class: "text-app-muted text-[12px] py-3 pl-11" }, "No replacements found"),
		);
	} else {
		for (const candidate of candidates) {
			panel.appendChild(renderCandidateRow(candidate, track, state));
		}
	}

	// Remove original button
	const removeContainer = h("div", { class: "flex justify-end mt-2 pr-1" });

	if (state.removed) {
		removeContainer.appendChild(h("span", { class: "text-accent text-[11px]" }, "\u2713 Removed"));
	} else {
		const removeBtn = h(
			"button",
			{
				class:
					"text-app-error/80 hover:text-app-error text-[11px] cursor-pointer transition-colors",
			},
			"\uD83D\uDDD1 Remove original",
		);
		removeBtn.addEventListener("click", async (e) => {
			e.stopPropagation();
			removeBtn.textContent = "Removing...";
			removeBtn.classList.add("opacity-50", "pointer-events-none");
			try {
				const source = sourceFromUnplayable(track.sourceId);
				await removeTrack(track.trackUri, source);
				state.removed = true;
				removeBtn.replaceWith(h("span", { class: "text-accent text-[11px]" }, "\u2713 Removed"));
			} catch {
				removeBtn.textContent = "\uD83D\uDDD1 Remove original";
				removeBtn.classList.remove("opacity-50", "pointer-events-none");
			}
		});
		removeContainer.appendChild(removeBtn);
	}

	panel.appendChild(removeContainer);
}

function renderCandidateRow(
	candidate: ReplacementCandidate,
	originalTrack: UnplayableTrack,
	state: TrackRowState,
): HTMLDivElement {
	const stars = "\u2605".repeat(candidate.confidence) + "\u2606".repeat(3 - candidate.confidence);
	const candidateUri = candidate.track.uri;
	const isAdded = state.added.has(candidateUri);

	// Preview button
	const previewBtn = h(
		"button",
		{
			class:
				"w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-app-text text-[11px] flex items-center justify-center cursor-pointer transition-colors shrink-0",
		},
		candidate.previewUrl ? "\u25B6" : "\u2197",
	);
	previewBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		if (candidate.previewUrl) {
			if (activePlayBtn === previewBtn) {
				stopPreview();
				return;
			}
			stopPreview();
			if (sharedAudio) {
				sharedAudio.src = candidate.previewUrl;
				sharedAudio.play();
				activePlayBtn = previewBtn;
				previewBtn.textContent = "\u23F8";
			}
		} else {
			window.open(`https://open.spotify.com/track/${candidate.track.id}`, "_blank");
		}
	});

	// Add button
	const actionCell = h("div", { class: "shrink-0" });

	if (isAdded) {
		actionCell.appendChild(h("span", { class: "text-accent text-[11px]" }, "\u2713 Added"));
	} else {
		const addBtn = h(
			"button",
			{
				class: "text-accent/80 hover:text-accent text-[11px] cursor-pointer transition-colors",
			},
			"+ Add",
		);
		addBtn.addEventListener("click", async (e) => {
			e.stopPropagation();
			addBtn.textContent = "Adding...";
			addBtn.classList.add("opacity-50", "pointer-events-none");
			try {
				const source = sourceFromUnplayable(originalTrack.sourceId);
				await addTrack(candidateUri, source);
				state.added.add(candidateUri);
				addBtn.replaceWith(h("span", { class: "text-accent text-[11px]" }, "\u2713 Added"));
			} catch {
				addBtn.textContent = "+ Add";
				addBtn.classList.remove("opacity-50", "pointer-events-none");
			}
		});
		actionCell.appendChild(addBtn);
	}

	return h(
		"div",
		{
			class: "flex items-center gap-2 py-1.5 pl-11",
		},
		h("span", { class: "text-amber-400 text-[11px] shrink-0 w-10" }, stars),
		renderThumbnail(candidate.thumbnailUrl),
		h(
			"div",
			{ class: "flex-1 min-w-0" },
			h("p", { class: "text-app-text text-[12px] truncate" }, candidate.track.name),
			h(
				"p",
				{ class: "text-app-muted text-[11px] truncate" },
				candidate.track.artists.map((a) => a.name).join(", "),
			),
		),
		previewBtn,
		actionCell,
	);
}

// --- Spotless happy path (5.5) ---

export function renderSpotless(totalScanned: number, onScanAgain: () => void): void {
	const app = getApp();
	app.innerHTML = "";

	const scanAgainBtn = h(
		"button",
		{
			class:
				"bg-accent hover:bg-accent/85 text-black font-bold py-3.5 px-9 rounded text-[13px] transition-colors cursor-pointer",
		},
		"Scan Again",
	);
	scanAgainBtn.addEventListener("click", onScanAgain);

	const container = h(
		"div",
		{
			class:
				"min-h-screen flex flex-col items-center justify-center bg-app-gradient text-app-text px-4",
		},
		h("h1", { class: "text-[52px] font-bold tracking-[-2px] mb-4" }, "Your library is spotless!"),
		h(
			"p",
			{ class: "text-app-muted text-[13px] mb-4" },
			`Scanned ${totalScanned} tracks — all playable`,
		),
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
			class: "text-accent hover:text-accent/80 underline cursor-pointer",
		},
		"Back to login",
	);
	backBtn.addEventListener("click", onBack);

	const container = h(
		"div",
		{
			class:
				"min-h-screen flex flex-col items-center justify-center bg-app-gradient text-app-text px-4",
		},
		h(
			"h1",
			{ class: "text-[34px] font-bold tracking-[-2px] mb-4 text-app-error" },
			"Something went wrong",
		),
		h("p", { class: "text-app-muted text-[13px] mb-6" }, message),
		backBtn,
	);

	app.appendChild(container);
}
