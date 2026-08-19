import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { addDays, format, parseISO, startOfDay, startOfWeek, subDays } from 'date-fns';

import { formatDate } from '../../lib/format';

const YEAR_DAYS = 361;
const WEEK_STARTS_ON = 0;
const WEEKDAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];
const GUTTER = 26;
const GAP = 2;
const MIN_CELL = 7;
const MAX_CELL = 11;

function toDay(value) {
	if (!value) return null;
	return startOfDay(typeof value === 'string' ? parseISO(value) : value);
}

function monthLabelForWeek(week) {
	const first = week.find((day) => {
		if (day.state === 'pad' || day.state === 'future') return false;
		return parseISO(day.date).getDate() === 1;
	});
	return first ? format(parseISO(first.date), 'MMM') : '';
}

function buildYearWeeks(recentLogs = [], createdAt = null) {
	const logSet = new Set(recentLogs);
	const today = startOfDay(new Date());
	const windowStart = subDays(today, YEAR_DAYS - 1);
	const creationDate = toDay(createdAt);
	const gridStart = startOfWeek(windowStart, { weekStartsOn: WEEK_STARTS_ON });
	const gridEnd = addDays(startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON }), 6);

	const weeks = [];
	let cursor = gridStart;
	while (cursor <= gridEnd) {
		const week = [];
		for (let row = 0; row < 7; row += 1) {
			const date = format(cursor, 'yyyy-MM-dd');
			let state = 'missed';
			if (cursor > today) state = 'future';
			else if (cursor < windowStart) state = 'pad';
			else if (creationDate && cursor < creationDate) state = 'empty';
			else if (logSet.has(date)) state = 'completed';
			week.push({
				date,
				state,
				active: state === 'completed'
			});
			cursor = addDays(cursor, 1);
		}
		weeks.push(week);
	}
	return weeks;
}

function computeCellSize(width, weekCount) {
	if (!width || width <= 0 || weekCount <= 0) return MAX_CELL;
	const available = width - GUTTER;
	const size = Math.floor((available - (weekCount - 1) * GAP) / weekCount);
	return Math.max(MIN_CELL, Math.min(MAX_CELL, size || MIN_CELL));
}

function tooltipFixedStyle(rect) {
	if (!rect) return null;
	const center = rect.left + rect.width / 2;
	const pad = 8;
	let left = center;
	let transform = 'translate(-50%, calc(-100% - 6px))';
	if (center < 96) {
		left = Math.max(pad, rect.left);
		transform = 'translate(0, calc(-100% - 6px))';
	} else if (center > window.innerWidth - 96) {
		left = Math.min(window.innerWidth - pad, rect.right);
		transform = 'translate(-100%, calc(-100% - 6px))';
	}
	return { position: 'fixed', top: rect.top, left, transform, zIndex: 99 };
}

function HabitHeatmapTooltip({ day, color, detail, rect }) {
	if (!day?.date || day.state === 'future' || day.state === 'pad' || !rect) return null;

	let status = 'Missed';
	if (day.state === 'empty') status = 'Before habit started';
	else if (day.active) status = 'Completed';

	const accuracyNote =
		detail?.accuracy_met === false && detail?.showed_up
			? 'Showed up · missed accuracy target'
			: detail?.accuracy_met
				? `Accuracy goal met${detail.best_accuracy != null ? ` (${detail.best_accuracy}%)` : ''}`
				: null;

	return (
		<div
			className="border-line bg-surface pointer-events-none rounded-md border px-2 py-1 text-[11px] whitespace-nowrap shadow-lg"
			style={tooltipFixedStyle(rect)}
		>
			<p className="text-muted" style={{ color: day.active ? color : undefined }}>
				{status}
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
	className = ''
}) {
	const containerRef = useRef(null);
	const [hovered, setHovered] = useState(null);
	const [width, setWidth] = useState(0);
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
		const update = () => setWidth(el.clientWidth);
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const weeks = useMemo(() => buildYearWeeks(logs, createdAt), [logs, createdAt]);
	const cell = computeCellSize(width, weeks.length);
	const colWidth = cell + GAP;

	return (
		<div className={`relative ${className}`}>
			<div
				ref={containerRef}
				className="w-full overflow-x-auto overflow-y-hidden"
				aria-label="Habit check-in history for the last year"
			>
				<div style={{ minWidth: GUTTER + weeks.length * colWidth - GAP }}>
					<div className="mb-1 flex" style={{ paddingLeft: GUTTER }}>
						{weeks.map((week, col) => (
							<div
								key={`m-${col}`}
								className="text-muted overflow-visible text-[9px] leading-3 whitespace-nowrap"
								style={{ width: cell, marginRight: col === weeks.length - 1 ? 0 : GAP }}
							>
								{monthLabelForWeek(week)}
							</div>
						))}
					</div>
					<div className="flex">
						<div
							className="text-muted flex shrink-0 flex-col text-[9px] leading-none"
							style={{ width: '12px', gap: GAP }}
						>
							{WEEKDAY_LABELS.map((label, row) => (
								<div key={row} className="flex items-center" style={{ height: cell }}>
									{label}
								</div>
							))}
						</div>
						<div className="flex" style={{ gap: GAP }}>
							{weeks.map((week, col) => (
								<div key={col} className="flex flex-col" style={{ gap: GAP }}>
									{week.map((day, row) => {
										const interactive =
											day.state === 'completed' || day.state === 'missed' || day.state === 'empty';
										const detail = detailByDate.get(day.date);
										const missedAccuracy = detail && detail.showed_up && !detail.accuracy_met;
										const isBlank =
											day.state === 'future' || day.state === 'pad' || day.state === 'empty';

										return (
											<div
												key={`${col}-${row}`}
												onMouseEnter={(e) => {
													if (!interactive) return;
													setHovered({
														day,
														detail,
														rect: e.currentTarget.getBoundingClientRect()
													});
												}}
												onMouseLeave={() => setHovered(null)}
											>
												<div
													className="rounded-[2px]"
													style={{
														width: cell,
														height: cell,
														opacity: day.state === 'future' || day.state === 'pad' ? 0.35 : 1,
														background: isBlank
															? 'var(--surface-2)'
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
														day.state === 'future' || day.state === 'pad'
															? undefined
															: `${formatDate(day.date, 'MMM d')}: ${
																	day.active
																		? 'completed'
																		: day.state === 'empty'
																			? 'before habit started'
																			: 'missed'
																}`
													}
												/>
											</div>
										);
									})}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
			{hovered &&
				typeof document !== 'undefined' &&
				createPortal(
					<HabitHeatmapTooltip
						day={hovered.day}
						color={color}
						detail={hovered.detail}
						rect={hovered.rect}
					/>,
					document.body
				)}
		</div>
	);
}
