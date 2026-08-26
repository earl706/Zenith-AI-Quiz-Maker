import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_STUDY_ALARM_SOUND, stopStudyAlarm } from '../lib/studyAlarm';
import { hmsFromSeconds, secondsFromHms } from '../lib/studyTimerFormat';
import {
	STUDY_TECHNIQUE_FREE,
	STUDY_TECHNIQUE_POMODORO,
	getBreakPhase,
	getBreakSeconds,
	getTechnique,
	isStructuredTechnique
} from '../lib/studyTechniques';

const DEFAULT_SECONDS = 25 * 60;

function applyDuration(set, total) {
	const normalized = Math.max(0, Math.floor(Number(total) || 0));
	const hms = hmsFromSeconds(normalized);
	set({
		totalSeconds: normalized,
		remainingSeconds: normalized,
		inputHours: hms.hours,
		inputMinutes: hms.minutes,
		inputSeconds: hms.seconds
	});
}

function countsAsFocus(s) {
	if (s.techniqueId === STUDY_TECHNIQUE_FREE) return s.freeMode !== 'rest';
	return s.phase === 'focus';
}

function normalizePersistedTechnique(partial) {
	if (!partial || typeof partial !== 'object') return partial;
	const next = { ...partial };
	if (next.techniqueId === 'rest') {
		next.techniqueId = STUDY_TECHNIQUE_FREE;
		next.freeMode = 'rest';
	}
	if (next.freeMode !== 'rest' && next.freeMode !== 'focus') {
		next.freeMode = 'focus';
	}
	return next;
}

export function selectIntervalActive(s) {
	if (s.remainingSeconds <= 0) return false;
	if (isStructuredTechnique(s.techniqueId) && s.phase !== 'focus') {
		return s.running || s.remainingSeconds < s.totalSeconds;
	}
	return Boolean(s.startedAt);
}

export function selectOnBreak(s) {
	if (s.techniqueId === STUDY_TECHNIQUE_FREE && s.freeMode === 'rest') return true;
	return isStructuredTechnique(s.techniqueId) && s.phase !== 'focus';
}

export function selectIsFreeRest(s) {
	return s.techniqueId === STUDY_TECHNIQUE_FREE && s.freeMode === 'rest';
}

