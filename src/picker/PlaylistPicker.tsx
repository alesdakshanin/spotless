// src/picker/PlaylistPicker.tsx — Preact component for selecting scan sources

import { useSignal } from "@preact/signals";
import type { ScanConfig, SpotifyPlaylist } from "../types";

const LIBRARY_IMAGE = `${import.meta.env.BASE_URL}library.png`;

interface Props {
	playlists: SpotifyPlaylist[];
	onScan: (config: ScanConfig) => void;
}

function getPlaylistImage(playlist: SpotifyPlaylist): string | undefined {
	const images = playlist.images;
	if (!images || images.length === 0) return undefined;
	return images[images.length - 1]?.url;
}

function Checkbox({ checked }: { checked: boolean }) {
	return (
		<span
			class={`w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] shrink-0 ${
				checked ? "bg-accent border-accent text-black" : "border-app-muted/50"
			}`}
		>
			{checked ? "✓" : ""}
		</span>
	);
}

export function PlaylistPicker({ playlists, onScan }: Props) {
	const likedSongs = useSignal(true);
	const selected = useSignal(new Set(playlists.map((p) => p.id)));
	const filterText = useSignal("");

	const filter = filterText.value.toLowerCase();
	const filteredPlaylists = filter
		? playlists.filter((p) => p.name.toLowerCase().includes(filter))
		: playlists;
	const showLikedSongs = !filter || "liked songs".includes(filter);

	const totalSelected = (likedSongs.value ? 1 : 0) + selected.value.size;
	const noneSelected = !likedSongs.value && selected.value.size === 0;

	const visibleIds = new Set(filteredPlaylists.map((p) => p.id));
	const allVisibleSelected =
		(showLikedSongs ? likedSongs.value : true) &&
		filteredPlaylists.every((p) => selected.value.has(p.id));

	function toggleLikedSongs() {
		likedSongs.value = !likedSongs.value;
	}

	function togglePlaylist(id: string) {
		const next = new Set(selected.value);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selected.value = next;
	}

	function toggleAllVisible() {
		if (allVisibleSelected) {
			// Deselect all visible
			if (showLikedSongs) likedSongs.value = false;
			const next = new Set(selected.value);
			for (const id of visibleIds) next.delete(id);
			selected.value = next;
		} else {
			// Select all visible
			if (showLikedSongs) likedSongs.value = true;
			const next = new Set(selected.value);
			for (const id of visibleIds) next.add(id);
			selected.value = next;
		}
	}

	function handleScan() {
		const selectedPlaylists = playlists.filter((p) => selected.value.has(p.id));
		onScan({ includeLikedSongs: likedSongs.value, playlists: selectedPlaylists });
	}

	return (
		<div class="w-full">
			{/* Toolbar */}
			<div class="flex items-center gap-3 mb-4">
				<input
					type="text"
					placeholder="Filter playlists..."
					value={filterText.value}
					onInput={(e) => {
						filterText.value = (e.target as HTMLInputElement).value;
					}}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							filterText.value = "";
							(e.target as HTMLInputElement).blur();
						}
					}}
					class="flex-1 bg-white/[0.06] border border-white/[0.06] rounded px-3 py-2 text-[13px] text-app-text placeholder:text-app-muted/60 outline-none focus:border-accent/40 transition-colors"
				/>
				<button
					type="button"
					onClick={toggleAllVisible}
					class="text-app-muted hover:text-app-text text-[13px] shrink-0 cursor-pointer"
				>
					{allVisibleSelected ? "Deselect all" : "Select all"}
				</button>
			</div>

			{/* Card grid */}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-28">
				{/* Liked Songs card */}
				{showLikedSongs && (
					<button
						type="button"
						aria-pressed={likedSongs.value}
						onClick={toggleLikedSongs}
						class={`flex items-center gap-3 px-3 py-3 rounded-lg border text-left cursor-pointer transition-colors ${
							likedSongs.value
								? "bg-accent/[0.07] border-accent/25"
								: "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
						}`}
					>
						<Checkbox checked={likedSongs.value} />
						<img
							src={LIBRARY_IMAGE}
							alt="Liked Songs"
							class="w-10 h-10 rounded-[2px] object-cover shrink-0"
						/>
						<span class="text-app-text text-[13px] truncate">Liked Songs</span>
					</button>
				)}

				{/* Playlist cards */}
				{filteredPlaylists.map((playlist) => {
					const imgUrl = getPlaylistImage(playlist);
					const isSelected = selected.value.has(playlist.id);
					return (
						<button
							key={playlist.id}
							type="button"
							aria-pressed={isSelected}
							onClick={() => togglePlaylist(playlist.id)}
							class={`flex items-center gap-3 px-3 py-3 rounded-lg border text-left cursor-pointer transition-colors ${
								isSelected
									? "bg-accent/[0.07] border-accent/25"
									: "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
							}`}
						>
							<Checkbox checked={isSelected} />
							{imgUrl ? (
								<img
									src={imgUrl}
									alt={playlist.name}
									class="w-10 h-10 rounded-[2px] object-cover shrink-0"
								/>
							) : (
								<div class="w-10 h-10 rounded-[2px] bg-white/10 shrink-0" />
							)}
							<div class="min-w-0 flex-1">
								<span class="text-app-text text-[13px] truncate block">{playlist.name}</span>
								<span class="text-app-muted text-[11px]">{playlist.tracks.total} tracks</span>
							</div>
						</button>
					);
				})}
			</div>

			{/* Sticky bottom bar */}
			<div class="fixed bottom-0 left-0 right-0 z-50 bg-app-surface/95 backdrop-blur border-t border-white/[0.08] py-3 px-6 flex items-center justify-between animate-slide-up">
				<span class="text-app-text text-[13px]">
					{totalSelected} source{totalSelected !== 1 ? "s" : ""} selected
				</span>
				<button
					type="button"
					disabled={noneSelected}
					onClick={handleScan}
					class="bg-accent hover:bg-accent/85 text-black font-bold py-2.5 px-6 rounded text-[13px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
				>
					Scan Library
				</button>
			</div>
		</div>
	);
}
