import { useMemo } from 'react';
import { eachDayOfInterval, format, subDays } from 'date-fns';

import { cn } from '../../lib/format';
import { ActivityHeatmap, defaultGetLevel } from '../analytics/ActivityHeatmap';

/** Match prior Dashboard green scale (theme-aware success). */
export const QUIZ_ACTIVITY_LEVEL_BG = [
	'color-mix(in srgb, var(--fg) 6%, var(--surface))',
	'color-mix(in srgb, var(--success) 22%, var(--surface-2))',
	'color-mix(in srgb, var(--success) 42%, var(--surface-2))',
	'color-mix(in srgb, var(--success) 68%, transparent)',
	'var(--success)'
];

export const QUIZ_ACTIVITY_WINDOW_DAYS = 497;

/** Contiguous zero-intensity days ending today (loading / missing payload). */
export function buildEmptyQuizTimeline(windowDays = QUIZ_ACTIVITY_WINDOW_DAYS, today = new Date()) {
	const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const start = subDays(end, windowDays - 1);
	return eachDayOfInterval({ start, end }).map((d) => ({
		date: format(d, 'yyyy-MM-dd'),
		intensity: 0
	}));
}

/**
 * Dashboard adapter: maps GET /quizzes/quiz/activity/ → generic ActivityHeatmap.
 * Always feeds a full timeline so the grid stays as an empty skeleton when
 * loading or all zeros (never the boilerplate "No activity yet" empty state).
 */
export default function QuizActivityHeatmap({ activity, loading = false, className }) {
	const timeline = useMemo(() => {
		if (Array.isArray(activity?.timeline) && activity.timeline.length) {
			return activity.timeline;
		}
		return buildEmptyQuizTimeline();
	}, [activity]);

	return (
		<ActivityHeatmap
			timeline={timeline}
			emptyLabel="No quiz activity"
			colors={QUIZ_ACTIVITY_LEVEL_BG}
			getLevel={defaultGetLevel}
			className={cn(loading && 'opacity-70', className)}
		/>
	);
}
