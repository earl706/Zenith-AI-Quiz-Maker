import { useState } from 'react';

import IdentificationAnswerInput from './IdentificationAnswerInput';
import MathRenderer from './MathRenderer';
import QuestionStudyFeedback from './QuestionStudyFeedback';
import { resolveQuestionImageSrc, resolveQuizImageSrc } from '../../lib/quizImages';
import { getChoiceData } from './quizHelpers';

export default function QuestionCard({
	question,
	answers,
	handleAnswerChange,
	handleIdentificationAnswerChange,
	answerSuggestionsEnabled = false,
	suggestionCorpus = []
}) {
	const [revealed, setRevealed] = useState(false);
	const answer = answers.find((a) => a.id === question.id);
	const questionImage = resolveQuestionImageSrc(question);
	const hasAnswer = String(answer?.userAnswer ?? '').trim() !== '';
	const identification = question.question_type === 'IDE' || question.question_type === 'IDE-COM';

	return (
		<div className="space-y-3">
			{identification ? (
				<IdentificationAnswerInput
					answer={answer}
					question={question}
					handleIdentificationAnswerChange={handleIdentificationAnswerChange}
					onEnter={() => hasAnswer && setRevealed(true)}
					disabled={revealed}
					answerSuggestionsEnabled={answerSuggestionsEnabled}
					suggestionCorpus={suggestionCorpus}
				/>
			) : (
				<div className="border-line bg-surface flex w-full flex-col items-center rounded-md border p-6">
					{question.question_type === 'MUL-COM' || question.question_type === 'COM' ? (
						<div className="text-fg mb-3 text-lg font-semibold">
							<MathRenderer expression={question.question} displayMode={false} />
						</div>
					) : (
						<p className="text-fg mb-3 text-lg font-semibold">{question.question}</p>
					)}

					{questionImage && (
						<div className="mb-4 flex w-full justify-center">
							<img
								src={questionImage}
								alt="Question"
								className="h-auto max-h-[200px] w-full max-w-md object-contain"
							/>
						</div>
					)}

					<div className="flex w-full flex-col gap-2">
						{(question.choices || []).map((choice, index) => {
							const choiceData = getChoiceData(choice);
							const choiceText = choiceData.text;
							const choiceImage = resolveQuizImageSrc(choiceData.image) || choiceData.image;
							const choiceId = choiceData.id || index;

							return (
								<button
									key={choiceId}
									type="button"
									disabled={revealed}
									onClick={() => {
										handleAnswerChange(question.id, 'userAnswer', choiceText);
										setRevealed(true);
									}}
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
												className="h-auto max-h-[120px] w-full max-w-[12rem] object-contain"
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
			{identification && !revealed && (
				<button
					type="button"
					disabled={!hasAnswer}
					onClick={() => setRevealed(true)}
					className="bg-primary text-primary-fg disabled:bg-muted/30 disabled:text-muted w-full rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed"
				>
					Check answer
				</button>
			)}
			{revealed && <QuestionStudyFeedback question={question} answer={answer} />}
		</div>
	);
}
