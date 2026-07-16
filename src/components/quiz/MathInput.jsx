import { useState } from 'react';
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
				<div className="flex w-full items-center gap-3">
					<button
						type="button"
						className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
							question.correctAnswerIndex === 0
								? 'border-primary bg-primary'
								: 'border-line bg-surface'
						}`}
						onClick={() => handleInputChange(question.id, 'correctAnswerIndex', 0)}
					/>
					<input
						type="text"
						value={question.choices[0]}
						onChange={(e) => handleMathInputChange(question.id, 0, e)}
						placeholder="Enter mathematical expression (e.g., x^2 + 2x + 1)"
						className="border-line bg-surface text-fg focus:border-primary flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
					/>
					<div className="flex min-h-[40px] flex-1 items-center justify-center">
						<MathRenderer expression={question.choices[0]} displayMode={true} />
					</div>
				</div>
			) : (
				[0, 1, 2, 3].map((index) => (
					<div className="flex items-center gap-3" key={index}>
						<button
							type="button"
							className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
								question.correctAnswerIndex === index
									? 'border-primary bg-primary'
									: 'border-line bg-surface'
							}`}
							onClick={() => handleInputChange(question.id, 'correctAnswerIndex', index)}
						/>
						<input
							type="text"
							value={question.choices[index]}
							onChange={(e) => handleMathInputChange(question.id, index, e)}
							placeholder={`Choice ${index + 1} (e.g., x^2 + 2x + 1)`}
							className="border-line bg-surface text-fg focus:border-primary flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
							required
						/>
						<div className="flex min-h-[40px] flex-1 items-center justify-center">
							<MathRenderer expression={question.choices[index]} displayMode={true} />
						</div>
						<button
							type="button"
							className="bg-danger flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full"
							onClick={() => removeChoice(question.id, index)}
						/>
					</div>
				))
			)}
		</>
	);
}
