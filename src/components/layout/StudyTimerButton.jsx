import { useEffect, useState } from 'react';
import { Coffee, Pause, Play, RotateCcw, SkipForward, Timer, Volume2 } from 'lucide-react';

import { habitsApi } from '../../lib/studyResources';
import { previewStudyAlarmSound, STUDY_ALARM_SOUNDS } from '../../lib/studyAlarm';
import { formatTimerDisplay } from '../../lib/studyTimerFormat';
import {
	getPhaseLabel,
	isStructuredTechnique,
	STUDY_TECHNIQUE_FREE,
	STUDY_TECHNIQUES
} from '../../lib/studyTechniques';
import {
	selectIntervalActive,
	selectIsFreeRest,
	selectOnBreak,
	useStudyTimerStore
} from '../../stores/studyTimerStore';
import { Button, Modal, ProgressRing, Select } from '../ui';

const DEFAULT_HABIT_NAME = 'Daily quiz practice';
const FREE_PRESETS = [15, 25, 45, 60];
const DIAL_ADJUST_SECONDS = 5 * 60;

function listHabits(data) {
	const rows = Array.isArray(data) ? data : data?.results || [];
	return rows.filter((h) => h.is_active !== false);
}

function pickDefaultHabit(habits) {
	return (
		habits.find((h) => h.name === DEFAULT_HABIT_NAME) ||
		habits.find((h) => h.is_active) ||
		habits[0]
	);
}

