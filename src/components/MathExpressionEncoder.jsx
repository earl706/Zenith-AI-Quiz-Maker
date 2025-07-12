import React, { useState, useEffect } from 'react';
import Latex from 'react-latex';

export default function MathExpressionEncoder({ choice }) {
	const [mathExpression, setMathExpression] = useState('');

	const initializeMathExpression = () => {
		let formattedExpression = choice.replace(/\^/g, '^');
		formattedExpression = formattedExpression.replace(/\*/g, '\\cdot ');
		setMathExpression(formattedExpression);
	};

	return (
		<>
			<div className="mb-2 w-full rounded p-2 text-sm focus:ring focus:ring-blue-200 focus:outline-none">
				<Latex>{`$$${choice}$$`}</Latex>
			</div>
		</>
	);
}
