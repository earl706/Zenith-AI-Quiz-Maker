import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, Map, RefreshCw, Sparkles, Trash2 } from 'lucide-react';

import { get } from '../lib/api';
import { cn, formatDate } from '../lib/format';
import {
	buildCapacityPayload,
	DEFAULT_ESTIMATED_MINUTES,
	DEFAULT_HOURS_PER_DAY,
	DEFAULT_HOURS_PER_WEEK,
	DEFAULT_STUDY_DAYS,
	formatDuration,
	formatMinutes,
	toastIfDeadlineExtended
} from '../lib/roadmapCapacity';
import {
	roadmapsApi,
	useBulkRoadmapMastery,
	useForkRoadmap,
	useForkRoadmapFromQuiz,
	usePatchRoadmapNode,
	useResetRoadmapSchedule,
	useResyncRoadmap
} from '../lib/studyResources';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import {
	Badge,
	Button,
	Card,
	CardBody,
	CardHeader,
	EmptyState,
	Input,
	LoadingScreen,
	Modal,
	ProgressRing,
	Select,
	StatCard
} from '../components/ui';
import { useAttemptLauncher } from '../components/quiz/useAttemptLauncher';
import { ToggleChip } from '../components/quiz/quizAuthoringUi';
import RoadmapCapacityFields from '../components/roadmap/RoadmapCapacityFields';
import RoadmapCapacityStrip from '../components/roadmap/RoadmapCapacityStrip';
import RoadmapNodeCard, {
	launchNodeSectionAttempt,
	resolveNodeQuizUuid
} from '../components/roadmap/RoadmapNodeCard';
import { paginateClient } from '../hooks/useListControls';

const PATH_PAGE_SIZE = 9;
const TODAY_PAGE_SIZE = 4;
const WEEK_PAGE_SIZE = 1;

const MOBILE_TABS = [
	{ id: 'path', label: 'Path' },
	{ id: 'today', label: 'Today' },
	{ id: 'week', label: 'Week' }
];

function listUnlinkedQuizHint() {
	toast.error(
		'No matching owner quiz for this roadmap. Create the quiz from Templates, or create the roadmap from My quiz so View/Attempt can link.'
	);
}

function RoadmapListCard({
	roadmap,
	onOpen,
	onDelete,
	onEditNode,
	onViewQuiz,
	onAttemptSection,
	onPrefetch
}) {
	const percent = roadmap.progress?.percent || 0;
	const preview = roadmap.preview_node;
	const sourceQuizUuid = roadmap.linked_quiz_uuid || roadmap.source_quiz_uuid;
	return (
		<Card
			className="cursor-pointer transition-colors hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--line))]"
			onClick={onOpen}
			onPointerEnter={onPrefetch}
			onFocus={onPrefetch}
		>
			<div className="space-y-3 p-5">
				<div className="flex items-center gap-3">
					<ProgressRing
						value={percent}
						size={48}
						stroke={5}
						tone="primary"
						label={`${Math.round(percent)}`}
					/>
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0">
								<h3 className="text-fg truncate font-semibold">{roadmap.title}</h3>
								<p className="text-muted mt-0.5 text-xs">
									{roadmap.progress?.mastered}/{roadmap.progress?.total} nodes mastered
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-1">
								{roadmap.deadline ? (
									<Badge tone="warning">{formatDate(roadmap.deadline, 'dd/MM/yyyy')}</Badge>
								) : null}
								<Button
									size="icon"
									variant="ghost"
									className="text-danger h-8 w-8"
									title="Delete roadmap"
									aria-label="Delete roadmap"
									onClick={(e) => {
										e.stopPropagation();
										onDelete();
									}}
								>
									<Trash2 size={14} />
								</Button>
							</div>
						</div>
					</div>
				</div>
				<div onClick={(e) => e.stopPropagation()}>
					{preview ? (
						<>
							<p className="text-muted mb-1 text-[10px] font-medium tracking-wide uppercase">
								{preview.overdue ? 'Longest overdue' : 'Due today'}
							</p>
							<RoadmapNodeCard
								node={preview}
								compact
								sourceQuizUuid={sourceQuizUuid}
								onEdit={() => onEditNode(preview)}
								onViewQuiz={() => onViewQuiz(preview, sourceQuizUuid)}
								onAttemptSection={() => onAttemptSection(preview, sourceQuizUuid)}
								onUnlinkedQuiz={listUnlinkedQuizHint}
							/>
						</>
					) : (
						<p className="text-muted text-xs">Nothing due today — you may be ahead or done.</p>
					)}
				</div>
			</div>
		</Card>
	);
}

function CompactPager({ page, totalPages, count, pageSize, onPageChange }) {
	if (count <= pageSize) return null;
	const from = (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, count);
	return (
		<div className="flex shrink-0 items-center justify-between gap-2 pt-1">
			<p className="text-muted text-[10px] tabular-nums">
				{from}–{to} of {count}
			</p>
			<div className="flex items-center gap-1">
				<Button
					size="sm"
					variant="ghost"
					className="h-7 px-2 text-xs"
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}
				>
					Prev
				</Button>
				<span className="text-muted text-[10px] tabular-nums">
					{page}/{totalPages}
				</span>
				<Button
					size="sm"
					variant="ghost"
					className="h-7 px-2 text-xs"
					disabled={page >= totalPages}
					onClick={() => onPageChange(page + 1)}
				>
					Next
				</Button>
			</div>
		</div>
	);
}

