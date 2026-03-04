// src/triage/TrackRow.tsx — Single track row in the triage list

import type { TriageStore, TriageTrack } from "./state";
import { toggleCheck, toggleExpanded } from "./state";
import { TrackExpansion } from "./TrackExpansion";

const RESTRICTION_COLORS: Record<string, string> = {
	market: "bg-blue-500/20 text-blue-400",
	product: "bg-purple-500/20 text-purple-400",
	explicit: "bg-orange-500/20 text-orange-400",
};

function restrictionClass(reason: string): string {
	const lower = reason.toLowerCase();
	for (const [key, cls] of Object.entries(RESTRICTION_COLORS)) {
		if (lower.includes(key)) return cls;
	}
	return "bg-app-error/20 text-app-error";
}

function confidenceIndicator(track: TriageTrack): string {
	if (track.searchStatus === "pending") return "";
	if (track.candidates.length === 0) return "–";
	const best = track.candidates[0];
	if (!best) return "–";
	return "★".repeat(best.confidence) + "☆".repeat(3 - best.confidence);
}

function bestCandidateName(track: TriageTrack): string {
	if (track.searchStatus === "pending") return "";
	if (track.candidates.length === 0) return "no match";
	const selected = track.selectedCandidateId
		? track.candidates.find((c) => c.track.uri === track.selectedCandidateId)
		: track.candidates[0];
	return selected ? selected.track.name : "";
}

export function TrackRow({
	triageTrack,
	store,
	isExpanded,
}: {
	triageTrack: TriageTrack;
	store: TriageStore;
	isExpanded: boolean;
}) {
	const { track, checked, candidates, searchStatus, applied } = triageTrack;
	const hasCandidates = candidates.length > 0;
	const firstCandidate = candidates[0];
	const isAutoProposed =
		hasCandidates && firstCandidate !== undefined && firstCandidate.confidence === 3;
	const confidence = confidenceIndicator(triageTrack);
	const candidateName = bestCandidateName(triageTrack);

	return (
		<div class={applied ? "opacity-40 pointer-events-none" : ""}>
			<button
				type="button"
				class={`flex items-center gap-2 py-2.5 border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.02] transition-colors w-full text-left ${
					isAutoProposed && checked ? "border-l-2 border-l-accent/40 pl-1" : ""
				}`}
				onClick={() => toggleExpanded(store, triageTrack.id)}
			>
				{/* Checkbox */}
				<label
					class="shrink-0"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<input
						type="checkbox"
						class="sr-only"
						checked={checked}
						disabled={!hasCandidates && searchStatus === "done"}
						onChange={(e) => {
							e.stopPropagation();
							toggleCheck(store, triageTrack.id);
						}}
					/>
					<span
						class={`w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] ${
							!hasCandidates && searchStatus === "done"
								? "border-app-muted/30 opacity-40"
								: checked
									? "bg-accent border-accent text-black cursor-pointer"
									: "border-app-muted/50 cursor-pointer"
						}`}
					>
						{checked ? "✓" : ""}
					</span>
				</label>

				{/* Thumbnail */}
				{track.thumbnailUrl ? (
					<img
						src={track.thumbnailUrl}
						alt=""
						class="w-10 h-10 rounded-[2px] object-cover shrink-0"
					/>
				) : (
					<div class="w-10 h-10 rounded-[2px] bg-app-surface shrink-0" />
				)}

				{/* Track info */}
				<div class="flex-1 min-w-0">
					<p class="text-app-text text-[13px] font-medium truncate">{track.name}</p>
					<p class="text-app-muted text-[11px] truncate">{track.artists.join(", ")}</p>
				</div>

				{/* Source tag */}
				<span class="text-app-muted/70 text-[10px] shrink-0 hidden sm:inline bg-white/[0.04] px-1.5 py-0.5 rounded">
					{track.source}
				</span>

				{/* Restriction badge */}
				<span
					class={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${restrictionClass(track.reason)}`}
				>
					{track.reason}
				</span>

				{/* Confidence indicator */}
				<span
					class={`text-[11px] shrink-0 w-12 text-right ${
						searchStatus === "pending" ? "animate-pulse text-app-muted/40" : "text-amber-400"
					}`}
				>
					{searchStatus === "pending" ? "···" : confidence}
				</span>

				{/* Best candidate preview */}
				<span
					class={`text-[11px] truncate max-w-[120px] shrink-0 hidden md:inline ${
						candidateName === "no match" ? "text-app-muted/50 italic" : "text-app-muted"
					}`}
				>
					{candidateName}
				</span>

				{/* Chevron */}
				<span class="text-app-muted text-[11px] shrink-0 ml-1">{isExpanded ? "▲" : "▼"}</span>
			</button>

			{/* Expansion panel */}
			{isExpanded && (
				<div class="border-b border-white/[0.06] bg-white/[0.01]">
					<TrackExpansion triageTrack={triageTrack} store={store} />
				</div>
			)}
		</div>
	);
}
