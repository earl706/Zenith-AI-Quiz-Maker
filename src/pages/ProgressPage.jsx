import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	AlertTriangle,
	BadgeCheck,
	BookOpen,
	Check,
	CheckCircle2,
	Clock,
	Flame,
	GitBranch,
	Pencil,
	Plus,
	Shuffle,
	Target,
	Trash2,
	Undo2
} from 'lucide-react';

import { get } from '../lib/api';
import { normalizeQuizList } from '../lib/resources';
import { habitsApi, roadmapsApi, useHabitCheckIn } from '../lib/studyResources';
import { toast } from '../stores/toastStore';
import { CompactHabitGrid } from '../components/habits/CompactHabitGrid';
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
	Select,
	StatCard
} from '../components/ui';

const DEFAULT_COLOR = '#0D9488';

function listRows(data) {
	return Array.isArray(data) ? data : data?.results || [];
}

function roadmapMinutes(roadmap) {
	const hours = Number(roadmap?.hours_per_day);
	if (!Number.isFinite(hours) || hours <= 0) return 15;
	return Math.max(1, Math.round(hours * 60));
}

function HabitFormModal({ open, onClose, habit }) {
	const create = habitsApi.useCreate({
		onSuccess: () => {
			toast.success('Habit created.');
			onClose();
		},
		onError: (err) => {
			const data = err.response?.data;
			const detail =
				(typeof data?.detail === 'string' && data.detail) ||
				(Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) ||
				'Could not save habit.';
			toast.error(detail);
		}
	});
	const update = habitsApi.useUpdate({
		onSuccess: () => {
			toast.success('Habit updated.');
			onClose();
		}
	});
	const [form, setForm] = useState({
		name: '',
		description: '',
		frequency: 'daily',
		target_attempts: 1,
		target_minutes: 15,
		target_accuracy: 80,
		color: DEFAULT_COLOR,
		sourceKind: '',
		sourceQuizUuid: '',
		sourceRoadmapId: ''
	});

	const { data: quizPayload } = useQuery({
		queryKey: ['quizzes', 'habit-source'],
		queryFn: () => get('/quizzes/quiz/'),
		enabled: open
	});
	const { data: roadmapPayload } = roadmapsApi.useList(
		{ status: 'active', page_size: 100 },
		{ enabled: open }
	);

	const quizzes = normalizeQuizList(quizPayload);
	const roadmaps = listRows(roadmapPayload);

	useEffect(() => {
		if (habit) {
			const sourceKind = habit.source_quiz_uuid ? 'quiz' : habit.source_roadmap_id ? 'roadmap' : '';
			setForm({
				name: habit.name || '',
				description: habit.description || '',
				frequency: habit.frequency || 'daily',
				target_attempts: habit.target_attempts ?? 1,
				target_minutes: habit.target_minutes ?? 15,
				target_accuracy: habit.target_accuracy ?? 80,
				color: habit.color || DEFAULT_COLOR,
				sourceKind,
				sourceQuizUuid: habit.source_quiz_uuid ? String(habit.source_quiz_uuid) : '',
				sourceRoadmapId: habit.source_roadmap_id ? String(habit.source_roadmap_id) : ''
			});
		} else if (open) {
			setForm({
				name: '',
				description: '',
				frequency: 'daily',
				target_attempts: 1,
				target_minutes: 15,
				target_accuracy: 80,
				color: DEFAULT_COLOR,
				sourceKind: '',
				sourceQuizUuid: '',
				sourceRoadmapId: ''
			});
		}
	}, [habit, open]);

	const applyQuiz = (uuid) => {
		const quiz = quizzes.find((q) => String(q.uuid) === String(uuid));
		setForm((f) => ({
			...f,
			sourceKind: 'quiz',
			sourceQuizUuid: uuid,
			sourceRoadmapId: '',
			name: quiz?.quiz_title || f.name,
			color: quiz?.tag_color || f.color
		}));
	};

	const applyRoadmap = (id) => {
		const roadmap = roadmaps.find((r) => String(r.id) === String(id));
		setForm((f) => ({
			...f,
			sourceKind: 'roadmap',
			sourceRoadmapId: id,
			sourceQuizUuid: '',
			name: roadmap?.title || f.name,
			color: roadmap?.color || f.color,
			target_minutes: roadmap ? roadmapMinutes(roadmap) : f.target_minutes
		}));
	};

	const sourceReady = Boolean(
		(form.sourceKind === 'quiz' && form.sourceQuizUuid) ||
			(form.sourceKind === 'roadmap' && form.sourceRoadmapId)
	);
	const canSave = Boolean(form.name.trim()) && (habit || sourceReady);

	const save = () => {
		if (!canSave) return;
		const body = {
			name: form.name.trim(),
			description: form.description,
			frequency: form.frequency,
			schedule_mode: 'fixed',
			target_attempts: Number(form.target_attempts) || 1,
			target_minutes: Number(form.target_minutes) || 0,
			target_accuracy: Number(form.target_accuracy) || 80,
			color: form.color || DEFAULT_COLOR,
			source_quiz_uuid: form.sourceKind === 'quiz' ? form.sourceQuizUuid || null : null,
			source_roadmap_id:
				form.sourceKind === 'roadmap' && form.sourceRoadmapId ? Number(form.sourceRoadmapId) : null
		};
		if (habit) update.mutate({ id: habit.id, ...body });
		else create.mutate(body);
	};

	return (
		<Modal open={open} onClose={onClose} title={habit ? 'Edit habit' : 'New habit'}>
			<div className="space-y-3">
				<Select
					label="Source"
					value={form.sourceKind}
					onChange={(e) => {
						const sourceKind = e.target.value;
						setForm((f) => ({
							...f,
							sourceKind,
							sourceQuizUuid: sourceKind === 'quiz' ? f.sourceQuizUuid : '',
							sourceRoadmapId: sourceKind === 'roadmap' ? f.sourceRoadmapId : ''
						}));
					}}
				>
					<option value="">{habit ? 'None (any quiz counts)' : 'Choose quiz or roadmap…'}</option>
					<option value="quiz">Quiz</option>
					<option value="roadmap">Roadmap</option>
				</Select>
				{form.sourceKind === 'quiz' && (
					<>
						<Select
							label="Quiz"
							value={form.sourceQuizUuid}
							onChange={(e) => applyQuiz(e.target.value)}
						>
							<option value="">Select a quiz…</option>
							{quizzes.map((q) => (
								<option key={q.uuid} value={q.uuid}>
									{q.quiz_title || 'Untitled quiz'}
								</option>
							))}
						</Select>
						{quizzes.length === 0 && (
							<p className="text-muted text-xs">
								No quizzes yet. Create one under My Quizzes first.
							</p>
						)}
					</>
				)}
				{form.sourceKind === 'roadmap' && (
					<>
						<Select
							label="Roadmap"
							value={form.sourceRoadmapId}
							onChange={(e) => applyRoadmap(e.target.value)}
						>
							<option value="">Select a roadmap…</option>
							{roadmaps.map((r) => (
								<option key={r.id} value={r.id}>
									{r.title || 'Untitled roadmap'}
								</option>
							))}
						</Select>
						{roadmaps.length === 0 && (
							<p className="text-muted text-xs">
								No active roadmaps yet. Create one under Roadmap first.
							</p>
						)}
					</>
				)}
				{!habit && (
					<p className="text-muted text-xs">
						New habits must be linked to one quiz or one roadmap. Attempts on that source log
						automatically; name, color, and time goal are copied from it.
					</p>
				)}
				<Input
					label="Name"
					value={form.name}
					onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
				/>
				<Input
					label="Description"
					value={form.description}
					onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
				/>
				<Select
					label="Frequency"
					value={form.frequency}
					onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
				>
					<option value="daily">Daily</option>
					<option value="eod">Every other day</option>
					<option value="biweekly">2× per week</option>
					<option value="weekly">Weekly</option>
				</Select>
				<div className="grid grid-cols-3 gap-2">
					<Input
						label="Attempts"
						type="number"
						min={0}
						value={form.target_attempts}
						onChange={(e) => setForm((f) => ({ ...f, target_attempts: e.target.value }))}
					/>
					<Input
						label="Minutes"
						type="number"
						min={0}
						value={form.target_minutes}
						onChange={(e) => setForm((f) => ({ ...f, target_minutes: e.target.value }))}
					/>
					<Input
						label="Accuracy %"
						type="number"
						min={0}
						max={100}
						value={form.target_accuracy}
						onChange={(e) => setForm((f) => ({ ...f, target_accuracy: e.target.value }))}
					/>
				</div>
				<p className="text-muted text-xs">
					Showing up (attempts or time) keeps your streak. Accuracy is tracked as an indicator.
				</p>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={save} disabled={!canSave}>
						Save
					</Button>
				</div>
			</div>
		</Modal>
	);
}

