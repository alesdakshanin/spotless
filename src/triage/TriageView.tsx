// src/triage/TriageView.tsx — Top-level triage component

import { useSignal } from "@preact/signals";
import type { ScanSummary } from "../types";
import { ApplyBar } from "./ApplyBar";
import type { BatchResult } from "./batch";
import { FilterBar } from "./FilterBar";
import { ReviewModal } from "./ReviewModal";
import type { TriageStore, TriageTrack } from "./state";
import { markTracksApplied } from "./state";
import { TrackRow } from "./TrackRow";

function groupBySource(tracks: TriageTrack[]): [string, TriageTrack[]][] {
	const groups = new Map<string, TriageTrack[]>();
	for (const t of tracks) {
		const key = t.track.source;
		const group = groups.get(key);
		if (group) {
			group.push(t);
		} else {
			groups.set(key, [t]);
		}
	}

	// Sort: Liked Songs first, then alphabetical
	const sorted = [...groups.entries()].sort(([a], [b]) => {
		if (a === "Liked Songs") return -1;
		if (b === "Liked Songs") return 1;
		return a.localeCompare(b);
	});

	return sorted;
}

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

	const groups = groupBySource(filteredTracks);

	const handleComplete = (result: BatchResult) => {
		const appliedTrackIds = result.succeeded.map((op) => op.trackId);
		const unique = [...new Set(appliedTrackIds)];
		markTracksApplied(store, unique);
	};

	return (
		<div class="min-h-screen flex flex-col items-center bg-app-gradient text-app-text px-4 py-12 pb-24">
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
							Finding replacements: {progress.completed}/{progress.total}
						</span>
					) : (
						<span>
							Replacement search complete — {progress.total}/{progress.total} tracks scanned
						</span>
					)}
				</div>
			</div>

			{/* Filter bar + select all */}
			<div class="w-full max-w-2xl">
				<FilterBar store={store} />
			</div>

			{/* Track list */}
			<div class="w-full max-w-2xl">
				{groups.map(([source, tracks]) => (
					<div key={source}>
						<div class="text-app-muted/60 text-[10px] uppercase tracking-wider mt-4 mb-1 px-1">
							{source}
						</div>
						{tracks.map((t) => (
							<TrackRow key={t.id} triageTrack={t} store={store} isExpanded={expandedId === t.id} />
						))}
					</div>
				))}
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

			{/* Apply bar */}
			<ApplyBar
				pendingOps={pendingOps}
				onApply={() => {
					showModal.value = true;
				}}
			/>

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
