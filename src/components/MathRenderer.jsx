import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

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

		return expression
			.replace(/\^/g, '^') // Convert ^ to ^{
			.replace(/\*/g, '\\cdot ') // Convert * to \cdot
			.replace(/\//g, '\\frac{') // Convert / to \frac{
			.replace(/sqrt/g, '\\sqrt{') // Convert sqrt to \sqrt{
			.replace(/pi/g, '\\pi') // Convert pi to \pi
			.replace(/theta/g, '\\theta') // Convert theta to \theta
			.replace(/alpha/g, '\\alpha') // Convert alpha to \alpha
			.replace(/beta/g, '\\beta') // Convert beta to \beta
			.replace(/gamma/g, '\\gamma') // Convert gamma to \gamma
			.replace(/delta/g, '\\delta') // Convert delta to \delta
			.replace(/sin/g, '\\sin') // Convert sin to \sin
			.replace(/cos/g, '\\cos') // Convert cos to \cos
			.replace(/tan/g, '\\tan') // Convert tan to \tan
			.replace(/log/g, '\\log') // Convert log to \log
			.replace(/ln/g, '\\ln') // Convert ln to \ln
			.replace(/infinity/g, '\\infty') // Convert infinity to \infty
			.replace(/inf/g, '\\infty'); // Convert inf to \infty
	}, [expression]);

	if (!formattedExpression) {
		return <span className={`text-gray-400 italic ${className}`}>Empty</span>;
	}

	try {
		return displayMode ? (
			<BlockMath math={formattedExpression} className={className} />
		) : (
			<InlineMath math={formattedExpression} className={className} />
		);
	} catch (error) {
		console.warn('LaTeX parsing error:', error);

		if (errorFallback) {
			return errorFallback;
		}

		return <span className={`text-sm text-red-500 ${className}`}>Invalid LaTeX: {expression}</span>;
	}
};

export default MathRenderer;
