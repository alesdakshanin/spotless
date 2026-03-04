// src/audio.ts — Spotify Web Playback SDK manager for candidate playback

import { signal } from "@preact/signals";
import { put } from "./api";
import { isTokenExpired, loadTokens, refreshAccessToken } from "./auth";

/** Track metadata from the SDK player state. */
export interface NowPlayingTrack {
	uri: string;
	name: string;
	artists: string;
	albumArtUrl?: string;
	paused: boolean;
}

/** The Spotify URI of the currently playing track, or null when paused/stopped. */
export const playingUri = signal<string | null>(null);

/** Full track info for the mini player, persists when paused until dismissed. */
export const nowPlaying = signal<NowPlayingTrack | null>(null);

/** Whether the SDK player is connected and ready to play. */
export const sdkReady = signal(false);

const SDK_URL = "https://sdk.scdn.co/spotify-player.js";
const PLAYER_NAME = "Spotless";

let player: Spotify.Player | null = null;
let deviceId: string | null = null;
let sdkLoaded = false;

function loadSdk(): Promise<void> {
	if (sdkLoaded) return Promise.resolve();

	return new Promise<void>((resolve) => {
		window.onSpotifyWebPlaybackSDKReady = () => {
			sdkLoaded = true;
			resolve();
		};
		const script = document.createElement("script");
		script.src = SDK_URL;
		document.body.appendChild(script);
	});
}

/** Initialize the Web Playback SDK player. Safe to call multiple times. */
export async function initPlayer(): Promise<void> {
	if (player) return;

	await loadSdk();

	const p = new Spotify.Player({
		name: PLAYER_NAME,
		getOAuthToken: (cb) => {
			const tokens = loadTokens();
			if (tokens && !isTokenExpired()) {
				cb(tokens.accessToken);
			} else {
				refreshAccessToken().then((refreshed) => cb(refreshed.accessToken));
			}
		},
		volume: 0.5,
	});

	p.addListener("ready", ({ device_id }) => {
		deviceId = device_id;
		sdkReady.value = true;
		console.log("[audio] SDK ready, device:", device_id);
	});

	p.addListener("not_ready", () => {
		sdkReady.value = false;
		console.log("[audio] SDK not ready");
	});

	p.addListener("player_state_changed", (state) => {
		if (!state) {
			playingUri.value = null;
			nowPlaying.value = null;
			return;
		}

		const track = state.track_window.current_track;
		const images = track.album.images;
		const art = images.length > 0 ? images[0] : undefined;

		playingUri.value = state.paused ? null : track.uri;
		nowPlaying.value = {
			uri: track.uri,
			name: track.name,
			artists: track.artists.map((a) => a.name).join(", "),
			albumArtUrl: art?.url,
			paused: state.paused,
		};
	});

	player = p;
	await p.connect();
}

/** Play a track by Spotify URI. If the same track is playing, pause it. */
export async function play(spotifyUri: string): Promise<void> {
	if (!deviceId || !player) return;

	if (playingUri.value === spotifyUri) {
		try {
			await player.pause();
		} catch (err) {
			console.error("[audio] Failed to pause:", err);
		}
		return;
	}

	try {
		await put(`/me/player/play?device_id=${deviceId}`, {
			uris: [spotifyUri],
		});
	} catch (err) {
		console.error("[audio] Failed to play:", err);
	}
}

/** Toggle play/pause on the current track. */
export async function togglePlay(): Promise<void> {
	if (!player) return;
	try {
		await player.togglePlay();
	} catch (err) {
		console.error("[audio] Failed to toggle play:", err);
	}
}

/** Stop any currently playing track. */
export async function stop(): Promise<void> {
	if (!player) return;
	try {
		await player.pause();
	} catch {
		// Ignore errors when stopping
	}
	playingUri.value = null;
}

/** Stop playback and hide the mini player. */
export async function dismiss(): Promise<void> {
	await stop();
	nowPlaying.value = null;
}

/** Disconnect the SDK player and release resources. */
export function disconnect(): void {
	if (player) {
		player.disconnect();
	}
	player = null;
	deviceId = null;
	sdkReady.value = false;
	playingUri.value = null;
	nowPlaying.value = null;
}

/** @internal Set up module state for testing without loading the SDK. */
export function _initForTesting(mockPlayer: Spotify.Player, mockDeviceId: string): void {
	disconnect();
	player = mockPlayer;
	deviceId = mockDeviceId;
	sdkReady.value = true;
}
