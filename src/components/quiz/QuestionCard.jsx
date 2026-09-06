import { memo, useMemo, useState } from 'react';

import ChessPuzzleAnswerInput from './ChessPuzzleAnswerInput';
import CodeAnswerInput from './CodeAnswerInput';
import IdentificationAnswerInput from './IdentificationAnswerInput';
import MathRenderer from './MathRenderer';
import QuestionChessBoard from './QuestionChessBoard';
import QuestionStudyFeedback from './QuestionStudyFeedback';
import QuestionTitle from './QuestionTitle';
import SequenceAnswerInput from './SequenceAnswerInput';
import { resolveQuestionImageSrc, resolveQuizImageSrc } from '../../lib/quizImages';
import {
	getChoiceData,
	isAttemptAnswerFullyCorrect,
	isChessPuzzleQuestion,
	isCodeQuestion,
	isMathematical,
	isSequence,
	chessPuzzleAnswered,
	codeQuestionAnswered,
	sequenceQuestionAnswered,
	shuffleSequenceItems
} from './quizHelpers';

function answerForQuestion(answers, questionId) {
	return answers.find((a) => a.id === questionId);
}

function questionCardPropsEqual(prev, next) {
	if (prev.question !== next.question) return false;
	if (prev.answerSuggestionsEnabled !== next.answerSuggestionsEnabled) return false;
	if (prev.autoFocus !== next.autoFocus) return false;
	if (prev.suggestionCorpus !== next.suggestionCorpus) return false;
	const id = prev.question.id;
	return answerForQuestion(prev.answers, id) === answerForQuestion(next.answers, id);
}

function QuestionCard({
	question,
	answers,
	handleAnswerChange,
	handleIdentificationAnswerChange,
	handleSequenceChange,
	handleChessMovesChange,
	answerSuggestionsEnabled = false,
	suggestionCorpus = [],
	autoFocus = false,
	onAnswered,
	onIdentificationRevealed,
	inputRef = null
}) {
	const [revealed, setRevealed] = useState(false);
	const answer = answers.find((a) => a.id === question.id);
	const questionImage = resolveQuestionImageSrc(question);
	const identification = question.question_type === 'IDE' || question.question_type === 'IDE-COM';
	const sequence = isSequence(question.question_type);
	const chessPuzzle = isChessPuzzleQuestion(question);
	const codeQuiz = isCodeQuestion(question);
	const displayItems = useMemo(() => {
		const items = question.sequence_items || [];
		if (!sequence) return items;
		if (question.random_choices) return shuffleSequenceItems(items);
		return items;
		// Shuffle once per question mount.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [question.id]);
	const hasAnswer = chessPuzzle
		? chessPuzzleAnswered(question, answer)
		: codeQuiz
			? codeQuestionAnswered(question, answer)
			: sequence
				? sequenceQuestionAnswered(question, answer)
				: String(answer?.userAnswer ?? '').trim() !== '';

	const notifyAnswered = (answerSnapshot) => {
		onAnswered?.(question.id, isAttemptAnswerFullyCorrect(question, answerSnapshot));
	};

	const revealIfAnswered = (committedText) => {
		if (chessPuzzle) {
			if (revealed) return;
			const patch = committedText && typeof committedText === 'object' ? committedText : null;
			const snapshot = { ...answer, ...(patch || {}) };
			if (!chessPuzzleAnswered(question, snapshot)) return;
			setRevealed(true);
			notifyAnswered(snapshot);
			onIdentificationRevealed?.(question.id);
			return;
		}
		if (sequence) {
			if (!hasAnswer || revealed) return;
			setRevealed(true);
			notifyAnswered(answer);
			onIdentificationRevealed?.(question.id);
			return;
		}
		const text = committedText != null ? committedText : answer?.userAnswer;
		if (!String(text ?? '').trim() || revealed) return;
		const nextAnswer = { ...answer, userAnswer: text };
		setRevealed(true);
		notifyAnswered(nextAnswer);
		onIdentificationRevealed?.(question.id);
	};

	return (
		<div className="space-y-3">
			{chessPuzzle ? (
				<ChessPuzzleAnswerInput
					question={question}
					answer={answer}
					onChessMovesChange={handleChessMovesChange}
					onEnter={revealIfAnswered}
					disabled={revealed}
					revealed={revealed}
				/>
			) : codeQuiz ? (
				<>
					<QuestionTitle text={question.question} mathematical={false} className="mb-3 text-2xl" />
					{questionImage && (
						<div className="mb-4 flex w-full justify-center">
							<img
								src={questionImage}
								alt="Question"
								className="h-auto max-h-[200px] w-full max-w-md object-contain"
							/>
						</div>
					)}
					<CodeAnswerInput
						question={question}
						value={answer?.userAnswer || ''}
						disabled={revealed}
						onChange={(text) => handleIdentificationAnswerChange(question.id, text)}
					/>
				</>
			) : sequence ? (
				<SequenceAnswerInput
					question={question}
					answer={answer}
					displayItems={displayItems}
					onSequenceChange={handleSequenceChange}
					onEnter={revealIfAnswered}
					autoFocus={autoFocus && !revealed}
					disabled={revealed}
					revealed={revealed}
				/>
			) : identification ? (
				<>
					<QuestionChessBoard question={question} className="mb-3 flex justify-center" />
					<IdentificationAnswerInput
						answer={answer}
						question={question}
						handleIdentificationAnswerChange={handleIdentificationAnswerChange}
						onEnter={revealIfAnswered}
						autoFocus={autoFocus && !revealed}
						disabled={revealed}
						answerSuggestionsEnabled={answerSuggestionsEnabled}
						suggestionCorpus={suggestionCorpus}
						inputRef={inputRef}
					/>
				</>
			) : (
				<div className="border-line bg-surface flex w-full flex-col items-center rounded-md border p-6">
					<QuestionTitle
						text={question.question}
						mathematical={isMathematical(question.question_type)}
						className="mb-3 text-2xl"
					/>

					<QuestionChessBoard question={question} />

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
										const nextAnswer = { ...answer, userAnswer: choiceText };
										handleAnswerChange(question.id, 'userAnswer', choiceText);
										if (revealed) return;
										setRevealed(true);
										notifyAnswered(nextAnswer);
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
											<MathRenderer
												expression={choiceText}
												displayMode={false}
												className="text-xl"
											/>
										) : (
											<span className="text-xl">{choiceText}</span>
										)}
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}
			{(identification || sequence || chessPuzzle || codeQuiz) && !revealed && (
				<button
					type="button"
					disabled={!hasAnswer}
					onClick={() => revealIfAnswered()}
					className="bg-primary text-primary-fg disabled:bg-muted/30 disabled:text-muted w-full cursor-pointer rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed"
				>
					Check answer
				</button>
			)}
			{revealed && <QuestionStudyFeedback question={question} answer={answer} />}
		</div>
	);
}

export default memo(QuestionCard, questionCardPropsEqual);
