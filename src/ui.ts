// src/ui.ts — DOM rendering for vanilla screens (login, scan, progress, spotless, error)

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

export function renderScanScreen(displayName: string, onLogout: () => void): HTMLDivElement {
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

	const pickerContainer = h("div", { id: "picker-root", class: "w-full max-w-2xl" });

	const container = h(
		"div",
		{
			class:
				"min-h-screen flex flex-col items-center bg-app-gradient text-app-text px-4 py-12 pb-36",
		},
		h(
			"div",
			{ class: "absolute top-4 right-4 flex items-center gap-4" },
			h("span", { class: "text-app-text/80 text-[13px]" }, displayName),
			logoutBtn,
		),
		h("h1", { class: "text-[34px] font-bold tracking-[-2px] mb-2 text-app-muted" }, "Spotless"),
		h(
			"p",
			{ class: "text-app-muted text-[13px] mb-8" },
			"Select sources to scan for unplayable tracks",
		),
		pickerContainer,
	);

	app.appendChild(container);
	return pickerContainer;
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
