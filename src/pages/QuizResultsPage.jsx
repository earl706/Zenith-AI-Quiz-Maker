import React from 'react';
import MathRenderer from '../components/MathRenderer';

export default function QuizResultsPage({ question, answer, correct, submittedAnswers, index }) {
	// Helper function to get choice text and image
	const getChoiceData = (choice) => {
		if (typeof choice === 'object' && choice !== null) {
			return {
				text: choice.text || choice,
				image: choice.image,
				id: choice.id
			};
		}
		return {
			text: choice,
			image: null,
			id: null
		};
	};

	// Helper function to determine choice styling
	const getChoiceStyle = (choiceText, isCorrect, isUserAnswer) => {
		if (isCorrect && choiceText === submittedAnswers[index].correctAnswer) {
			return 'w-full py-[10px] px-[30px] rounded-full text-white font-extrabold transition bg-[#00CA4E]';
		} else if (choiceText === submittedAnswers[index].correctAnswer) {
			return 'w-full py-[10px] px-[30px] rounded-full text-white font-extrabold transition bg-[#00CA4E]';
		} else if (choiceText === submittedAnswers[index].userAnswer) {
			return 'w-full py-[10px] px-[30px] rounded-full text-white font-extrabold transition bg-[#FF605C]';
		} else {
			return 'w-full py-[10px] px-[30px] rounded-full text-[#646464] font-extrabold transition bg-white';
		}
	};

	// Render identification question results
	const renderIdentificationResult = () => {
		const isMathematical = question.question_type === 'IDE-COM';

		return (
			<div className="flex flex-col gap-[10px]">
				{/* Question Image */}
				{question.question_image && (
					<div className="mb-[15px] flex justify-center">
						<img
							src={question.question_image}
							alt="Question"
							className="max-h-[200px] rounded-[10px] object-cover"
						/>
					</div>
				)}

				{/* Correct Answer Display */}
				<div className="flex flex-col gap-[5px]">
					<p className="text-sm font-semibold text-gray-600">Correct Answer:</p>
					<div className="flex flex-row items-center rounded-lg bg-green-100 p-2">
						{isMathematical ? (
							<MathRenderer expression={submittedAnswers[index].correctAnswer} displayMode={true} />
						) : (
							<p className="w-full text-sm">{submittedAnswers[index].correctAnswer}</p>
						)}
					</div>
				</div>

				{/* User Answer Display */}
				<div className="flex flex-col gap-[5px]">
					<p className="text-sm font-semibold text-gray-600">Your Answer:</p>
					<div
						className={`flex flex-row items-center rounded-lg p-2 ${
							correct ? 'bg-green-100' : 'bg-red-100'
						}`}
					>
						{isMathematical ? (
							<MathRenderer expression={submittedAnswers[index].userAnswer} displayMode={true} />
						) : (
							<p className="w-full text-sm">{submittedAnswers[index].userAnswer}</p>
						)}
					</div>
				</div>
			</div>
		);
	};

	// Render multiple choice question results
	const renderMultipleChoiceResult = () => {
		return (
			<div className="flex flex-col gap-[10px]">
				{/* Question Image */}
				{question.question_image && (
					<div className="mb-[15px] flex justify-center">
						<img
							src={question.question_image}
							alt="Question"
							className="max-h-[200px] rounded-[10px] object-cover"
						/>
					</div>
				)}

				{/* Choices */}
				<div className="flex flex-col gap-[10px]">
					{question.choices.map((choice, choice_index) => {
						const choiceData = getChoiceData(choice);
						const isMathematical =
							question.question_type === 'MUL-COM' ||
							question.question_type === 'COM' ||
							question.question_type === 'IDE-COM';

						return (
							<div
								key={choice_index}
								className={getChoiceStyle(
									choiceData.text,
									correct,
									choiceData.text === submittedAnswers[index].userAnswer
								)}
							>
								<div className="flex flex-col items-center gap-[10px]">
									{/* Choice Image */}
									{choiceData.image && (
										<div className="flex justify-center">
											<img
												src={choiceData.image}
												alt={`Choice ${choice_index + 1}`}
												className="max-h-[120px] rounded-[8px] object-cover"
											/>
										</div>
									)}

									{/* Choice Text/Expression */}
									{isMathematical ? (
										<div className="flex items-center justify-center">
											<MathRenderer expression={choiceData.text} displayMode={false} />
										</div>
									) : (
										<div className="text-center text-[14px] font-extrabold">{choiceData.text}</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	return (
		<div
			className={`flex w-full flex-col drop-shadow-md ${
				correct ? 'bg-[#F0FFF0]' : 'bg-[#FFF0F0]'
			} rounded-[20px] px-[30px] pt-[20px] pb-[30px]`}
		>
			<div className="flex w-full flex-col justify-between">
				<p className="w-full rounded pb-[10px] text-center text-[16px] font-extrabold focus:ring focus:ring-blue-200 focus:outline-none">
					{question.question}
				</p>
			</div>

			{/* Render based on question type */}
			{question.question_type === 'IDE' || question.question_type === 'IDE-COM'
				? renderIdentificationResult()
				: renderMultipleChoiceResult()}
		</div>
	);
}
