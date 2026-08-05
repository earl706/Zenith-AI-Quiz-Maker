import { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

/** Strip outer $ / $$ so we do not double-wrap authored LaTeX. */
function stripMathDelimiters(value) {
	const text = String(value).trim();
	if (text.startsWith('$$') && text.endsWith('$$') && text.length >= 4) {
		return text.slice(2, -2).trim();
	}
	if (text.startsWith('$') && text.endsWith('$') && text.length >= 2) {
		return text.slice(1, -1).trim();
	}
	return text;
}

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
		return stripMathDelimiters(expression);
	}, [expression]);

	if (!formattedExpression) {
		return <span className={`text-muted italic ${className}`}>Empty</span>;
	}

	try {
		const latexString = displayMode ? `$$${formattedExpression}$$` : `$${formattedExpression}$`;
		return <Latex className={className}>{latexString}</Latex>;
	} catch {
		if (errorFallback) return errorFallback;
		return <span className={`text-danger text-sm ${className}`}>Invalid LaTeX: {expression}</span>;
	}
}
