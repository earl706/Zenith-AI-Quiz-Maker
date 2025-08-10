import React, { useEffect, useState } from 'react';
import IdentificationAnswerInput from '../components/IdentificationAnswerInput';
import MathRenderer from '../components/MathRenderer';

export default function QuizFlashcardAttemptPage({
	questionsParam,
	submitAnswers,
	handleAnswerChange,
	handleIdentificationAnswerChange,
	answers
}) {
	const [questions, setQuestions] = useState([]);
	const [questionNumber, setQuestionNumber] = useState(0);
	const [currentQuestion, setCurrentQuestion] = useState(null);

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

	const handleNext = () => {
		setQuestionNumber((prev) => (prev + 1) % questionsParam.length);
	};

	const handlePrev = () => {
		setQuestionNumber((prev) => (prev - 1 + questionsParam.length) % questionsParam.length);
	};

	const answer = answers.find((a) => a.id === currentQuestion?.id);

	useEffect(() => {
		setQuestions(questionsParam);
	}, [questionsParam]);

	useEffect(() => {
		if (questionsParam.length > 0) {
			setCurrentQuestion(questionsParam[questionNumber]);
		}
	}, [questionNumber, questionsParam]);

	if (!currentQuestion) {
		return <div>Loading...</div>;
	}

	return (
		<>
			<div className="flex w-full flex-col rounded-[10px] bg-white px-6 py-4">
				{/* Navigation and Submit */}
				<div className="mb-[20px] flex flex-col justify-center gap-[10px]">
					<div className="flex w-full gap-[20px]">
						<button
							onClick={handlePrev}
							className="w-1/2 cursor-pointer rounded-full bg-[#3C6B9F] p-[10px] text-[16px] font-extrabold text-white transition-all hover:bg-[#1A497D]"
						>
							Prev
						</button>
						<button
							onClick={handleNext}
							className="w-1/2 cursor-pointer rounded-full bg-[#3C6B9F] p-[10px] text-[16px] font-extrabold text-white transition-all hover:bg-[#1A497D]"
						>
							Next
						</button>
					</div>
					<button
						onClick={submitAnswers}
						className="w-full cursor-pointer rounded-full bg-[#00CA4E] p-[10px] text-[16px] font-extrabold text-white transition-all hover:bg-[#00AA2E]"
					>
						Submit
					</button>
				</div>

				{/* Question Counter */}
				<div className="mb-[20px] text-center">
					<span className="text-sm text-gray-600">
						Question {questionNumber + 1} of {questionsParam.length}
					</span>
				</div>

				{/* Question Content */}
				{currentQuestion.question_type === 'IDE' || currentQuestion.question_type === 'IDE-COM' ? (
					<IdentificationAnswerInput
						answer={answer}
						question={currentQuestion}
						handleIdentificationAnswerChange={handleIdentificationAnswerChange}
					/>
				) : (
					<div className="mb-[20px] flex w-full flex-col items-center rounded-[20px] bg-[#EFF7FF] p-[30px] drop-shadow-lg">
						{/* Question Text */}
						<p className="mb-[10px] w-full text-center text-[16px] font-extrabold">
							{currentQuestion.question}
						</p>

						{/* Question Image Display */}
						{currentQuestion.question_image && (
							<div className="mb-[15px] flex justify-center">
								<img
									src={currentQuestion.question_image}
									alt="Question"
									className="max-h-[200px] rounded-[10px] object-cover"
								/>
							</div>
						)}

						{/* Choices */}
						<div className="flex w-full flex-col gap-[10px]">
							{currentQuestion.choices.map((choice, index) => {
								const choiceData = getChoiceData(choice);
								const isMathematical =
									currentQuestion.question_type === 'MUL-COM' ||
									currentQuestion.question_type === 'COM' ||
									currentQuestion.question_type === 'IDE-COM';

								return (
									<button
										key={index}
										onClick={() => {
											handleAnswerChange(currentQuestion.id, 'userAnswer', choiceData.text);
										}}
										className={`w-full cursor-pointer rounded-full px-[30px] py-[10px] text-center font-extrabold text-[#646464] transition ${
											answer?.userAnswer === choiceData.text
												? 'bg-[#007AFF] text-white'
												: 'bg-white hover:bg-[#007AFF] hover:text-white'
										}`}
									>
										<div className="flex flex-col items-center gap-[10px]">
											{/* Choice Image Display */}
											{choiceData.image && (
												<div className="flex justify-center">
													<img
														src={choiceData.image}
														alt={`Choice ${index + 1}`}
														className="max-h-[120px] rounded-[8px] object-cover"
													/>
												</div>
											)}

											{/* Choice Text/Expression Display */}
											{isMathematical ? (
												<div className="flex items-center justify-center">
													<MathRenderer expression={choiceData.text} displayMode={false} />
												</div>
											) : (
												<div className="text-center text-[14px] font-extrabold">
													{choiceData.text}
												</div>
											)}
										</div>
									</button>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</>
	);
}
