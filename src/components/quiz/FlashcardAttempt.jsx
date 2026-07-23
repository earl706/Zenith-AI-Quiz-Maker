import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../lib/format';
import { Button, Card, CardBody, LoadingScreen } from '../ui';
import IdentificationAnswerInput from './IdentificationAnswerInput';
import MathRenderer from './MathRenderer';
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
	const total = questions.length;
	const currentQuestion = questions[index];
	const answer = currentQuestion ? answersByIdMap.get(currentQuestion.id) : null;
	const isLast = index === total - 1;
	const math = currentQuestion ? isMathematical(currentQuestion.question_type) : false;

	if (!currentQuestion) return <LoadingScreen />;

	const goPrev = () => setIndex((p) => (p - 1 + total) % total);
	const goNext = () => setIndex((p) => (p + 1) % total);

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
					answer={answer}
					question={currentQuestion}
					handleIdentificationAnswerChange={onIdentificationChange}
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
									src={currentQuestion.question_image}
									alt=""
									className="max-h-48 rounded-md object-cover"
								/>
							</div>
						)}
						<div className="space-y-2">
							{(currentQuestion.choices || []).map((choice, choiceIndex) => {
								const choiceData = getChoiceData(choice);
								const selected = answer?.userAnswer === choiceData.text;
								return (
									<button
										key={choiceData.id ?? choiceIndex}
										type="button"
										onClick={() =>
											onAnswerChange(currentQuestion.id, 'userAnswer', choiceData.text)
										}
										className={cn(
											'w-full cursor-pointer rounded-md px-4 py-3 text-center font-semibold transition',
											selected
												? 'bg-primary text-primary-fg ring-primary/30 ring-2 ring-offset-2 ring-offset-[var(--surface)]'
												: 'bg-surface-2 text-fg hover:bg-primary/10'
										)}
									>
										<div className="flex flex-col items-center gap-2">
											{choiceData.image && (
												<img
													src={choiceData.image}
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
