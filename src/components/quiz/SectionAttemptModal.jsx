import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { get } from '../../lib/api';
import { toast } from '../../stores/toastStore';
import { Button, Modal } from '../ui';
import InlineLatexText from './InlineLatexText';
import {
	groupQuestionsByApiSection,
	questionTypeLabel,
	questionsInScopeOrder,
	slimQuestionCatalog
} from './quizHelpers';

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

function sameId(a, b) {
	return a != null && b != null && String(a) === String(b);
}

function extractCatalogQuestions(payload) {
	if (!payload || typeof payload !== 'object') return [];
	const questions = payload.questions || payload.quiz?.questions || payload.data?.questions || [];
	return slimQuestionCatalog(questions);
}

const EMPTY_QUESTIONS = [];

const DEFAULT_PRESET_HINT =
	"Pre-selected from the section you're viewing — you can change the selection below.";

/**
 * Pre-attempt settings: sections (when present) and optional hand-picked questions.
 * onConfirm({ fullQuiz, sectionIds, shuffle?, sample?, questionIds?, studyMode? })
 *
 * initialSectionIds — when set, opens with only those sections checked (not "All").
 * highlightedSectionId — subtle hint for the section that drove the pre-selection.
 * presetHint — optional override for the preset helper line under Quick start.
 * quizId — used to hydrate per-section question_count and the question catalog.
 * questions — optional already-loaded stems (Quiz page / retake) to skip catalog fetch.
 * skipCountHydration — skip the full-quiz summary fetch (roadmap stub sections).
 * initialStudyMode — when true, opens with Study mode checked.
 */
