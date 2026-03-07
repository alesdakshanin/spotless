// src/triage/NoMatchSection.tsx — Section for tracks with no swap candidates

import type { SelectAllState, TriageStore, TriageTrack } from "./state";
import { deselectAllNoMatchSection, selectAllNoMatchSection } from "./state";
import { TrackRow } from "./TrackRow";

function SectionSelectAll({
	label,
	state,
	onToggle,
}: {
	label: string;
	state: SelectAllState;
	onToggle: () => void;
}) {
	return (
		<label class="flex items-center gap-2 py-2 px-1 border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.02] transition-colors">
			<input
				type="checkbox"
				class="sr-only"
				checked={state === "all"}
				ref={(el) => {
					if (el) el.indeterminate = state === "some";
				}}
				onChange={onToggle}
			/>
			<span
				class={`w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] shrink-0 ${
					state === "all"
						? "bg-red-500 border-red-500 text-white"
						: state === "some"
							? "bg-red-500/40 border-red-500 text-white"
							: "border-app-muted/50"
				}`}
			>
				{state === "all" ? "✓" : state === "some" ? "–" : ""}
			</span>
			<span class="text-app-muted text-[12px]">{label}</span>
		</label>
	);
}

export function NoMatchSection({
	store,
	tracks,
	expandedId,
}: {
	store: TriageStore;
	tracks: TriageTrack[];
	expandedId: string | null;
}) {
	const selectAll = store.noMatchSelectAllState.value;

	const handleToggle = () => {
		if (selectAll === "none" || selectAll === "some") {
			selectAllNoMatchSection(store);
		} else {
			deselectAllNoMatchSection(store);
		}
	};

	return (
		<div>
			<div class="text-app-muted/60 text-[10px] uppercase tracking-wider mt-4 mb-1 px-1">
				No swap found ({tracks.length})
			</div>
			<SectionSelectAll label="Select all for removal" state={selectAll} onToggle={handleToggle} />
			{tracks.map((t) => (
				<TrackRow
					key={t.id}
					triageTrack={t}
					store={store}
					isExpanded={expandedId === t.id}
					variant="removal"
				/>
			))}
		</div>
	);
}
