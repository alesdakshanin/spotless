// src/triage/summarizeOps.ts — Ops grouping and summary

import type { PendingOp } from "./state";

export interface GroupedTrackOps {
	add?: PendingOp;
	remove?: PendingOp;
}

export function groupOpsByTrack(ops: PendingOp[]): Map<string, GroupedTrackOps> {
	const grouped = new Map<string, GroupedTrackOps>();
	for (const op of ops) {
		const entry = grouped.get(op.trackId) ?? {};
		if (op.type === "add") entry.add = op;
		else entry.remove = op;
		grouped.set(op.trackId, entry);
	}
	return grouped;
}

export function summarizeOps(ops: PendingOp[]): string {
	const trackOps = groupOpsByTrack(ops);

	let replacingCount = 0;
	let removingCount = 0;
	for (const { add, remove } of trackOps.values()) {
		if (add && remove) replacingCount++;
		else if (remove) removingCount++;
	}

	const parts: string[] = [];
	if (replacingCount > 0) parts.push(`Replacing ${replacingCount}`);
	if (removingCount > 0) parts.push(`removing ${removingCount}`);
	return parts.join(", ");
}
