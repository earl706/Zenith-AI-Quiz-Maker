import { useEffect, useRef } from 'react';
import { BellOff, VolumeX } from 'lucide-react';

import { startStudyAlarm } from '../../lib/studyAlarm';
import {
	getTechnique,
	isStructuredTechnique,
	STUDY_TECHNIQUE_FREE
} from '../../lib/studyTechniques';
import { formatDurationSeconds } from '../../lib/format';
import { useStudyTimerStore } from '../../stores/studyTimerStore';
import { toast } from '../../stores/toastStore';
import { Button } from '../ui';

function toastAfterAlarm(action) {
	if (action === 'start_break') {
		const { phase } = useStudyTimerStore.getState();
		const breakLabel = phase === 'long_break' ? 'Long break' : 'Short break';
		toast.success(`${breakLabel} started — rest up.`);
		return;
	}
	if (action === 'start_focus') {
		const tech = getTechnique(useStudyTimerStore.getState().techniqueId);
		toast.success(`${tech.label} — focus round started.`);
	}
}

export function StudyTimerEngine() {
	const syncTick = useStudyTimerStore((s) => s.syncTick);
	const startAlarm = useStudyTimerStore((s) => s.startAlarm);
	const resolveAfterAlarm = useStudyTimerStore((s) => s.resolveAfterAlarm);
	const stopAlarmSound = useStudyTimerStore((s) => s.stopAlarmSound);
	const alarmActive = useStudyTimerStore((s) => s.alarmActive);
	const alarmCompletedPhase = useStudyTimerStore((s) => s.alarmCompletedPhase);
	const pendingAfterAlarm = useStudyTimerStore((s) => s.pendingAfterAlarm);
	const finishingRef = useRef(false);

	const handleAlarmDismiss = () => {
		const action = resolveAfterAlarm();
		toastAfterAlarm(action);
	};

	const finishFocusPhase = () => {
		if (finishingRef.current) return;
		finishingRef.current = true;
		try {
			const state = useStudyTimerStore.getState();
			const structured = isStructuredTechnique(state.techniqueId);
			const payload = state.getSessionPayload();
			const seconds = Math.max(0, Math.floor(Number(payload.actualSeconds) || 0));

			if (seconds > 0) {
				toast.success(`Focus complete — ${formatDurationSeconds(seconds)}.`);
			}

			useStudyTimerStore.setState({
				pendingAfterAlarm: structured ? 'start_break' : 'finish_free'
			});
			startAlarm('focus');
			startStudyAlarm(state.alarmSound);
		} finally {
			finishingRef.current = false;
		}
	};

	const finishBreakPhase = () => {
		if (finishingRef.current) return;
		finishingRef.current = true;
		try {
			useStudyTimerStore.setState({ pendingAfterAlarm: 'start_focus' });
			startAlarm('break');
			startStudyAlarm('soft');
		} finally {
			finishingRef.current = false;
		}
	};

	const finishRestPhase = () => {
		if (finishingRef.current) return;
		finishingRef.current = true;
		try {
			const seconds = Math.max(
				0,
				Math.floor(Number(useStudyTimerStore.getState().getSessionPayload().actualSeconds) || 0)
			);
			if (seconds > 0) {
				toast.success(`Rest complete — ${formatDurationSeconds(seconds)}.`);
			}
			useStudyTimerStore.setState({ pendingAfterAlarm: 'finish_free' });
			startAlarm('rest');
			startStudyAlarm('soft');
		} finally {
			finishingRef.current = false;
		}
	};

	const onIntervalEnd = () => {
		const { techniqueId, phase, freeMode } = useStudyTimerStore.getState();
		if (techniqueId === STUDY_TECHNIQUE_FREE && freeMode === 'rest') {
			finishRestPhase();
		} else if (isStructuredTechnique(techniqueId) && phase !== 'focus') {
			finishBreakPhase();
		} else {
			finishFocusPhase();
		}
	};

	const onIntervalEndRef = useRef(onIntervalEnd);
	onIntervalEndRef.current = onIntervalEnd;

	useEffect(() => {
		const state = useStudyTimerStore.getState();
		if (state.running && state.endAt != null && state.endAt <= Date.now()) {
			onIntervalEndRef.current();
		} else if (state.running) {
			syncTick();
		}
	}, [syncTick]);

	useEffect(() => {
		const id = window.setInterval(() => {
			if (syncTick()) onIntervalEndRef.current();
		}, 250);
		return () => window.clearInterval(id);
	}, [syncTick]);

	const restAlarm = alarmCompletedPhase === 'rest';
	const breakAlarm = alarmCompletedPhase === 'break';
	const alarmTitle = restAlarm
		? 'Rest finished'
		: breakAlarm
			? 'Break finished'
			: 'Study timer finished';
	const alarmHint = restAlarm
		? 'Stop the alarm when you are ready.'
		: breakAlarm
			? 'Stop the alarm to start your next focus round.'
			: pendingAfterAlarm === 'start_break'
				? 'Stop the alarm to start your break.'
				: 'Stop the alarm to continue.';

	if (!alarmActive) return null;

	return (
		<div className="fixed bottom-6 left-1/2 z-50 w-[min(100%,24rem)] -translate-x-1/2 px-4 sm:px-0">
			<div className="border-line bg-surface flex flex-col gap-3 rounded-lg border px-4 py-3 shadow-xl sm:flex-row sm:items-center">
				<div className="min-w-0 flex-1">
					<p className="text-fg text-sm font-medium">{alarmTitle}</p>
					<p className="text-muted mt-0.5 text-xs">{alarmHint}</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button size="sm" variant="ghost" onClick={stopAlarmSound}>
						<VolumeX size={15} />
						Stop sound
					</Button>
					<Button size="sm" onClick={handleAlarmDismiss}>
						<BellOff size={15} />
						Stop alarm
					</Button>
				</div>
			</div>
		</div>
	);
}
