import { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

import { cn } from '../../lib/format';
import { needsDisplayMath, stripMathDelimiters } from '../../lib/latexWrap';

function LatexChunk({ latex, className = '', display = false }) {
	const wrapped = display ? `$$${latex}$$` : `$${latex}$`;
	return <Latex className={className}>{wrapped}</Latex>;
}

/**
 * Renders stored LaTeX as one expression. Overflow is horizontal scroll only
 * (no operator wrap). Does not rewrite author/fixture text.
 */
export default function MathRenderer({
	expression,
	displayMode = false,
	className = '',
	errorFallback = null
}) {
	const formattedExpression = useMemo(() => {
		if (!expression || String(expression).trim() === '') return null;
		return stripMathDelimiters(expression);
	}, [expression]);

	if (!formattedExpression) {
		return errorFallback ?? <span className={cn('text-muted italic', className)}>Empty</span>;
	}

	const display = displayMode || needsDisplayMath(formattedExpression);

	return (
		<span
			className={cn(
				'math-h-scroll max-w-full min-w-0 py-0.5 break-normal whitespace-nowrap [&_.katex-display]:my-0 [&_.katex-display]:text-left',
				display ? 'block w-full text-left' : 'inline-block align-middle',
				displayMode && 'text-[1.15em]',
				className
			)}
		>
			<LatexChunk latex={formattedExpression} display={display} />
		</span>
	);
}
