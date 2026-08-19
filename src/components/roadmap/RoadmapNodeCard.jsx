import { useState } from 'react';
import {
	AlertCircle,
	BookOpen,
	GitBranch,
	Loader2,
	Lock,
	Pencil,
	Sparkles,
	Target
} from 'lucide-react';

import { cn, formatDate } from '../../lib/format';
import { toast } from '../../stores/toastStore';

/** Prefer the linked owner quiz; node.quiz_uuid may be stale or not owned. */
export function resolveNodeQuizUuid(node, sourceQuizUuid) {
	const raw = sourceQuizUuid || node?.quiz_uuid;
	if (raw == null || raw === '') return null;
	return String(raw);
}

const UNLINKED_QUIZ_MESSAGE =
	'No matching owner quiz for this roadmap. Create the quiz from Templates, or create the roadmap from My quiz so View/Attempt can link.';

export function nodeSectionAttemptOptions(node) {
	const sectionId = node?.section_id;
	const hasSection = sectionId != null && sectionId !== '';
	return {
		initialSectionIds: hasSection ? [sectionId] : [],
		highlightedSectionId: hasSection ? sectionId : undefined,
		presetHint: hasSection
			? 'Pre-selected from this roadmap section — you can change the selection below.'
			: undefined,
		skipCountHydration: true
	};
}

export function launchNodeSectionAttempt({ node, sourceQuizUuid, launchAttempt, onUnlinked }) {
	const quizUuid = resolveNodeQuizUuid(node, sourceQuizUuid);
	if (!quizUuid) {
		if (onUnlinked) onUnlinked(node);
		else toast.error(UNLINKED_QUIZ_MESSAGE);
		return;
	}
	const sectionId = node?.section_id;
	const hasSection = sectionId != null && sectionId !== '';
	launchAttempt(
		{
			uuid: quizUuid,
			quiz_title: node.roadmap_title || 'Quiz',
			sections: hasSection ? [{ id: sectionId, title: node.title, order: node.order ?? 0 }] : []
		},
		nodeSectionAttemptOptions(node)
	);
}

function NodeIconButton({ title, onClick, children, className, busy = false }) {
	return (
		<button
			type="button"
			title={title}
			aria-label={title}
			disabled={busy}
			onClick={(e) => {
				e.stopPropagation();
				onClick?.(e);
			}}
			className={cn(
				'text-fg hover:bg-surface-2 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors',
				'disabled:pointer-events-none disabled:opacity-50',
				className
			)}
		>
			{busy ? <Loader2 size={14} className="animate-spin" /> : children}
		</button>
	);
}

/**
 * Shared roadmap section row used by Roadmap detail, list cards, and Dashboard Due Today.
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
	const [attemptBusy, setAttemptBusy] = useState(false);
	const iconSize = compact ? 13 : 14;
	const meta = (
		<>
			{node.roadmap_title ? `${node.roadmap_title} · ` : ''}
			{node.qualifying_attempts}/{node.mastery_attempts_required} at ≥
			{node.mastery_accuracy_threshold}%
			{node.due_date ? ` · ${formatDate(node.due_date, 'MMM d')}` : ''}
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

	const handleAttempt = async () => {
		const result = onAttemptSection?.(node);
		if (result && typeof result.then === 'function') {
			setAttemptBusy(true);
			try {
				await result;
			} finally {
				setAttemptBusy(false);
			}
		}
	};

	const actions = (
		<div className="flex shrink-0 items-center gap-0.5">
			{node.overdue && (
				<span
					title="Overdue"
					aria-label="Overdue"
					className="text-danger inline-flex h-7 w-7 shrink-0 items-center justify-center"
				>
					<AlertCircle size={iconSize} aria-hidden />
				</span>
			)}
			{showQuizActions && (
				<>
					<NodeIconButton title={`View quiz for ${node.title}`} onClick={() => onViewQuiz?.(node)}>
						<BookOpen size={iconSize} />
					</NodeIconButton>
					<NodeIconButton
						title={`Attempt section ${node.title}`}
						busy={attemptBusy}
						onClick={handleAttempt}
					>
						<Target size={iconSize} />
					</NodeIconButton>
				</>
			)}
			{showUnlinkedHint && (
				<NodeIconButton
					title="No linked quiz — create or match a quiz to attempt this section"
					onClick={() => onUnlinkedQuiz?.(node)}
					className="text-muted"
				>
					<BookOpen size={iconSize} />
				</NodeIconButton>
			)}
			{showEdit && (
				<NodeIconButton
					title={`Edit requirements for ${node.title}`}
					onClick={() => onEdit?.(node)}
				>
					<Pencil size={iconSize} />
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
