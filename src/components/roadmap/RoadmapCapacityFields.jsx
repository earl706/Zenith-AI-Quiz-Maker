import { STUDY_DAY_LABELS } from '../../lib/roadmapCapacity';
import { Input } from '../ui';
import { cn } from '../../lib/format';

/**
 * Shared study-capacity inputs for create/fork and roadmap settings.
 */
export default function RoadmapCapacityFields({
	hoursPerWeek,
	onHoursPerWeek,
	hoursPerDay,
	onHoursPerDay,
	studyDays,
	onStudyDays,
	defaultEstimatedMinutes,
	onDefaultEstimatedMinutes,
	sectionEstimates,
	onSectionEstimate,
	sections = [],
	showSectionEstimates = true,
	compact = false
}) {
	const toggleDay = (day) => {
		const set = new Set(studyDays);
		if (set.has(day)) {
			if (set.size <= 1) return;
			set.delete(day);
		} else {
			set.add(day);
		}
		onStudyDays(Array.from(set).sort((a, b) => a - b));
	};

	return (
		<div className={cn('space-y-3', compact && 'space-y-2')}>
			<div className="grid grid-cols-2 gap-3">
				<Input
					label="Hours / week"
					type="number"
					min={0.25}
					max={168}
					step={0.25}
					value={hoursPerWeek}
					onChange={(e) => onHoursPerWeek(e.target.value)}
				/>
				<Input
					label="Hours / day"
					type="number"
					min={0.25}
					max={24}
					step={0.25}
					value={hoursPerDay}
					onChange={(e) => onHoursPerDay(e.target.value)}
				/>
			</div>
			<div>
				<p className="text-fg mb-1.5 text-xs font-medium">Study days</p>
				<div className="flex flex-wrap gap-1">
					{STUDY_DAY_LABELS.map(({ value, label }) => {
						const on = studyDays.includes(value);
						return (
							<button
								key={value}
								type="button"
								onClick={() => toggleDay(value)}
								className={cn(
									'cursor-pointer rounded-md border px-2 py-1 text-xs font-medium transition-colors',
									on
										? 'border-primary bg-primary/10 text-primary'
										: 'border-line text-muted hover:text-fg'
								)}
							>
								{label}
							</button>
						);
					})}
				</div>
			</div>
			{showSectionEstimates && (
				<Input
					label="Default minutes / section"
					type="number"
					min={1}
					max={1440}
					value={defaultEstimatedMinutes}
					onChange={(e) => onDefaultEstimatedMinutes(e.target.value)}
				/>
			)}
			{showSectionEstimates && sections.length > 0 && (
				<div className="space-y-2">
					<p className="text-muted text-xs">
						Optional per-section estimates (minutes). Leave blank to use the default.
					</p>
					<div className="max-h-40 space-y-1.5 overflow-y-auto">
						{sections.map((section, index) => {
							const key = section.id != null ? String(section.id) : String(index);
							return (
								<div key={key} className="grid grid-cols-[1fr_5.5rem] items-center gap-2">
									<p className="text-fg truncate text-xs">{section.title}</p>
									<Input
										type="number"
										min={1}
										max={1440}
										placeholder={String(defaultEstimatedMinutes || 30)}
										value={sectionEstimates[key] ?? ''}
										onChange={(e) => onSectionEstimate(key, e.target.value, section, index)}
										className="text-xs"
									/>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
