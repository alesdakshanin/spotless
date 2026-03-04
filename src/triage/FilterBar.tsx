// src/triage/FilterBar.tsx — Filter chips and selection count

import type { Filter, FilterCounts, SelectAllState, TriageStore } from "./state";
import { deselectAllVisible, selectAllVisible, setFilter } from "./state";

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
	const selectAll = store.selectAllState.value;

	return (
		<div class="mb-4">
			{/* Filter chips */}
			<div class="flex items-center gap-2 flex-wrap mb-3">
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

			{/* Select all */}
			<SelectAllControl selectAll={selectAll} store={store} />
		</div>
	);
}

function SelectAllControl({ selectAll, store }: { selectAll: SelectAllState; store: TriageStore }) {
	const handleClick = () => {
		if (selectAll === "none" || selectAll === "some") {
			selectAllVisible(store);
		} else {
			deselectAllVisible(store);
		}
	};

	return (
		<label class="flex items-center gap-2 py-2 px-1 border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.02] transition-colors">
			<input
				type="checkbox"
				class="sr-only"
				checked={selectAll === "all"}
				ref={(el) => {
					if (el) el.indeterminate = selectAll === "some";
				}}
				onChange={handleClick}
			/>
			<span
				class={`w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] shrink-0 ${
					selectAll === "all"
						? "bg-accent border-accent text-black"
						: selectAll === "some"
							? "bg-accent/40 border-accent text-black"
							: "border-app-muted/50"
				}`}
			>
				{selectAll === "all" ? "✓" : selectAll === "some" ? "–" : ""}
			</span>
			<span class="text-app-muted text-[12px]">Select all visible with candidates</span>
		</label>
	);
}
