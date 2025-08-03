import React, { useState } from 'react';
import MathRenderer from './MathRenderer';

export default function MathInput({
	handleChoicesChange,
	question,
	handleInputChange,
	removeChoice
}) {
	const [inputs, setInputs] = useState(['', '', '', '']);

	const handleMathInputChange = (id, index, e) => {
		const rawInput = e.target.value;
		setInputs(inputs.map((input, indx) => (indx === index ? rawInput : input)));
		handleChoicesChange(id, index, rawInput);
	};

	return (
		<>
			{question.identification ? (
				<div className="flex w-full flex-row items-center">
					<div className="mr-[20px] flex w-[3%] items-center">
						<button
							className={`h-[20px] w-[20px] rounded-full bg-[#007AFF] transition-all ${
								question.correctAnswerIndex == 0 ? 'ring-2 ring-[#007AFF] ring-offset-3' : ''
							}`}
							onClick={() => handleInputChange(question.id, 'correctAnswerIndex', 0)}
						></button>
					</div>
					<div className="flex w-full items-center justify-between gap-[20px]">
						<input
							type="text"
							value={question.choices[0]}
							onChange={(e) => {
								handleMathInputChange(question.id, 0, e);
							}}
							placeholder="Enter mathematical expression (e.g., x^2 + 2x + 1)"
							className="w-1/2 rounded-full bg-white px-[20px] py-[12px] text-[12px] text-[#919191]"
						/>
						<div className="flex min-h-[40px] w-1/2 items-center justify-center">
							<MathRenderer expression={question.choices[0]} displayMode={true} />
						</div>
					</div>
				</div>
			) : (
				[0, 1, 2, 3].map((index) => (
					<div className="flex items-center" key={index}>
						<div className="mr-[20px] flex w-[3%] items-center">
							<button
								className={`h-[20px] w-[20px] rounded-full bg-[#007AFF] transition-all ${
									question.correctAnswerIndex == index ? 'ring-2 ring-[#007AFF] ring-offset-3' : ''
								}`}
								onClick={() => handleInputChange(question.id, 'correctAnswerIndex', index)}
							></button>
						</div>
						<input
							type="text"
							value={question.choices[index]}
							onChange={(e) => handleMathInputChange(question.id, index, e)}
							placeholder={`Choice ${index + 1} (e.g., x^2 + 2x + 1)`}
							className="mr-[20px] w-full rounded-full bg-white px-[20px] py-[12px] text-[12px] text-[#919191]"
							required
						/>
						<div className="flex min-h-[40px] w-full items-center justify-center">
							<MathRenderer expression={question.choices[index]} displayMode={true} />
						</div>
						<div className="flex w-[3%] items-center">
							<button
								className="h-[20px] w-[20px] cursor-pointer rounded-full bg-[#FF605C]"
								onClick={() => removeChoice(question.id, index)}
							></button>
						</div>
					</div>
				))
			)}
		</>
	);
}
