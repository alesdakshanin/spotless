// src/triage/mount.ts — Mount/unmount the Preact triage view

import { h, render } from "preact";
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

	// Start background search
	searchAllReplacements(store);
}

export function unmountTriageView(container: HTMLElement): void {
	render(null, container);
}
