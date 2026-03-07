// src/triage/FilterBar.tsx — Filter chips and selection count

import type { Filter, FilterCounts, TriageStore } from "./state";
import { setFilter } from "./state";

interface FilterChip {
	id: Filter;
	label: string;
	count: number;
}

function chips(counts: FilterCounts): FilterChip[] {
	return [
		{ id: "all", label: "All", count: counts.all },
		{ id: "auto-proposed", label: "★★★ Auto-proposed", count: counts.autoProposed },
		{ id: "needs-review", label: "★★ Needs review", count: counts.needsReview },
		{ id: "no-match", label: "No match", count: counts.noMatch },
	];
}

export function FilterBar({ store }: { store: TriageStore }) {
	const activeFilter = store.filter.value;
	const counts = store.counts.value;
	const selectedCount = store.selectedCount.value;

	return (
		<div class="mb-4">
			<div class="flex items-center gap-2 flex-wrap">
				{chips(counts).map((chip) => (
					<button
						key={chip.id}
						type="button"
						onClick={() => setFilter(store, chip.id)}
						class={`px-3 py-1.5 rounded text-[12px] cursor-pointer transition-colors ${
							activeFilter === chip.id
								? "bg-accent/20 text-accent"
								: "bg-white/[0.06] text-app-muted hover:text-app-text hover:bg-white/[0.1]"
						}`}
					>
						{chip.label} ({chip.count})
					</button>
				))}
				<span class="ml-auto text-app-muted text-[12px]">{selectedCount} selected</span>
			</div>
		</div>
	);
}
