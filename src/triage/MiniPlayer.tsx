// src/triage/MiniPlayer.tsx — Persistent mini player bar showing current playback

import { dismiss, nowPlaying, togglePlay } from "../audio";

export function MiniPlayer() {
	const state = nowPlaying.value;
	if (!state) return null;

	return (
		<div class="bg-app-surface/95 backdrop-blur border-t border-white/[0.08] py-2 px-4 flex items-center gap-3 animate-slide-up">
			{/* Album art */}
			{state.albumArtUrl ? (
				<img src={state.albumArtUrl} alt="" class="w-10 h-10 rounded object-cover shrink-0" />
			) : (
				<div class="w-10 h-10 rounded bg-white/[0.06] shrink-0" />
			)}

			{/* Track info */}
			<div class="flex-1 min-w-0">
				<p class="text-app-text text-[12px] truncate">{state.name}</p>
				<p class="text-app-muted text-[11px] truncate">{state.artists}</p>
			</div>

			{/* Play/Pause */}
			<button
				type="button"
				title={state.paused ? "Resume" : "Pause"}
				onClick={() => togglePlay()}
				class="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-black shrink-0 cursor-pointer transition-colors hover:bg-accent/85"
			>
				<span class="text-[12px]">{state.paused ? "▶" : "⏸"}</span>
			</button>

			{/* Dismiss */}
			<button
				type="button"
				title="Dismiss player"
				onClick={() => dismiss()}
				class="w-6 h-6 flex items-center justify-center rounded-full text-app-muted hover:text-app-text shrink-0 cursor-pointer transition-colors"
			>
				<span class="text-[11px]">✕</span>
			</button>
		</div>
	);
}
