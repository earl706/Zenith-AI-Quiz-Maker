import { useMemo, useState } from 'react';

import { Button, Input, Modal } from '../ui';

const DEFAULT_SAMPLE = 10;

function normalizeInitialIds(initialSectionIds, allIds) {
	if (!Array.isArray(initialSectionIds) || !initialSectionIds.length) return null;
	const allowed = new Set(allIds);
	const next = initialSectionIds.filter((id) => allowed.has(id));
	return next.length ? next : null;
}

const DEFAULT_PRESET_HINT =
	"Pre-selected from the section you're viewing — you can change the selection below.";

/**
 * Pre-attempt settings: sections (when present) and random modes.
 * onConfirm({ fullQuiz, sectionIds, shuffle?, sample? })
 *
 * initialSectionIds — when set, opens with only those sections checked (not "All").
 * highlightedSectionId — subtle hint for the section that drove the pre-selection.
 * presetHint — optional override for the preset helper line under Quick start.
 */
export default function SectionAttemptModal({
	open,
	onClose,
	sections = [],
	quizTitle = 'Quiz',
	onConfirm,
	initialSectionIds = null,
	highlightedSectionId = null,
	presetHint = null
}) {
	const sorted = useMemo(
		() =>
			[...(sections || [])].sort(
				(a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id ?? 0) - (b.id ?? 0)
			),
		[sections]
	);

	const hasSections = sorted.length > 0;
	const allIds = useMemo(() => sorted.map((s) => s.id).filter(Boolean), [sorted]);
	const presetIds = useMemo(
		() => normalizeInitialIds(initialSectionIds, allIds),
		[initialSectionIds, allIds]
	);
	const focusId = highlightedSectionId ?? presetIds?.[0] ?? null;

	const [selected, setSelected] = useState(() => presetIds ?? allIds);
	const [allSelected, setAllSelected] = useState(() => !presetIds);
	const [sampleCount, setSampleCount] = useState(String(DEFAULT_SAMPLE));

	const toggleAll = () => {
		if (allSelected) {
			setAllSelected(false);
			setSelected([]);
		} else {
			setAllSelected(true);
			setSelected(allIds);
		}
	};

	const toggleSection = (id) => {
		setAllSelected(false);
		setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const canConfirm = !hasSections || allSelected || selected.length > 0;

	const confirmWith = (scope) => {
		onConfirm?.(scope);
		onClose?.();
	};

	const handleConfirm = () => {
		if (!canConfirm) return;
		if (!hasSections || allSelected || selected.length === allIds.length) {
			confirmWith({ fullQuiz: true, sectionIds: [] });
		} else {
			confirmWith({ fullQuiz: false, sectionIds: selected });
		}
	};

	const startRandomSection = () => {
		if (!allIds.length) return;
		const id = allIds[Math.floor(Math.random() * allIds.length)];
		confirmWith({ fullQuiz: false, sectionIds: [id] });
	};

	const startShuffledFull = () => {
		confirmWith({ fullQuiz: true, sectionIds: [], shuffle: true });
	};

	const startRandomSubset = () => {
		const n = Number.parseInt(sampleCount, 10);
		const count = Number.isFinite(n) && n > 0 ? n : DEFAULT_SAMPLE;
		confirmWith({ fullQuiz: true, sectionIds: [], shuffle: true, sample: count });
	};

	const startFocusedSection = () => {
		if (!focusId) return;
		confirmWith({ fullQuiz: false, sectionIds: [focusId] });
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Start attempt"
			size="xl"
			footer={
				<>
					<Button variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button disabled={!canConfirm} onClick={handleConfirm}>
						Start attempt
					</Button>
				</>
			}
		>
			<p className="text-muted mb-4 text-sm">
				{hasSections ? (
					<>
						Select which parts of <span className="text-fg font-medium">{quizTitle}</span> to take.
					</>
				) : (
					<>
						Ready to take <span className="text-fg font-medium">{quizTitle}</span>.
					</>
				)}
			</p>

			{hasSections && (
				<>
					<div className="mb-4 space-y-2">
						<p className="text-fg text-xs font-medium tracking-wide uppercase">Quick start</p>
						<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
							{presetIds?.length === 1 && focusId && (
								<Button type="button" className="sm:flex-1" onClick={startFocusedSection}>
									Start this section
								</Button>
							)}
							<Button
								type="button"
								variant="secondary"
								className="sm:flex-1"
								disabled={!allIds.length}
								onClick={startRandomSection}
							>
								Random section
							</Button>
							<Button
								type="button"
								variant="secondary"
								className="sm:flex-1"
								onClick={startShuffledFull}
							>
								Full quiz (shuffled)
							</Button>
						</div>
						<div className="border-line flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-end">
							<div className="min-w-0 flex-1">
								<Input
									label="Random questions"
									type="number"
									min={1}
									value={sampleCount}
									onChange={(e) => setSampleCount(e.target.value)}
									placeholder={String(DEFAULT_SAMPLE)}
								/>
							</div>
							<Button type="button" variant="secondary" onClick={startRandomSubset}>
								Start subset
							</Button>
						</div>
					</div>

					{presetIds && (
						<p className="text-muted mb-2 text-xs">{presetHint || DEFAULT_PRESET_HINT}</p>
					)}

					<label className="border-line bg-surface-2 mb-3 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5">
						<input
							type="checkbox"
							checked={allSelected}
							onChange={toggleAll}
							className="h-4 w-4 accent-[var(--primary)]"
						/>
						<span className="text-fg text-sm font-medium">All sections</span>
					</label>

					<ul className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
						{sorted.map((section) => {
							const checked = allSelected || selected.includes(section.id);
							const isFocused = focusId != null && section.id === focusId;
							return (
								<li key={section.id} className="min-w-0">
									<label
										className={`border-line hover:bg-surface-2 flex h-full cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition ${
											isFocused ? 'border-primary/40 bg-primary/6 ring-primary/25 ring-1' : ''
										}`}
									>
										<input
											type="checkbox"
											checked={checked}
											disabled={allSelected}
											onChange={() => toggleSection(section.id)}
											className="h-4 w-4 shrink-0 accent-[var(--primary)]"
										/>
										<span className="text-fg min-w-0 flex-1 truncate text-sm">{section.title}</span>
										{section.question_count != null && (
											<span className="text-muted shrink-0 text-xs">
												{section.question_count} Q
											</span>
										)}
									</label>
								</li>
							);
						})}
					</ul>
				</>
			)}
		</Modal>
	);
}
