import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarRange, GitBranch, Lock, Map, Pencil, RefreshCw, Sparkles } from 'lucide-react';

import { get } from '../lib/api';
import { cn, formatDate } from '../lib/format';
import {
	roadmapsApi,
	useBulkRoadmapMastery,
	useForkRoadmap,
	useForkRoadmapFromQuiz,
	usePatchRoadmapNode,
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
	Modal,
	ProgressBar,
	ProgressRing,
	Select,
	StatCard
} from '../components/ui';
import { paginateClient } from '../hooks/useListControls';

const PATH_PAGE_SIZE = 11;
const TODAY_PAGE_SIZE = 4;
const WEEK_PAGE_SIZE = 1;

const MOBILE_TABS = [
	{ id: 'path', label: 'Path' },
	{ id: 'today', label: 'Today' },
	{ id: 'week', label: 'Week' }
];

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

function WeekPanel({ week, onEdit }) {
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
						</p>
						{(d.nodes || []).length ? (
							(d.nodes || []).map((n) => (
								<RoadmapNodeCard key={n.id} node={n} onEdit={onEdit} compact />
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
	const data = err.response?.data;
	return (
		data?.mastery_attempts_required?.[0] ||
		data?.mastery_accuracy_threshold?.[0] ||
		data?.detail ||
		'Could not update mastery requirements.'
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

function RoadmapNodeCard({ node, onEdit, compact = false }) {
	const meta = (
		<>
			{node.qualifying_attempts}/{node.mastery_attempts_required} at ≥
			{node.mastery_accuracy_threshold}%
			{node.due_date ? ` · ${formatDate(node.due_date, 'MMM d')}` : ''}
		</>
	);
	const icon =
		node.status === 'locked' ? (
			<Lock size={compact ? 12 : 16} className="text-muted shrink-0" />
		) : node.status === 'mastered' ? (
			<Sparkles size={compact ? 12 : 16} className="text-success shrink-0" />
		) : (
			<GitBranch size={compact ? 12 : 16} className="text-primary shrink-0" />
		);

	if (compact) {
		return (
			<div className="border-line flex min-h-0 items-center gap-1.5 rounded border px-2 py-0.5">
				{icon}
				<p className="text-fg min-w-0 flex-1 truncate text-xs leading-tight">
					<span className="font-medium">{node.title}</span>
					<span className="text-muted font-normal"> · {meta}</span>
				</p>
				<Button
					size="sm"
					variant="ghost"
					className="h-6 w-6 shrink-0 p-0"
					aria-label={`Edit requirements for ${node.title}`}
					onClick={() => onEdit?.(node)}
				>
					<Pencil size={12} />
				</Button>
			</div>
		);
	}

	return (
		<div className="border-line flex items-center gap-3 rounded-md border p-3">
			{icon}
			<div className="min-w-0 flex-1">
				<p className="text-fg truncate text-sm font-medium">{node.title}</p>
				<p className="text-muted text-xs">{meta}</p>
			</div>
			<div className="flex shrink-0 items-center gap-1">
				<Button
					size="sm"
					variant="ghost"
					aria-label={`Edit requirements for ${node.title}`}
					onClick={() => onEdit?.(node)}
				>
					<Pencil size={14} />
				</Button>
			</div>
		</div>
	);
}

function ForkModal({ open, onClose, catalog, quizSources }) {
	const forkTemplate = useForkRoadmap();
	const forkQuiz = useForkRoadmapFromQuiz();
	const [source, setSource] = useState('template'); // template | quiz
	const [slug, setSlug] = useState('');
	const [quizUuid, setQuizUuid] = useState('');
	const [deadline, setDeadline] = useState('');
	const [title, setTitle] = useState('');

	const selectedTemplate = catalog.find((c) => c.slug === slug);
	const selectedQuiz = quizSources.find((q) => q.uuid === quizUuid);
	const pending = forkTemplate.isPending || forkQuiz.isPending;

	useEffect(() => {
		if (!open) return;
		setSource('template');
		setSlug('');
		setQuizUuid('');
		setDeadline('');
		setTitle('');
	}, [open]);

	const submit = () => {
		if (source === 'template') {
			if (!slug) return;
			forkTemplate.mutate(
				{
					template_slug: slug,
					deadline: deadline || null,
					title: title || undefined
				},
				{
					onSuccess: () => {
						toast.success('Roadmap created from template.');
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
				title: title || undefined
			},
			{
				onSuccess: () => {
					toast.success('Roadmap created from quiz.');
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
			<div className="space-y-3">
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
	const [dueDate, setDueDate] = useState('');
	const [manualDue, setManualDue] = useState(false);

	useEffect(() => {
		if (!open || !node) return;
		setAttempts(String(node.mastery_attempts_required ?? 2));
		setAccuracy(String(node.mastery_accuracy_threshold ?? 80));
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
		const body = {
			roadmapId,
			nodeId: node.id,
			mastery_attempts_required: parsed.mastery_attempts_required,
			mastery_accuracy_threshold: parsed.mastery_accuracy_threshold,
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
					{node?.qualifying_attempts ?? 0} qualifying.
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
					Keep this due date (don&apos;t auto-reschedule)
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

	useEffect(() => {
		if (!open || !roadmap?.nodes?.length) return;
		const first = roadmap.nodes[0];
		setAttempts(String(first.mastery_attempts_required ?? 2));
		setAccuracy(String(first.mastery_accuracy_threshold ?? 80));
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
				mastery_accuracy_threshold: parsed.mastery_accuracy_threshold
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
					Applies the same N attempts × ≥X% accuracy requirement to every section on this roadmap (
					{nodeCount} nodes).
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
			</div>
		</Modal>
	);
}

function RoadmapDetail({ roadmap, onBack }) {
	const plan = roadmap.daily_plan || roadmap.weekly_plan;
	const todayNodes = plan?.tasks_today?.nodes || [];
	const weekBuckets = useMemo(() => groupDaysIntoWeeks(plan?.days || []), [plan?.days]);
	const nodes = roadmap.nodes || [];
	const [editNode, setEditNode] = useState(null);
	const [bulkOpen, setBulkOpen] = useState(false);
	const [mobileTab, setMobileTab] = useState('path');
	const [pathPage, setPathPage] = useState(1);
	const [todayPage, setTodayPage] = useState(1);
	const [weekPage, setWeekPage] = useState(1);
	const resync = useResyncRoadmap();

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

	const pathPanel = (
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
				<div className="grid grid-cols-1 gap-1 sm:grid-cols-1">
					{pagedPath.results.map((node) => (
						<RoadmapNodeCard key={node.id} node={node} onEdit={setEditNode} compact />
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

	const todayPanel = (
		<Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<CardHeader
				className="shrink-0 p-3"
				title="Tasks today"
				subtitle={<span className="text-[10px]">Due today + overdue</span>}
			/>
			<CardBody className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-3 pt-0">
				<div className="space-y-1">
					{!pagedToday.results.length ? (
						<p className="text-muted text-xs">Nothing due today — you may be ahead or done.</p>
					) : (
						pagedToday.results.map((n) => (
							<RoadmapNodeCard key={n.id} node={n} onEdit={openNodeEditor} compact />
						))
					)}
				</div>
				<div className="mt-auto">
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

	const weekPanel = (
		<Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<CardHeader
				className="shrink-0 p-3"
				title="Weekly calendar"
				subtitle={<span className="text-[10px]">Daily dues by week</span>}
			/>
			<CardBody className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-3 pt-0">
				<div className="min-h-0 flex-1 overflow-y-auto">
					<WeekPanel week={pagedWeeks.results[0]} onEdit={openNodeEditor} />
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
					{roadmap.deadline && <Badge tone="warning">Due {formatDate(roadmap.deadline)}</Badge>}
				</div>
			</div>

			{/* Desktop: two-column single-screen dashboard */}
			<div className="hidden min-h-0 flex-1 gap-3 overflow-hidden lg:grid lg:grid-cols-2">
				{pathPanel}
				<div className="flex min-h-0 flex-col gap-3 overflow-hidden">
					{todayPanel}
					{weekPanel}
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
				{mobileTab === 'path' && pathPanel}
				{mobileTab === 'today' && todayPanel}
				{mobileTab === 'week' && weekPanel}
			</div>

			<NodeMasteryModal
				open={editNode != null}
				onClose={() => setEditNode(null)}
				roadmapId={roadmap.id}
				node={editNode}
			/>
			<BulkMasteryModal open={bulkOpen} onClose={() => setBulkOpen(false)} roadmap={roadmap} />
		</div>
	);
}

export default function RoadmapPage() {
	const [forkOpen, setForkOpen] = useState(false);
	const [selectedId, setSelectedId] = useState(null);

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

	const { data: detail } = roadmapsApi.useDetail(selectedId, {
		enabled: selectedId != null
	});

	const remove = roadmapsApi.useRemove({
		onSuccess: () => {
			toast.success('Roadmap archived/removed.');
			setSelectedId(null);
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

	if (selectedId && detail) {
		return <RoadmapDetail roadmap={detail} onBack={() => setSelectedId(null)} />;
	}

	return (
		<div>
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
						<Card
							key={r.id}
							className="cursor-pointer transition-colors hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--line))]"
							onClick={() => setSelectedId(r.id)}
						>
							<CardHeader
								title={r.title}
								subtitle={r.source_template_slug || (r.source_quiz_uuid ? 'From quiz' : undefined)}
								action={r.deadline ? <Badge tone="warning">{formatDate(r.deadline)}</Badge> : null}
							/>
							<CardBody className="space-y-2">
								<ProgressBar value={r.progress?.percent || 0} />
								<p className="text-muted text-xs">
									{r.progress?.mastered}/{r.progress?.total} nodes mastered
								</p>
								<Button
									size="sm"
									variant="ghost"
									className="text-danger"
									onClick={(e) => {
										e.stopPropagation();
										remove.mutate(r.id);
									}}
								>
									Delete
								</Button>
							</CardBody>
						</Card>
					))}
				</div>
			)}

			<ForkModal
				open={forkOpen}
				onClose={() => setForkOpen(false)}
				catalog={catalog}
				quizSources={quizSources}
			/>
		</div>
	);
}
