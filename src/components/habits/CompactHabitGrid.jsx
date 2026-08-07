import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';

import { formatDate } from '../../lib/format';

function buildHabitWeeks(recentLogs = [], weekCount = 5, createdAt = null) {
	const logSet = new Set(recentLogs);
	const totalCells = weekCount * 7;
	const today = startOfDay(new Date());
	let creationDate = today;
	if (createdAt) {
		creationDate = startOfDay(typeof createdAt === 'string' ? parseISO(createdAt) : createdAt);
	}
	if (creationDate > today) creationDate = today;

	const ageDays = differenceInCalendarDays(today, creationDate) + 1;
	const days = [];

	if (ageDays <= totalCells) {
		for (let i = 0; i < totalCells; i++) {
			const d = addDays(creationDate, i);
			const date = format(d, 'yyyy-MM-dd');
			if (d > today) {
				days.push({ date, active: false, state: 'future' });
			} else {
				const completed = logSet.has(date);
				days.push({ date, active: completed, state: completed ? 'completed' : 'missed' });
			}
		}
	} else {
		const startDate = addDays(today, -(totalCells - 1));
		for (let i = 0; i < totalCells; i++) {
			const d = addDays(startDate, i);
			const date = format(d, 'yyyy-MM-dd');
			const completed = logSet.has(date);
			days.push({ date, active: completed, state: completed ? 'completed' : 'missed' });
		}
	}

	const weeks = [];
	for (let i = 0; i < days.length; i += 7) {
		weeks.push(days.slice(i, i + 7));
	}
	return weeks;
}

const HABIT_GRID_GAP = 3;
const HABIT_MIN_CELL = 10;

function computeHabitGridLayout(width, { minWeeks = 5, maxWeeks = 26 } = {}) {
	if (!width || width <= 0) {
		return { weeks: minWeeks };
	}
	const weeks = Math.min(
		maxWeeks,
		Math.max(minWeeks, Math.floor((width + HABIT_GRID_GAP) / (HABIT_MIN_CELL + HABIT_GRID_GAP)))
	);
	return { weeks };
}

function tileCellRadius(row, col, size = 7) {
	const last = size - 1;
	const parts = ['rounded-sm'];
	if (row === 0 && col === 0) parts.push('rounded-tl-sm');
	if (row === 0 && col === last) parts.push('rounded-tr-sm');
	if (row === last && col === 0) parts.push('rounded-bl-sm');
	if (row === last && col === last) parts.push('rounded-br-sm');
	return parts.join(' ');
}

function HabitHeatmapTooltip({ day, color, detail }) {
	if (!day?.date || day.state === 'future') return null;
	const accuracyNote =
		detail?.accuracy_met === false && detail?.showed_up
			? 'Showed up · missed accuracy target'
			: detail?.accuracy_met
				? `Accuracy goal met${detail.best_accuracy != null ? ` (${detail.best_accuracy}%)` : ''}`
				: null;

	return (
		<div className="border-line bg-surface pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-lg border px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg">
			<p className="text-fg font-medium">{formatDate(day.date, 'EEE, MMM d, yyyy')}</p>
			<p className="text-muted" style={{ color: day.active ? color : undefined }}>
				{day.active ? 'Completed' : 'Missed'}
			</p>
			{accuracyNote && <p className="text-warning mt-0.5">{accuracyNote}</p>}
		</div>
	);
}

export function CompactHabitGrid({
	logs = [],
	logDetails = [],
	createdAt = null,
	color = 'var(--primary)',
	minWeeks = 5,
	maxWeeks = 26,
	className = ''
}) {
	const containerRef = useRef(null);
	const [hovered, setHovered] = useState(null);
	const [layout, setLayout] = useState(() => computeHabitGridLayout(0, { minWeeks, maxWeeks }));
	const detailByDate = useMemo(() => {
		const map = new Map();
		for (const d of logDetails || []) {
			if (d?.date) map.set(d.date, d);
		}
		return map;
	}, [logDetails]);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const update = () => {
			setLayout(computeHabitGridLayout(el.clientWidth, { minWeeks, maxWeeks }));
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	}, [minWeeks, maxWeeks]);

	const gridWeeks = useMemo(
		() => buildHabitWeeks(logs, layout.weeks, createdAt),
		[logs, layout.weeks, createdAt]
	);
	const { weeks } = layout;

	return (
		<div ref={containerRef} className={`w-full ${className}`} aria-label="Habit check-in history">
			<div className="flex w-full" style={{ gap: HABIT_GRID_GAP }}>
				{gridWeeks.map((week, col) => (
					<div key={col} className="flex min-w-0 flex-1 flex-col" style={{ gap: HABIT_GRID_GAP }}>
						{week.map((day, row) => {
							const isFuture = day.state === 'future';
							const isHovered = !isFuture && hovered === day.date;
							const detail = detailByDate.get(day.date);
							const missedAccuracy = detail && detail.showed_up && !detail.accuracy_met;

							return (
								<div
									key={`${col}-${row}`}
									className="relative"
									onMouseEnter={() => !isFuture && setHovered(day.date)}
									onMouseLeave={() => setHovered(null)}
								>
									{isHovered && <HabitHeatmapTooltip day={day} color={color} detail={detail} />}
									<div
										className={`aspect-square w-full transition-colors ${tileCellRadius(row, col, weeks)} ${
											isFuture ? 'border-line border border-dashed opacity-30' : ''
										}`}
										style={{
											background: isFuture
												? 'transparent'
												: day.state === 'completed'
													? missedAccuracy
														? `color-mix(in srgb, ${color} 55%, var(--warning))`
														: color
													: 'var(--surface-2)',
											boxShadow: missedAccuracy
												? 'inset 0 0 0 1px color-mix(in srgb, var(--warning) 70%, transparent)'
												: undefined
										}}
										aria-label={
											isFuture
												? 'Upcoming day'
												: day.date
													? `${formatDate(day.date, 'MMM d')}: ${day.active ? 'completed' : 'missed'}`
													: undefined
										}
									/>
								</div>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
