import { cn } from '../../lib/format';
import InlineLatexText from './InlineLatexText';

/**
 * Question prompt for quiz detail, attempt, and review.
 * Author-embedded $...$ / $$...$$ fragments render as KaTeX. Remaining text
 * stays plain. Choices / answers still use MathRenderer separately.
 */
export default function QuestionTitle({
	text,
	mathematical: _mathematical = false,
	className = '',
	as: Tag = 'p'
}) {
	const value = text == null ? '' : String(text);
	const classes = cn('text-fg text-center leading-snug font-semibold', className);

	if (!value.trim()) {
		return <Tag className={cn(classes, 'text-muted italic')}>Empty</Tag>;
	}

	return <InlineLatexText text={value} as={Tag} className={classes} />;
}
