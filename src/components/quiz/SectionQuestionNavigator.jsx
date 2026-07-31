import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../lib/format';
import { Select } from '../ui';

export default function SectionQuestionNavigator({
	groups,
	sectionPage,
	onSectionPageChange,
	className
}) {
	if (!groups?.length) return null;

	const total = groups.length;
	const current = groups[Math.min(sectionPage, total - 1)] ?? groups[0];
	const title = current?.section?.title || 'Questions';
	const questionCount = current?.questions?.length ?? 0;
	const page = Math.min(sectionPage, total - 1);

	return (
		<div
			className={cn(
				'border-line bg-surface sticky top-0 z-10 space-y-3 rounded-md border p-3 shadow-sm',
				className
			)}
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-muted text-[0.65rem] font-semibold tracking-wide uppercase">
						Section {page + 1} of {total}
					</p>
					<p className="text-fg truncate text-sm font-semibold">{title}</p>
					<p className="text-muted text-xs">
						{questionCount} question{questionCount === 1 ? '' : 's'}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<button
						type="button"
						disabled={page <= 0}
						onClick={() => onSectionPageChange(page - 1)}
						className="border-line text-muted hover:text-fg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border disabled:cursor-default disabled:opacity-40"
						aria-label="Previous section"
					>
						<ChevronLeft size={16} />
					</button>
					<button
						type="button"
						disabled={page >= total - 1}
						onClick={() => onSectionPageChange(page + 1)}
						className="border-line text-muted hover:text-fg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border disabled:cursor-default disabled:opacity-40"
						aria-label="Next section"
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
			{total > 6 && (
				<Select
					label="Jump to section"
					value={String(page)}
					onChange={(e) => onSectionPageChange(Number.parseInt(e.target.value, 10))}
					className="text-sm"
				>
					{groups.map((group, index) => (
						<option key={group.section?.id ?? group.section?.clientKey ?? index} value={index}>
							{index + 1}. {group.section?.title || 'Questions'}
						</option>
					))}
				</Select>
			)}
		</div>
	);
}
