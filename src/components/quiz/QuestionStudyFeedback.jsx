import { BookOpen, CheckCircle2, XCircle } from 'lucide-react';

import { cn } from '../../lib/format';
import { answersEqual } from '../../lib/mathAnswersEqual';
import InlineLatexText from './InlineLatexText';
import MathRenderer from './MathRenderer';
import {
	isChessPuzzleQuestion,
	isCodeQuestion,
	isMathematical,
	resolveCorrectAnswer,
	chessPuzzleCredit,
	codeQuestionCredit
} from './quizHelpers';
import { formatUciList } from '../../lib/chessHelpers';
import CodeAnswerInput from './CodeAnswerInput';

function ContentBlock({ label, value }) {
	if (!String(value || '').trim()) return null;
	return (
		<div>
			<p className="text-muted mb-1 text-[0.7rem] font-semibold tracking-wide uppercase">{label}</p>
			<InlineLatexText
				text={value}
				className="text-fg text-sm leading-relaxed whitespace-pre-wrap"
			/>
		</div>
	);
}

function StudyNotes({ question, bordered = false }) {
	if (!(question?.explanation || question?.worked_solution || question?.source_citation)) {
		return null;
	}
	return (
		<div className={cn('space-y-3', bordered && 'border-line border-t pt-3')}>
			<p className="text-primary flex items-center gap-1.5 text-xs font-semibold uppercase">
				<BookOpen size={14} aria-hidden />
				Study notes
			</p>
			<ContentBlock label="Explanation" value={question.explanation} />
			<ContentBlock label="Worked solution" value={question.worked_solution} />
			{question.source_citation && (
				<InlineLatexText
					text={`Source: ${question.source_citation}`}
					className="text-muted text-xs"
				/>
			)}
		</div>
	);
}

function SequenceSolution({ question }) {
	const items = question?.sequence_items || [];
	const math = isMathematical(question?.question_type);
	if (!items.length) return null;
	return (
		<div>
			<p className="text-muted mb-1 text-[0.7rem] font-semibold tracking-wide uppercase">
				Correct sequence
			</p>
			<ol className="space-y-1.5">
				{items.map((item, index) => (
					<li
						key={item.id ?? index}
						className="border-line bg-surface flex items-start rounded-md border px-2.5 py-1.5 text-sm"
					>
						<span className="text-muted mr-2 tabular-nums">{index + 1}.</span>
						{math ? (
							<MathRenderer expression={item.text} displayMode={false} />
						) : (
							<span className="text-fg">{item.text}</span>
						)}
						{item.role !== 'blank' && (
							<span className="text-muted ml-2 text-[0.65rem] uppercase">{item.role}</span>
						)}
					</li>
				))}
			</ol>
		</div>
	);
}

function CorrectAnswerBlock({ value, math }) {
	if (!String(value || '').trim()) return null;
	return (
		<div>
			<p className="text-muted mb-1 text-[0.7rem] font-semibold tracking-wide uppercase">
				Correct answer
			</p>
			{math ? (
				<MathRenderer expression={value} displayMode />
			) : (
				<p className="text-fg text-sm font-medium">{value}</p>
			)}
		</div>
	);
}