export function StudyTimerButton() {
	const [open, setOpen] = useState(false);
	const running = useStudyTimerStore((s) => s.running);
	const remainingSeconds = useStudyTimerStore((s) => s.remainingSeconds);
	const totalSeconds = useStudyTimerStore((s) => s.totalSeconds);
	const sessionActive = useStudyTimerStore(selectIntervalActive);
	const onBreak = useStudyTimerStore(selectOnBreak);
	const isFreeRest = useStudyTimerStore(selectIsFreeRest);
	const techniqueId = useStudyTimerStore((s) => s.techniqueId);
	const phase = useStudyTimerStore((s) => s.phase);
	const freeMode = useStudyTimerStore((s) => s.freeMode);
	const pomodoroCount = useStudyTimerStore((s) => s.pomodoroCount);
	const start = useStudyTimerStore((s) => s.start);
	const pause = useStudyTimerStore((s) => s.pause);
	const reset = useStudyTimerStore((s) => s.reset);
	const skipBreak = useStudyTimerStore((s) => s.skipBreak);
	const setDurationSeconds = useStudyTimerStore((s) => s.setDurationSeconds);
	const addDuration = useStudyTimerStore((s) => s.addDuration);
	const setTechnique = useStudyTimerStore((s) => s.setTechnique);
	const toggleFreeMode = useStudyTimerStore((s) => s.toggleFreeMode);
	const alarmActive = useStudyTimerStore((s) => s.alarmActive);
	const alarmSound = useStudyTimerStore((s) => s.alarmSound);
	const setAlarmSound = useStudyTimerStore((s) => s.setAlarmSound);
	const attachedHabitId = useStudyTimerStore((s) => s.attachedHabitId);
	const setAttachedHabit = useStudyTimerStore((s) => s.setAttachedHabit);
	const applyDefaultHabit = useStudyTimerStore((s) => s.applyDefaultHabit);
	const habitDefaultApplied = useStudyTimerStore((s) => s.habitDefaultApplied);

	const phaseLabel = getPhaseLabel(phase, techniqueId, pomodoroCount, freeMode);
	const structured = isStructuredTechnique(techniqueId);
	const isFree = techniqueId === STUDY_TECHNIQUE_FREE;
	const locked = sessionActive || alarmActive;
	const remainingPct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;
	const display = formatTimerDisplay(remainingSeconds);
	const canStart = remainingSeconds > 0;
	const canEditDuration = !locked && !structured;
	const canToggleFreeMode = isFree && canEditDuration;
	const tone = onBreak || isFreeRest ? 'success' : 'primary';

	const { data: habitData, isLoading: habitsLoading } = habitsApi.useList(
		{ is_active: true, page_size: 100 },
		{ enabled: open }
	);
	const habits = listHabits(habitData);

	useEffect(() => {
		if (!open || habitDefaultApplied || habitsLoading || !habits.length) return;
		applyDefaultHabit(pickDefaultHabit(habits));
	}, [open, habitDefaultApplied, habitsLoading, habits, applyDefaultHabit]);

	const ariaLabel = sessionActive
		? `${isFreeRest || onBreak ? 'Rest' : 'Study timer'} ${display} remaining`
		: 'Study timer';

	const startLabel = isFreeRest ? 'Start rest' : onBreak ? 'Start break' : 'Start';

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="hover:bg-surface-2 relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md"
				aria-label={ariaLabel}
				title={ariaLabel}
			>
				{sessionActive || running ? (
					<ProgressRing value={remainingPct} size={28} stroke={3} tone={tone} label="" />
				) : (
					<Timer size={18} className="text-muted" />
				)}
			</button>

			<Modal open={open} onClose={() => setOpen(false)} title="Study timer" size="sm">
				<div className="space-y-4">
					<div className="flex flex-col items-center gap-2">
						<div className="flex w-full items-center justify-center gap-3">
							{canEditDuration && (
								<Button
									size="sm"
									variant="secondary"
									onClick={() => addDuration(-DIAL_ADJUST_SECONDS)}
									aria-label="Decrease timer by 5 minutes"
								>
									-5m
								</Button>
							)}
							<div className="relative inline-flex items-center justify-center">
								<ProgressRing
									value={sessionActive ? remainingPct : 0}
									size={148}
									stroke={8}
									tone={tone}
									label=""
								/>
								<p className="text-fg pointer-events-none absolute font-mono text-3xl font-bold tracking-tight tabular-nums">
									{display}
								</p>
							</div>
							{canEditDuration && (
								<Button
									size="sm"
									variant="secondary"
									onClick={() => addDuration(DIAL_ADJUST_SECONDS)}
									aria-label="Increase timer by 5 minutes"
								>
									+5m
								</Button>
							)}
						</div>
						{canToggleFreeMode ? (
							<button
								type="button"
								onClick={toggleFreeMode}
								className="text-fg hover:bg-surface-2 cursor-pointer rounded-md px-2 py-0.5 text-sm font-medium transition-colors"
								aria-label={`Switch to ${freeMode === 'rest' ? 'Focus' : 'Rest'} mode`}
								title="Toggle Focus / Rest"
							>
								{phaseLabel}
							</button>
						) : (
							<p className="text-fg text-sm font-medium">{phaseLabel}</p>
						)}
					</div>

					<div className="flex items-center justify-center">
						{sessionActive ? (
							<div className="bg-surface-2 flex items-center gap-1 rounded-md p-1">
								{running ? (
									<Button
										size="sm"
										variant={onBreak || isFreeRest ? 'primary' : 'secondary'}
										onClick={pause}
										aria-label={isFreeRest || onBreak ? 'Pause rest timer' : 'Pause study timer'}
									>
										<Pause size={16} />
										Pause
									</Button>
								) : (
									<Button
										size="sm"
										onClick={start}
										aria-label={isFreeRest || onBreak ? 'Resume rest timer' : 'Resume study timer'}
									>
										<Play size={16} />
										Resume
									</Button>
								)}
								{onBreak && !isFreeRest && (
									<Button size="sm" variant="ghost" onClick={skipBreak} aria-label="Skip break">
										<SkipForward size={16} />
										Skip
									</Button>
								)}
								<Button size="sm" variant="ghost" onClick={reset} aria-label="Reset timer">
									<RotateCcw size={16} />
									Reset
								</Button>
							</div>
						) : (
							<Button onClick={start} disabled={!canStart} aria-label={startLabel}>
								{isFreeRest || onBreak ? <Coffee size={18} /> : <Play size={18} />}
								{startLabel}
							</Button>
						)}
					</div>

					{canEditDuration && (
						<div className="flex flex-wrap justify-center gap-2">
							{FREE_PRESETS.map((minutes) => (
								<Button
									key={minutes}
									size="sm"
									variant="secondary"
									onClick={() => setDurationSeconds(minutes * 60)}
								>
									{minutes}m
								</Button>
							))}
						</div>
					)}

					<div className="space-y-3">
						<Select
							label="Technique"
							value={techniqueId === 'rest' ? STUDY_TECHNIQUE_FREE : techniqueId}
							disabled={locked}
							onChange={(e) => setTechnique(e.target.value)}
						>
							{STUDY_TECHNIQUES.map((t) => (
								<option key={t.id} value={t.id}>
									{t.label}
								</option>
							))}
						</Select>

						<Select
							label="Habit"
							value={attachedHabitId ?? ''}
							disabled={locked}
							onChange={(e) => {
								const id = e.target.value;
								if (!id) {
									setAttachedHabit(null);
									return;
								}
								const habit = habits.find((h) => String(h.id) === String(id));
								setAttachedHabit(habit || null);
							}}
						>
							<option value="">None</option>
							{habits.map((h) => (
								<option key={h.id} value={h.id}>
									{h.name}
								</option>
							))}
						</Select>

						<div className="flex items-end gap-2">
							<div className="min-w-0 flex-1">
								<Select
									label="Alarm"
									value={alarmSound}
									disabled={locked}
									onChange={(e) => setAlarmSound(e.target.value)}
								>
									{STUDY_ALARM_SOUNDS.map((s) => (
										<option key={s.id} value={s.id}>
											{s.label}
										</option>
									))}
								</Select>
							</div>
							<Button
								size="icon"
								variant="secondary"
								disabled={locked}
								onClick={() => previewStudyAlarmSound(alarmSound)}
								aria-label="Preview alarm"
								className="mb-0.5 shrink-0"
							>
								<Volume2 size={16} />
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		</>
	);
}
