import { useEffect, useState } from 'react';
import { Flame, Plus, Target, Undo2 } from 'lucide-react';

import { habitsApi, useEnsureDefaultHabits, useHabitCheckIn } from '../lib/studyResources';
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

function HabitFormModal({ open, onClose, habit }) {
	const create = habitsApi.useCreate({
		onSuccess: () => {
			toast.success('Habit created.');
			onClose();
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
		target_accuracy: 80
	});

	useEffect(() => {
		if (habit) {
			setForm({
				name: habit.name || '',
				description: habit.description || '',
				frequency: habit.frequency || 'daily',
				target_attempts: habit.target_attempts ?? 1,
				target_minutes: habit.target_minutes ?? 15,
				target_accuracy: habit.target_accuracy ?? 80
			});
		} else if (open) {
			setForm({
				name: '',
				description: '',
				frequency: 'daily',
				target_attempts: 1,
				target_minutes: 15,
				target_accuracy: 80
			});
		}
	}, [habit, open]);

	const save = () => {
		const body = {
			...form,
			schedule_mode: 'fixed',
			target_attempts: Number(form.target_attempts) || 1,
			target_minutes: Number(form.target_minutes) || 0,
			target_accuracy: Number(form.target_accuracy) || 80
		};
		if (habit) update.mutate({ id: habit.id, ...body });
		else create.mutate(body);
	};

	return (
		<Modal open={open} onClose={onClose} title={habit ? 'Edit habit' : 'New habit'}>
			<div className="space-y-3">
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
					<Button onClick={save} disabled={!form.name.trim()}>
						Save
					</Button>
				</div>
			</div>
		</Modal>
	);
}

export default function ProgressPage() {
	const { data, isLoading } = habitsApi.useList({ is_active: true });
	const ensureDefaults = useEnsureDefaultHabits();
	const checkIn = useHabitCheckIn();
	const remove = habitsApi.useRemove({
		onSuccess: () => toast.success('Habit removed.')
	});
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState(null);

	const habits = Array.isArray(data) ? data : data?.results || [];

	useEffect(() => {
		if (
			!isLoading &&
			habits.length === 0 &&
			!ensureDefaults.isPending &&
			!ensureDefaults.isSuccess
		) {
			ensureDefaults.mutate();
		}
	}, [isLoading, habits.length, ensureDefaults]);

	const bestStreak = Math.max(0, ...habits.map((h) => h.momentum?.current_streak || 0));
	const dueToday = habits.filter((h) => h.today_status?.status === 'due').length;

	return (
		<div>
			<PageHeader
				title="Progress"
				icon={Flame}
				description="Habits, streaks, and study heatmaps. Quiz attempts log automatically."
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
					description="Create a habit or wait for the default daily practice habit to appear."
				/>
			) : (
				<div className="space-y-4">
					{habits.map((habit) => {
						const todayLog = habit.today_log;
						const showedUp = todayLog?.showed_up;
						const missedAccuracy = showedUp && !todayLog?.accuracy_met;

						return (
							<Card key={habit.id}>
								<CardHeader
									title={habit.name}
									action={
										<div className="flex flex-wrap items-center gap-2">
											<Badge
												tone={habit.today_status?.status === 'completed' ? 'success' : 'warning'}
											>
												{habit.today_status?.status === 'completed' ? 'Done today' : 'Due'}
											</Badge>
											{missedAccuracy && (
												<Badge tone="warning">Missed {habit.target_accuracy}% target</Badge>
											)}
											{todayLog?.accuracy_met && <Badge tone="success">Accuracy met</Badge>}
										</div>
									}
								/>
								<CardBody className="space-y-3">
									{habit.description && <p className="text-muted text-sm">{habit.description}</p>}
									<div className="text-muted flex flex-wrap gap-3 text-xs">
										<span>{habit.schedule_summary}</span>
										<span>Streak {habit.momentum?.current_streak ?? 0}</span>
										<span>
											Goal: {habit.target_attempts} attempt(s) or {habit.target_minutes} min · ≥
											{habit.target_accuracy}%
										</span>
									</div>
									<CompactHabitGrid
										logs={habit.recent_logs || []}
										logDetails={habit.recent_log_details || []}
										createdAt={habit.created_at}
										color={habit.color || 'var(--primary)'}
									/>
									<div className="flex flex-wrap gap-2">
										<Button
											size="sm"
											variant="secondary"
											disabled={checkIn.isPending}
											onClick={() =>
												checkIn.mutate(
													{ id: habit.id },
													{ onSuccess: () => toast.success('Checked in.') }
												)
											}
										>
											Manual check-in
										</Button>
										{showedUp && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => checkIn.mutate({ id: habit.id, undo: true })}
											>
												<Undo2 size={14} className="mr-1" />
												Undo today
											</Button>
										)}
										<Button
											size="sm"
											variant="ghost"
											onClick={() => {
												setEditing(habit);
												setModalOpen(true);
											}}
										>
											Edit
										</Button>
										<Button
											size="sm"
											variant="ghost"
											className="text-danger"
											onClick={() => remove.mutate(habit.id)}
										>
											Delete
										</Button>
									</div>
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
