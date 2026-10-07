import { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

import { cn } from '../../lib/format';
import { splitLatexAtOperators, stripMathDelimiters } from '../../lib/latexWrap';

function LatexChunk({ latex, className = '' }) {
	return <Latex className={className}>{`$${latex}$`}</Latex>;
}

/**
 * Renders stored LaTeX as-is. Does not rewrite author/fixture text.
 * Long expressions wrap onto new lines at operators / juxtaposed commands.
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

	const chunks = useMemo(
		() => (formattedExpression ? splitLatexAtOperators(formattedExpression) : []),
		[formattedExpression]
	);

	if (!formattedExpression) {
		return <span className={cn('text-muted italic', className)}>Empty</span>;
	}

	if (!chunks.length && errorFallback) return errorFallback;

	return (
		<span
			className={cn(
				'inline-flex max-w-full min-w-0 flex-wrap items-baseline gap-x-1',
				displayMode && 'w-full justify-center py-1 text-[1.15em]',
				className
			)}
		>
			{chunks.map((chunk, index) => (
				<span key={`${index}-${chunk.slice(0, 24)}`} className="shrink-0">
					<LatexChunk latex={chunk} />
				</span>
			))}
		</span>
	);
}
