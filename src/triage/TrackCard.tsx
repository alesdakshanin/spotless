// src/triage/TrackCard.tsx — Flat card with inline candidate + remove action rows

import { play, playingUri, sdkReady } from "../audio";
import { spotifyUrl } from "../spotify-url";
import type { ReplacementCandidate } from "../types";
import type { TriageStore, TriageTrack } from "./state";
import { selectCandidate, toggleRemove } from "./state";

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

function CandidateRow({
	candidate,
	isSelected,
	onSelect,
}: {
	candidate: ReplacementCandidate;
	isSelected: boolean;
	onSelect: () => void;
}) {
	const thumbnailUrl = candidate.thumbnailUrl;
	const trackUri = candidate.track.uri;
	const isPlaying = playingUri.value === trackUri;

	return (
		<button
			type="button"
			onClick={onSelect}
			class={`flex items-center gap-2 py-2 px-2 rounded cursor-pointer transition-colors w-full text-left ${
				isSelected
					? "bg-accent/10 border border-accent/40"
					: "border border-transparent hover:bg-white/[0.03]"
			}`}
		>
			{/* Thumbnail */}
			{thumbnailUrl ? (
				<a
					href={spotifyUrl("album", candidate.track.album.id)}
					target="_blank"
					rel="noopener noreferrer"
					class="shrink-0"
					onClick={(e) => e.stopPropagation()}
				>
					<img src={thumbnailUrl} alt="" class="w-8 h-8 rounded-[2px] object-cover" />
				</a>
			) : (
				<div class="w-8 h-8 rounded-[2px] bg-app-surface shrink-0" />
			)}

			{/* Play / Open in Spotify */}
			{sdkReady.value ? (
				<button
					type="button"
					title="Play on Spotify"
					class={`w-7 h-7 flex items-center justify-center rounded-full shrink-0 cursor-pointer transition-colors ${
						isPlaying
							? "bg-accent/20 text-accent"
							: "bg-white/[0.06] text-app-muted hover:bg-white/10 hover:text-app-text"
					}`}
					onClick={(e) => {
						e.stopPropagation();
						play(trackUri);
					}}
				>
					<span class="text-[10px]">{isPlaying ? "⏸" : "▶"}</span>
				</button>
			) : (
				<a
					href={`https://open.spotify.com/track/${candidate.track.id}`}
					target="_blank"
					rel="noopener noreferrer"
					title="Open in Spotify"
					class="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.06] text-app-muted hover:bg-white/10 hover:text-app-text shrink-0"
					onClick={(e) => e.stopPropagation()}
				>
					<span class="text-[10px]">↗</span>
				</a>
			)}

			{/* Info */}
			<div class="flex-1 min-w-0">
				<p class="text-app-text text-[12px] truncate">{candidate.track.name}</p>
				<p class="text-app-muted text-[11px] truncate">
					{candidate.track.artists.map((a) => a.name).join(", ")}
				</p>
			</div>

			{/* Checkmark */}
			{isSelected && <span class="text-accent text-[14px] shrink-0">✓</span>}
		</button>
	);
}

function RemoveRow({
	source,
	isSelected,
	onToggle,
}: {
	source: string;
	isSelected: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			class={`flex items-center gap-2 py-2 px-2 rounded cursor-pointer transition-colors w-full text-left ${
				isSelected
					? "bg-red-500/10 border border-red-500/40"
					: "border border-transparent hover:bg-white/[0.03]"
			}`}
		>
			{/* Red ✕ icon square */}
			<div class="w-8 h-8 rounded-[2px] bg-red-500/15 flex items-center justify-center shrink-0">
				<span class="text-red-400 text-[13px]">✕</span>
			</div>

			{/* Label */}
			<div class="flex-1 min-w-0">
				<p class="text-app-text text-[12px]">Remove from {source}</p>
			</div>

			{/* Checkmark */}
			{isSelected && <span class="text-red-400 text-[14px] shrink-0">✓</span>}
		</button>
	);
}

export function TrackCard({
	triageTrack,
	store,
}: {
	triageTrack: TriageTrack;
	store: TriageStore;
}) {
	const { track, intent, selectedCandidateId, candidates, applied } = triageTrack;
	const hasCandidates = candidates.length > 0;
	const isRemoveIntent = intent === "remove";

	return (
		<div
			class={`bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden ${
				applied ? "opacity-40 pointer-events-none" : ""
			}`}
		>
			{/* Header */}
			<div class="flex items-center gap-2.5 p-3">
				{/* Album art */}
				{track.thumbnailUrl ? (
					<img
						src={track.thumbnailUrl}
						alt=""
						class="w-11 h-11 rounded-[3px] object-cover shrink-0"
					/>
				) : (
					<div class="w-11 h-11 rounded-[3px] bg-app-surface shrink-0" />
				)}

				{/* Track info */}
				<div class="flex-1 min-w-0">
					<p
						class={`text-[13px] font-medium truncate ${
							isRemoveIntent ? "line-through text-app-muted" : "text-app-text"
						}`}
					>
						{track.name}
					</p>
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
			</div>

			{/* Body: action rows */}
			<div class="px-3 pb-3 flex flex-col gap-1">
				{hasCandidates ? (
					candidates.map((c) => (
						<CandidateRow
							key={c.track.uri}
							candidate={c}
							isSelected={intent === "replace" && selectedCandidateId === c.track.uri}
							onSelect={() => selectCandidate(store, triageTrack.id, c.track.uri)}
						/>
					))
				) : (
					<p class="text-app-muted text-[12px] py-2 px-2">No replacement candidates found.</p>
				)}

				<RemoveRow
					source={track.source}
					isSelected={isRemoveIntent}
					onToggle={() => toggleRemove(store, triageTrack.id)}
				/>
			</div>
		</div>
	);
}