export default function ProgressPage() {
	const { data, isLoading } = habitsApi.useList({ is_active: true });
	const checkIn = useHabitCheckIn();
	const remove = habitsApi.useRemove({
		onSuccess: () => toast.success('Habit removed.')
	});
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState(null);

	const habits = listRows(data);

	const bestStreak = Math.max(0, ...habits.map((h) => h.momentum?.current_streak || 0));
	const dueToday = habits.filter((h) => h.today_status?.status === 'due').length;

	return (
		<div>
			<PageHeader
				title="Progress"
				icon={Flame}
				description="Habits forked from a quiz or roadmap. Attempts on that source log automatically."
				actions={
					<Button
						onClick={() => {
							setEditing(null);
							setModalOpen(true);
						}}
					>
						<Plus size={16} className="mr-1" />
						New habit
					</Button>
				}
			/>

			<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard icon={Flame} label="Best streak" value={bestStreak} tone="warning" />
				<StatCard icon={Target} label="Habits" value={habits.length} tone="primary" />
				<StatCard icon={Target} label="Due today" value={dueToday} tone="danger" />
			</div>

			{isLoading ? (
				<p className="text-muted text-sm">Loading habits…</p>
			) : habits.length === 0 ? (
				<EmptyState
					title="No habits yet"
					description="Create a habit from one existing quiz or roadmap. Attempts on that source keep the streak."
				/>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{habits.map((habit) => {
						const todayLog = habit.today_log;
						const showedUp = todayLog?.showed_up;
						const missedAccuracy = showedUp && !todayLog?.accuracy_met;
						const sourceKind = habit.source_quiz_uuid
							? 'quiz'
							: habit.source_roadmap_id
								? 'roadmap'
								: 'any';
						const sourceMeta =
							sourceKind === 'quiz'
								? { label: 'Quiz', Icon: BookOpen }
								: sourceKind === 'roadmap'
									? { label: 'Roadmap', Icon: GitBranch }
									: { label: 'Any quiz', Icon: Shuffle };
						const doneToday = habit.today_status?.status === 'completed';
						const iconBtn =
							'text-fg hover:bg-surface-2 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50';

						return (
							<Card key={habit.id}>
								<CardHeader
									className="p-4 pb-2"
									title={habit.name}
									action={
										<div className="flex items-center gap-0.5">
											<button
												type="button"
												className={`${iconBtn} bg-surface-2 border-line border`}
												disabled={checkIn.isPending}
												title="Manual check-in"
												aria-label="Manual check-in"
												onClick={() =>
													checkIn.mutate(
														{ id: habit.id },
														{ onSuccess: () => toast.success('Checked in.') }
													)
												}
											>
												<Check size={14} />
											</button>
											<button
												type="button"
												className={iconBtn}
												disabled={checkIn.isPending || !showedUp}
												title="Undo today"
												aria-label="Undo today"
												onClick={() => checkIn.mutate({ id: habit.id, undo: true })}
											>
												<Undo2 size={14} />
											</button>
											<button
												type="button"
												className={iconBtn}
												title="Edit habit"
												aria-label="Edit habit"
												onClick={() => {
													setEditing(habit);
													setModalOpen(true);
												}}
											>
												<Pencil size={14} />
											</button>
											<button
												type="button"
												className={`${iconBtn} text-danger`}
												title="Delete habit"
												aria-label="Delete habit"
												onClick={() => remove.mutate(habit.id)}
											>
												<Trash2 size={14} />
											</button>
										</div>
									}
								>
									<div className="mt-1.5 flex flex-wrap items-center gap-1">
										<Badge
											tone="neutral"
											className="h-6 w-6 justify-center px-0"
											title={sourceMeta.label}
											aria-label={sourceMeta.label}
										>
											<sourceMeta.Icon size={14} />
										</Badge>
										<Badge
											tone={doneToday ? 'success' : 'warning'}
											className="h-6 w-6 justify-center px-0"
											title={doneToday ? 'Done today' : 'Due'}
											aria-label={doneToday ? 'Done today' : 'Due'}
										>
											{doneToday ? <CheckCircle2 size={14} /> : <Clock size={14} />}
										</Badge>
										{missedAccuracy && (
											<Badge
												tone="warning"
												className="h-6 w-6 justify-center px-0"
												title={`Missed ${habit.target_accuracy}% target`}
												aria-label={`Missed ${habit.target_accuracy}% target`}
											>
												<AlertTriangle size={14} />
											</Badge>
										)}
										{todayLog?.accuracy_met && (
											<Badge
												tone="success"
												className="h-6 w-6 justify-center px-0"
												title="Accuracy met"
												aria-label="Accuracy met"
											>
												<BadgeCheck size={14} />
											</Badge>
										)}
									</div>
								</CardHeader>
								<CardBody className="p-4 pt-0">
									<CompactHabitGrid
										logs={habit.recent_logs || []}
										logDetails={habit.recent_log_details || []}
										createdAt={habit.created_at}
										color={habit.color || 'var(--primary)'}
									/>
								</CardBody>
							</Card>
						);
					})}
				</div>
			)}

			<HabitFormModal open={modalOpen} onClose={() => setModalOpen(false)} habit={editing} />
		</div>
	);
}
