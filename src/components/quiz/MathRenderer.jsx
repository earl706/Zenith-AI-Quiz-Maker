import { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

/**
 * Renders stored LaTeX as-is. Does not rewrite author/fixture text.
 */
export default function MathRenderer({
	expression,
	displayMode = false,
	className = '',
	errorFallback = null
}) {
	const formattedExpression = useMemo(() => {
		if (!expression || String(expression).trim() === '') return null;
		return String(expression);
	}, [expression]);

	if (!formattedExpression) {
		return <span className={`text-muted italic ${className}`}>Empty</span>;
	}

	try {
		const latexString = displayMode ? `$$${formattedExpression}$$` : `$${formattedExpression}$`;
		return <Latex className={className}>{latexString}</Latex>;
	} catch (error) {
		if (errorFallback) return errorFallback;
		return <span className={`text-danger text-sm ${className}`}>Invalid LaTeX: {expression}</span>;
	}
}
