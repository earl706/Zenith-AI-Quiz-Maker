import { useMemo } from 'react';
import 'katex/dist/katex.min.css';

import { cn } from '../../lib/format';
import { hasInlineMathDelimiters, isBareLatexBlock, splitProseAndMath } from '../../lib/latexWrap';
import MathRenderer from './MathRenderer';

const SOFT_WRAP = 'max-w-full min-w-0 wrap-anywhere whitespace-pre-wrap break-words';

/**
 * Prose plus author-embedded $...$ / $$...$$ as KaTeX.
 * On computational questions, undelimited LaTeX blocks also render as math.
 * Prose wraps; math fragments stay one line (MathRenderer scrolls if needed).
 */
export default function InlineLatexText({
	text,
	className = '',
	as: Tag = 'p',
	mathematical = false
}) {
	const value = text == null ? '' : String(text);
	const useBareMath = mathematical && isBareLatexBlock(value);
	const useInlineMath = useMemo(() => hasInlineMathDelimiters(value), [value]);
	const parts = useMemo(
		() => (useInlineMath && !useBareMath ? splitProseAndMath(value) : null),
		[useInlineMath, useBareMath, value]
	);

	if (!value.trim()) return null;

	const classes = cn(SOFT_WRAP, className);

	if (useBareMath) {
		return (
			<Tag className={cn('max-w-full min-w-0', className)}>
				<MathRenderer expression={value} displayMode />
			</Tag>
		);
	}

	if (!useInlineMath || !parts) {
		return <Tag className={classes}>{value}</Tag>;
	}

	return (
		<Tag className={classes}>
			{parts.map((part, index) =>
				part.type === 'math' ? (
					<MathRenderer key={`m-${index}`} expression={part.value} displayMode={part.display} />
				) : (
					<span key={`t-${index}`}>{part.value}</span>
				)
			)}
		</Tag>
	);
}