export const useStudyTimerStore = create(
	persist(
		(set, get) => ({
			totalSeconds: DEFAULT_SECONDS,
			remainingSeconds: DEFAULT_SECONDS,
			running: false,
			endAt: null,
			startedAt: null,
			interruptions: 0,
			inputHours: 0,
			inputMinutes: 25,
			inputSeconds: 0,
			alarmActive: false,
			alarmStartedAt: null,
			alarmCompletedPhase: null,
			pendingAfterAlarm: null,
			alarmSound: DEFAULT_STUDY_ALARM_SOUND,
			techniqueId: STUDY_TECHNIQUE_POMODORO,
			phase: 'focus',
			freeMode: 'focus',
			pomodoroCount: 0,

			setAlarmSound: (alarmSound) => {
				const s = get();
				if (s.running || selectIntervalActive(s) || s.alarmActive) return;
				set({ alarmSound });
			},

			setTechnique: (techniqueId) => {
				const s = get();
				if (s.running || selectIntervalActive(s) || s.alarmActive) return;
				const tech = getTechnique(techniqueId);
				if (!isStructuredTechnique(techniqueId)) {
					set({
						techniqueId: STUDY_TECHNIQUE_FREE,
						phase: 'focus',
						pomodoroCount: 0,
						running: false,
						endAt: null,
						startedAt: null,
						interruptions: 0
					});
					return;
				}
				set({
					techniqueId,
					phase: 'focus',
					pomodoroCount: 0,
					running: false,
					endAt: null,
					startedAt: null,
					interruptions: 0
				});
				applyDuration(set, tech.focusSeconds);
			},

			toggleFreeMode: () => {
				const s = get();
				if (s.running || selectIntervalActive(s) || s.alarmActive) return;
				if (s.techniqueId !== STUDY_TECHNIQUE_FREE) return;
				set({ freeMode: s.freeMode === 'rest' ? 'focus' : 'rest' });
			},

			startAlarm: (completedPhase) =>
				set({
					alarmActive: true,
					alarmStartedAt: Date.now(),
					alarmCompletedPhase: completedPhase
				}),

			stopAlarmSound: () => {
				stopStudyAlarm();
			},

			resolveAfterAlarm: () => {
				stopStudyAlarm();
				const s = get();
				const pending = s.pendingAfterAlarm;
				set({
					alarmActive: false,
					alarmStartedAt: null,
					alarmCompletedPhase: null,
					pendingAfterAlarm: null
				});
				if (pending === 'start_break') {
					get().advanceToBreak();
					return 'start_break';
				}
				if (pending === 'start_focus') {
					get().advanceToFocus();
					get().start();
					return 'start_focus';
				}
				if (pending === 'finish_free') {
					get().clearAfterFinish();
					return 'finish_free';
				}
				return null;
			},

			setDurationSeconds: (total) => {
				const s = get();
				if (s.running || selectIntervalActive(s) || isStructuredTechnique(s.techniqueId)) return;
				const capped = Math.min(99 * 3600 + 59 * 60 + 59, Math.max(0, Math.floor(total)));
				applyDuration(set, capped);
			},

			addDuration: (delta) => {
				const s = get();
				if (s.running || selectIntervalActive(s) || isStructuredTechnique(s.techniqueId)) return;
				get().setDurationSeconds(s.remainingSeconds + delta);
			},

			start: () => {
				const s = get();
				if (s.running) return;
				let remaining = s.remainingSeconds;
				if (remaining <= 0) {
					if (isStructuredTechnique(s.techniqueId) && s.phase === 'focus') {
						remaining = getTechnique(s.techniqueId).focusSeconds;
					} else {
						const total = secondsFromHms(s.inputHours, s.inputMinutes, s.inputSeconds);
						if (total <= 0) return;
						remaining = total;
					}
					applyDuration(set, remaining);
				}
				const now = Date.now();
				const structuredFocus = isStructuredTechnique(s.techniqueId) && s.phase === 'focus';
				const freeform = !isStructuredTechnique(s.techniqueId);
				set({
					running: true,
					remainingSeconds: remaining,
					endAt: now + remaining * 1000,
					startedAt: structuredFocus || freeform ? s.startedAt || new Date(now).toISOString() : null
				});
			},

			pause: () => {
				const s = get();
				if (!s.running) return;
				const remaining = s.endAt
					? Math.max(0, Math.ceil((s.endAt - Date.now()) / 1000))
					: s.remainingSeconds;
				set({
					running: false,
					endAt: null,
					remainingSeconds: remaining,
					interruptions: countsAsFocus(s) ? s.interruptions + 1 : s.interruptions
				});
			},

			reset: () => {
				const s = get();
				stopStudyAlarm();
				const tech = getTechnique(s.techniqueId);
				const total = isStructuredTechnique(s.techniqueId)
					? tech.focusSeconds
					: s.totalSeconds ||
						secondsFromHms(s.inputHours, s.inputMinutes, s.inputSeconds) ||
						DEFAULT_SECONDS;
				applyDuration(set, total);
				set({
					running: false,
					endAt: null,
					startedAt: null,
					interruptions: 0,
					phase: 'focus',
					pomodoroCount: 0,
					alarmActive: false,
					alarmStartedAt: null,
					alarmCompletedPhase: null,
					pendingAfterAlarm: null
				});
			},

			skipBreak: () => {
				const s = get();
				if (!isStructuredTechnique(s.techniqueId) || s.phase === 'focus') return;
				stopStudyAlarm();
				set({
					alarmActive: false,
					alarmStartedAt: null,
					alarmCompletedPhase: null,
					pendingAfterAlarm: null
				});
				get().advanceToFocus();
				get().start();
			},

			advanceToBreak: () => {
				const s = get();
				const tech = getTechnique(s.techniqueId);
				if (!isStructuredTechnique(s.techniqueId)) return;

				const nextCount = s.pomodoroCount + 1;
				const breakSeconds = getBreakSeconds(tech, nextCount);
				const phase = getBreakPhase(tech, nextCount);
				const now = Date.now();

				applyDuration(set, breakSeconds);
				set({
					pomodoroCount: nextCount,
					phase,
					running: true,
					endAt: now + breakSeconds * 1000,
					startedAt: null,
					interruptions: 0
				});
			},

			advanceToFocus: () => {
				const s = get();
				const tech = getTechnique(s.techniqueId);
				if (!isStructuredTechnique(s.techniqueId)) return;

				applyDuration(set, tech.focusSeconds);
				set({
					phase: 'focus',
					running: false,
					endAt: null,
					startedAt: null,
					interruptions: 0
				});
			},

			syncTick: () => {
				const s = get();
				if (!s.running || s.endAt == null) return false;
				const remaining = Math.max(0, Math.ceil((s.endAt - Date.now()) / 1000));
				if (remaining <= 0) {
					set({ running: false, endAt: null, remainingSeconds: 0 });
					return true;
				}
				if (remaining !== s.remainingSeconds) set({ remainingSeconds: remaining });
				return false;
			},

			getSessionPayload: () => {
				const s = get();
				const totalSeconds = Math.max(0, Math.floor(Number(s.totalSeconds) || 0));
				const remainingSeconds = Math.max(0, Math.floor(Number(s.remainingSeconds) || 0));
				const elapsed = Math.max(0, totalSeconds - remainingSeconds);
				const actualSeconds = elapsed || totalSeconds;
				return {
					startedAt: s.startedAt || new Date().toISOString(),
					plannedSeconds: totalSeconds,
					actualSeconds,
					techniqueId: s.techniqueId,
					phase: s.phase,
					freeMode: s.freeMode
				};
			},

			clearAfterFinish: () => {
				const { inputHours, inputMinutes, inputSeconds, techniqueId } = get();
				const tech = getTechnique(techniqueId);
				const total = isStructuredTechnique(techniqueId)
					? tech.focusSeconds
					: secondsFromHms(inputHours, inputMinutes, inputSeconds) || DEFAULT_SECONDS;
				applyDuration(set, total);
				set({
					running: false,
					endAt: null,
					startedAt: null,
					interruptions: 0,
					phase: 'focus',
					pomodoroCount: 0
				});
			}
		}),
		{
			name: 'zenith-study-timer',
			partialize: (s) => ({
				totalSeconds: s.totalSeconds,
				remainingSeconds: s.remainingSeconds,
				running: s.running,
				endAt: s.endAt,
				startedAt: s.startedAt,
				interruptions: s.interruptions,
				inputHours: s.inputHours,
				inputMinutes: s.inputMinutes,
				inputSeconds: s.inputSeconds,
				alarmSound: s.alarmSound,
				techniqueId: s.techniqueId,
				phase: s.phase,
				freeMode: s.freeMode,
				pomodoroCount: s.pomodoroCount
			}),
			merge: (persisted, current) => {
				const next = {
					...current,
					...normalizePersistedTechnique(persisted)
				};
				delete next.attachmentType;
				delete next.attachedHabitId;
				delete next.attachedHabitName;
				delete next.habitDefaultApplied;
				return next;
			}
		}
	)
);