export default function QuestionStudyFeedback({ question, answer, showSolution = false }) {
	const sequence = String(question?.question_type || '').startsWith('SEQ');
	const chessPuzzle = isChessPuzzleQuestion(question);
	const codeQuiz = isCodeQuestion(question);
	const selected = String(answer?.userAnswer ?? '').trim();
	const correctAnswer = String(answer?.correctAnswer ?? '').trim()
		? String(answer.correctAnswer).trim()
		: String(resolveCorrectAnswer(question) ?? '').trim();
	const hasChessInput = (answer?.userChessMoves || []).length > 0;
	const unansweredPeek =
		showSolution &&
		((chessPuzzle && !hasChessInput) ||
			(codeQuiz && !selected) ||
			(sequence && !selected) ||
			(!chessPuzzle && !codeQuiz && !sequence && !selected));
	if (!sequence && !chessPuzzle && !codeQuiz && !selected && !showSolution) return null;
	const math = isMathematical(question?.question_type);
	const correct = chessPuzzle
		? chessPuzzleCredit(question, answer) === 1
		: codeQuiz
			? codeQuestionCredit(question, answer) === 1
			: sequence
				? false
				: answersEqual(correctAnswer, selected, {
						mathematical: math,
						questionType: question?.question_type ?? answer?.questionType
					});
	if (chessPuzzle) {
		if (unansweredPeek) {
			return (
				<div className="border-line bg-surface-2 w-full space-y-3 rounded-md border p-4 text-left">
					{correctAnswer && (
						<p className="text-muted text-sm">
							Solution: <span className="text-fg font-mono">{correctAnswer}</span>
						</p>
					)}
				</div>
			);
		}
		return (
			<div
				className={cn(
					'w-full space-y-3 rounded-md border p-4 text-left',
					correct ? 'border-success/25 bg-success/5' : 'border-danger/25 bg-danger/5'
				)}
			>
				<div
					className={cn(
						'flex items-center gap-2 text-sm font-semibold',
						correct ? 'text-success' : 'text-danger'
					)}
				>
					{correct ? <CheckCircle2 size={16} aria-hidden /> : <XCircle size={16} aria-hidden />}
					{correct ? 'Correct' : 'Review this line'}
				</div>
				{!correct && (
					<p className="text-muted text-sm">
						Solution: <span className="text-fg font-mono">{correctAnswer}</span>
					</p>
				)}
				{hasChessInput && (
					<p className="text-muted text-sm">
						You played:{' '}
						<span className="text-fg font-mono">{formatUciList(answer.userChessMoves)}</span>
					</p>
				)}
			</div>
		);
	}
	if (codeQuiz) {
		if (unansweredPeek) {
			return (
				<div className="border-line bg-surface-2 w-full space-y-3 rounded-md border p-4 text-left">
					{correctAnswer && (
						<div>
							<p className="text-muted mb-1 text-[0.7rem] font-semibold tracking-wide uppercase">
								Expected solution
							</p>
							<CodeAnswerInput question={question} value={correctAnswer} readOnly />
						</div>
					)}
					<StudyNotes question={question} bordered={!!correctAnswer} />
				</div>
			);
		}
		return (
			<div
				className={cn(
					'w-full space-y-3 rounded-md border p-4 text-left',
					correct ? 'border-success/25 bg-success/5' : 'border-danger/25 bg-danger/5'
				)}
			>
				<div
					className={cn(
						'flex items-center gap-2 text-sm font-semibold',
						correct ? 'text-success' : 'text-danger'
					)}
				>
					{correct ? <CheckCircle2 size={16} aria-hidden /> : <XCircle size={16} aria-hidden />}
					{correct ? 'Correct' : 'Review this code'}
				</div>
				{!correct && correctAnswer && (
					<div>
						<p className="text-muted mb-1 text-[0.7rem] font-semibold tracking-wide uppercase">
							Expected solution
						</p>
						<CodeAnswerInput question={question} value={correctAnswer} readOnly />
					</div>
				)}
				<StudyNotes question={question} bordered />
			</div>
		);
	}
	if (sequence) {
		const notes = question?.explanation || question?.worked_solution || question?.source_citation;
		if (!showSolution && !notes) return null;
		return (
			<div className="border-line bg-surface-2 w-full space-y-3 rounded-md border p-4 text-left">
				{showSolution && <SequenceSolution question={question} />}
				<StudyNotes question={question} bordered={showSolution} />
			</div>
		);
	}

	if (unansweredPeek) {
		return (
			<div className="border-line bg-surface-2 w-full space-y-3 rounded-md border p-4 text-left">
				<CorrectAnswerBlock value={correctAnswer} math={math} />
				<StudyNotes question={question} bordered={!!correctAnswer} />
			</div>
		);
	}

	return (
		<div
			className={cn(
				'w-full space-y-3 rounded-md border p-4 text-left',
				correct ? 'border-success/25 bg-success/5' : 'border-danger/25 bg-danger/5'
			)}
		>
			<div
				className={cn(
					'flex items-center gap-2 text-sm font-semibold',
					correct ? 'text-success' : 'text-danger'
				)}
			>
				{correct ? <CheckCircle2 size={16} aria-hidden /> : <XCircle size={16} aria-hidden />}
				{correct ? 'Correct' : 'Review this answer'}
			</div>

			{!correct && <CorrectAnswerBlock value={correctAnswer} math={math} />}

			<StudyNotes question={question} bordered />
		</div>
	);
}
