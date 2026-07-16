import { useState } from 'react';
import MathRenderer from './MathRenderer';

export default function IdentificationAnswerInput({
	answer,
	handleIdentificationAnswerChange,
	question
}) {
	const [mathExpressions, setMathExpressions] = useState('');

	const handleMathInputChange = (id, e) => {
		const rawInput = e.target.value;
		let formattedExpression = rawInput.replace(/\^/g, '^');
		formattedExpression = formattedExpression.replace(/\*/g, '\\cdot ');
		setMathExpressions(formattedExpression);
		handleIdentificationAnswerChange(id, e.target.value);
	};

	return (
		<>
			{question.question_type === 'IDE-COM' ? (
				<div className="border-line bg-surface flex w-full flex-col items-center rounded-md border p-6">
					<p className="text-fg mb-3 w-full text-center text-base font-semibold">
						{question.question}
					</p>
					{question.question_image && (
						<div className="mb-4 flex justify-center">
							<img
								src={question.question_image}
								alt="Question"
								className="max-h-[200px] rounded-md object-cover"
							/>
						</div>
					)}
					<div className="flex w-full flex-col">
						<input
							type="text"
							value={answer.userAnswer}
							onChange={(e) => handleMathInputChange(answer.id, e)}
							placeholder="Enter mathematical expression (e.g., x^2 + 2x + 1)"
							className="border-line bg-surface-2 text-fg focus:border-primary mb-4 w-full rounded-md border px-4 py-2 font-medium transition focus:outline-none"
						/>
						<div className="flex min-h-[40px] w-full items-center justify-center">
							<MathRenderer expression={answer.userAnswer} displayMode={true} />
						</div>
					</div>
				</div>
			) : (
				<div className="border-line bg-surface flex w-full flex-col items-center rounded-md border p-6">
					<p className="text-fg mb-3 w-full text-center text-base font-semibold">
						{question.question}
					</p>
					{question.question_image && (
						<div className="mb-4 flex justify-center">
							<img
								src={question.question_image}
								alt="Question"
								className="max-h-[200px] rounded-md object-cover"
							/>
						</div>
					)}
					<input
						type="text"
						value={answer.userAnswer}
						onChange={(event) => handleIdentificationAnswerChange(answer.id, event.target.value)}
						placeholder="Enter your answer"
						className="border-line bg-surface-2 text-fg focus:border-primary w-full rounded-md border px-4 py-2 font-medium transition focus:outline-none"
					/>
				</div>
			)}
		</>
	);
}
