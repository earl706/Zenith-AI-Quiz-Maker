import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../lib/format';
import { resolveQuizImageSrc } from '../../lib/quizImages';
import { Button, Card, CardBody, LoadingScreen } from '../ui';
import IdentificationAnswerInput from './IdentificationAnswerInput';
import MathRenderer from './MathRenderer';
import QuestionStudyFeedback from './QuestionStudyFeedback';
import { getChoiceData, isIdentification, isMathematical } from './quizHelpers';

export default function FlashcardAttempt({
	questions,
	answersByIdMap,
	onAnswerChange,
	onIdentificationChange,
	onSubmit,
	submitting,
	answeredCount
}) {
	const [index, setIndex] = useState(0);
	const [revealedIds, setRevealedIds] = useState(() => new Set());
	const total = questions.length;
	const currentQuestion = questions[index];
	const answer = currentQuestion ? answersByIdMap.get(currentQuestion.id) : null;
	const isLast = index === total - 1;
	const math = currentQuestion ? isMathematical(currentQuestion.question_type) : false;
	const revealed = currentQuestion ? revealedIds.has(currentQuestion.id) : false;
	const hasAnswer = String(answer?.userAnswer ?? '').trim() !== '';

	const goPrev = () => setIndex((p) => (p - 1 + total) % total);
	const goNext = () => setIndex((p) => (p + 1) % total);

	const handleChoiceSelect = (questionId, choiceText) => {
		if (revealed) return;
		onAnswerChange(questionId, 'userAnswer', choiceText);
		setRevealedIds((previous) => new Set(previous).add(questionId));
	};

	const handleIdentificationEnter = () => {
		if (hasAnswer && currentQuestion) {
			setRevealedIds((previous) => new Set(previous).add(currentQuestion.id));
		}
	};

	if (!currentQuestion) return <LoadingScreen />;

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-muted text-sm">
					Question <span className="text-fg font-semibold">{index + 1}</span> of {total}
				</p>
				<div className="flex flex-wrap gap-1.5">
					{questions.map((q, i) => {
						const filled = String(answersByIdMap.get(q.id)?.userAnswer ?? '').trim() !== '';
						return (
							<button
								key={q.id ?? i}
								type="button"
								aria-label={`Go to question ${i + 1}`}
								onClick={() => setIndex(i)}
								className={cn(
									'h-2 w-2 rounded-full transition',
									i === index
										? 'bg-primary scale-125'
										: filled
											? 'bg-primary/45'
											: 'bg-line hover:bg-muted/40'
								)}
							/>
						);
					})}
				</div>
			</div>

			<div className="flex gap-2">
				<Button variant="secondary" className="flex-1" onClick={goPrev} disabled={submitting}>
					<ChevronLeft size={16} /> Prev
				</Button>
				<Button variant="secondary" className="flex-1" onClick={goNext} disabled={submitting}>
					Next <ChevronRight size={16} />
				</Button>
			</div>

			{isIdentification(currentQuestion.question_type) ? (
				<IdentificationAnswerInput
					key={currentQuestion.id}
					answer={answer}
					question={currentQuestion}
					handleIdentificationAnswerChange={onIdentificationChange}
					onEnter={handleIdentificationEnter}
					autoFocus
					disabled={revealed}
				/>
			) : (
				<Card>
					<CardBody className="space-y-4 p-5 sm:p-6">
						<p className="text-fg text-center text-base leading-snug font-semibold">
							{currentQuestion.question}
						</p>
						{currentQuestion.question_image && (
							<div className="flex justify-center">
								<img
									src={
										resolveQuizImageSrc(currentQuestion.question_image) ||
										currentQuestion.question_image
									}
									alt=""
									className="max-h-48 rounded-md object-cover"
								/>
							</div>
						)}
						<div className="space-y-2">
							{(currentQuestion.choices || []).map((choice, choiceIndex) => {
								const choiceData = getChoiceData(choice);
								const selected = answer?.userAnswer === choiceData.text;
								const choiceImage = resolveQuizImageSrc(choiceData.image) || choiceData.image;
								return (
									<button
										key={choiceData.id ?? choiceIndex}
										type="button"
										disabled={revealed}
										onClick={() => handleChoiceSelect(currentQuestion.id, choiceData.text)}
										className={cn(
											'w-full cursor-pointer rounded-md px-4 py-3 text-center font-semibold transition',
											selected
												? 'bg-primary text-primary-fg ring-primary/30 ring-2 ring-offset-2 ring-offset-[var(--surface)]'
												: 'bg-surface-2 text-fg hover:bg-primary/10'
										)}
									>
										<div className="flex flex-col items-center gap-2">
											{choiceImage && (
												<img
													src={choiceImage}
													alt=""
													className="max-h-24 rounded-md object-cover"
												/>
											)}
											{math ? (
												<MathRenderer expression={choiceData.text} displayMode={false} />
											) : (
												<span className="text-sm">{choiceData.text}</span>
											)}
										</div>
									</button>
								);
							})}
						</div>
					</CardBody>
				</Card>
			)}

			{isIdentification(currentQuestion.question_type) && !revealed && (
				<Button
					className="w-full"
					variant="secondary"
					disabled={!hasAnswer || submitting}
					onClick={handleIdentificationEnter}
				>
					Check answer
				</Button>
			)}
			{revealed && <QuestionStudyFeedback question={currentQuestion} answer={answer} />}

			<div className="border-line space-y-2 border-t pt-4">
				<p className="text-muted text-center text-xs">
					Answered {answeredCount} of {total}
				</p>
				<Button
					className="w-full"
					variant={isLast ? 'primary' : 'secondary'}
					loading={submitting}
					onClick={onSubmit}
				>
					Submit quiz
				</Button>
			</div>
		</div>
	);
}
