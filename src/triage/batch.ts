// src/triage/batch.ts — Batch execution engine

import { addTrack, removeTrack, sourceFromUnplayable } from "../actions";
import { backupTracks, ensureBackupPlaylist } from "../backup";
import type { PendingOp } from "./state";

export interface BatchResult {
	succeeded: PendingOp[];
	failed: { op: PendingOp; error: string }[];
}

export type ProgressCallback = (completed: number, total: number) => void;

/**
 * Execute a batch of pending operations sequentially.
 * When backup is enabled, backs up all tracks from remove ops before executing.
 * ADD before REMOVE per track. If ADD fails for a track, its REMOVE is skipped.
 */
export async function executeBatch(
	ops: PendingOp[],
	userId: string,
	onProgress?: ProgressCallback,
	backup = true,
): Promise<BatchResult> {
	const result: BatchResult = { succeeded: [], failed: [] };

	// Group ops by track: adds first, then removes
	const adds = ops.filter((op) => op.type === "add");
	const removes = ops.filter((op) => op.type === "remove");
	const ordered = [...adds, ...removes];

	// Phase 1: Backup
	if (backup && removes.length > 0) {
		const uniqueUris = [...new Set(removes.map((op) => op.trackUri))];
		try {
			const playlistId = await ensureBackupPlaylist(userId);
			await backupTracks(playlistId, uniqueUris);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			for (const op of ordered) {
				result.failed.push({ op, error: `Backup failed: ${message}` });
			}
			return result;
		}
	}

	// Phase 2: Execute
	const failedTrackIds = new Set<string>();
	let completed = 0;
	const total = ordered.length;

	for (const op of ordered) {
		// Skip remove if add failed for this track
		if (op.type === "remove" && failedTrackIds.has(op.trackId)) {
			result.failed.push({ op, error: "Skipped because add failed" });
			completed++;
			onProgress?.(completed, total);
			continue;
		}

		try {
			const source = sourceFromUnplayable(op.sourceId);
			if (op.type === "add" && op.candidateUri) {
				await addTrack(op.candidateUri, source);
			} else if (op.type === "remove") {
				await removeTrack(op.trackUri, source);
			}
			result.succeeded.push(op);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			result.failed.push({ op, error: message });
			if (op.type === "add") {
				failedTrackIds.add(op.trackId);
			}
		}

		completed++;
		onProgress?.(completed, total);
	}

	return result;
}
