// src/picker/mount.ts — Mount/unmount the Preact playlist picker

import { h, render } from "preact";
import type { ScanConfig, SpotifyPlaylist } from "../types";
import { PlaylistPicker } from "./PlaylistPicker";

export function mountPicker(
	container: HTMLElement,
	playlists: SpotifyPlaylist[],
	onScan: (config: ScanConfig) => void,
): void {
	render(h(PlaylistPicker, { playlists, onScan }), container);
}

export function unmountPicker(container: HTMLElement): void {
	render(null, container);
}
