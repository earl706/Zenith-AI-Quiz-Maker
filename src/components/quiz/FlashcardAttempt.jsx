import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn, formatDurationSeconds } from '../../lib/format';
import { resolveQuestionImageSrc, resolveQuizImageSrc } from '../../lib/quizImages';
import { Button, Card, CardBody, LoadingScreen, ProgressBar } from '../ui';
import IdentificationAnswerInput from './IdentificationAnswerInput';
import MathRenderer from './MathRenderer';
import QuestionStudyFeedback from './QuestionStudyFeedback';
import QuestionTitle from './QuestionTitle';
import {
	getChoiceData,
	isIdentification,
	isMathematical,
	resolveQuestionTimerSeconds
} from './quizHelpers';

const MC_AUTO_ADVANCE_MS = 250;
const ID_ENTER_ADVANCE_MS = 2000;
const ID_CHECK_ADVANCE_MS = 5000;
const TIMER_REVEAL_ADVANCE_MS = 1500;

export default function FlashcardAttempt({
	questions,
	answersByIdMap,
	onAnswerChange,
	onIdentificationChange,
	onSubmit,
	submitting,
	answerSuggestionsEnabled = false,
	suggestionCorpus = [],
	perQuestionTimerEnabled = false,
	perQuestionTimeSeconds = 30
}) {
	const [index, setIndex] = useState(0);
	const [revealedIds, setRevealedIds] = useState(() => new Set());
	const [lockedIds, setLockedIds] = useState(() => new Set());
	const [secondsLeft, setSecondsLeft] = useState(null);
	const total = questions.length;
	const currentQuestion = questions[index];
	const answer = currentQuestion ? answersByIdMap.get(currentQuestion.id) : null;
	const isLast = index === total - 1;
	const math = currentQuestion ? isMathematical(currentQuestion.question_type) : false;
	const revealed = currentQuestion ? revealedIds.has(currentQuestion.id) : false;
	const locked = currentQuestion ? lockedIds.has(currentQuestion.id) : false;
	const hasAnswer = String(answer?.userAnswer ?? '').trim() !== '';

	const advanceTimer = useRef(null);
	const questionLimitRef = useRef(0);
	const timedOutRef = useRef(false);

	const cancelAutoAdvance = () => {
		if (advanceTimer.current) {
			clearTimeout(advanceTimer.current);
			advanceTimer.current = null;
		}
	};

	useEffect(() => cancelAutoAdvance, []);

	const markLocked = (questionId) => {
		setLockedIds((previous) => new Set(previous).add(questionId));
	};

	const markRevealed = (questionId) => {
		setRevealedIds((previous) => new Set(previous).add(questionId));
	};

	const goTo = (next) => {
		if (perQuestionTimerEnabled && next < index) return;
		cancelAutoAdvance();
		timedOutRef.current = false;
		setIndex(next);
	};

	const goPrev = () => {
		if (perQuestionTimerEnabled) return;
		goTo((index - 1 + total) % total);
	};

	const advanceForward = () => {
		cancelAutoAdvance();
		timedOutRef.current = false;
		if (isLast) {
			onSubmit?.();
			return;
		}
		setIndex((previous) => Math.min(previous + 1, total - 1));
	};

	const goNext = () => {
		if (!currentQuestion) return;
		if (perQuestionTimerEnabled) {
			if (!locked) {
				markLocked(currentQuestion.id);
				if (hasAnswer) markRevealed(currentQuestion.id);
			}
			advanceForward();
			return;
		}
		goTo((index + 1) % total);
	};

	const scheduleAfterReveal = (delayMs) => {
		cancelAutoAdvance();
		advanceTimer.current = setTimeout(() => {
			advanceTimer.current = null;
			advanceForward();
		}, delayMs);
	};

	const revealIdentification = (delayMs) => {
		if (!hasAnswer || !currentQuestion || locked) return;
		markRevealed(currentQuestion.id);
		markLocked(currentQuestion.id);
		scheduleAfterReveal(perQuestionTimerEnabled ? TIMER_REVEAL_ADVANCE_MS : delayMs);
	};

	const handleChoiceSelect = (questionId, choiceText) => {
		if (lockedIds.has(questionId)) return;
		onAnswerChange(questionId, 'userAnswer', choiceText);
		cancelAutoAdvance();
		if (perQuestionTimerEnabled) {
			markLocked(questionId);
			markRevealed(questionId);
			scheduleAfterReveal(TIMER_REVEAL_ADVANCE_MS);
			return;
		}
		if (isLast) return;
		advanceTimer.current = setTimeout(() => {
			advanceTimer.current = null;
			setIndex((p) => Math.min(p + 1, total - 1));
		}, MC_AUTO_ADVANCE_MS);
	};

	const handleTimeout = () => {
		if (!currentQuestion || timedOutRef.current) return;
		timedOutRef.current = true;
		markLocked(currentQuestion.id);
		markRevealed(currentQuestion.id);
		scheduleAfterReveal(TIMER_REVEAL_ADVANCE_MS);
	};

	useEffect(() => {
		if (!perQuestionTimerEnabled || !currentQuestion) {
			setSecondsLeft(null);
			return undefined;
		}
		if (locked) {
			return undefined;
		}
		const limit = resolveQuestionTimerSeconds(currentQuestion, perQuestionTimeSeconds);
		questionLimitRef.current = limit;
		timedOutRef.current = false;
		setSecondsLeft(limit);
		const interval = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev == null) return prev;
				if (prev <= 1) {
					clearInterval(interval);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [perQuestionTimerEnabled, currentQuestion?.id, perQuestionTimeSeconds, index, locked]);

	useEffect(() => {
		if (!perQuestionTimerEnabled || secondsLeft !== 0 || locked) return;
		handleTimeout();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- fire once at zero
	}, [secondsLeft, perQuestionTimerEnabled, locked, currentQuestion?.id]);

	if (!currentQuestion) return <LoadingScreen />;

	const limit =
		questionLimitRef.current ||
		resolveQuestionTimerSeconds(currentQuestion, perQuestionTimeSeconds);
	const remaining = secondsLeft ?? limit;
	const progressPct = limit > 0 ? (remaining / limit) * 100 : 0;
	const warning = remaining <= Math.max(5, Math.ceil(limit * 0.25));
	const timerTone = warning ? 'danger' : 'primary';

	return (
		<div className="space-y-4">
			{perQuestionTimerEnabled && (
				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<p className="text-muted text-xs font-medium tracking-wide uppercase">Question timer</p>
						<p
							className={cn(
								'font-mono text-lg font-bold tracking-tight',
								warning ? 'text-danger' : 'text-fg'
							)}
							aria-live="polite"
						>
							{formatDurationSeconds(Math.max(0, remaining))}
						</p>
					</div>
					<ProgressBar value={progressPct} tone={timerTone} />
				</div>
			)}

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-muted text-sm">
					Question <span className="text-fg font-semibold">{index + 1}</span> of {total}
				</p>
				<div className="flex flex-wrap gap-1.5">
					{questions.map((q, i) => {
						const filled = String(answersByIdMap.get(q.id)?.userAnswer ?? '').trim() !== '';
						const canJump = !perQuestionTimerEnabled || i >= index;
						return (
							<button
								key={q.id ?? i}
								type="button"
								aria-label={`Go to question ${i + 1}`}
								disabled={!canJump || submitting}
								onClick={() => canJump && goTo(i)}
								className={cn(
									'h-2 w-2 rounded-full transition',
									i === index
										? 'bg-primary scale-125'
										: filled
											? 'bg-primary/45'
											: 'bg-line hover:bg-muted/40',
									!canJump && 'cursor-not-allowed opacity-40'
								)}
							/>
						);
					})}
				</div>
			</div>

			<div className="flex gap-2">
				<Button
					variant="secondary"
					className="flex-1"
					onClick={goPrev}
					disabled={submitting || perQuestionTimerEnabled}
				>
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
					onEnter={() => revealIdentification(ID_ENTER_ADVANCE_MS)}
					autoFocus
					disabled={revealed || locked}
					answerSuggestionsEnabled={answerSuggestionsEnabled}
					suggestionCorpus={suggestionCorpus}
				/>
			) : (
				<Card>
					<CardBody className="space-y-4 p-5 sm:p-6">
						<QuestionTitle
							text={currentQuestion.question}
							mathematical={math}
							className="text-base"
						/>
						{resolveQuestionImageSrc(currentQuestion) && (
							<div className="flex w-full justify-center">
								<img
									src={resolveQuestionImageSrc(currentQuestion)}
									alt=""
									className="h-auto max-h-48 w-full max-w-md object-contain"
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
										disabled={locked || submitting}
										onClick={() => handleChoiceSelect(currentQuestion.id, choiceData.text)}
										className={cn(
											'w-full rounded-md px-4 py-3 text-center font-semibold transition',
											locked || submitting ? 'cursor-not-allowed' : 'cursor-pointer',
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

			{isIdentification(currentQuestion.question_type) && !revealed && !locked && (
				<Button
					className="w-full"
					variant="secondary"
					disabled={!hasAnswer || submitting}
					onClick={() => revealIdentification(ID_CHECK_ADVANCE_MS)}
				>
					Check answer
				</Button>
			)}
			{revealed && <QuestionStudyFeedback question={currentQuestion} answer={answer} />}
		</div>
	);
}
