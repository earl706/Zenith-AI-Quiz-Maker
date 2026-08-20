import { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

import { cn } from '../../lib/format';

const HAS_INLINE_MATH = /\$/;

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
	const useInlineMath = useMemo(() => HAS_INLINE_MATH.test(value), [value]);

	const classes = cn('text-fg text-center leading-snug font-semibold', className);

	if (!value.trim()) {
		return <Tag className={cn(classes, 'text-muted italic')}>Empty</Tag>;
	}

	if (!useInlineMath) {
		return <Tag className={classes}>{value}</Tag>;
	}

	try {
		return (
			<Tag className={classes}>
				<Latex>{value}</Latex>
			</Tag>
		);
	} catch {
		return <Tag className={classes}>{value}</Tag>;
	}
}
