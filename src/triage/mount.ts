// src/triage/mount.ts — Mount/unmount the Preact triage view

import { h, render } from "preact";
import { disconnect as disconnectAudio, initPlayer } from "../audio";
import type { ScanSummary } from "../types";
import { createTriageStore, searchAllReplacements } from "./state";
import { TriageView } from "./TriageView";

export function mountTriageView(
	container: HTMLElement,
	summary: ScanSummary,
	onScanAgain: () => void,
): void {
	const store = createTriageStore(summary.unplayable);

	render(h(TriageView, { store, summary, onScanAgain }), container);

	// Start background search and SDK connection in parallel
	searchAllReplacements(store);
	initPlayer().catch((err) => console.error("[audio] SDK init failed:", err));
}

export function unmountTriageView(container: HTMLElement): void {
	disconnectAudio();
	render(null, container);
}
