import { Check, X } from 'lucide-react';

import { Button } from '../ui';
import { cn } from '../../lib/format';

/**
 * Sticky review bar for AI proposal accept/reject.
 */
export default function QuizAiReviewBar({
	summaryLabel,
	instruction,
	pendingCount,
	onAcceptAll,
	onRejectAll,
	onDone
}) {
	return (
		<div className="border-line bg-bg/95 fixed inset-x-0 bottom-0 z-30 border-t p-3 shadow-lg backdrop-blur">
			<div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<p className="text-fg text-sm font-medium">Review AI changes</p>
					<p className="text-muted truncate text-xs">
						{summaryLabel}
						{pendingCount > 0 ? ` · ${pendingCount} pending` : ' · all reviewed'}
						{instruction ? ` · “${instruction}”` : ''}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<Button variant="ghost" size="sm" className="cursor-pointer" onClick={onRejectAll}>
						<X size={14} /> Reject all
					</Button>
					<Button variant="secondary" size="sm" className="cursor-pointer" onClick={onAcceptAll}>
						<Check size={14} /> Accept all
					</Button>
					<Button size="sm" className="cursor-pointer" onClick={onDone}>
						Done
					</Button>
				</div>
			</div>
		</div>
	);
}

/** Per-card accept/reject controls + status badge. */
export function QuizAiChangeControls({ meta, onAccept, onReject, className }) {
	if (!meta || meta.kind === 'unchanged' || meta.status === 'accept' || meta.status === 'reject') {
		return null;
	}
	if (meta.status !== 'pending') return null;

	const label = meta.kind === 'added' ? 'Added' : meta.kind === 'removed' ? 'Removed' : 'Modified';

	return (
		<div className={cn('flex items-center gap-1', className)}>
			<span
				className={cn(
					'rounded px-1.5 py-0.5 text-[0.65rem] font-medium',
					meta.kind === 'added' && 'bg-success/15 text-success',
					meta.kind === 'modified' && 'bg-warning/15 text-warning',
					meta.kind === 'removed' && 'bg-danger/15 text-danger'
				)}
			>
				{label}
			</span>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 cursor-pointer"
				aria-label="Accept change"
				title="Accept"
				onClick={onAccept}
			>
				<Check size={14} className="text-success" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 cursor-pointer"
				aria-label="Reject change"
				title="Reject"
				onClick={onReject}
			>
				<X size={14} className="text-danger" />
			</Button>
		</div>
	);
}
