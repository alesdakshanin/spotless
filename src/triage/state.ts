// src/triage/state.ts — Signal-based triage store and actions

import { computed, type ReadonlySignal, type Signal, signal } from "@preact/signals";
import { searchReplacements } from "../replacements";
import type { ReplacementCandidate, UnplayableTrack } from "../types";

// --- Types ---

export type Intent = "skip" | "replace" | "remove";

export interface TriageTrack {
	id: string;
	track: UnplayableTrack;
	intent: Intent;
	selectedCandidateId: string | null;
	candidates: ReplacementCandidate[];
	searchStatus: "pending" | "done";
	applied: boolean;
}

export interface PendingOp {
	type: "add" | "remove";
	trackId: string;
	trackName: string;
	artistNames: string;
	source: string;
	sourceId: string | null;
	trackUri: string;
	candidateUri?: string;
	candidateName?: string;
	confidence?: 1 | 2 | 3;
}

export interface SearchProgress {
	completed: number;
	total: number;
}

// --- Store ---

export interface TriageStore {
	tracks: Signal<TriageTrack[]>;
	searchProgress: Signal<SearchProgress>;

	pendingOps: ReadonlySignal<PendingOp[]>;
	selectedCount: ReadonlySignal<number>;
}

function bestCandidateId(candidates: ReplacementCandidate[]): string | null {
	const best = candidates[0]; // already sorted by confidence desc
	return best ? best.track.uri : null;
}

export function createTriageStore(unplayableTracks: UnplayableTrack[]): TriageStore {
	const tracks = signal<TriageTrack[]>(
		unplayableTracks.map((t) => ({
			id: t.trackUri,
			track: t,
			intent: "skip" as const,
			selectedCandidateId: null,
			candidates: [],
			searchStatus: "pending" as const,
			applied: false,
		})),
	);

	const searchProgress = signal<SearchProgress>({ completed: 0, total: unplayableTracks.length });

	const pendingOps = computed<PendingOp[]>(() => {
		const ops: PendingOp[] = [];
		for (const t of tracks.value) {
			if (t.applied) continue;
			const artistNames = t.track.artists.join(", ");

			if (t.intent === "replace" && t.selectedCandidateId) {
				const candidate = t.candidates.find((c) => c.track.uri === t.selectedCandidateId);
				// add op
				ops.push({
					type: "add",
					trackId: t.id,
					trackName: t.track.name,
					artistNames,
					source: t.track.source,
					sourceId: t.track.sourceId,
					trackUri: t.track.trackUri,
					candidateUri: t.selectedCandidateId,
					candidateName: candidate?.track.name,
					confidence: candidate?.confidence,
				});
				// remove op
				ops.push({
					type: "remove",
					trackId: t.id,
					trackName: t.track.name,
					artistNames,
					source: t.track.source,
					sourceId: t.track.sourceId,
					trackUri: t.track.trackUri,
				});
			} else if (t.intent === "remove") {
				ops.push({
					type: "remove",
					trackId: t.id,
					trackName: t.track.name,
					artistNames,
					source: t.track.source,
					sourceId: t.track.sourceId,
					trackUri: t.track.trackUri,
				});
			}
			// intent === "skip" → no ops
		}
		return ops;
	});

	const selectedCount = computed(
		() => tracks.value.filter((t) => t.intent !== "skip" && !t.applied).length,
	);

	return {
		tracks,
		searchProgress,
		pendingOps,
		selectedCount,
	};
}

// --- Actions ---

function updateTrack(
	store: TriageStore,
	id: string,
	updater: (t: TriageTrack) => TriageTrack,
): void {
	store.tracks.value = store.tracks.value.map((t) => (t.id === id ? updater(t) : t));
}

export function selectCandidate(store: TriageStore, trackId: string, candidateUri: string): void {
	updateTrack(store, trackId, (t) => {
		if (t.applied) return t;
		// Toggle off if same candidate re-clicked
		if (t.intent === "replace" && t.selectedCandidateId === candidateUri) {
			return { ...t, intent: "skip" as const };
		}
		return { ...t, intent: "replace" as const, selectedCandidateId: candidateUri };
	});
}

export function toggleRemove(store: TriageStore, trackId: string): void {
	updateTrack(store, trackId, (t) => {
		if (t.applied) return t;
		return {
			...t,
			intent: t.intent === "remove" ? ("skip" as const) : ("remove" as const),
			selectedCandidateId: null,
		};
	});
}

export function markTracksApplied(store: TriageStore, trackIds: string[]): void {
	const ids = new Set(trackIds);
	store.tracks.value = store.tracks.value.map((t) =>
		ids.has(t.id) ? { ...t, applied: true, intent: "skip" as const } : t,
	);
}

// --- Background Search ---

export async function searchAllReplacements(
	store: TriageStore,
	searchFn: (track: UnplayableTrack) => Promise<ReplacementCandidate[]> = searchReplacements,
): Promise<void> {
	const trackList = store.tracks.value;
	store.searchProgress.value = { completed: 0, total: trackList.length };

	for (let i = 0; i < trackList.length; i++) {
		const current = store.tracks.value[i];
		if (!current) continue;

		let candidates: ReplacementCandidate[];
		try {
			candidates = await searchFn(current.track);
		} catch (err) {
			console.error(`[replacements] Search FAILED for "${current.track.name}":`, err);
			candidates = [];
		}

		const firstCandidate = candidates[0];
		const isAutoProposal = firstCandidate !== undefined && firstCandidate.confidence === 3;

		updateTrack(store, current.id, (t) => ({
			...t,
			candidates,
			searchStatus: "done" as const,
			intent: isAutoProposal ? ("replace" as const) : ("skip" as const),
			selectedCandidateId: isAutoProposal ? bestCandidateId(candidates) : null,
		}));

		store.searchProgress.value = { completed: i + 1, total: trackList.length };
	}
}
