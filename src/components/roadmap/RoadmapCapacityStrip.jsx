import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../lib/format';
import {
	capacityLoadPct,
	capacityRingTone,
	capacitySpentPct,
	clampCapacityRingPct,
	formatDuration,
	formatMinutesShort
} from '../../lib/roadmapCapacity';
import { ProgressRing } from '../ui';

function CapacityMetric({ title, rawPct, caption, subcaption, size = 44, stroke = 4 }) {
	const tone = capacityRingTone(rawPct);
	const fill = clampCapacityRingPct(rawPct);
	const over = rawPct > 100;
	return (
		<div className="flex min-w-0 items-center gap-2">
			<ProgressRing
				value={fill}
				size={size}
				stroke={stroke}
				tone={tone}
				label={`${Math.round(fill)}`}
			/>
			<div className="min-w-0">
				<p className="text-fg text-[11px] leading-tight font-medium">{title}</p>
				<p
					className={cn(
						'truncate text-[10px] leading-tight',
						over ? (tone === 'danger' ? 'text-danger' : 'text-warning') : 'text-muted'
					)}
				>
					{caption}
				</p>
				{subcaption ? (
					<p className="text-muted truncate text-[10px] leading-tight">{subcaption}</p>
				) : null}
			</div>
		</div>
	);
}

/**
 * Compact Today / Week / Path capacity rings for RoadmapDetail.
 * Mobile: Today only; tap expands Week + Path.
 */
export default function RoadmapCapacityStrip({ budget, progress }) {
	const [expanded, setExpanded] = useState(false);

	if (!budget) return null;

	const todayPlanned = budget.today?.planned_minutes || 0;
	const todayBudget = budget.today?.budget_minutes || 0;
	const weekPlanned = budget.week?.planned_minutes || 0;
	const weekBudget = budget.week?.budget_minutes || 0;
	const pathEst = progress?.estimated_minutes_total || 0;
	const pathSpent = progress?.spent_seconds_total || 0;

	const todayPct = capacityLoadPct(todayPlanned, todayBudget);
	const weekPct = capacityLoadPct(weekPlanned, weekBudget);
	const pathPct = capacitySpentPct(pathSpent, pathEst);

	const todayCaption =
		todayBudget > 0
			? `${formatMinutesShort(todayPlanned)} / ${formatMinutesShort(todayBudget)}`
			: todayPlanned > 0
				? `${formatMinutesShort(todayPlanned)} planned · off day`
				: 'No study day';

	const weekCaption = `${formatMinutesShort(weekPlanned)} / ${formatMinutesShort(weekBudget)}`;
	const pathCaption =
		pathEst > 0 || pathSpent > 0
			? `${formatDuration(pathSpent)} / ${formatMinutesShort(pathEst)} est`
			: 'No remaining estimate';

	const todaySub =
		budget.today?.spent_seconds > 0 ? `Spent ${formatDuration(budget.today.spent_seconds)}` : null;
	const weekSub =
		budget.week?.spent_seconds > 0 ? `Spent ${formatDuration(budget.week.spent_seconds)}` : null;

	const todayMetric = (
		<CapacityMetric title="Today" rawPct={todayPct} caption={todayCaption} subcaption={todaySub} />
	);
	const weekMetric = (
		<CapacityMetric title="Week" rawPct={weekPct} caption={weekCaption} subcaption={weekSub} />
	);
	const pathMetric = <CapacityMetric title="Path" rawPct={pathPct} caption={pathCaption} />;

	return (
		<div className="border-line bg-surface shrink-0 rounded-md border px-2.5 py-2">
			{/* Desktop / large: all three */}
			<div className="hidden items-center gap-4 sm:flex">
				{todayMetric}
				<div className="bg-line h-8 w-px shrink-0" aria-hidden />
				{weekMetric}
				<div className="bg-line h-8 w-px shrink-0" aria-hidden />
				{pathMetric}
			</div>

			{/* Mobile: Today + tap to reveal Week/Path */}
			<div className="sm:hidden">
				<button
					type="button"
					onClick={() => setExpanded((v) => !v)}
					aria-expanded={expanded}
					className="hover:bg-surface-2 flex w-full cursor-pointer items-center gap-2 rounded-md px-0.5 py-0.5 text-left transition-colors"
				>
					<div className="min-w-0 flex-1">{todayMetric}</div>
					<ChevronDown
						size={16}
						className={cn(
							'text-muted shrink-0 transition-transform duration-200',
							expanded && 'rotate-180'
						)}
						aria-hidden
					/>
					<span className="sr-only">{expanded ? 'Hide week and path' : 'Show week and path'}</span>
				</button>
				{expanded && (
					<div className="border-line mt-2 space-y-2 border-t pt-2">
						{weekMetric}
						{pathMetric}
					</div>
				)}
			</div>
		</div>
	);
}
