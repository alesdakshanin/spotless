// src/triage/state.ts — Signal-based triage store and actions

import { computed, type ReadonlySignal, type Signal, signal } from "@preact/signals";
import { searchReplacements } from "../replacements";
import type { ReplacementCandidate, UnplayableTrack } from "../types";

// --- Types ---

export type Filter = "all" | "auto-proposed" | "needs-review" | "no-match";

export interface TriageTrack {
	id: string;
	track: UnplayableTrack;
	checked: boolean;
	selectedCandidateId: string | null;
	removeOriginal: boolean;
	candidates: ReplacementCandidate[];
	searchStatus: "pending" | "done";
	applied: boolean;
}

export interface FilterCounts {
	all: number;
	autoProposed: number;
	needsReview: number;
	noMatch: number;
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

export type SelectAllState = "none" | "some" | "all";

// --- Store ---

export interface TriageStore {
	tracks: Signal<TriageTrack[]>;
	filter: Signal<Filter>;
	searchProgress: Signal<SearchProgress>;
	expandedTrackId: Signal<string | null>;

	filteredTracks: ReadonlySignal<TriageTrack[]>;
	counts: ReadonlySignal<FilterCounts>;
	pendingOps: ReadonlySignal<PendingOp[]>;
	selectAllState: ReadonlySignal<SelectAllState>;
	selectedCount: ReadonlySignal<number>;
}

function bestCandidateId(candidates: ReplacementCandidate[]): string | null {
	const best = candidates[0]; // already sorted by confidence desc
	return best ? best.track.uri : null;
}

function bestConfidence(candidates: ReplacementCandidate[]): number {
	return candidates[0]?.confidence ?? 0;
}

function trackMatchesFilter(t: TriageTrack, filter: Filter): boolean {
	if (filter === "all") return true;
	const best = bestConfidence(t.candidates);
	if (filter === "auto-proposed") return best === 3;
	if (filter === "needs-review") return best >= 1 && best <= 2;
	if (filter === "no-match") return t.searchStatus === "done" && t.candidates.length === 0;
	return true;
}

export function createTriageStore(unplayableTracks: UnplayableTrack[]): TriageStore {
	const tracks = signal<TriageTrack[]>(
		unplayableTracks.map((t) => ({
			id: t.trackUri,
			track: t,
			checked: false,
			selectedCandidateId: null,
			removeOriginal: false,
			candidates: [],
			searchStatus: "pending" as const,
			applied: false,
		})),
	);

	const filter = signal<Filter>("all");
	const searchProgress = signal<SearchProgress>({ completed: 0, total: unplayableTracks.length });
	const expandedTrackId = signal<string | null>(null);

	const filteredTracks = computed(() =>
		tracks.value.filter((t) => trackMatchesFilter(t, filter.value)),
	);

	const counts = computed<FilterCounts>(() => {
		const all = tracks.value;
		return {
			all: all.length,
			autoProposed: all.filter((t) => bestConfidence(t.candidates) === 3).length,
			needsReview: all.filter((t) => {
				const best = bestConfidence(t.candidates);
				return best >= 1 && best <= 2;
			}).length,
			noMatch: all.filter((t) => t.searchStatus === "done" && t.candidates.length === 0).length,
		};
	});

	const pendingOps = computed<PendingOp[]>(() => {
		const ops: PendingOp[] = [];
		for (const t of tracks.value) {
			if (!t.checked || t.applied) continue;
			const artistNames = t.track.artists.join(", ");
			if (t.selectedCandidateId) {
				const candidate = t.candidates.find((c) => c.track.uri === t.selectedCandidateId);
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
			}
			if (t.removeOriginal) {
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
		}
		return ops;
	});

	const selectAllState = computed<SelectAllState>(() => {
		const visible = filteredTracks.value.filter((t) => t.candidates.length > 0 && !t.applied);
		if (visible.length === 0) return "none";
		const checkedCount = visible.filter((t) => t.checked).length;
		if (checkedCount === 0) return "none";
		if (checkedCount === visible.length) return "all";
		return "some";
	});

	const selectedCount = computed(() => tracks.value.filter((t) => t.checked && !t.applied).length);

	return {
		tracks,
		filter,
		searchProgress,
		expandedTrackId,
		filteredTracks,
		counts,
		pendingOps,
		selectAllState,
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

export function toggleCheck(store: TriageStore, id: string): void {
	updateTrack(store, id, (t) => {
		if (t.applied) return t;
		const newChecked = !t.checked;
		if (newChecked) {
			return {
				...t,
				checked: true,
				selectedCandidateId: t.selectedCandidateId ?? bestCandidateId(t.candidates),
				removeOriginal: bestConfidence(t.candidates) === 3 ? true : t.removeOriginal,
			};
		}
		return { ...t, checked: false, selectedCandidateId: null, removeOriginal: false };
	});
}

export function selectCandidate(store: TriageStore, trackId: string, candidateUri: string): void {
	updateTrack(store, trackId, (t) => ({
		...t,
		checked: true,
		selectedCandidateId: candidateUri,
	}));
}

export function toggleRemoveOriginal(store: TriageStore, id: string): void {
	updateTrack(store, id, (t) => ({ ...t, removeOriginal: !t.removeOriginal }));
}

export function setFilter(store: TriageStore, f: Filter): void {
	store.filter.value = f;
	store.expandedTrackId.value = null;
}

export function selectAllVisible(store: TriageStore): void {
	const visibleIds = new Set(
		store.filteredTracks.value
			.filter((t) => t.candidates.length > 0 && !t.applied)
			.map((t) => t.id),
	);
	store.tracks.value = store.tracks.value.map((t) => {
		if (!visibleIds.has(t.id)) return t;
		return {
			...t,
			checked: true,
			selectedCandidateId: t.selectedCandidateId ?? bestCandidateId(t.candidates),
			removeOriginal: bestConfidence(t.candidates) === 3 ? true : t.removeOriginal,
		};
	});
}

export function deselectAllVisible(store: TriageStore): void {
	const visibleIds = new Set(store.filteredTracks.value.map((t) => t.id));
	store.tracks.value = store.tracks.value.map((t) => {
		if (!visibleIds.has(t.id)) return t;
		return { ...t, checked: false, selectedCandidateId: null, removeOriginal: false };
	});
}

export function toggleExpanded(store: TriageStore, id: string): void {
	store.expandedTrackId.value = store.expandedTrackId.value === id ? null : id;
}

export function markTracksApplied(store: TriageStore, trackIds: string[]): void {
	const ids = new Set(trackIds);
	store.tracks.value = store.tracks.value.map((t) =>
		ids.has(t.id) ? { ...t, applied: true, checked: false } : t,
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
			checked: isAutoProposal,
			selectedCandidateId: isAutoProposal ? bestCandidateId(candidates) : null,
			removeOriginal: isAutoProposal,
		}));

		store.searchProgress.value = { completed: i + 1, total: trackList.length };
	}
}
