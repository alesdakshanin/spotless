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

export function PlaylistPicker({ playlists, onScan }: Props) {
	const likedSongs = useSignal(true);
	const selected = useSignal(new Set(playlists.map((p) => p.id)));

	const noneSelected = !likedSongs.value && selected.value.size === 0;

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

	function handleScan() {
		const selectedPlaylists = playlists.filter((p) => selected.value.has(p.id));
		onScan({ includeLikedSongs: likedSongs.value, playlists: selectedPlaylists });
	}

	return (
		<div class="w-full max-w-lg">
			<div class="mb-6 max-h-96 overflow-y-auto rounded-lg bg-white/5 py-1">
				{/* Liked Songs row */}
				<label class="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5">
					<input
						type="checkbox"
						checked={likedSongs.value}
						onChange={toggleLikedSongs}
						class="accent-accent h-5 w-5 shrink-0 cursor-pointer"
					/>
					<img
						src={LIBRARY_IMAGE}
						alt="Liked Songs"
						class="h-12 w-12 rounded object-cover shrink-0"
					/>
					<span class="text-app-text text-[15px] truncate">Liked Songs</span>
				</label>

				{/* Playlist rows */}
				{playlists.map((playlist, i) => {
					const imgUrl = getPlaylistImage(playlist);
					const isLast = i === playlists.length - 1;
					return (
						<label
							key={playlist.id}
							class={`flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer${isLast ? "" : " border-b border-white/5"}`}
						>
							<input
								type="checkbox"
								checked={selected.value.has(playlist.id)}
								onChange={() => togglePlaylist(playlist.id)}
								class="accent-accent h-5 w-5 shrink-0 cursor-pointer"
							/>
							{imgUrl ? (
								<img
									src={imgUrl}
									alt={playlist.name}
									class="h-12 w-12 rounded object-cover shrink-0"
								/>
							) : (
								<div class="h-12 w-12 rounded bg-white/10 shrink-0" />
							)}
							<span class="text-app-text text-[15px] truncate">{playlist.name}</span>
						</label>
					);
				})}
			</div>

			<button
				type="button"
				disabled={noneSelected}
				onClick={handleScan}
				class="w-full bg-accent hover:bg-accent/85 text-black font-bold py-3.5 rounded text-[13px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Scan Library
			</button>
		</div>
	);
}