function useClampedPage(page, setPage, paged) {
	useEffect(() => {
		if (page !== paged.page) setPage(paged.page);
	}, [page, paged.page, setPage]);
}

function WeekPanel({ week, onEdit, sourceQuizUuid, onViewQuiz, onAttemptSection }) {
	if (!week) {
		return <p className="text-muted text-xs">No schedule yet.</p>;
	}
	const visibleDays = week.days.filter((d) => d.is_today || (d.nodes || []).length > 0);
	return (
		<div className="border-line rounded border px-2 py-1.5">
			<p className="text-fg truncate text-xs leading-tight font-medium">
				Week {week.week_index}
				{week.is_current ? ' · current' : ''}
				<span className="text-muted font-normal">
					{' '}
					· {formatDate(week.start, 'MMM d')} – {formatDate(week.end, 'MMM d')}
				</span>
			</p>
			<div className="mt-1 space-y-1 overflow-y-auto">
				{visibleDays.map((d) => (
					<div
						key={d.date}
						className={`space-y-0.5 ${d.is_today ? 'rounded bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] px-1 py-0.5' : ''}`}
					>
						<p className="text-muted text-[10px] leading-tight font-medium tracking-wide uppercase">
							{formatDate(d.date, 'EEE MMM d')}
							{d.is_today ? ' · today' : d.is_past ? ' · past' : ''}
							{d.planned_minutes ? ` · ${formatMinutes(d.planned_minutes)}` : ''}
						</p>
						{(d.nodes || []).length ? (
							(d.nodes || []).map((n) => (
								<RoadmapNodeCard
									key={n.id}
									node={n}
									onEdit={onEdit}
									compact
									sourceQuizUuid={sourceQuizUuid}
									onViewQuiz={onViewQuiz}
									onAttemptSection={onAttemptSection}
								/>
							))
						) : (
							<p className="text-muted text-[10px] leading-tight">No sections due</p>
						)}
					</div>
				))}
				{!visibleDays.length && <p className="text-muted text-[10px]">No sections this week</p>}
			</div>
		</div>
	);
}

function parseMasteryGates(attemptsStr, accuracyStr) {
	const mastery_attempts_required = Number.parseInt(attemptsStr, 10);
	const mastery_accuracy_threshold = Number.parseInt(accuracyStr, 10);
	if (!Number.isFinite(mastery_attempts_required) || mastery_attempts_required < 1) {
		return { error: 'Attempts required must be at least 1.' };
	}
	if (mastery_attempts_required > 50) {
		return { error: 'Attempts required must be 50 or fewer.' };
	}
	if (
		!Number.isFinite(mastery_accuracy_threshold) ||
		mastery_accuracy_threshold < 0 ||
		mastery_accuracy_threshold > 100
	) {
		return { error: 'Accuracy must be between 0 and 100.' };
	}
	return { mastery_attempts_required, mastery_accuracy_threshold };
}

function masteryGateError(err) {
	const data = err?.response?.data;
	return (
		data?.mastery_attempts_required?.[0] ||
		data?.mastery_accuracy_threshold?.[0] ||
		data?.require_flashcard?.[0] ||
		data?.require_random_question_order?.[0] ||
		data?.require_per_question_timer?.[0] ||
		data?.detail ||
		'Could not update mastery requirements.'
	);
}

function AttemptSettingsToggles({
	requireFlashcard,
	setRequireFlashcard,
	requireRandomOrder,
	setRequireRandomOrder,
	requireTimer,
	setRequireTimer
}) {
	return (
		<div className="space-y-1.5">
			<p className="text-muted text-xs">
				Qualifying attempts only count when the quiz has these settings on.
			</p>
			<div className="flex flex-wrap gap-1.5">
				<ToggleChip
					active={requireFlashcard}
					onClick={() => setRequireFlashcard(!requireFlashcard)}
				>
					Flashcard
				</ToggleChip>
				<ToggleChip
					active={requireRandomOrder}
					onClick={() => setRequireRandomOrder(!requireRandomOrder)}
				>
					Shuffle questions
				</ToggleChip>
				<ToggleChip active={requireTimer} onClick={() => setRequireTimer(!requireTimer)}>
					Per-question timer
				</ToggleChip>
			</div>
		</div>
	);
}

/** Group daily_plan.days into week buckets (7 days), preserving per-day dues. */
function groupDaysIntoWeeks(days = []) {
	if (!days.length) return [];
	const weeks = [];
	for (let i = 0; i < days.length; i += 7) {
		const chunk = days.slice(i, i + 7);
		weeks.push({
			week_index: weeks.length + 1,
			start: chunk[0].date,
			end: chunk[chunk.length - 1].date,
			is_current: chunk.some((d) => d.is_today),
			days: chunk
		});
	}
	return weeks;
}

