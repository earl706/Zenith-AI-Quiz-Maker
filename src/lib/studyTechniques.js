export const STUDY_TECHNIQUE_FREE = 'free';
export const STUDY_TECHNIQUE_POMODORO = 'pomodoro';

export const STUDY_TECHNIQUES = [
	{
		id: STUDY_TECHNIQUE_POMODORO,
		label: 'Pomodoro',
		description: '25 min focus · 5 min break · 15 min long break every 4 rounds',
		focusSeconds: 25 * 60,
		shortBreakSeconds: 5 * 60,
		longBreakSeconds: 15 * 60,
		cyclesBeforeLongBreak: 4
	},
	{
		id: '52-17',
		label: '52 / 17',
		description: '52 min focus · 17 min rest',
		focusSeconds: 52 * 60,
		shortBreakSeconds: 17 * 60,
		longBreakSeconds: null,
		cyclesBeforeLongBreak: null
	},
	{
		id: 'deep-work',
		label: 'Deep work',
		description: '50 min focus · 10 min break · 30 min long break every 3 rounds',
		focusSeconds: 50 * 60,
		shortBreakSeconds: 10 * 60,
		longBreakSeconds: 30 * 60,
		cyclesBeforeLongBreak: 3
	},
	{
		id: STUDY_TECHNIQUE_FREE,
		label: 'Free timer',
		description: 'Set any duration — toggle Focus or Rest',
		focusSeconds: null,
		shortBreakSeconds: null,
		longBreakSeconds: null,
		cyclesBeforeLongBreak: null
	}
];

export function getTechnique(id) {
	return STUDY_TECHNIQUES.find((t) => t.id === id) ?? STUDY_TECHNIQUES[0];
}

export function isFreeformTechnique(id) {
	return id === STUDY_TECHNIQUE_FREE;
}

export function isStructuredTechnique(id) {
	return Boolean(id) && !isFreeformTechnique(id);
}

export function getPhaseLabel(phase, techniqueId, pomodoroCount, freeMode = 'focus') {
	if (techniqueId === STUDY_TECHNIQUE_FREE) {
		return freeMode === 'rest' ? 'Rest' : 'Focus';
	}
	if (!isStructuredTechnique(techniqueId)) return 'Focus';
	if (phase === 'long_break') return 'Long break';
	if (phase === 'short_break') return 'Short break';
	const round = Math.max(1, pomodoroCount + 1);
	return `Focus · Round ${round}`;
}

export function getBreakSeconds(technique, pomodoroCountAfterFocus) {
	if (!technique?.shortBreakSeconds) return 0;
	const useLong =
		technique.longBreakSeconds &&
		technique.cyclesBeforeLongBreak &&
		pomodoroCountAfterFocus % technique.cyclesBeforeLongBreak === 0;
	return useLong ? technique.longBreakSeconds : technique.shortBreakSeconds;
}

export function getBreakPhase(technique, pomodoroCountAfterFocus) {
	if (!technique?.shortBreakSeconds) return 'short_break';
	const useLong =
		technique.longBreakSeconds &&
		technique.cyclesBeforeLongBreak &&
		pomodoroCountAfterFocus % technique.cyclesBeforeLongBreak === 0;
	return useLong ? 'long_break' : 'short_break';
}
