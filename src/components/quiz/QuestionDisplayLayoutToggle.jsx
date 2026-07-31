import { Layers, List } from 'lucide-react';

import { cn } from '../../lib/format';
import {
	QUESTION_LAYOUT_SCROLL,
	QUESTION_LAYOUT_SECTION
} from './useQuestionDisplayLayout';

export default function QuestionDisplayLayoutToggle({ layout, onLayoutChange, className }) {
	return (
		<div
			className={cn(
				'border-line bg-surface-2 inline-flex rounded-md border p-0.5',
				className
			)}
			role="group"
			aria-label="Question display layout"
		>
			<button
				type="button"
				onClick={() => onLayoutChange(QUESTION_LAYOUT_SCROLL)}
				className={cn(
					'inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition',
					layout === QUESTION_LAYOUT_SCROLL
						? 'bg-surface text-fg shadow-sm'
						: 'text-muted hover:text-fg'
				)}
				aria-pressed={layout === QUESTION_LAYOUT_SCROLL}
			>
				<List size={14} aria-hidden />
				All questions
			</button>
			<button
				type="button"
				onClick={() => onLayoutChange(QUESTION_LAYOUT_SECTION)}
				className={cn(
					'inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition',
					layout === QUESTION_LAYOUT_SECTION
						? 'bg-surface text-fg shadow-sm'
						: 'text-muted hover:text-fg'
				)}
				aria-pressed={layout === QUESTION_LAYOUT_SECTION}
			>
				<Layers size={14} aria-hidden />
				By section
			</button>
		</div>
	);
}
