// src/triage/TrackExpansion.tsx — Accordion expansion panel with candidate selection

import { play, playingUri, sdkReady } from "../audio";
import { spotifyUrl } from "../spotify-url";
import type { ReplacementCandidate } from "../types";
import type { TriageStore, TriageTrack } from "./state";
import { selectCandidate, toggleRemoveOriginal } from "./state";

function CandidateRow({
	candidate,
	isSelected,
	onSelect,
}: {
	candidate: ReplacementCandidate;
	isSelected: boolean;
	onSelect: () => void;
}) {
	const stars = "★".repeat(candidate.confidence) + "☆".repeat(3 - candidate.confidence);
	const images = candidate.track.album.images;
	const thumbnail = images.length > 0 ? images[images.length - 1] : undefined;
	const trackUri = candidate.track.uri;
	const isPlaying = playingUri.value === trackUri;

	return (
		<label
			class={`flex items-center gap-2 py-2 px-2 rounded cursor-pointer transition-colors ${
				isSelected ? "bg-accent/10" : "hover:bg-white/[0.03]"
			}`}
		>
			<input
				type="radio"
				name="candidate-selection"
				class="sr-only"
				checked={isSelected}
				onChange={onSelect}
			/>
			{/* Radio indicator */}
			<span
				class={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
					isSelected ? "border-accent" : "border-app-muted/50"
				}`}
			>
				{isSelected && <span class="w-2 h-2 rounded-full bg-accent" />}
			</span>

			{/* Thumbnail */}
			{thumbnail?.url ? (
				<a
					href={spotifyUrl("album", candidate.track.album.id)}
					target="_blank"
					rel="noopener noreferrer"
					class="shrink-0"
					onClick={(e) => e.stopPropagation()}
				>
					<img src={thumbnail.url} alt="" class="w-9 h-9 rounded-[2px] object-cover" />
				</a>
			) : (
				<div class="w-9 h-9 rounded-[2px] bg-app-surface shrink-0" />
			)}

			{/* Play / Open in Spotify */}
			{sdkReady.value ? (
				<button
					type="button"
					title="Play on Spotify"
					class={`w-8 h-8 flex items-center justify-center rounded-full shrink-0 cursor-pointer transition-colors ${
						isPlaying
							? "bg-accent/20 text-accent"
							: "bg-white/[0.06] text-app-muted hover:bg-white/10 hover:text-app-text"
					}`}
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						play(trackUri);
					}}
				>
					<span class="text-[11px]">{isPlaying ? "⏸" : "▶"}</span>
				</button>
			) : (
				<a
					href={`https://open.spotify.com/track/${candidate.track.id}`}
					target="_blank"
					rel="noopener noreferrer"
					title="Open in Spotify"
					class="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-app-muted hover:bg-white/10 hover:text-app-text shrink-0"
					onClick={(e) => e.stopPropagation()}
				>
					<span class="text-[11px]">↗</span>
				</a>
			)}

			{/* Info */}
			<div class="flex-1 min-w-0">
				<p class="text-app-text text-[12px] truncate">
					<a
						href={spotifyUrl("track", candidate.track.id)}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:underline"
						onClick={(e) => e.stopPropagation()}
					>
						{candidate.track.name}
					</a>
				</p>
				<p class="text-app-muted text-[11px] truncate">
					{candidate.track.artists.map((a, i) => (
						<>
							{i > 0 && ", "}
							<a
								key={a.id}
								href={spotifyUrl("artist", a.id)}
								target="_blank"
								rel="noopener noreferrer"
								class="hover:underline"
								onClick={(e) => e.stopPropagation()}
							>
								{a.name}
							</a>
						</>
					))}
				</p>
			</div>

			{/* Stars */}
			<span class="text-amber-400 text-[11px] shrink-0">{stars}</span>

			{/* Recommended badge */}
			{candidate.confidence === 3 && (
				<span class="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded shrink-0">
					RECOMMENDED
				</span>
			)}
		</label>
	);
}

export function TrackExpansion({
	triageTrack,
	store,
}: {
	triageTrack: TriageTrack;
	store: TriageStore;
}) {
	const { candidates, selectedCandidateId, removeOriginal, searchStatus, track } = triageTrack;

	if (searchStatus === "pending") {
		return (
			<div class="py-3 pl-7">
				<p class="text-app-muted text-[12px]">Searching for replacements...</p>
			</div>
		);
	}

	if (candidates.length === 0) {
		return (
			<div class="py-3 pl-7">
				<p class="text-app-muted text-[12px]">No replacement candidates found for this track.</p>
			</div>
		);
	}

	return (
		<div class="py-2 pl-7">
			<p class="text-app-muted text-[10px] uppercase tracking-wider mb-2">
				Candidates for &ldquo;{track.name}&rdquo;
			</p>

			{candidates.map((c) => (
				<CandidateRow
					key={c.track.uri}
					candidate={c}
					isSelected={selectedCandidateId === c.track.uri}
					onSelect={() => selectCandidate(store, triageTrack.id, c.track.uri)}
				/>
			))}

			{/* Remove original toggle */}
			<div class="flex items-center gap-2 mt-3 pl-2">
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						toggleRemoveOriginal(store, triageTrack.id);
					}}
					class={`w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] shrink-0 cursor-pointer ${
						removeOriginal ? "bg-accent border-accent text-black" : "border-app-muted/50"
					}`}
				>
					{removeOriginal ? "✓" : ""}
				</button>
				<span class="text-app-muted text-[12px]">Remove original from {track.source}</span>
			</div>
		</div>
	);
}
