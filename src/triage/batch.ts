// src/triage/batch.ts — Batch execution engine

import { addTrack, removeTrack, sourceFromUnplayable } from "../actions";
import type { PendingOp } from "./state";

export interface BatchResult {
	succeeded: PendingOp[];
	failed: { op: PendingOp; error: string }[];
}

export type ProgressCallback = (completed: number, total: number) => void;

/**
 * Execute a batch of pending operations sequentially.
 * ADD before REMOVE per track. If ADD fails for a track, its REMOVE is skipped.
 */
export async function executeBatch(
	ops: PendingOp[],
	onProgress?: ProgressCallback,
): Promise<BatchResult> {
	const result: BatchResult = { succeeded: [], failed: [] };
	const failedTrackIds = new Set<string>();

	// Group ops by track: adds first, then removes
	const adds = ops.filter((op) => op.type === "add");
	const removes = ops.filter((op) => op.type === "remove");
	const ordered = [...adds, ...removes];

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
