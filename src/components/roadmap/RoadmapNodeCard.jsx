import { BookOpen, GitBranch, Lock, Pencil, Sparkles, Target } from 'lucide-react';

import { cn, formatDate } from '../../lib/format';
import { Badge } from '../ui';

export function resolveNodeQuizUuid(node, sourceQuizUuid) {
	const raw = node?.quiz_uuid ?? sourceQuizUuid;
	if (raw == null || raw === '') return null;
	return String(raw);
}

function NodeIconButton({ title, onClick, children, className }) {
	return (
		<button
			type="button"
			title={title}
			aria-label={title}
			onClick={onClick}
			className={cn(
				'text-fg hover:bg-surface-2 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors',
				className
			)}
		>
			{children}
		</button>
	);
}

/**
 * Shared roadmap section row used by Roadmap detail and Dashboard Due Today.
 */
export default function RoadmapNodeCard({
	node,
	onEdit,
	compact = false,
	sourceQuizUuid = null,
	onViewQuiz,
	onAttemptSection,
	onUnlinkedQuiz,
	showEdit = true
}) {
	const meta = (
		<>
			{node.roadmap_title ? `${node.roadmap_title} · ` : ''}
			{node.qualifying_attempts}/{node.mastery_attempts_required} at ≥
			{node.mastery_accuracy_threshold}%
			{node.due_date ? ` · ${formatDate(node.due_date, 'MMM d')}` : ''}
			{node.overdue ? ' · overdue' : ''}
		</>
	);
	const icon =
		node.status === 'locked' ? (
			<Lock size={compact ? 12 : 16} className="text-muted shrink-0" />
		) : node.status === 'mastered' ? (
			<Sparkles size={compact ? 12 : 16} className="text-success shrink-0" />
		) : (
			<GitBranch size={compact ? 12 : 16} className="text-primary shrink-0" />
		);

	const quizUuid = resolveNodeQuizUuid(node, sourceQuizUuid);
	const showQuizActions = node.status === 'available' && Boolean(quizUuid);
	const showUnlinkedHint = node.status === 'available' && !quizUuid && Boolean(onUnlinkedQuiz);

	const actions = (
		<div className="flex shrink-0 items-center gap-0.5">
			{node.overdue && (
				<Badge tone="danger" className="mr-1 px-1.5 py-0 text-[10px]">
					Overdue
				</Badge>
			)}
			{showQuizActions && (
				<>
					<NodeIconButton title={`View quiz for ${node.title}`} onClick={() => onViewQuiz?.(node)}>
						<BookOpen size={compact ? 13 : 14} />
					</NodeIconButton>
					<NodeIconButton
						title={`Attempt section ${node.title}`}
						onClick={() => onAttemptSection?.(node)}
					>
						<Target size={compact ? 13 : 14} />
					</NodeIconButton>
				</>
			)}
			{showUnlinkedHint && (
				<NodeIconButton
					title="No linked quiz — create or match a quiz to attempt this section"
					onClick={() => onUnlinkedQuiz?.(node)}
					className="text-muted"
				>
					<BookOpen size={compact ? 13 : 14} />
				</NodeIconButton>
			)}
			{showEdit && (
				<NodeIconButton
					title={`Edit requirements for ${node.title}`}
					onClick={() => onEdit?.(node)}
				>
					<Pencil size={compact ? 13 : 14} />
				</NodeIconButton>
			)}
		</div>
	);

	if (compact) {
		return (
			<div className="border-line flex min-h-8 items-center gap-1.5 rounded border px-2 py-1">
				{icon}
				<p className="text-fg min-w-0 flex-1 truncate text-xs leading-tight">
					<span className="font-medium">{node.title}</span>
					<span className="text-muted font-normal"> · {meta}</span>
				</p>
				{actions}
			</div>
		);
	}

	return (
		<div className="border-line flex items-center gap-3 rounded-md border p-3">
			{icon}
			<div className="min-w-0 flex-1">
				<p className="text-fg truncate text-sm font-medium">{node.title}</p>
				<p className="text-muted text-xs">{meta}</p>
			</div>
			{actions}
		</div>
	);
}
