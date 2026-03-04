// src/triage/ReviewModal.tsx — Confirmation, progress, and completion states

import { useSignal } from "@preact/signals";
import { type BatchResult, executeBatch } from "./batch";
import type { PendingOp } from "./state";

type ModalState =
	| { phase: "review" }
	| { phase: "progress"; completed: number; total: number }
	| { phase: "done"; result: BatchResult };

export function ReviewModal({
	pendingOps,
	onClose,
	onComplete,
}: {
	pendingOps: PendingOp[];
	onClose: () => void;
	onComplete: (result: BatchResult) => void;
}) {
	const state = useSignal<ModalState>({ phase: "review" });

	const handleApply = async () => {
		const total = pendingOps.length;
		state.value = { phase: "progress", completed: 0, total };

		const result = await executeBatch(pendingOps, (completed, t) => {
			state.value = { phase: "progress", completed, total: t };
		});

		state.value = { phase: "done", result };
		onComplete(result);
	};

	const handleRetry = async () => {
		const current = state.value;
		if (current.phase !== "done") return;

		const failedOps = current.result.failed.map((f) => f.op);
		const total = failedOps.length;
		state.value = { phase: "progress", completed: 0, total };

		const result = await executeBatch(failedOps, (completed, t) => {
			state.value = { phase: "progress", completed, total: t };
		});

		// Merge with previous successes
		const allSucceeded = [...current.result.succeeded, ...result.succeeded];
		state.value = { phase: "done", result: { succeeded: allSucceeded, failed: result.failed } };
		onComplete({ succeeded: allSucceeded, failed: result.failed });
	};

	const addCount = pendingOps.filter((op) => op.type === "add").length;
	const removeCount = pendingOps.filter((op) => op.type === "remove").length;

	return (
		<div
			role="dialog"
			aria-modal="true"
			class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget && state.value.phase === "review") onClose();
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape" && state.value.phase === "review") onClose();
			}}
		>
			<div class="bg-app-surface rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
				{state.value.phase === "review" && (
					<ReviewContent
						pendingOps={pendingOps}
						addCount={addCount}
						removeCount={removeCount}
						onCancel={onClose}
						onApply={handleApply}
					/>
				)}

				{state.value.phase === "progress" && (
					<ProgressContent completed={state.value.completed} total={state.value.total} />
				)}

				{state.value.phase === "done" && (
					<DoneContent result={state.value.result} onDone={onClose} onRetry={handleRetry} />
				)}
			</div>
		</div>
	);
}

function ReviewContent({
	pendingOps,
	addCount,
	removeCount,
	onCancel,
	onApply,
}: {
	pendingOps: PendingOp[];
	addCount: number;
	removeCount: number;
	onCancel: () => void;
	onApply: () => void;
}) {
	const parts: string[] = [];
	if (addCount > 0) parts.push(`${addCount} replacement${addCount !== 1 ? "s" : ""}`);
	if (removeCount > 0) parts.push(`${removeCount} removal${removeCount !== 1 ? "s" : ""}`);

	return (
		<>
			<div class="p-5 border-b border-white/[0.08]">
				<h2 class="text-app-text text-lg font-bold">Review Changes</h2>
				<p class="text-app-muted text-[12px] mt-1">
					{parts.join(" + ")} — these changes will modify your Spotify library.
				</p>
			</div>

			<div class="flex-1 overflow-y-auto p-5">
				{pendingOps.map((op, i) => (
					<div key={`${op.trackId}-${op.type}-${i}`} class="flex items-center gap-2 py-2">
						<span
							class={`text-[10px] font-bold px-2 py-0.5 rounded ${
								op.type === "add" ? "bg-accent/20 text-accent" : "bg-app-error/20 text-app-error"
							}`}
						>
							{op.type === "add" ? "ADD" : "REMOVE"}
						</span>
						<div class="flex-1 min-w-0">
							<p class="text-app-text text-[12px] truncate">
								{op.type === "add" ? op.candidateName : op.trackName}
							</p>
							<p class="text-app-muted text-[10px] truncate">
								{op.type === "add" ? `→ ${op.source}` : `from ${op.source}`}
							</p>
						</div>
						{op.confidence && (
							<span class="text-amber-400 text-[10px] shrink-0">{"★".repeat(op.confidence)}</span>
						)}
					</div>
				))}
			</div>

			<div class="p-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					class="text-app-muted hover:text-app-text text-[13px] cursor-pointer transition-colors px-4 py-2"
				>
					Cancel
				</button>
				<button
					type="button"
					onClick={onApply}
					class="bg-accent hover:bg-accent/85 text-black font-bold py-2.5 px-6 rounded text-[13px] transition-colors cursor-pointer"
				>
					Apply {pendingOps.length} changes
				</button>
			</div>
		</>
	);
}

function ProgressContent({ completed, total }: { completed: number; total: number }) {
	const pct = total > 0 ? (completed / total) * 100 : 0;

	return (
		<div class="p-8 flex flex-col items-center gap-4">
			<div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
			<p class="text-app-text text-[14px]">
				Applying... {completed}/{total}
			</p>
			<div class="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
				<div
					class="h-full bg-accent rounded-full transition-all duration-300"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

function DoneContent({
	result,
	onDone,
	onRetry,
}: {
	result: BatchResult;
	onDone: () => void;
	onRetry: () => void;
}) {
	const allGood = result.failed.length === 0;

	return (
		<div class="p-8 flex flex-col items-center gap-4">
			{allGood ? (
				<>
					<span class="text-accent text-4xl">✓</span>
					<p class="text-app-text text-[16px] font-bold">All changes applied!</p>
					<p class="text-app-muted text-[13px]">{result.succeeded.length} changes applied</p>
				</>
			) : (
				<>
					<span class="text-app-error text-4xl">!</span>
					<p class="text-app-text text-[16px] font-bold">
						{result.succeeded.length}/{result.succeeded.length + result.failed.length} changes
						applied. {result.failed.length} failed.
					</p>
					<div class="w-full max-h-40 overflow-y-auto">
						{result.failed.map((f, i) => (
							<div key={`fail-${i}`} class="text-[11px] text-app-error/80 py-1">
								{f.op.type === "add" ? "ADD" : "REMOVE"} {f.op.trackName}: {f.error}
							</div>
						))}
					</div>
				</>
			)}

			<div class="flex gap-3 mt-2">
				{!allGood && (
					<button
						type="button"
						onClick={onRetry}
						class="text-accent hover:text-accent/80 text-[13px] cursor-pointer transition-colors px-4 py-2"
					>
						Retry failed
					</button>
				)}
				<button
					type="button"
					onClick={onDone}
					class="bg-accent hover:bg-accent/85 text-black font-bold py-2.5 px-6 rounded text-[13px] transition-colors cursor-pointer"
				>
					Done
				</button>
			</div>
		</div>
	);
}
