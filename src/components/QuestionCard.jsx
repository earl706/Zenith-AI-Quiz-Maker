import React, { useEffect } from 'react';
import IdentificationAnswerInput from './IdentificationAnswerInput';
import MathRenderer from './MathRenderer';

export default function QuestionCard({
	question,
	answers,
	handleAnswerChange,
	handleIdentificationAnswerChange
}) {
	const answer = answers.find((a) => a.id === question.id);
	useEffect(() => {}, []);

	return (
		<>
			{question.question_type === 'IDE' || question.question_type === 'IDE-COM' ? (
				<IdentificationAnswerInput
					answer={answer}
					question={question}
					handleIdentificationAnswerChange={handleIdentificationAnswerChange}
				/>
			) : (
				<div className="mb-[20px] flex w-full flex-col items-center rounded-[20px] bg-[#EFF7FF] p-[30px] drop-shadow-lg">
					<p className="mb-2 text-lg font-semibold">{question.question}</p>

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

					<div className="flex w-full flex-col gap-[10px]">
						{question.choices.map((choice, index) => {
							// Handle new choice structure with id, text, and image
							const choiceText = choice.text || choice;
							const choiceImage = choice.image;
							const choiceId = choice.id || index;

							return (
								<button
									key={choiceId}
									onClick={() => {
										handleAnswerChange(question.id, 'userAnswer', choiceText);
									}}
									className={`w-full cursor-pointer rounded-[15px] p-[15px] text-center font-extrabold text-[#646464] transition ${
										answer.userAnswer === choiceText
											? 'bg-[#007AFF] text-white'
											: 'bg-white hover:bg-[#007AFF] hover:text-white'
									}`}
								>
									<div className="flex flex-col items-center gap-[10px]">
										{/* Choice Image Display */}
										{choiceImage && (
											<div className="flex justify-center">
												<img
													src={choiceImage}
													alt={`Choice ${index + 1}`}
													className="max-h-[120px] rounded-[8px] object-cover"
												/>
											</div>
										)}

										{/* Choice Text Display */}
										{question.question_type === 'COM' ||
										question.question_type === 'IDE-COM' ||
										question.question_type === 'MUL-COM' ? (
											<div className="flex items-center justify-center">
												<MathRenderer expression={choiceText} displayMode={false} />
											</div>
										) : (
											<div className="text-center text-[14px] font-extrabold">{choiceText}</div>
										)}
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</>
	);
}