function ForkModal({ open, onClose, catalog, quizSources }) {
	const forkTemplate = useForkRoadmap();
	const forkQuiz = useForkRoadmapFromQuiz();
	const [source, setSource] = useState('template'); // template | quiz
	const [slug, setSlug] = useState('');
	const [quizUuid, setQuizUuid] = useState('');
	const [deadline, setDeadline] = useState('');
	const [title, setTitle] = useState('');
	const [hoursPerWeek, setHoursPerWeek] = useState(DEFAULT_HOURS_PER_WEEK);
	const [hoursPerDay, setHoursPerDay] = useState(DEFAULT_HOURS_PER_DAY);
	const [studyDays, setStudyDays] = useState(DEFAULT_STUDY_DAYS);
	const [defaultEstimatedMinutes, setDefaultEstimatedMinutes] = useState(DEFAULT_ESTIMATED_MINUTES);
	const [sectionEstimates, setSectionEstimates] = useState({});

	const selectedTemplate = catalog.find((c) => c.slug === slug);
	const selectedQuiz = quizSources.find((q) => q.uuid === quizUuid);
	const selectedSections =
		source === 'template' ? selectedTemplate?.sections || [] : selectedQuiz?.sections || [];
	const pending = forkTemplate.isPending || forkQuiz.isPending;

	useEffect(() => {
		if (!open) return;
		setSource('template');
		setSlug('');
		setQuizUuid('');
		setDeadline('');
		setTitle('');
		setHoursPerWeek(DEFAULT_HOURS_PER_WEEK);
		setHoursPerDay(DEFAULT_HOURS_PER_DAY);
		setStudyDays(DEFAULT_STUDY_DAYS);
		setDefaultEstimatedMinutes(DEFAULT_ESTIMATED_MINUTES);
		setSectionEstimates({});
	}, [open]);

	useEffect(() => {
		setSectionEstimates({});
	}, [slug, quizUuid, source]);

	const capacityBody = () =>
		buildCapacityPayload({
			hoursPerWeek,
			hoursPerDay,
			studyDays,
			defaultEstimatedMinutes,
			sectionEstimates,
			sections: selectedSections
		});

	const submit = () => {
		if (source === 'template') {
			if (!slug) return;
			forkTemplate.mutate(
				{
					template_slug: slug,
					deadline: deadline || null,
					title: title || undefined,
					...capacityBody()
				},
				{
					onSuccess: (data) => {
						toast.success('Roadmap created from template.');
						toastIfDeadlineExtended(data, toast);
						onClose();
					},
					onError: (err) => toast.error(err.response?.data?.detail || 'Could not fork roadmap.')
				}
			);
			return;
		}
		if (!quizUuid) return;
		forkQuiz.mutate(
			{
				quiz_uuid: quizUuid,
				deadline: deadline || null,
				title: title || undefined,
				...capacityBody()
			},
			{
				onSuccess: (data) => {
					toast.success('Roadmap created from quiz.');
					toastIfDeadlineExtended(data, toast);
					onClose();
				},
				onError: (err) =>
					toast.error(err.response?.data?.detail || 'Could not create roadmap from quiz.')
			}
		);
	};

	const hint =
		source === 'template' && selectedTemplate
			? `Creates a step per section with prerequisites in order. Mastery default: ${selectedTemplate.default_mastery_attempts}× ≥${selectedTemplate.default_mastery_accuracy}%.`
			: source === 'quiz' && selectedQuiz
				? `Creates a step per section with prerequisites in order. Mastery default: ${selectedQuiz.default_mastery_attempts}× ≥${selectedQuiz.default_mastery_accuracy}%.`
				: source === 'quiz' && quizSources.length === 0
					? 'No quizzes with sections yet. Add sections to a quiz, then create a roadmap.'
					: null;

	const canSubmit = source === 'template' ? Boolean(slug) : Boolean(quizUuid);

	return (
		<Modal open={open} onClose={onClose} title="Create a mastery roadmap" size="lg">
			<div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
				<div className="border-line flex gap-1 rounded-md border p-0.5">
					<button
						type="button"
						onClick={() => setSource('template')}
						className={cn(
							'flex-1 cursor-pointer rounded px-2 py-1.5 text-xs font-medium transition-colors',
							source === 'template' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-fg'
						)}
					>
						Template
					</button>
					<button
						type="button"
						onClick={() => setSource('quiz')}
						className={cn(
							'flex-1 cursor-pointer rounded px-2 py-1.5 text-xs font-medium transition-colors',
							source === 'quiz' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-fg'
						)}
					>
						My quiz
					</button>
				</div>
				{source === 'template' ? (
					<Select label="Template" value={slug} onChange={(e) => setSlug(e.target.value)}>
						<option value="">Select a quiz template…</option>
						{catalog.map((c) => (
							<option key={c.slug} value={c.slug}>
								{c.title} ({c.section_count} sections)
							</option>
						))}
					</Select>
				) : (
					<Select label="Quiz" value={quizUuid} onChange={(e) => setQuizUuid(e.target.value)}>
						<option value="">Select a quiz with sections…</option>
						{quizSources.map((q) => (
							<option key={q.uuid} value={q.uuid}>
								{q.title} ({q.section_count} sections)
							</option>
						))}
					</Select>
				)}
				{hint && <p className="text-muted text-sm">{hint}</p>}
				<Input
					label="Custom title (optional)"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>
				<Input
					label="Deadline"
					type="date"
					value={deadline}
					onChange={(e) => setDeadline(e.target.value)}
				/>
				<RoadmapCapacityFields
					hoursPerWeek={hoursPerWeek}
					onHoursPerWeek={setHoursPerWeek}
					hoursPerDay={hoursPerDay}
					onHoursPerDay={setHoursPerDay}
					studyDays={studyDays}
					onStudyDays={setStudyDays}
					defaultEstimatedMinutes={defaultEstimatedMinutes}
					onDefaultEstimatedMinutes={setDefaultEstimatedMinutes}
					sectionEstimates={sectionEstimates}
					onSectionEstimate={(key, value) =>
						setSectionEstimates((prev) => ({ ...prev, [key]: value }))
					}
					sections={selectedSections}
				/>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={submit} disabled={!canSubmit || pending} loading={pending}>
						{source === 'template' ? 'Fork roadmap' : 'Create roadmap'}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

function NodeMasteryModal({ open, onClose, roadmapId, node }) {
	const patchNode = usePatchRoadmapNode();
	const [attempts, setAttempts] = useState('2');
	const [accuracy, setAccuracy] = useState('80');
	const [requireFlashcard, setRequireFlashcard] = useState(true);
	const [requireRandomOrder, setRequireRandomOrder] = useState(true);
	const [requireTimer, setRequireTimer] = useState(true);
	const [estimatedMinutes, setEstimatedMinutes] = useState(DEFAULT_ESTIMATED_MINUTES);
	const [dueDate, setDueDate] = useState('');
	const [manualDue, setManualDue] = useState(false);

	useEffect(() => {
		if (!open || !node) return;
		setAttempts(String(node.mastery_attempts_required ?? 2));
		setAccuracy(String(node.mastery_accuracy_threshold ?? 80));
		setRequireFlashcard(node.require_flashcard !== false);
		setRequireRandomOrder(node.require_random_question_order !== false);
		setRequireTimer(node.require_per_question_timer !== false);
		setEstimatedMinutes(String(node.estimated_minutes ?? 30));
		setDueDate(node.due_date ? String(node.due_date).slice(0, 10) : '');
		setManualDue(!!node.due_date_override);
	}, [open, node]);

	const save = () => {
		if (!node || roadmapId == null) return;
		const parsed = parseMasteryGates(attempts, accuracy);
		if (parsed.error) {
			toast.error(parsed.error);
			return;
		}
		const est = Number.parseInt(estimatedMinutes, 10);
		if (!Number.isFinite(est) || est < 1 || est > 1440) {
			toast.error('Estimated minutes must be between 1 and 1440.');
			return;
		}
		const body = {
			roadmapId,
			nodeId: node.id,
			mastery_attempts_required: parsed.mastery_attempts_required,
			mastery_accuracy_threshold: parsed.mastery_accuracy_threshold,
			require_flashcard: requireFlashcard,
			require_random_question_order: requireRandomOrder,
			require_per_question_timer: requireTimer,
			estimated_minutes: est,
			due_date: dueDate || null,
			due_date_override: manualDue && !!dueDate
		};
		patchNode.mutate(body, {
			onSuccess: () => {
				toast.success('Section schedule updated.');
				onClose();
			},
			onError: (err) => toast.error(masteryGateError(err))
		});
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Edit section requirements"
			size="sm"
			footer={
				<>
					<Button variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button loading={patchNode.isPending} onClick={save}>
						Save
					</Button>
				</>
			}
		>
			<div className="space-y-3">
				<p className="text-fg text-sm font-medium">{node?.title}</p>
				<p className="text-muted text-xs">
					Master after enough qualifying attempts at or above the accuracy gate. Current progress:{' '}
					{node?.qualifying_attempts ?? 0} qualifying
					{node?.spent_seconds != null ? ` · spent ${formatDuration(node.spent_seconds)}` : ''}.
				</p>
				<div className="grid grid-cols-2 gap-3">
					<Input
						label="Attempts required"
						type="number"
						min={1}
						max={50}
						value={attempts}
						onChange={(e) => setAttempts(e.target.value)}
					/>
					<Input
						label="Accuracy ≥ %"
						type="number"
						min={0}
						max={100}
						value={accuracy}
						onChange={(e) => setAccuracy(e.target.value)}
					/>
				</div>
				<AttemptSettingsToggles
					requireFlashcard={requireFlashcard}
					setRequireFlashcard={setRequireFlashcard}
					requireRandomOrder={requireRandomOrder}
					setRequireRandomOrder={setRequireRandomOrder}
					requireTimer={requireTimer}
					setRequireTimer={setRequireTimer}
				/>
				<Input
					label="Estimated minutes"
					type="number"
					min={1}
					max={1440}
					value={estimatedMinutes}
					onChange={(e) => setEstimatedMinutes(e.target.value)}
				/>
				<Input
					label="Due date"
					type="date"
					value={dueDate}
					onChange={(e) => {
						setDueDate(e.target.value);
						if (e.target.value) setManualDue(true);
					}}
				/>
				<label className="text-muted flex cursor-pointer items-center gap-2 text-xs">
					<input
						type="checkbox"
						checked={manualDue}
						onChange={(e) => setManualDue(e.target.checked)}
						className="accent-primary"
					/>
					Keep this due date (don&apos;t move on Reset schedule)
				</label>
			</div>
		</Modal>
	);
}

function BulkMasteryModal({ open, onClose, roadmap }) {
	const bulk = useBulkRoadmapMastery();
	const nodeCount = roadmap?.nodes?.length ?? 0;
	const [attempts, setAttempts] = useState('2');
	const [accuracy, setAccuracy] = useState('80');
	const [requireFlashcard, setRequireFlashcard] = useState(true);
	const [requireRandomOrder, setRequireRandomOrder] = useState(true);
	const [requireTimer, setRequireTimer] = useState(true);

	useEffect(() => {
		if (!open || !roadmap?.nodes?.length) return;
		const first = roadmap.nodes[0];
		setAttempts(String(first.mastery_attempts_required ?? 2));
		setAccuracy(String(first.mastery_accuracy_threshold ?? 80));
		setRequireFlashcard(first.require_flashcard !== false);
		setRequireRandomOrder(first.require_random_question_order !== false);
		setRequireTimer(first.require_per_question_timer !== false);
	}, [open, roadmap]);

	const save = () => {
		if (roadmap?.id == null) return;
		const parsed = parseMasteryGates(attempts, accuracy);
		if (parsed.error) {
			toast.error(parsed.error);
			return;
		}
		bulk.mutate(
			{
				roadmapId: roadmap.id,
				mastery_attempts_required: parsed.mastery_attempts_required,
				mastery_accuracy_threshold: parsed.mastery_accuracy_threshold,
				require_flashcard: requireFlashcard,
				require_random_question_order: requireRandomOrder,
				require_per_question_timer: requireTimer
			},
			{
				onSuccess: () => {
					toast.success(`Mastery gates set for all ${nodeCount} sections.`);
					onClose();
				},
				onError: (err) => toast.error(masteryGateError(err))
			}
		);
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Set all mastery gates"
			size="sm"
			footer={
				<>
					<Button variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button loading={bulk.isPending} disabled={!nodeCount} onClick={save}>
						Apply to all
					</Button>
				</>
			}
		>
			<div className="space-y-3">
				<p className="text-muted text-xs">
					Applies the same N attempts × ≥X% accuracy requirement and attempt-settings gates to every
					section on this roadmap ({nodeCount} nodes).
				</p>
				<div className="grid grid-cols-2 gap-3">
					<Input
						label="Attempts required"
						type="number"
						min={1}
						max={50}
						value={attempts}
						onChange={(e) => setAttempts(e.target.value)}
					/>
					<Input
						label="Accuracy ≥ %"
						type="number"
						min={0}
						max={100}
						value={accuracy}
						onChange={(e) => setAccuracy(e.target.value)}
					/>
				</div>
				<AttemptSettingsToggles
					requireFlashcard={requireFlashcard}
					setRequireFlashcard={setRequireFlashcard}
					requireRandomOrder={requireRandomOrder}
					setRequireRandomOrder={setRequireRandomOrder}
					requireTimer={requireTimer}
					setRequireTimer={setRequireTimer}
				/>
			</div>
		</Modal>
	);
}

function CapacitySettingsModal({ open, onClose, roadmap }) {
	const update = roadmapsApi.useUpdate();
	const [deadline, setDeadline] = useState('');
	const [hoursPerWeek, setHoursPerWeek] = useState(DEFAULT_HOURS_PER_WEEK);
	const [hoursPerDay, setHoursPerDay] = useState(DEFAULT_HOURS_PER_DAY);
	const [studyDays, setStudyDays] = useState(DEFAULT_STUDY_DAYS);

	useEffect(() => {
		if (!open || !roadmap) return;
		setDeadline(roadmap.deadline ? String(roadmap.deadline).slice(0, 10) : '');
		setHoursPerWeek(String(roadmap.hours_per_week ?? 5));
		setHoursPerDay(String(roadmap.hours_per_day ?? 1));
		setStudyDays(
			Array.isArray(roadmap.study_days) && roadmap.study_days.length
				? roadmap.study_days.map(Number)
				: DEFAULT_STUDY_DAYS
		);
	}, [open, roadmap]);

	const save = () => {
		if (roadmap?.id == null) return;
		update.mutate(
			{
				id: roadmap.id,
				deadline: deadline || null,
				hours_per_week: Number(hoursPerWeek) || 5,
				hours_per_day: Number(hoursPerDay) || 1,
				study_days: studyDays
			},
			{
				onSuccess: (data) => {
					toast.success('Study capacity updated — schedule recalculated.');
					toastIfDeadlineExtended(data, toast);
					onClose();
				},
				onError: (err) =>
					toast.error(err.response?.data?.detail || 'Could not update study capacity.')
			}
		);
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Deadline & study capacity"
			size="md"
			footer={
				<>
					<Button variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button loading={update.isPending} onClick={save}>
						Save & reschedule
					</Button>
				</>
			}
		>
			<div className="space-y-3">
				<p className="text-muted text-xs">
					Changing hours/week, hours/day, or study days re-packs section due dates from today. If
					the plan cannot fit, the deadline is extended automatically. Edit per-section estimates on
					each section.
				</p>
				<Input
					label="Deadline"
					type="date"
					value={deadline}
					onChange={(e) => setDeadline(e.target.value)}
				/>
				<RoadmapCapacityFields
					hoursPerWeek={hoursPerWeek}
					onHoursPerWeek={setHoursPerWeek}
					hoursPerDay={hoursPerDay}
					onHoursPerDay={setHoursPerDay}
					studyDays={studyDays}
					onStudyDays={setStudyDays}
					defaultEstimatedMinutes={DEFAULT_ESTIMATED_MINUTES}
					onDefaultEstimatedMinutes={() => {}}
					showSectionEstimates={false}
				/>
			</div>
		</Modal>
	);
}

function ResetScheduleModal({ open, onClose, onConfirm, pending }) {
	const close = () => {
		if (!pending) onClose?.();
	};

	return (
		<Modal
			open={open}
			onClose={close}
			title="Reset schedule?"
			size="sm"
			footer={
				<>
					<Button variant="secondary" onClick={close} disabled={pending}>
						Cancel
					</Button>
					<Button loading={pending} onClick={onConfirm}>
						Reset schedule
					</Button>
				</>
			}
		>
			<p className="text-muted text-sm leading-relaxed">
				Re-pack all auto-scheduled sections onto your study days using hours/week and hours/day from
				today? Pinned due dates are kept. If work cannot fit before the deadline, the deadline is
				extended. This cannot be undone.
			</p>
		</Modal>
	);
}

function RoadmapDetail({ roadmap, onBack }) {
	const navigate = useNavigate();
	const { launchAttempt, attemptModal } = useAttemptLauncher();
	const plan = roadmap.daily_plan || roadmap.weekly_plan;
	const budget = plan?.time_budget;
	const todayNodes = plan?.tasks_today?.nodes || [];
	const weekBuckets = useMemo(() => groupDaysIntoWeeks(plan?.days || []), [plan?.days]);
	const nodes = roadmap.nodes || [];
	const [editNode, setEditNode] = useState(null);
	const [bulkOpen, setBulkOpen] = useState(false);
	const [capacityOpen, setCapacityOpen] = useState(false);
	const [resetScheduleOpen, setResetScheduleOpen] = useState(false);
	const [mobileTab, setMobileTab] = useState('path');
	const [pathPage, setPathPage] = useState(1);
	const [todayPage, setTodayPage] = useState(1);
	const [weekPage, setWeekPage] = useState(1);
	const resync = useResyncRoadmap();
	const resetSchedule = useResetRoadmapSchedule();
	const sourceQuizUuid = roadmap.linked_quiz_uuid
		? String(roadmap.linked_quiz_uuid)
		: roadmap.source_quiz_uuid
			? String(roadmap.source_quiz_uuid)
			: null;

	const currentWeekIndex = useMemo(() => {
		const idx = weekBuckets.findIndex((w) => w.is_current);
		return idx >= 0 ? idx + 1 : 1;
	}, [weekBuckets]);

	const pagedPath = useMemo(
		() => paginateClient(nodes, pathPage, PATH_PAGE_SIZE),
		[nodes, pathPage]
	);
	const pagedToday = useMemo(
		() => paginateClient(todayNodes, todayPage, TODAY_PAGE_SIZE),
		[todayNodes, todayPage]
	);
	const pagedWeeks = useMemo(
		() => paginateClient(weekBuckets, weekPage, WEEK_PAGE_SIZE),
		[weekBuckets, weekPage]
	);

	useEffect(() => {
		setPathPage(1);
		setTodayPage(1);
		setMobileTab('path');
	}, [roadmap.id]);

	useEffect(() => {
		setWeekPage(currentWeekIndex);
	}, [roadmap.id, currentWeekIndex]);

	useClampedPage(pathPage, setPathPage, pagedPath);
	useClampedPage(todayPage, setTodayPage, pagedToday);
	useClampedPage(weekPage, setWeekPage, pagedWeeks);

	const openNodeEditor = (n) => {
		const full = nodes.find((node) => node.id === n.id);
		setEditNode(full || n);
	};

	const handleResync = () => {
		resync.mutate(roadmap.id, {
			onSuccess: () => toast.success('Roadmap resynced from quiz sections.'),
			onError: (err) => toast.error(err.response?.data?.detail || 'Could not resync roadmap.')
		});
	};

	const handleResetSchedule = () => {
		resetSchedule.mutate(roadmap.id, {
			onSuccess: (data) => {
				toast.success('Schedule reset.');
				toastIfDeadlineExtended(data, toast);
				setResetScheduleOpen(false);
			},
			onError: (err) => toast.error(err.response?.data?.detail || 'Could not reset schedule.')
		});
	};

	const handleUnlinkedQuiz = () => {
		toast.error(
			'No matching owner quiz for this roadmap. Create the quiz from Templates, or create the roadmap from My quiz so View/Attempt can link.'
		);
	};

	const handleViewQuiz = (node) => {
		const quizUuid = resolveNodeQuizUuid(node, sourceQuizUuid);
		if (!quizUuid) return;
		navigate(`/quizzes/${quizUuid}`);
	};

	const handleAttemptSection = (node) => {
		launchNodeSectionAttempt({
			node: { ...node, roadmap_title: roadmap.title },
			sourceQuizUuid,
			launchAttempt,
			onUnlinked: handleUnlinkedQuiz
		});
	};

	const nodeCardProps = {
		sourceQuizUuid,
		onViewQuiz: handleViewQuiz,
		onAttemptSection: handleAttemptSection,
		onUnlinkedQuiz: handleUnlinkedQuiz
	};

	const renderPathPanel = () => (
		<Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<CardHeader
				className="shrink-0 p-3"
				title={roadmap.title}
				subtitle={
					roadmap.description ? (
						<span className="line-clamp-1 text-[10px]">{roadmap.description}</span>
					) : (
						<span className="text-[10px]">Mastery path</span>
					)
				}
				action={
					<div className="flex flex-col items-center gap-0.5">
						<ProgressRing
							value={roadmap.progress?.percent || 0}
							size={48}
							stroke={5}
							tone="primary"
							label={`${Math.round(roadmap.progress?.percent || 0)}`}
						/>
						<p className="text-muted text-[10px]">
							{roadmap.progress?.mastered}/{roadmap.progress?.total}
						</p>
					</div>
				}
			/>
			<CardBody className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden p-3 pt-0">
				<div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
					{pagedPath.results.map((node) => (
						<RoadmapNodeCard
							key={node.id}
							node={node}
							onEdit={setEditNode}
							compact
							{...nodeCardProps}
						/>
					))}
					{!pagedPath.results.length && (
						<p className="text-muted col-span-full text-xs">No sections yet.</p>
					)}
				</div>
				<div className="mt-auto flex shrink-0 flex-col gap-1">
					<div className="flex justify-end">
						<Button
							size="sm"
							variant="secondary"
							className="h-7 text-xs"
							disabled={!nodes.length}
							onClick={() => setBulkOpen(true)}
						>
							Set all gates
						</Button>
					</div>
					<CompactPager
						page={pagedPath.page}
						totalPages={pagedPath.total_pages}
						count={pagedPath.count}
						pageSize={pagedPath.page_size}
						onPageChange={setPathPage}
					/>
				</div>
			</CardBody>
		</Card>
	);

	const renderTodayPanel = () => (
		<Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<CardHeader
				className="shrink-0 p-3"
				title="Tasks today"
				subtitle={<span className="text-[10px]">Due today + overdue</span>}
			/>
			<CardBody className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-3 pt-0">
				<div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
					{!pagedToday.results.length ? (
						<p className="text-muted text-xs">Nothing due today — you may be ahead or done.</p>
					) : (
						pagedToday.results.map((n) => (
							<RoadmapNodeCard
								key={n.id}
								node={n}
								onEdit={openNodeEditor}
								compact
								{...nodeCardProps}
							/>
						))
					)}
				</div>
				<div className="mt-auto shrink-0">
					<CompactPager
						page={pagedToday.page}
						totalPages={pagedToday.total_pages}
						count={pagedToday.count}
						pageSize={pagedToday.page_size}
						onPageChange={setTodayPage}
					/>
				</div>
			</CardBody>
		</Card>
	);

	const renderWeekPanel = () => (
		<Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<CardHeader
				className="shrink-0 p-3"
				title="Weekly calendar"
				subtitle={<span className="text-[10px]">Daily dues by week</span>}
			/>
			<CardBody className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-3 pt-0">
				<div className="min-h-0 flex-1 overflow-y-auto">
					<WeekPanel week={pagedWeeks.results[0]} onEdit={openNodeEditor} {...nodeCardProps} />
				</div>
				<div className="shrink-0">
					<CompactPager
						page={pagedWeeks.page}
						totalPages={pagedWeeks.total_pages}
						count={pagedWeeks.count}
						pageSize={pagedWeeks.page_size}
						onPageChange={setWeekPage}
					/>
				</div>
			</CardBody>
		</Card>
	);

	return (
		<div className="flex h-[calc(100dvh-8rem)] min-h-0 flex-col gap-2 overflow-hidden">
			{attemptModal}
			<div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
				<Button variant="ghost" className="h-8 px-2 text-sm" onClick={onBack}>
					← All roadmaps
				</Button>
				<div className="flex flex-wrap items-center gap-2">
					{roadmap.source_quiz_uuid && (
						<Button
							size="sm"
							variant="secondary"
							className="h-8"
							loading={resync.isPending}
							onClick={handleResync}
							title="Update nodes from the linked quiz’s current sections"
						>
							<RefreshCw size={14} className="mr-1" />
							Resync from quiz
						</Button>
					)}
					<Button
						size="sm"
						variant="secondary"
						className="h-8"
						onClick={() => setResetScheduleOpen(true)}
						title="Re-pack due dates using study capacity from today"
					>
						<CalendarRange size={14} className="mr-1" />
						Reset schedule
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="h-8"
						onClick={() => setCapacityOpen(true)}
						title="Edit deadline and study capacity"
					>
						{roadmap.deadline ? `Due ${formatDate(roadmap.deadline)}` : 'Set deadline'}
					</Button>
				</div>
			</div>

			{budget ? <RoadmapCapacityStrip budget={budget} progress={roadmap.progress} /> : null}

			{/* Desktop: two-column single-screen dashboard */}
			<div className="hidden min-h-0 flex-1 gap-3 overflow-hidden lg:grid lg:grid-cols-2">
				{renderPathPanel()}
				<div className="flex min-h-0 flex-col gap-3 overflow-hidden">
					{renderTodayPanel()}
					{renderWeekPanel()}
				</div>
			</div>

			{/* Mobile / tablet: tabbed panels */}
			<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:hidden">
				<div className="border-line flex shrink-0 gap-1 rounded-md border p-0.5">
					{MOBILE_TABS.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setMobileTab(tab.id)}
							className={cn(
								'flex-1 cursor-pointer rounded px-2 py-1.5 text-xs font-medium transition-colors',
								mobileTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted hover:text-fg'
							)}
						>
							{tab.label}
						</button>
					))}
				</div>
				{mobileTab === 'path' && renderPathPanel()}
				{mobileTab === 'today' && renderTodayPanel()}
				{mobileTab === 'week' && renderWeekPanel()}
			</div>

			<NodeMasteryModal
				open={editNode != null}
				onClose={() => setEditNode(null)}
				roadmapId={roadmap.id}
				node={editNode}
			/>
			<BulkMasteryModal open={bulkOpen} onClose={() => setBulkOpen(false)} roadmap={roadmap} />
			<CapacitySettingsModal
				open={capacityOpen}
				onClose={() => setCapacityOpen(false)}
				roadmap={roadmap}
			/>
			<ResetScheduleModal
				open={resetScheduleOpen}
				onClose={() => setResetScheduleOpen(false)}
				onConfirm={handleResetSchedule}
				pending={resetSchedule.isPending}
			/>
		</div>
	);
}

