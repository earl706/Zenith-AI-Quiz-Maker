import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn, formatDurationSeconds } from '../../lib/format';
import { answersEqual } from '../../lib/mathAnswersEqual';
import { resolveQuestionImageSrc, resolveQuizImageSrc } from '../../lib/quizImages';
import { Button, Card, CardBody, LoadingScreen, ProgressBar } from '../ui';
import ChessPuzzleAnswerInput from './ChessPuzzleAnswerInput';
import CodeAnswerInput from './CodeAnswerInput';
import IdentificationAnswerInput from './IdentificationAnswerInput';
import MathRenderer from './MathRenderer';
import QuestionChessBoard from './QuestionChessBoard';
import QuestionStudyFeedback from './QuestionStudyFeedback';
import QuestionTitle from './QuestionTitle';
import SequenceAnswerInput from './SequenceAnswerInput';
import {
	advanceDelayForAnswer,
	ADVANCE_DELAY_WRONG_MS,
	getChoiceData,
	isChessPuzzleQuestion,
	isCodeQuestion,
	isIdentification,
	isMathematical,
	isSequence,
	chessPuzzleAnswered,
	codeQuestionAnswered,
	resolveQuestionTimerSeconds,
	sequenceQuestionAnswered,
	shuffleSequenceItems,
	resolveCorrectAnswer
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
	onChessMovesChange,
	onSubmit,
	submitting,
	answerSuggestionsEnabled = false,
	suggestionCorpus = [],
	perQuestionTimerEnabled = false,
	perQuestionTimeSeconds = 30,
	paused = false,
	draftState = null,
	onDraftStateChange,
	studyMode = false
}) {
	const [index, setIndex] = useState(() => draftState?.index ?? 0);
	const [revealedIds, setRevealedIds] = useState(() => new Set(draftState?.revealedIds ?? []));
	const [peekedIds, setPeekedIds] = useState(() => new Set(draftState?.peekedIds ?? []));
	const [lockedIds, setLockedIds] = useState(() => new Set(draftState?.lockedIds ?? []));
	const [secondsLeft, setSecondsLeft] = useState(() =>
		draftState?.secondsLeft != null ? draftState.secondsLeft : null
	);
	const remainingByIdRef = useRef(
		draftState?.remainingById && typeof draftState.remainingById === 'object'
			? { ...draftState.remainingById }
			: {}
	);
	const secondsLeftRef = useRef(secondsLeft);
	secondsLeftRef.current = secondsLeft;
	const previousQuestionIdRef = useRef(null);
	const total = questions.length;
	const currentQuestion = questions[index];
	const answer = currentQuestion ? answersByIdMap.get(currentQuestion.id) : null;
	const isLast = index === total - 1;
	const math = currentQuestion ? isMathematical(currentQuestion.question_type) : false;
	const revealed = currentQuestion ? revealedIds.has(currentQuestion.id) : false;
	const peeked = currentQuestion ? peekedIds.has(currentQuestion.id) : false;
	const locked = currentQuestion ? lockedIds.has(currentQuestion.id) : false;
	const sequence = currentQuestion ? isSequence(currentQuestion.question_type) : false;
	const chessPuzzle = currentQuestion ? isChessPuzzleQuestion(currentQuestion) : false;
	const codeQuiz = currentQuestion ? isCodeQuestion(currentQuestion) : false;
	const displayItems = useMemo(() => {
		if (!currentQuestion || !sequence) return [];
		const items = currentQuestion.sequence_items || [];
		if (currentQuestion.random_choices) return shuffleSequenceItems(items);
		return items;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentQuestion?.id]);
	const hasAnswer = chessPuzzle
		? chessPuzzleAnswered(currentQuestion, answer)
		: codeQuiz
			? codeQuestionAnswered(currentQuestion, answer)
			: sequence
				? sequenceQuestionAnswered(currentQuestion, answer)
				: String(answer?.userAnswer ?? '').trim() !== '';

	const advanceTimer = useRef(null);
	const onSubmitRef = useRef(onSubmit);
	const questionLimitRef = useRef(0);
	const timedOutRef = useRef(false);
	/** Sync guard so timer-zero cannot overwrite a user answer's advance delay. */
	const completedIdsRef = useRef(new Set());
	/** Seconds to apply once after a draft restore; not read on every parent draft sync. */
	const pendingRestoredSecondsRef = useRef(null);
	const goPrevRef = useRef(() => {});
	const goNextRef = useRef(() => {});
	const peekToggleRef = useRef(() => {});

	const cancelAutoAdvance = () => {
		if (advanceTimer.current) {
			clearTimeout(advanceTimer.current);
			advanceTimer.current = null;
		}
	};

	useEffect(() => cancelAutoAdvance, []);

	useEffect(() => {
		onSubmitRef.current = onSubmit;
	}, [onSubmit]);

	useEffect(() => {
		if (!draftState?.restoreToken) return;
		setIndex(draftState.index ?? 0);
		setRevealedIds(new Set(draftState.revealedIds ?? []));
		setPeekedIds(new Set(draftState.peekedIds ?? []));
		setLockedIds(new Set(draftState.lockedIds ?? []));
		completedIdsRef.current = new Set(draftState.lockedIds ?? []);
		remainingByIdRef.current =
			draftState.remainingById && typeof draftState.remainingById === 'object'
				? { ...draftState.remainingById }
				: {};
		pendingRestoredSecondsRef.current =
			draftState.secondsLeft != null ? draftState.secondsLeft : null;
		previousQuestionIdRef.current = null;
		// eslint-disable-next-line react-hooks/exhaustive-deps -- restore only when parent issues a new token
	}, [draftState?.restoreToken]);

	useEffect(() => {
		onDraftStateChange?.({
			index,
			revealedIds: [...revealedIds],
			peekedIds: [...peekedIds],
			lockedIds: [...lockedIds],
			secondsLeft,
			remainingById: { ...remainingByIdRef.current }
		});
	}, [index, revealedIds, peekedIds, lockedIds, secondsLeft, onDraftStateChange]);

	const markLocked = (questionId) => {
		setLockedIds((previous) => new Set(previous).add(questionId));
	};

	const markRevealed = (questionId) => {
		setRevealedIds((previous) => new Set(previous).add(questionId));
	};

	const markPeeked = (questionId) => {
		setPeekedIds((previous) => new Set(previous).add(questionId));
	};

	const togglePeeked = (questionId) => {
		setPeekedIds((previous) => {
			const next = new Set(previous);
			if (next.has(questionId)) next.delete(questionId);
			else next.add(questionId);
			return next;
		});
	};

	const markCompleted = (questionId) => {
		completedIdsRef.current.add(questionId);
		markLocked(questionId);
		markRevealed(questionId);
		markPeeked(questionId);
	};

	const goTo = (next) => {
		if (next === index) return;
		if (next < 0 || next >= total) return;
		cancelAutoAdvance();
		timedOutRef.current = false;
		setIndex(next);
	};

	const goPrev = () => {
		if (index <= 0) {
			if (perQuestionTimerEnabled) return;
			goTo(total - 1);
			return;
		}
		goTo(index - 1);
	};

	const advanceForward = () => {
		cancelAutoAdvance();
		timedOutRef.current = false;
		if (isLast) {
			onSubmitRef.current?.();
			return;
		}
		setIndex((previous) => Math.min(previous + 1, total - 1));
	};

	const goNext = () => {
		if (!currentQuestion) return;
		if (perQuestionTimerEnabled) {
			advanceForward();
			return;
		}
		goTo((index + 1) % total);
	};

	goPrevRef.current = goPrev;
	goNextRef.current = goNext;
	peekToggleRef.current = () => {
		if (!studyMode || !currentQuestion) return;
		togglePeeked(currentQuestion.id);
	};

	useEffect(() => {
		if (paused || submitting) return undefined;
		const onKey = (event) => {
			if (event.nativeEvent?.isComposing) return;
			if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return;
			const prev = event.code === 'BracketLeft' || event.key === '[';
			const next = event.code === 'BracketRight' || event.key === ']';
			const peek = event.code === 'KeyP' || event.key.toLowerCase() === 'p';
			if (!prev && !next && !peek) return;
			if (peek && !studyMode) return;
			event.preventDefault();
			event.stopPropagation();
			if (prev) goPrevRef.current();
			else if (next) goNextRef.current();
			else peekToggleRef.current();
		};
		document.addEventListener('keydown', onKey, true);
		return () => document.removeEventListener('keydown', onKey, true);
	}, [paused, submitting, studyMode]);

	const scheduleAfterReveal = (delayMs) => {
		cancelAutoAdvance();
		advanceTimer.current = setTimeout(() => {
			advanceTimer.current = null;
			advanceForward();
		}, delayMs);
	};

	const revealIdentification = (committedText, answerPatch = null) => {
		if (!currentQuestion || locked || completedIdsRef.current.has(currentQuestion.id)) return;
		// Click handlers pass a SyntheticEvent; only a real string may replace the answer.
		const text = typeof committedText === 'string' ? committedText : '';
		const snapshot = {
			...answer,
			...(answerPatch && typeof answerPatch === 'object' ? answerPatch : {}),
			...(text.trim() !== '' ? { userAnswer: text } : {})
		};
		if (sequence) {
			if (!sequenceQuestionAnswered(currentQuestion, snapshot)) return;
		} else if (chessPuzzle) {
			if (!chessPuzzleAnswered(currentQuestion, snapshot)) return;
		} else if (codeQuiz) {
			if (!codeQuestionAnswered(currentQuestion, snapshot)) return;
		} else if (!String(snapshot?.userAnswer ?? '').trim()) {
			return;
		}
		if (
			!sequence &&
			!chessPuzzle &&
			text.trim() !== '' &&
			text !== String(answer?.userAnswer ?? '')
		) {
			onIdentificationChange?.(currentQuestion.id, text);
		}
		markCompleted(currentQuestion.id);
		scheduleAfterReveal(advanceDelayForAnswer(currentQuestion, snapshot));
	};

	const handleEnterReveal = (patch) => {
		if (typeof patch === 'string') {
			revealIdentification(patch);
			return;
		}
		revealIdentification(undefined, patch && typeof patch === 'object' ? patch : null);
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
			previousQuestionIdRef.current = currentQuestion?.id ?? null;
			return;
		}

		const prevId = previousQuestionIdRef.current;
		const questionChanged = prevId !== currentQuestion.id;
		if (questionChanged && prevId != null && secondsLeftRef.current != null) {
			remainingByIdRef.current[prevId] = secondsLeftRef.current;
		}
		previousQuestionIdRef.current = currentQuestion.id;

		const limit = resolveQuestionTimerSeconds(currentQuestion, perQuestionTimeSeconds);
		questionLimitRef.current = limit;

		if (!questionChanged && locked) return;

		const restored = pendingRestoredSecondsRef.current;
		if (restored != null) {
			pendingRestoredSecondsRef.current = null;
			const next = Math.min(limit, Math.max(0, restored));
			remainingByIdRef.current[currentQuestion.id] = next;
			setSecondsLeft(next);
			timedOutRef.current = next === 0;
			return;
		}

		const saved = remainingByIdRef.current[currentQuestion.id];
		if (saved != null) {
			const next = Math.min(limit, Math.max(0, saved));
			setSecondsLeft(next);
			timedOutRef.current = next === 0 || locked;
			return;
		}

		if (locked) {
			remainingByIdRef.current[currentQuestion.id] = 0;
			setSecondsLeft(0);
			timedOutRef.current = true;
			return;
		}

		timedOutRef.current = false;
		remainingByIdRef.current[currentQuestion.id] = limit;
		setSecondsLeft(limit);
	}, [
		perQuestionTimerEnabled,
		currentQuestion?.id,
		perQuestionTimeSeconds,
		locked,
		draftState?.restoreToken
	]);

	useEffect(() => {
		if (!perQuestionTimerEnabled || !currentQuestion || locked || paused) return undefined;
		const questionId = currentQuestion.id;
		const interval = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev == null) return prev;
				const next = prev <= 1 ? 0 : prev - 1;
				remainingByIdRef.current[questionId] = next;
				return next;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [perQuestionTimerEnabled, currentQuestion?.id, locked, paused]);

	useEffect(() => {
		if (!perQuestionTimerEnabled || secondsLeft !== 0 || locked) return;
		if (!currentQuestion) return;
		const saved = remainingByIdRef.current[currentQuestion.id];
		if (saved != null && saved > 0) return;
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
	const showKey = peeked;
	const keyAnswer = String(answer?.correctAnswer ?? '').trim()
		? String(answer.correctAnswer).trim()
		: String(resolveCorrectAnswer(currentQuestion) ?? '').trim();

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
						return (
							<button
								key={q.id ?? i}
								type="button"
								aria-label={`Go to question ${i + 1}`}
								disabled={submitting}
								onClick={() => goTo(i)}
								className={cn(
									'h-2 w-2 cursor-pointer rounded-full transition',
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
				<Button
					variant="secondary"
					className="flex-1"
					onClick={goPrev}
					disabled={submitting || (perQuestionTimerEnabled && index === 0)}
					title="Previous (⌘[)"
				>
					<ChevronLeft size={16} /> Prev
				</Button>
				<Button
					variant="secondary"
					className="flex-1"
					onClick={goNext}
					disabled={submitting}
					title="Next (⌘])"
				>
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
						data-attempt-question-id={currentQuestion.id}
					>
						{chessPuzzle ? (
							<ChessPuzzleAnswerInput
								question={currentQuestion}
								answer={answer}
								onChessMovesChange={onChessMovesChange}
								onEnter={handleEnterReveal}
								disabled={revealed || locked}
								revealed={revealed}
							/>
						) : codeQuiz ? (
							<>
								<QuestionTitle
									text={currentQuestion.question}
									mathematical={false}
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
								<CodeAnswerInput
									question={currentQuestion}
									value={answer?.userAnswer || ''}
									disabled={revealed || locked}
									autoFocus={!revealed && !locked}
									onChange={(text) => onIdentificationChange?.(currentQuestion.id, text)}
								/>
							</>
						) : sequence ? (
							<SequenceAnswerInput
								question={currentQuestion}
								answer={answer}
								displayItems={displayItems}
								onSequenceChange={onSequenceChange}
								onEnter={handleEnterReveal}
								autoFocus={!revealed && !locked}
								disabled={revealed || locked}
								revealed={revealed}
							/>
						) : isIdentification(currentQuestion.question_type) ? (
							<>
								<QuestionChessBoard question={currentQuestion} className="flex justify-center" />
								<IdentificationAnswerInput
									answer={answer}
									question={currentQuestion}
									handleIdentificationAnswerChange={onIdentificationChange}
									onEnter={handleEnterReveal}
									autoFocus={!revealed && !locked}
									disabled={revealed || locked}
									answerSuggestionsEnabled={answerSuggestionsEnabled}
									suggestionCorpus={suggestionCorpus}
								/>
							</>
						) : (
							<Card>
								<CardBody className="space-y-4 p-5 sm:p-6">
									<QuestionTitle
										text={currentQuestion.question}
										mathematical={math}
										className="text-2xl"
									/>
									<QuestionChessBoard question={currentQuestion} />
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
														'w-full min-w-0 rounded-md px-4 py-3 text-center font-semibold wrap-anywhere transition',
														locked || submitting ? 'cursor-not-allowed' : 'cursor-pointer',
														selected
															? 'bg-primary text-primary-fg ring-primary/30 ring-2 ring-offset-2 ring-offset-[var(--surface)]'
															: showKey &&
																  answersEqual(choiceData.text, keyAnswer, {
																		mathematical: math,
																		questionType: currentQuestion.question_type
																  })
																? 'border-success/40 bg-success/10 text-fg ring-success/30 ring-1'
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
															<span className="text-xl break-words wrap-anywhere">
																{choiceData.text}
															</span>
														)}
													</div>
												</button>
											);
										})}
									</div>
								</CardBody>
							</Card>
						)}

						{studyMode && (
							<Button
								className="w-full"
								variant="secondary"
								disabled={submitting}
								onClick={() => togglePeeked(currentQuestion.id)}
								title={peeked ? 'Hide answer (⌘P)' : 'Show answer (⌘P)'}
							>
								{peeked ? 'Hide answer' : 'Show answer'}
							</Button>
						)}
						{(isIdentification(currentQuestion.question_type) ||
							sequence ||
							chessPuzzle ||
							codeQuiz) &&
							!revealed &&
							!locked && (
								<Button
									className="w-full"
									variant="secondary"
									disabled={!hasAnswer || submitting}
									onClick={() => revealIdentification()}
								>
									Check answer
								</Button>
							)}
						{((!studyMode && revealed) || peeked) && (
							<QuestionStudyFeedback
								question={currentQuestion}
								answer={answer}
								showSolution={showKey}
							/>
						)}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}
