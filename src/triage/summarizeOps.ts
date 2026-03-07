// src/triage/summarizeOps.ts — Track-level summary of pending operations

import type { PendingOp } from "./state";

export function summarizeOps(ops: PendingOp[]): string {
	const trackOps = new Map<string, { add: boolean; remove: boolean }>();
	for (const op of ops) {
		const entry = trackOps.get(op.trackId) ?? { add: false, remove: false };
		entry[op.type === "add" ? "add" : "remove"] = true;
		trackOps.set(op.trackId, entry);
	}

	let swapCount = 0;
	let addCount = 0;
	let removeCount = 0;
	for (const { add, remove } of trackOps.values()) {
		if (add && remove) swapCount++;
		else if (add) addCount++;
		else removeCount++;
	}

	const parts: string[] = [];
	if (swapCount > 0) parts.push(`${swapCount} swap${swapCount !== 1 ? "s" : ""}`);
	if (addCount > 0) parts.push(`${addCount} addition${addCount !== 1 ? "s" : ""}`);
	if (removeCount > 0) parts.push(`${removeCount} removal${removeCount !== 1 ? "s" : ""}`);
	return parts.join(" + ");
}