export default function SectionAttemptModal({
	open,
	onClose,
	sections = [],
	questions: initialQuestions = EMPTY_QUESTIONS,
	quizTitle = 'Quiz',
	quizId = null,
	onConfirm,
	initialSectionIds = null,
	highlightedSectionId = null,
	presetHint = null,
	skipCountHydration = false,
	initialStudyMode = false
}) {
	const [hydratedSections, setHydratedSections] = useState(sections);
	const incomingCatalog = useMemo(() => slimQuestionCatalog(initialQuestions), [initialQuestions]);
	const [catalog, setCatalog] = useState(incomingCatalog);
	const [catalogLoading, setCatalogLoading] = useState(false);
	const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
	const [expandedIds, setExpandedIds] = useState([]);
	const [studyMode, setStudyMode] = useState(!!initialStudyMode);

	useEffect(() => {
		setHydratedSections(sections);
	}, [sections]);

	useEffect(() => {
		if (incomingCatalog.length) setCatalog(incomingCatalog);
	}, [incomingCatalog]);

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

	useEffect(() => {
		if (!open || !quizId) return;
		if (incomingCatalog.length) {
			setCatalogLoading(false);
			return;
		}

		let cancelled = false;
		setCatalogLoading(true);
		(async () => {
			try {
				const payload = await get(`/quizzes/quiz/${quizId}/?catalog=1`);
				if (cancelled) return;
				setCatalog(extractCatalogQuestions(payload));
			} catch {
				if (!cancelled) setCatalog([]);
			} finally {
				if (!cancelled) setCatalogLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [open, quizId, incomingCatalog]);

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
	const presetAppliedKey = useRef('');

	useEffect(() => {
		if (!open) {
			presetAppliedKey.current = '';
			setSelectedQuestionIds([]);
			setExpandedIds([]);
			return;
		}
		setStudyMode(!!initialStudyMode);
		if (focusId != null) {
			setExpandedIds((prev) =>
				prev.some((id) => sameId(id, focusId)) ? prev : [...prev, focusId]
			);
		}
	}, [open, focusId, initialStudyMode]);

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

	const activeSections = useMemo(() => {
		if (!hasSections) return [];
		return allSelected ? sorted : sorted.filter((section) => selected.includes(section.id));
	}, [hasSections, allSelected, sorted, selected]);

	const poolQuestions = useMemo(() => {
		if (!catalog.length) return [];
		if (!hasSections) return catalog;
		if (!activeSections.length) return [];
		const allowed = new Set(activeSections.map((section) => String(section.id)));
		return catalog.filter((q) => q.section != null && allowed.has(String(q.section)));
	}, [catalog, hasSections, activeSections]);

	useEffect(() => {
		if (!open || !hasSections || expandedIds.length || !activeSections.length) return;
		const first = activeSections[0]?.id;
		if (first != null) setExpandedIds([first]);
	}, [open, hasSections, expandedIds.length, activeSections]);

	const selectedQuestionCount = useMemo(() => {
		if (catalog.length) return poolQuestions.length;
		if (!hasSections) return null;
		if (!activeSections.length) return 0;
		let sum = 0;
		let known = 0;
		for (const section of activeSections) {
			const count = sectionQuestionCount(section);
			if (count == null) continue;
			sum += count;
			known += 1;
		}
		if (known === 0) return null;
		return sum;
	}, [catalog.length, poolQuestions.length, hasSections, activeSections]);

	const pickedInPool = useMemo(() => {
		const allowed = new Set(poolQuestions.map((q) => String(q.id)));
		return selectedQuestionIds.filter((id) => allowed.has(String(id)));
	}, [selectedQuestionIds, poolQuestions]);

	useEffect(() => {
		if (!open) return;
		const allowed = new Set(poolQuestions.map((q) => String(q.id)));
		setSelectedQuestionIds((prev) => {
			const next = prev.filter((id) => allowed.has(String(id)));
			return next.length === prev.length ? prev : next;
		});
	}, [open, poolQuestions]);

	const questionGroups = useMemo(
		() => groupQuestionsByApiSection(poolQuestions, hasSections ? activeSections : []),
		[poolQuestions, hasSections, activeSections]
	);

	const selectedSectionCount = allSelected ? sorted.length : selected.length;
	const isSubset = pickedInPool.length > 0 && pickedInPool.length < poolQuestions.length;

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

	const toggleExpanded = (id) => {
		setExpandedIds((prev) =>
			prev.some((item) => sameId(item, id))
				? prev.filter((item) => !sameId(item, id))
				: [...prev, id]
		);
	};

	const toggleQuestion = (id) => {
		setSelectedQuestionIds((prev) =>
			prev.some((item) => sameId(item, id))
				? prev.filter((item) => !sameId(item, id))
				: [...prev, id]
		);
	};

	const toggleSectionQuestions = (sectionQuestions) => {
		const ids = sectionQuestions.map((q) => q.id);
		setSelectedQuestionIds((prev) => {
			const allOn = ids.every((id) => prev.some((item) => sameId(item, id)));
			if (allOn) {
				return prev.filter((item) => !ids.some((id) => sameId(item, id)));
			}
			const next = [...prev];
			for (const id of ids) {
				if (!next.some((item) => sameId(item, id))) next.push(id);
			}
			return next;
		});
	};

	const canConfirm = !hasSections || allSelected || selected.length > 0;

	const confirmWith = (scope) => {
		onConfirm?.({ ...scope, studyMode });
		onClose?.();
	};

	const buildScopeFromSelection = () => {
		const base =
			hasSections && !allSelected && selected.length
				? { fullQuiz: false, sectionIds: selected }
				: { fullQuiz: true, sectionIds: [] };

		if (!isSubset) return base;

		const orderedIds = questionsInScopeOrder(poolQuestions, pickedInPool, sorted).map((q) => q.id);
		return { ...base, questionIds: orderedIds, sample: orderedIds.length };
	};

	const handleConfirm = () => {
		if (!canConfirm) return;
		confirmWith(buildScopeFromSelection());
	};

	const startRandomSection = () => {
		if (!allIds.length) return;
		const id = allIds[Math.floor(Math.random() * allIds.length)];
		confirmWith({ fullQuiz: false, sectionIds: [id] });
	};

	const startShuffledFull = () => {
		confirmWith({ fullQuiz: true, sectionIds: [], shuffle: true });
	};

	const startFocusedSection = () => {
		if (!focusId) return;
		confirmWith({ fullQuiz: false, sectionIds: [focusId] });
	};

	const startLabel = isSubset ? `Start ${pickedInPool.length}-question subset` : 'Start attempt';

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
						{startLabel}
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
				</>
			)}

			<div className="border-line bg-surface-2 mt-3 flex items-center justify-between gap-3 rounded-md border px-3 py-2.5">
				<p className="text-muted text-xs font-medium tracking-wide uppercase">Selection</p>
				<p className="text-fg text-sm tabular-nums">
					<span className="font-medium">
						{isSubset
							? `${pickedInPool.length} / ${poolQuestions.length} questions`
							: selectedQuestionCount != null
								? formatQuestionCount(selectedQuestionCount)
								: catalogLoading
									? 'Questions…'
									: 'Questions…'}
					</span>
					{hasSections && (
						<span className="text-muted">
							{' '}
							· {selectedSectionCount} section{selectedSectionCount === 1 ? '' : 's'}
						</span>
					)}
				</p>
			</div>

			<label className="border-line bg-surface-2 mt-3 flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5">
				<input
					type="checkbox"
					checked={studyMode}
					onChange={(event) => setStudyMode(event.target.checked)}
					className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
				/>
				<span className="min-w-0 flex-1">
					<span className="text-fg text-sm font-medium">Study mode</span>
					<span className="text-muted mt-0.5 block text-xs">
						Show or hide answers on any question while you work. Scored, but does not count toward
						roadmap mastery.
					</span>
				</span>
			</label>

			<QuestionPicker
				loading={catalogLoading}
				groups={questionGroups}
				hasSections={hasSections}
				pickedIds={pickedInPool}
				expandedIds={expandedIds}
				onToggleExpanded={toggleExpanded}
				onToggleQuestion={toggleQuestion}
				onToggleSectionQuestions={toggleSectionQuestions}
				onClear={() => setSelectedQuestionIds([])}
			/>
		</Modal>
	);
}

function QuestionPicker({
	loading,
	groups,
	hasSections,
	pickedIds,
	expandedIds,
	onToggleExpanded,
	onToggleQuestion,
	onToggleSectionQuestions,
	onClear
}) {
	const visibleGroups = groups.filter((group) => group.questions.length);
	if (loading && !visibleGroups.length) {
		return <p className="text-muted mt-3 text-xs">Loading questions…</p>;
	}
	if (!visibleGroups.length) return null;

	const pickedCount = pickedIds.length;

	return (
		<div className="border-line mt-3 rounded-md border p-3">
			<div className="mb-2 flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-fg text-xs font-medium tracking-wide uppercase">Questions</p>
					<p className="text-muted mt-1 text-xs">
						Leave unchecked to take every question in the selection. Checking some starts a subset
						attempt that does not count toward roadmap mastery.
					</p>
				</div>
				{pickedCount > 0 && (
					<Button type="button" variant="ghost" size="sm" onClick={onClear}>
						Clear
					</Button>
				)}
			</div>
			<ul className="space-y-2">
				{visibleGroups.map((group, index) => {
					const sectionId = group.section?.id ?? `flat-${index}`;
					const expanded = !hasSections || expandedIds.some((id) => sameId(id, sectionId));
					const selectedInGroup = group.questions.filter((q) =>
						pickedIds.some((id) => sameId(id, q.id))
					).length;
					const allOn = selectedInGroup === group.questions.length && group.questions.length > 0;
					const title = group.section?.title || 'Questions';
					return (
						<li key={sectionId} className="border-line rounded-md border">
							{hasSections ? (
								<div className="flex items-center gap-1 px-2 py-1.5">
									<button
										type="button"
										className="text-fg flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left text-sm"
										onClick={() => onToggleExpanded(sectionId)}
										aria-expanded={expanded}
									>
										{expanded ? (
											<ChevronDown size={16} className="text-muted shrink-0" />
										) : (
											<ChevronRight size={16} className="text-muted shrink-0" />
										)}
										<span className="min-w-0 flex-1 truncate font-medium">{title}</span>
										<span className="text-muted shrink-0 text-xs tabular-nums">
											{selectedInGroup
												? `${selectedInGroup} / ${group.questions.length}`
												: formatQuestionCount(group.questions.length)}
										</span>
									</button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => onToggleSectionQuestions(group.questions)}
									>
										{allOn ? 'Clear' : 'Select all'}
									</Button>
								</div>
							) : (
								<div className="flex items-center justify-end px-2 py-1">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => onToggleSectionQuestions(group.questions)}
									>
										{allOn ? 'Clear' : 'Select all'}
									</Button>
								</div>
							)}
							{expanded && (
								<ul className="border-line max-h-56 space-y-1 overflow-y-auto border-t px-2 py-2">
									{group.questions.map((question, questionIndex) => {
										const checked = pickedIds.some((id) => sameId(id, question.id));
										const typeLabel = question.question_type
											? questionTypeLabel(question.question_type)
											: null;
										return (
											<li key={question.id}>
												<label className="hover:bg-surface-2 flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5">
													<input
														type="checkbox"
														checked={checked}
														onChange={() => onToggleQuestion(question.id)}
														className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
													/>
													<span className="text-muted w-6 shrink-0 pt-0.5 text-xs tabular-nums">
														{questionIndex + 1}.
													</span>
													{String(question.question || '').trim() ? (
														<InlineLatexText
															text={question.question}
															as="span"
															className="text-fg line-clamp-2 min-w-0 flex-1 text-sm"
														/>
													) : (
														<span className="text-muted min-w-0 flex-1 text-sm italic">
															Untitled question
														</span>
													)}
													{typeLabel && (
														<span className="text-muted shrink-0 pt-0.5 text-[10px] tracking-wide uppercase">
															{typeLabel}
														</span>
													)}
												</label>
											</li>
										);
									})}
								</ul>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
