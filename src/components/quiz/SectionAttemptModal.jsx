import { useEffect, useMemo, useRef, useState } from 'react';

import { get } from '../../lib/api';
import { toast } from '../../stores/toastStore';
import { Button, Input, Modal } from '../ui';

const DEFAULT_SAMPLE = 10;

function normalizeInitialIds(initialSectionIds, allIds) {
	if (!Array.isArray(initialSectionIds) || !initialSectionIds.length) return null;
	const byKey = new Map((allIds || []).map((id) => [String(id), id]));
	const next = [];
	for (const id of initialSectionIds) {
		if (id == null || id === '') continue;
		const match = byKey.get(String(id));
		if (match != null) next.push(match);
	}
	return next.length ? next : null;
}

function sectionNeedsCount(section) {
	return section?.question_count == null && section?.questions_count == null;
}

function sectionQuestionCount(section) {
	const raw = section?.question_count ?? section?.questions_count;
	const n = Number(raw);
	return Number.isFinite(n) ? n : null;
}

function mergeSectionCounts(sections, apiSections) {
	if (!Array.isArray(apiSections) || !apiSections.length) return sections;
	const byId = new Map(
		apiSections.filter((s) => s?.id != null).map((s) => [s.id, sectionQuestionCount(s)])
	);
	return sections.map((section) => {
		const count = byId.get(section.id) ?? byId.get(Number(section.id));
		if (count == null) return section;
		return { ...section, question_count: count };
	});
}

function mergeHydratedSections(prev, apiSections) {
	if (!Array.isArray(apiSections) || !apiSections.length) return prev;
	const prevList = Array.isArray(prev) ? prev : [];
	const prevIds = new Set(
		prevList.map((s) => String(s?.id)).filter((id) => id && id !== 'undefined')
	);
	const apiIds = new Set(
		apiSections.map((s) => String(s?.id)).filter((id) => id && id !== 'undefined')
	);
	const apiCoversPrev = prevIds.size > 0 && [...prevIds].every((id) => apiIds.has(id));
	// Replace when opening with a stub / empty list so the full quiz section set appears.
	if (!prevList.length || (prevList.length < apiSections.length && apiCoversPrev)) {
		return apiSections.map((section) => ({
			id: section.id,
			title: section.title,
			order: section.order,
			question_count: sectionQuestionCount(section)
		}));
	}
	return mergeSectionCounts(prevList, apiSections);
}

function formatQuestionCount(count) {
	if (count == null) return null;
	return `${count} question${count === 1 ? '' : 's'}`;
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
 * quizId — used to hydrate per-section question_count when callers omit it.
 * skipCountHydration — skip the full-quiz summary fetch (roadmap stub sections).
 */
export default function SectionAttemptModal({
	open,
	onClose,
	sections = [],
	quizTitle = 'Quiz',
	quizId = null,
	onConfirm,
	initialSectionIds = null,
	highlightedSectionId = null,
	presetHint = null,
	skipCountHydration = false
}) {
	const [hydratedSections, setHydratedSections] = useState(sections);

	useEffect(() => {
		setHydratedSections(sections);
	}, [sections]);

	useEffect(() => {
		if (!open || !quizId || skipCountHydration) return;
		const list = Array.isArray(sections) ? sections : [];
		const needsFullList = list.length === 0;
		const needsCounts = list.some(sectionNeedsCount);
		if (!needsFullList && !needsCounts) return;

		let cancelled = false;
		(async () => {
			try {
				let apiSections = null;
				try {
					const summary = await get(`/quizzes/quiz/summary/${quizId}/`);
					apiSections = summary?.quiz?.sections;
				} catch {
					const detail = await get(`/quizzes/quiz/${quizId}/`);
					apiSections = detail?.data?.sections || detail?.sections;
				}
				if (cancelled || !apiSections) return;
				setHydratedSections((prev) =>
					mergeHydratedSections(prev.length ? prev : list, apiSections)
				);
			} catch {
				/* keep titles without counts */
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [open, quizId, sections, skipCountHydration]);

	const sorted = useMemo(
		() =>
			[...(hydratedSections || [])].sort(
				(a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id ?? 0) - (b.id ?? 0)
			),
		[hydratedSections]
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
	const presetAppliedKey = useRef('');

	// Re-apply initialSectionIds when the section list hydrates; toast+close if none match.
	useEffect(() => {
		if (!open) {
			presetAppliedKey.current = '';
			return;
		}
		if (!Array.isArray(initialSectionIds) || !initialSectionIds.length) return;
		if (!allIds.length) return;

		const key = `${allIds.map(String).join(',')}|${initialSectionIds.map(String).join(',')}`;
		if (presetAppliedKey.current === key) return;
		presetAppliedKey.current = key;

		const matched = normalizeInitialIds(initialSectionIds, allIds);
		if (matched) {
			setSelected(matched);
			setAllSelected(false);
			return;
		}
		toast.error('That section is not on this quiz.');
		onClose?.();
	}, [open, allIds, initialSectionIds, onClose]);

	const totalQuestions = useMemo(() => {
		let sum = 0;
		let known = 0;
		for (const section of sorted) {
			const count = sectionQuestionCount(section);
			if (count == null) continue;
			sum += count;
			known += 1;
		}
		return known === sorted.length && sorted.length > 0 ? sum : null;
	}, [sorted]);

	const selectedQuestionCount = useMemo(() => {
		if (!hasSections) return null;
		const active = allSelected ? sorted : sorted.filter((section) => selected.includes(section.id));
		if (!active.length) return 0;
		let sum = 0;
		let known = 0;
		for (const section of active) {
			const count = sectionQuestionCount(section);
			if (count == null) continue;
			sum += count;
			known += 1;
		}
		if (known === 0) return null;
		return sum;
	}, [hasSections, allSelected, sorted, selected]);

	const selectedSectionCount = allSelected ? sorted.length : selected.length;

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
		if (!hasSections || allSelected) {
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
						<span className="text-fg min-w-0 flex-1 text-sm font-medium">All sections</span>
						{totalQuestions != null && (
							<span className="text-muted shrink-0 text-xs tabular-nums">
								{formatQuestionCount(totalQuestions)}
							</span>
						)}
					</label>

					<ul className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
						{sorted.map((section) => {
							const checked = allSelected || selected.includes(section.id);
							const isFocused = focusId != null && section.id === focusId;
							const countLabel = formatQuestionCount(sectionQuestionCount(section));
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
										{countLabel && (
											<span className="text-muted shrink-0 text-xs tabular-nums">{countLabel}</span>
										)}
									</label>
								</li>
							);
						})}
					</ul>

					<div className="border-line bg-surface-2 mt-3 flex items-center justify-between gap-3 rounded-md border px-3 py-2.5">
						<p className="text-muted text-xs font-medium tracking-wide uppercase">Selection</p>
						<p className="text-fg text-sm tabular-nums">
							<span className="font-medium">
								{selectedQuestionCount != null
									? formatQuestionCount(selectedQuestionCount)
									: 'Questions…'}
							</span>
							<span className="text-muted">
								{' '}
								· {selectedSectionCount} section{selectedSectionCount === 1 ? '' : 's'}
							</span>
						</p>
					</div>
				</>
			)}
		</Modal>
	);
}
