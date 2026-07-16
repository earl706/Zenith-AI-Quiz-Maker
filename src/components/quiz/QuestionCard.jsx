import IdentificationAnswerInput from './IdentificationAnswerInput';
import MathRenderer from './MathRenderer';

export default function QuestionCard({
	question,
	answers,
	handleAnswerChange,
	handleIdentificationAnswerChange
}) {
	const answer = answers.find((a) => a.id === question.id);

	return (
		<>
			{question.question_type === 'IDE' || question.question_type === 'IDE-COM' ? (
				<IdentificationAnswerInput
					answer={answer}
					question={question}
					handleIdentificationAnswerChange={handleIdentificationAnswerChange}
				/>
			) : (
				<div className="border-line bg-surface flex w-full flex-col items-center rounded-md border p-6">
					<p className="text-fg mb-3 text-lg font-semibold">{question.question}</p>

					{question.question_image && (
						<div className="mb-4 flex justify-center">
							<img
								src={question.question_image}
								alt="Question"
								className="max-h-[200px] rounded-md object-cover"
							/>
						</div>
					)}

					<div className="flex w-full flex-col gap-2">
						{question.choices.map((choice, index) => {
							const choiceText = choice.text || choice;
							const choiceImage = choice.image;
							const choiceId = choice.id || index;

							return (
								<button
									key={choiceId}
									type="button"
									onClick={() => handleAnswerChange(question.id, 'userAnswer', choiceText)}
									className={`w-full cursor-pointer rounded-md p-3 text-center font-semibold transition ${
										answer.userAnswer === choiceText
											? 'bg-primary text-primary-fg'
											: 'bg-surface-2 text-fg hover:bg-primary/10'
									}`}
								>
									<div className="flex flex-col items-center gap-2">
										{choiceImage && (
											<img
												src={choiceImage}
												alt={`Choice ${index + 1}`}
												className="max-h-[120px] rounded-md object-cover"
											/>
										)}
										{question.question_type === 'COM' ||
										question.question_type === 'IDE-COM' ||
										question.question_type === 'MUL-COM' ? (
											<MathRenderer expression={choiceText} displayMode={false} />
										) : (
											<span className="text-sm">{choiceText}</span>
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
