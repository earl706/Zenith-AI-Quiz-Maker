import React, { useState, useEffect } from 'react';
import MathRenderer from './MathRenderer';

export default function IdentificationAnswerInput({
	answer,
	handleIdentificationAnswerChange,
	question
}) {
	const [input, setInput] = useState('');
	const [questionNumber, setQuestionNumber] = useState(0);
	const [mathExpressions, setMathExpressions] = useState('');

	const handleMathInputChange = (id, e) => {
		const rawInput = e.target.value;
		setInput(rawInput);

		let formattedExpression = rawInput.replace(/\^/g, '^');
		formattedExpression = formattedExpression.replace(/\*/g, '\\cdot ');
		setMathExpressions(formattedExpression);
		handleIdentificationAnswerChange(id, e.target.value);
	};

	useEffect(() => {}, [mathExpressions]);

	return (
		<>
			{question.question_type == 'IDE-COM' ? (
				<div className="mb-[20px] flex w-full flex-col items-center rounded-[20px] bg-[#EFF7FF] p-[30px] drop-shadow-lg">
					<p className="mb-[10px] w-full text-center text-[16px] font-extrabold">
						{question.question}
					</p>

					{/* Question Image Display */}
					{question.question_image && (
						<div className="mb-[15px] flex justify-center">
							<img
								src={question.question_image}
								alt="Question"
								className="max-h-[200px] rounded-[10px] object-cover"
							/>
						</div>
					)}

					<div className="flex w-full flex-col">
						<input
							type="text"
							value={answer.userAnswer}
							onChange={(e) => {
								handleMathInputChange(answer.id, e);
							}}
							placeholder="Enter mathematical expression (e.g., x^2 + 2x + 1)"
							className={`focus:none mb-[20px] w-full rounded-full bg-white px-[30px] py-[10px] font-extrabold text-[#646464] transition`}
						/>
						<div className="flex min-h-[40px] w-full items-center justify-center">
							<MathRenderer expression={answer.userAnswer} displayMode={true} />
						</div>
					</div>
				</div>
			) : (
				<div className="mb-[20px] flex w-full flex-col items-center rounded-[20px] bg-[#EFF7FF] p-[30px] drop-shadow-lg">
					<p className="mb-[10px] w-full text-center text-[16px] font-extrabold">
						{question.question}
					</p>

					{/* Question Image Display */}
					{question.question_image && (
						<div className="mb-[15px] flex justify-center">
							<img
								src={question.question_image}
								alt="Question"
								className="max-h-[200px] rounded-[10px] object-cover"
							/>
						</div>
					)}

					<input
						id={`${0}-${answer.id}`}
						type="text"
						name={`${0}-${answer.id}`}
						value={answer.userAnswer}
						onChange={(event) => {
							handleIdentificationAnswerChange(answer.id, event.target.value);
						}}
						placeholder="Enter your answer"
						className={`focus:none w-full rounded-full bg-white px-[30px] py-[10px] font-extrabold text-[#646464] transition`}
					/>
				</div>
			)}
		</>
	);
}
