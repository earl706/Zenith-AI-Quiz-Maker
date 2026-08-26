/** Shared helpers for roadmap study capacity + time display. */

export const DEFAULT_STUDY_DAYS = [0, 1, 2, 3, 4]; // Mon–Fri
export const DEFAULT_HOURS_PER_WEEK = '5';
export const DEFAULT_HOURS_PER_DAY = '1';
export const DEFAULT_ESTIMATED_MINUTES = '30';

export const STUDY_DAY_LABELS = [
	{ value: 0, label: 'Mon' },
	{ value: 1, label: 'Tue' },
	{ value: 2, label: 'Wed' },
	{ value: 3, label: 'Thu' },
	{ value: 4, label: 'Fri' },
	{ value: 5, label: 'Sat' },
	{ value: 6, label: 'Sun' }
];

export function formatDuration(seconds) {
	const s = Math.max(0, Math.round(Number(seconds) || 0));
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	const rem = m % 60;
	return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function formatMinutes(minutes) {
	const m = Math.max(0, Math.round(Number(minutes) || 0));
	if (m < 60) return `${m} min`;
	const h = Math.floor(m / 60);
	const rem = m % 60;
	return rem ? `${h}h ${rem}m` : `${h}h`;
}

/** Compact minutes for ring captions (e.g. 43m, 1h 20m). */
export function formatMinutesShort(minutes) {
	const m = Math.max(0, Math.round(Number(minutes) || 0));
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	const rem = m % 60;
	return rem ? `${h}h ${rem}m` : `${h}h`;
}

/**
 * Study time ratio: spent seconds ÷ budget/estimate minutes.
 * Used for Today/Week (spent÷budget) and Path (spent÷remaining estimate).
 * Raw may exceed 100 when over budget/estimate.
 */
export function capacitySpentPct(spentSeconds, estimatedMinutes) {
	const spentMin = Math.max(0, Number(spentSeconds) || 0) / 60;
	const est = Math.max(0, Number(estimatedMinutes) || 0);
	if (est <= 0) return spentMin > 0 ? 100 : 0;
	return (spentMin / est) * 100;
}

/** Clamp display fill to 0–100; tone warns/dangers when raw load is over budget. */
export function capacityRingTone(rawPct) {
	const pct = Number(rawPct) || 0;
	if (pct > 125) return 'danger';
	if (pct > 100) return 'warning';
	return 'primary';
}

export function clampCapacityRingPct(rawPct) {
	return Math.max(0, Math.min(100, Number(rawPct) || 0));
}

export function buildCapacityPayload({
	hoursPerWeek,
	hoursPerDay,
	studyDays,
	defaultEstimatedMinutes,
	sectionEstimates = {},
	sections = []
}) {
	const payload = {
		hours_per_week: Number(hoursPerWeek) || 5,
		hours_per_day: Number(hoursPerDay) || 1,
		study_days: studyDays?.length ? studyDays : DEFAULT_STUDY_DAYS,
		default_estimated_minutes: Number(defaultEstimatedMinutes) || 30
	};

	const estimates = [];
	for (const [key, raw] of Object.entries(sectionEstimates)) {
		if (raw === '' || raw == null) continue;
		const minutes = Number(raw);
		if (!Number.isFinite(minutes) || minutes < 1) continue;
		const section = sections.find((s, i) => String(s.id) === key || String(i) === key);
		const entry = { estimated_minutes: Math.round(minutes) };
		if (section?.id != null) entry.section_id = section.id;
		else entry.index = Number(key);
		estimates.push(entry);
	}
	if (estimates.length) payload.section_estimates = estimates;
	return payload;
}

export function toastIfDeadlineExtended(data, toast) {
	const meta = data?.schedule_meta || data?.daily_plan?.time_budget?.schedule;
	if (meta?.deadline_extended && meta?.deadline) {
		toast.info(`Deadline extended to ${meta.deadline} so the plan fits your study capacity.`);
	}
}
