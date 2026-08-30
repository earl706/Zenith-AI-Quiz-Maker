import { useState } from 'react';

import { cn, formatDate } from '../../lib/format';
import { formatDuration } from '../../lib/roadmapCapacity';

function tileTooltip(day) {
	const label = formatDate(day.date, 'MMM d, yyyy');
	if (!day.attempts) return `${label}: no quiz activity`;
	const parts = [
		`${day.attempts} attempt${day.attempts === 1 ? '' : 's'}`,
		formatDuration(day.duration_seconds || 0)
	];
	if (day.best_accuracy != null) {
		parts.push(`${Math.round(Number(day.best_accuracy))}% best`);
	}
	return `${label}: ${parts.join(' · ')}`;
}

/**
 * Status-page style quiz activity strip (finished linked-quiz attempts).
 * Default window comes from the API (60 local days). Green = ≥1 completed
 * attempt that day; muted = none. Display-only.
 */
export default function RoadmapActivityStrip({ activity, className, compact = false }) {
	const [tip, setTip] = useState(null);

	const days = activity?.days;
	if (!Array.isArray(days) || !days.length) return null;

	const windowDays = activity.window_days || days.length;
	const activeDays = activity.active_days ?? days.filter((d) => d.attempts > 0).length;
	const barH = compact ? 'h-6' : 'h-7';

	return (
		<div
			className={cn('min-w-0', className)}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
		>
			<div className="mb-1.5 flex items-center justify-between gap-2">
				<p className="text-muted text-[10px] font-medium tracking-wide uppercase">Activity</p>
				<p className="text-muted text-[10px] tabular-nums">
					{activeDays}/{windowDays} active days
				</p>
			</div>
			<div
				className={cn('relative flex w-full items-stretch gap-px', barH)}
				role="img"
				aria-label={`Quiz activity over the last ${windowDays} days: ${activeDays} active`}
			>
				{days.map((day) => {
					const active = (day.attempts || 0) > 0;
					const label = tileTooltip(day);
					return (
						<div
							key={day.date}
							role="presentation"
							aria-label={label}
							title={label}
							className={cn(
								'min-w-0 flex-1 rounded-[1px] transition-opacity',
								active ? 'bg-success hover:opacity-90' : 'bg-surface-2 hover:bg-line'
							)}
							onMouseEnter={(e) => {
								const rect = e.currentTarget.getBoundingClientRect();
								setTip({
									text: label,
									x: rect.left + rect.width / 2,
									y: rect.top
								});
							}}
							onMouseLeave={() => setTip(null)}
						/>
					);
				})}
			</div>
			{tip ? (
				<div
					role="tooltip"
					className="border-line bg-surface text-fg pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 -translate-y-full rounded-md border px-2 py-1 text-[10px] shadow-md"
					style={{ left: tip.x, top: tip.y - 6 }}
				>
					{tip.text}
				</div>
			) : null}
		</div>
	);
}
