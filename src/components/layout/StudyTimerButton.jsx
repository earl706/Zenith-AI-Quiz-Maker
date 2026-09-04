import { useState } from 'react';
import {
	Bell,
	Brain,
	Coffee,
	Gauge,
	Hourglass,
	Music2,
	Pause,
	Play,
	Radio,
	RotateCcw,
	SkipForward,
	Timer,
	Volume1,
	Zap
} from 'lucide-react';

import { previewStudyAlarmSound, STUDY_ALARM_SOUNDS } from '../../lib/studyAlarm';
import { cn } from '../../lib/format';
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
import { Button, Modal, ProgressRing } from '../ui';

const FREE_PRESETS = [15, 25, 45, 60];
const DIAL_ADJUST_SECONDS = 5 * 60;

const TECHNIQUE_ICONS = {
	pomodoro: Timer,
	'52-17': Hourglass,
	'deep-work': Brain,
	[STUDY_TECHNIQUE_FREE]: Gauge
};

const TECHNIQUE_SHORT_LABELS = {
	pomodoro: 'Pomodoro',
	'52-17': '52/17',
	'deep-work': 'Deep',
	[STUDY_TECHNIQUE_FREE]: 'Free'
};

const ALARM_ICONS = {
	chime: Music2,
	bell: Bell,
	digital: Radio,
	soft: Volume1,
	urgent: Zap
};

function IconChoice({ selected, disabled, icon: Icon, label, onClick, ariaLabel }) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			aria-label={ariaLabel || label}
			aria-pressed={selected}
			title={label}
			className={cn(
				'inline-flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-1 transition-colors duration-150',
				'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
				'disabled:pointer-events-none disabled:opacity-50',
				selected ? 'text-primary' : 'text-muted hover:text-fg'
			)}
		>
			<Icon size={16} aria-hidden />
			<span className="text-xxs max-w-full truncate font-medium tracking-wide">{label}</span>
		</button>
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
	const activeTechniqueId = techniqueId === 'rest' ? STUDY_TECHNIQUE_FREE : techniqueId;

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
						<div className="space-y-1.5">
							<p className="text-fg text-sm font-medium">Technique</p>
							<div className="flex gap-1.5" role="group" aria-label="Technique">
								{STUDY_TECHNIQUES.map((t) => {
									const Icon = TECHNIQUE_ICONS[t.id] || Timer;
									const shortLabel = TECHNIQUE_SHORT_LABELS[t.id] || t.label;
									return (
										<IconChoice
											key={t.id}
											icon={Icon}
											label={shortLabel}
											ariaLabel={t.label}
											selected={activeTechniqueId === t.id}
											disabled={locked}
											onClick={() => setTechnique(t.id)}
										/>
									);
								})}
							</div>
						</div>

						<div className="space-y-1.5">
							<p className="text-fg text-sm font-medium">Alarm</p>
							<div className="flex gap-1.5" role="group" aria-label="Alarm">
								{STUDY_ALARM_SOUNDS.map((s) => {
									const Icon = ALARM_ICONS[s.id] || Bell;
									return (
										<IconChoice
											key={s.id}
											icon={Icon}
											label={s.label}
											ariaLabel={`${s.label} alarm`}
											selected={alarmSound === s.id}
											disabled={locked}
											onClick={() => {
												setAlarmSound(s.id);
												previewStudyAlarmSound(s.id);
											}}
										/>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</Modal>
		</>
	);
}
