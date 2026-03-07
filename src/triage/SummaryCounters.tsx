// src/triage/SummaryCounters.tsx — Live counters for swapping, removing, no match

import type { SectionCounts } from "./state";

export function SummaryCounters({ counts }: { counts: SectionCounts }) {
	return (
		<div class="flex items-center gap-1.5 text-[12px] mb-3">
			<span class="text-accent font-medium">{counts.swapping} swapping</span>
			<span class="text-app-muted/40">·</span>
			<span class="text-red-400 font-medium">{counts.removing} removing</span>
			<span class="text-app-muted/40">·</span>
			<span class="text-app-muted">{counts.noMatch} no match</span>
		</div>
	);
}
