// src/triage/ApplyBar.tsx — Fixed bottom bar with apply action

import type { PendingOp } from "./state";
import { summarizeOps } from "./summarizeOps";

export function ApplyBar({
	pendingOps,
	disabled = false,
	onApply,
}: {
	pendingOps: PendingOp[];
	disabled?: boolean;
	onApply: () => void;
}) {
	if (pendingOps.length === 0) return null;

	const summary = summarizeOps(pendingOps);

	return (
		<div class="bg-app-surface/95 backdrop-blur border-t border-white/[0.08] py-3 px-6 flex items-center justify-between animate-slide-up">
			<span class="text-app-text text-[13px]">{summary}</span>
			<button
				type="button"
				onClick={disabled ? undefined : onApply}
				disabled={disabled}
				class={`font-bold py-2.5 px-6 rounded text-[13px] transition-colors ${
					disabled
						? "bg-accent/40 text-black/50 cursor-not-allowed"
						: "bg-accent hover:bg-accent/85 text-black cursor-pointer"
				}`}
			>
				Apply Changes
			</button>
		</div>
	);
}