export default function RoadmapPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { launchAttempt, attemptModal } = useAttemptLauncher();
	const [forkOpen, setForkOpen] = useState(false);
	const [selectedId, setSelectedId] = useState(null);
	const [editPreview, setEditPreview] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);

	const { data: listData, isLoading } = roadmapsApi.useList({ status: 'active' });
	const roadmaps = Array.isArray(listData) ? listData : listData?.results || [];

	const { data: catalog = [] } = useQuery({
		queryKey: ['roadmaps', 'catalog'],
		queryFn: () => get('/roadmaps/catalog/')
	});

	const { data: quizSources = [] } = useQuery({
		queryKey: ['roadmaps', 'quiz-sources'],
		queryFn: () => get('/roadmaps/quiz-sources/')
	});

	const { data: detail, isError: detailError } = roadmapsApi.useDetail(selectedId, {
		enabled: selectedId != null,
		staleTime: 30_000
	});

	const prefetchDetail = (id) => {
		if (id == null) return;
		queryClient.prefetchQuery({
			queryKey: ['roadmaps', 'detail', id],
			queryFn: () => get(`/roadmaps/${id}/`),
			staleTime: 30_000
		});
	};

	const remove = roadmapsApi.useRemove({
		onSuccess: () => {
			toast.success('Roadmap archived/removed.');
			setSelectedId(null);
			setDeleteTarget(null);
		}
	});

	const totals = useMemo(() => {
		const count = roadmaps.length;
		const avg =
			count === 0
				? 0
				: Math.round(roadmaps.reduce((s, r) => s + (r.progress?.percent || 0), 0) / count);
		return { count, avg };
	}, [roadmaps]);

	const handleListViewQuiz = (node, sourceQuizUuid) => {
		const quizUuid = resolveNodeQuizUuid(node, sourceQuizUuid);
		if (!quizUuid) {
			listUnlinkedQuizHint();
			return;
		}
		navigate(`/quizzes/${quizUuid}`);
	};

	const handleListAttemptSection = (node, sourceQuizUuid) => {
		launchNodeSectionAttempt({
			node,
			sourceQuizUuid,
			launchAttempt,
			onUnlinked: listUnlinkedQuizHint
		});
	};

	if (selectedId) {
		if (detail) {
			return <RoadmapDetail roadmap={detail} onBack={() => setSelectedId(null)} />;
		}
		if (detailError) {
			return (
				<div>
					<Button variant="ghost" className="mb-4 h-8 px-2 text-sm" onClick={() => setSelectedId(null)}>
						← All roadmaps
					</Button>
					<EmptyState
						title="Could not open roadmap"
						description="The detail request failed. Go back and try again."
						action={
							<Button variant="secondary" onClick={() => setSelectedId(null)}>
								Back to list
							</Button>
						}
					/>
				</div>
			);
		}
		return <LoadingScreen label="Opening roadmap…" />;
	}

	return (
		<div>
			{attemptModal}
			<PageHeader
				title="Roadmap"
				icon={Map}
				description="Fork a template or your quiz into a mastery path, set a deadline, and follow the plan."
				actions={
					<Button onClick={() => setForkOpen(true)}>
						<Sparkles size={16} className="mr-1" />
						Create roadmap
					</Button>
				}
			/>

			<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<StatCard icon={Map} label="Active roadmaps" value={totals.count} tone="primary" />
				<StatCard
					icon={CalendarRange}
					label="Avg. mastery"
					value={`${totals.avg}%`}
					tone="success"
				/>
			</div>

			{isLoading ? (
				<p className="text-muted text-sm">Loading roadmaps…</p>
			) : roadmaps.length === 0 ? (
				<EmptyState
					title="No roadmaps yet"
					description="Fork a quiz template or one of your sectioned quizzes to get a mastery path."
					action={<Button onClick={() => setForkOpen(true)}>Create roadmap</Button>}
				/>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{roadmaps.map((r) => (
						<RoadmapListCard
							key={r.id}
							roadmap={r}
							onOpen={() => setSelectedId(r.id)}
							onPrefetch={() => prefetchDetail(r.id)}
							onDelete={() => setDeleteTarget(r)}
							onEditNode={(node) => setEditPreview({ node, roadmapId: r.id })}
							onViewQuiz={handleListViewQuiz}
							onAttemptSection={handleListAttemptSection}
						/>
					))}
				</div>
			)}

			<ForkModal
				open={forkOpen}
				onClose={() => setForkOpen(false)}
				catalog={catalog}
				quizSources={quizSources}
			/>
			<NodeMasteryModal
				open={editPreview != null}
				onClose={() => setEditPreview(null)}
				roadmapId={editPreview?.roadmapId}
				node={editPreview?.node}
			/>
			<Modal
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				title="Delete roadmap"
				size="sm"
				footer={
					<>
						<Button variant="secondary" onClick={() => setDeleteTarget(null)}>
							Cancel
						</Button>
						<Button
							variant="danger"
							loading={remove.isPending}
							onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}
						>
							Delete
						</Button>
					</>
				}
			>
				<p className="text-muted text-sm">
					Are you sure you want to delete {deleteTarget?.title || 'this roadmap'}? This archives the
					path and cannot be undone from here.
				</p>
			</Modal>
		</div>
	);
}
