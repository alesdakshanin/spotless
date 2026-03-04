// src/spotify-sdk.d.ts — Type declarations for Spotify Web Playback SDK

declare namespace Spotify {
	interface PlayerOptions {
		name: string;
		getOAuthToken: (cb: (token: string) => void) => void;
		volume?: number;
	}

	interface WebPlaybackState {
		paused: boolean;
		track_window: {
			current_track: {
				uri: string;
				name: string;
				artists: Array<{ name: string; uri: string }>;
				album: {
					name: string;
					uri: string;
					images: Array<{ url: string; height: number; width: number }>;
				};
			};
		};
	}

	interface WebPlaybackInstance {
		device_id: string;
	}

	interface WebPlaybackError {
		message: string;
	}

	class Player {
		constructor(options: PlayerOptions);
		connect(): Promise<boolean>;
		disconnect(): void;
		pause(): Promise<void>;
		resume(): Promise<void>;
		togglePlay(): Promise<void>;
		addListener(event: "ready", callback: (instance: WebPlaybackInstance) => void): void;
		addListener(event: "not_ready", callback: (instance: WebPlaybackInstance) => void): void;
		addListener(
			event: "player_state_changed",
			callback: (state: WebPlaybackState | null) => void,
		): void;
		addListener(event: "initialization_error", callback: (error: WebPlaybackError) => void): void;
		addListener(event: "authentication_error", callback: (error: WebPlaybackError) => void): void;
		addListener(event: "account_error", callback: (error: WebPlaybackError) => void): void;
	}
}

interface Window {
	onSpotifyWebPlaybackSDKReady?: () => void;
}
