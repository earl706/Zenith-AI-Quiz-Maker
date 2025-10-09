import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

const MathRenderer = ({
	expression,
	displayMode = false,
	className = '',
	errorFallback = null
}) => {
	const formattedExpression = useMemo(() => {
		if (!expression || expression.trim() === '') {
			return null;
		}

		return expression;
	}, [expression]);

	if (!formattedExpression) {
		return <span className={`text-gray-400 italic ${className}`}>Empty</span>;
	}

	try {
		const latexString = displayMode ? `$$${formattedExpression}$$` : `$${formattedExpression}$`;

		return <Latex className={className}>{latexString}</Latex>;
	} catch (error) {
		console.warn('LaTeX parsing error:', error);

		if (errorFallback) {
			return errorFallback;
		}

		return <span className={`text-sm text-red-500 ${className}`}>Invalid LaTeX: {expression}</span>;
	}
};

export default MathRenderer;
