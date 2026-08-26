import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn, formatDurationSeconds } from '../../lib/format';
import { resolveQuestionImageSrc, resolveQuizImageSrc } from '../../lib/quizImages';
import { Button, Card, CardBody, LoadingScreen, ProgressBar } from '../ui';
import IdentificationAnswerInput from './IdentificationAnswerInput';
import MathRenderer from './MathRenderer';
import QuestionStudyFeedback from './QuestionStudyFeedback';
import QuestionTitle from './QuestionTitle';
import SequenceAnswerInput from './SequenceAnswerInput';
import {
	advanceDelayForAnswer,
	ADVANCE_DELAY_WRONG_MS,
	getChoiceData,
	isIdentification,
	isMathematical,
	isSequence,
	resolveQuestionTimerSeconds,
	sequenceQuestionAnswered,
	shuffleSequenceItems
} from './quizHelpers';

const FLASHCARD_FADE = {
	duration: 0.25,
	ease: [0.22, 1, 0.36, 1]
};

export default function FlashcardAttempt({
	questions,
	answersByIdMap,
	onAnswerChange,
	onIdentificationChange,
	onSequenceChange,
	onSubmit,
	submitting,
	answerSuggestionsEnabled = false,
	suggestionCorpus = [],
	perQuestionTimerEnabled = false,
	perQuestionTimeSeconds = 30,
	paused = false,
	draftState = null,
	onDraftStateChange
}) {
	const [index, setIndex] = useState(() => draftState?.index ?? 0);
	const [revealedIds, setRevealedIds] = useState(() => new Set(draftState?.revealedIds ?? []));
	const [lockedIds, setLockedIds] = useState(() => new Set(draftState?.lockedIds ?? []));
	const [secondsLeft, setSecondsLeft] = useState(() =>
		draftState?.secondsLeft != null ? draftState.secondsLeft : null
	);
	const total = questions.length;
	const currentQuestion = questions[index];
	const answer = currentQuestion ? answersByIdMap.get(currentQuestion.id) : null;
	const isLast = index === total - 1;
	const math = currentQuestion ? isMathematical(currentQuestion.question_type) : false;
	const revealed = currentQuestion ? revealedIds.has(currentQuestion.id) : false;
	const locked = currentQuestion ? lockedIds.has(currentQuestion.id) : false;
	const sequence = currentQuestion ? isSequence(currentQuestion.question_type) : false;
	const displayItems = useMemo(() => {
		if (!currentQuestion || !sequence) return [];
		const items = currentQuestion.sequence_items || [];
		if (currentQuestion.random_choices) return shuffleSequenceItems(items);
		return items;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentQuestion?.id]);
	const hasAnswer = sequence
		? sequenceQuestionAnswered(currentQuestion, answer)
		: String(answer?.userAnswer ?? '').trim() !== '';

	const advanceTimer = useRef(null);
	const questionLimitRef = useRef(0);
	const timedOutRef = useRef(false);
	/** Sync guard so timer-zero cannot overwrite a user answer's advance delay. */
	const completedIdsRef = useRef(new Set());
	/** Seconds to apply once after a draft restore; not read on every parent draft sync. */
	const pendingRestoredSecondsRef = useRef(null);

	const cancelAutoAdvance = () => {
		if (advanceTimer.current) {
			clearTimeout(advanceTimer.current);
			advanceTimer.current = null;
		}
	};

	useEffect(() => cancelAutoAdvance, []);

	useEffect(() => {
		if (!draftState?.restoreToken) return;
		setIndex(draftState.index ?? 0);
		setRevealedIds(new Set(draftState.revealedIds ?? []));
		setLockedIds(new Set(draftState.lockedIds ?? []));
		completedIdsRef.current = new Set(draftState.lockedIds ?? []);
		pendingRestoredSecondsRef.current =
			draftState.secondsLeft != null ? draftState.secondsLeft : null;
		// eslint-disable-next-line react-hooks/exhaustive-deps -- restore only when parent issues a new token
	}, [draftState?.restoreToken]);

	useEffect(() => {
		onDraftStateChange?.({
			index,
			revealedIds: [...revealedIds],
			lockedIds: [...lockedIds],
			secondsLeft
		});
	}, [index, revealedIds, lockedIds, secondsLeft, onDraftStateChange]);

	const markLocked = (questionId) => {
		setLockedIds((previous) => new Set(previous).add(questionId));
	};

	const markRevealed = (questionId) => {
		setRevealedIds((previous) => new Set(previous).add(questionId));
	};

	const markCompleted = (questionId) => {
		completedIdsRef.current.add(questionId);
		markLocked(questionId);
		markRevealed(questionId);
	};

	const goTo = (next) => {
		if (perQuestionTimerEnabled && next < index) return;
		if (next === index) return;
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
				completedIdsRef.current.add(currentQuestion.id);
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

	const revealIdentification = (committedText) => {
		if (!currentQuestion || locked || completedIdsRef.current.has(currentQuestion.id)) return;
		const snapshot = sequence
			? answer
			: {
					...answer,
					userAnswer:
						committedText != null && String(committedText).trim() !== ''
							? committedText
							: answer?.userAnswer
				};
		if (sequence) {
			if (!sequenceQuestionAnswered(currentQuestion, snapshot)) return;
		} else if (!String(snapshot?.userAnswer ?? '').trim()) {
			return;
		}
		if (
			!sequence &&
			committedText != null &&
			String(committedText).trim() !== '' &&
			String(committedText) !== String(answer?.userAnswer ?? '')
		) {
			onIdentificationChange?.(currentQuestion.id, committedText);
		}
		markCompleted(currentQuestion.id);
		scheduleAfterReveal(advanceDelayForAnswer(currentQuestion, snapshot));
	};

	const handleChoiceSelect = (questionId, choiceText) => {
		if (lockedIds.has(questionId) || completedIdsRef.current.has(questionId)) return;
		const question = questions.find((q) => q.id === questionId) || currentQuestion;
		const prior = answersByIdMap.get(questionId);
		const nextAnswer = { ...prior, userAnswer: choiceText };
		onAnswerChange(questionId, 'userAnswer', choiceText);
		markCompleted(questionId);
		scheduleAfterReveal(advanceDelayForAnswer(question, nextAnswer));
	};

	const handleTimeout = () => {
		if (!currentQuestion || timedOutRef.current) return;
		if (completedIdsRef.current.has(currentQuestion.id)) return;
		timedOutRef.current = true;
		markCompleted(currentQuestion.id);
		scheduleAfterReveal(ADVANCE_DELAY_WRONG_MS);
	};

	useEffect(() => {
		if (!perQuestionTimerEnabled || !currentQuestion) {
			setSecondsLeft(null);
			return;
		}
		if (locked) return;
		const limit = resolveQuestionTimerSeconds(currentQuestion, perQuestionTimeSeconds);
		questionLimitRef.current = limit;
		timedOutRef.current = false;
		const restored = pendingRestoredSecondsRef.current;
		if (restored != null) {
			pendingRestoredSecondsRef.current = null;
			setSecondsLeft(Math.min(limit, Math.max(0, restored)));
			return;
		}
		setSecondsLeft(limit);
		// draftState object syncs every tick for persistence — only restoreToken may re-init.
	}, [
		perQuestionTimerEnabled,
		currentQuestion?.id,
		perQuestionTimeSeconds,
		index,
		locked,
		draftState?.restoreToken
	]);

	useEffect(() => {
		if (!perQuestionTimerEnabled || !currentQuestion || locked || paused) return undefined;
		const interval = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev == null) return prev;
				if (prev <= 1) return 0;
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [perQuestionTimerEnabled, currentQuestion?.id, locked, paused]);

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
				<div className="flex flex-wrap gap-1.5">
					{questions.map((q, i) => {
						const filled = sequenceQuestionAnswered(q, answersByIdMap.get(q.id))
							? true
							: String(answersByIdMap.get(q.id)?.userAnswer ?? '').trim() !== '';
						const canJump = !perQuestionTimerEnabled || i >= index;
						return (
							<button
								key={q.id ?? i}
								type="button"
								aria-label={`Go to question ${i + 1}`}
								disabled={!canJump || submitting}
								onClick={() => canJump && goTo(i)}
								className={cn(
									'h-2 w-2 cursor-pointer rounded-full transition',
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

			<div className="relative">
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={currentQuestion.id}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={FLASHCARD_FADE}
						className="space-y-4"
					>
						{sequence ? (
							<SequenceAnswerInput
								question={currentQuestion}
								answer={answer}
								displayItems={displayItems}
								onSequenceChange={onSequenceChange}
								onEnter={revealIdentification}
								autoFocus={!revealed && !locked}
								disabled={revealed || locked}
								revealed={revealed}
							/>
						) : isIdentification(currentQuestion.question_type) ? (
							<IdentificationAnswerInput
								answer={answer}
								question={currentQuestion}
								handleIdentificationAnswerChange={onIdentificationChange}
								onEnter={revealIdentification}
								autoFocus={!revealed && !locked}
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
										className="text-2xl"
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
															<MathRenderer
																expression={choiceData.text}
																displayMode={false}
																className="text-xl"
															/>
														) : (
															<span className="text-xl">{choiceData.text}</span>
														)}
													</div>
												</button>
											);
										})}
									</div>
								</CardBody>
							</Card>
						)}

						{(isIdentification(currentQuestion.question_type) || sequence) &&
							!revealed &&
							!locked && (
								<Button
									className="w-full"
									variant="secondary"
									disabled={!hasAnswer || submitting}
									onClick={revealIdentification}
								>
									Check answer
								</Button>
							)}
						{revealed && <QuestionStudyFeedback question={currentQuestion} answer={answer} />}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}
