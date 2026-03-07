// src/triage/TriageView.tsx — Top-level triage component

import { useSignal } from "@preact/signals";
import type { ScanSummary } from "../types";
import { ApplyBar } from "./ApplyBar";
import type { BatchResult } from "./batch";
import { FilterBar } from "./FilterBar";
import { MiniPlayer } from "./MiniPlayer";
import { NoMatchSection } from "./NoMatchSection";
import { ReviewModal } from "./ReviewModal";
import { SummaryCounters } from "./SummaryCounters";
import { SwapSection } from "./SwapSection";
import type { TriageStore } from "./state";
import { markTracksApplied } from "./state";

export function TriageView({
	store,
	summary,
	onScanAgain,
}: {
	store: TriageStore;
	summary: ScanSummary;
	onScanAgain: () => void;
}) {
	const showModal = useSignal(false);
	const progress = store.searchProgress.value;
	const filteredTracks = store.filteredTracks.value;
	const pendingOps = store.pendingOps.value;
	const expandedId = store.expandedTrackId.value;
	const isSearching = progress.completed < progress.total;
	const activeFilter = store.filter.value;

	const swapTracks = filteredTracks.filter((t) => t.candidates.length > 0);
	const noMatchTracks = filteredTracks.filter(
		(t) => t.searchStatus === "done" && t.candidates.length === 0,
	);

	const handleComplete = (result: BatchResult) => {
		const appliedTrackIds = result.succeeded.map((op) => op.trackId);
		const unique = [...new Set(appliedTrackIds)];
		markTracksApplied(store, unique);
	};

	return (
		<div class="min-h-screen flex flex-col items-center bg-app-gradient text-app-text px-4 py-12 pb-36">
			<h1 class="text-[34px] font-bold tracking-[-2px] mb-6 text-app-muted">Spotless</h1>
			<h2 class="text-2xl font-bold mb-2 text-app-text">Scan Results</h2>
			<p class="text-app-muted text-[13px] mb-6">
				Scanned {summary.totalScanned} tracks — found {summary.unplayable.length} unplayable
			</p>

			{/* Search progress */}
			<div class="w-full max-w-2xl mb-4">
				<div
					class={`text-[12px] py-2 px-3 rounded ${
						isSearching ? "bg-accent/10 text-accent" : "bg-white/[0.04] text-app-muted"
					}`}
				>
					{isSearching ? (
						<span class="animate-pulse">
							Finding swaps: {progress.completed}/{progress.total}
						</span>
					) : (
						<span>
							Swap search complete — {progress.total}/{progress.total} tracks scanned
						</span>
					)}
				</div>
			</div>

			{/* Summary counters + filter bar */}
			<div class="w-full max-w-2xl">
				<SummaryCounters counts={store.sectionCounts.value} />
				<FilterBar store={store} />
			</div>

			{/* Track sections */}
			<div class="w-full max-w-2xl">
				{swapTracks.length > 0 && activeFilter !== "no-match" && (
					<SwapSection store={store} tracks={swapTracks} expandedId={expandedId} />
				)}
				{noMatchTracks.length > 0 &&
					activeFilter !== "auto-proposed" &&
					activeFilter !== "needs-review" && (
						<NoMatchSection store={store} tracks={noMatchTracks} expandedId={expandedId} />
					)}
			</div>

			{/* Scan again */}
			<div class="mt-8">
				<button
					type="button"
					onClick={onScanAgain}
					class="text-app-muted hover:text-app-text text-[13px] underline cursor-pointer transition-colors"
				>
					Scan Again
				</button>
			</div>

			{/* Bottom bars: mini player + apply */}
			<div class="fixed bottom-0 left-0 right-0 z-50 flex flex-col">
				<MiniPlayer />
				<ApplyBar
					pendingOps={pendingOps}
					disabled={isSearching}
					onApply={() => {
						showModal.value = true;
					}}
				/>
			</div>

			{/* Review modal */}
			{showModal.value && (
				<ReviewModal
					pendingOps={pendingOps}
					onClose={() => {
						showModal.value = false;
					}}
					onComplete={handleComplete}
				/>
			)}
		</div>
	);
}
