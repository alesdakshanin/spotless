// src/triage/ApplyBar.tsx — Fixed bottom bar with apply action

import type { PendingOp } from "./state";

export function ApplyBar({
	pendingOps,
	onApply,
}: {
	pendingOps: PendingOp[];
	onApply: () => void;
}) {
	if (pendingOps.length === 0) return null;

	const addCount = pendingOps.filter((op) => op.type === "add").length;
	const removeCount = pendingOps.filter((op) => op.type === "remove").length;

	const parts: string[] = [];
	if (addCount > 0) parts.push(`${addCount} replacement${addCount !== 1 ? "s" : ""}`);
	if (removeCount > 0) parts.push(`${removeCount} removal${removeCount !== 1 ? "s" : ""}`);
	const summary = parts.join(" + ");

	return (
		<div class="fixed bottom-0 left-0 right-0 bg-app-surface/95 backdrop-blur border-t border-white/[0.08] py-3 px-6 flex items-center justify-between z-50 animate-slide-up">
			<span class="text-app-text text-[13px]">{summary}</span>
			<button
				type="button"
				onClick={onApply}
				class="bg-accent hover:bg-accent/85 text-black font-bold py-2.5 px-6 rounded text-[13px] transition-colors cursor-pointer"
			>
				Apply Changes
			</button>
		</div>
	);
}
