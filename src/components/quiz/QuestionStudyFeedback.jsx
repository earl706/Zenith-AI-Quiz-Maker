import { BookOpen, CheckCircle2, XCircle } from 'lucide-react';

import { cn } from '../../lib/format';
import { answersEqual } from '../../lib/mathAnswersEqual';
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
			<p className="text-fg text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
		</div>
	);
}

export default function QuestionStudyFeedback({ question, answer }) {
	const sequence = String(question?.question_type || '').startsWith('SEQ');
	const chessPuzzle = isChessPuzzleQuestion(question);
	const codeQuiz = isCodeQuestion(question);
	const selected = String(answer?.userAnswer ?? '').trim();
	const correctAnswer = String(answer?.correctAnswer ?? '').trim()
		? String(answer.correctAnswer).trim()
		: String(resolveCorrectAnswer(question) ?? '').trim();
	if (!sequence && !chessPuzzle && !codeQuiz && !selected) return null;
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
				{(answer?.userChessMoves || []).length > 0 && (
					<p className="text-muted text-sm">
						You played:{' '}
						<span className="text-fg font-mono">{formatUciList(answer.userChessMoves)}</span>
					</p>
				)}
			</div>
		);
	}
	if (codeQuiz) {
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
				{(question?.explanation || question?.worked_solution || question?.source_citation) && (
					<div className="border-line space-y-3 border-t pt-3">
						<p className="text-primary flex items-center gap-1.5 text-xs font-semibold uppercase">
							<BookOpen size={14} aria-hidden />
							Study notes
						</p>
						<ContentBlock label="Explanation" value={question.explanation} />
						<ContentBlock label="Worked solution" value={question.worked_solution} />
						{question.source_citation && (
							<p className="text-muted text-xs">Source: {question.source_citation}</p>
						)}
					</div>
				)}
			</div>
		);
	}
	if (sequence) {
		if (!(question?.explanation || question?.worked_solution || question?.source_citation)) {
			return null;
		}
		return (
			<div className="border-line bg-surface-2 w-full space-y-3 rounded-md border p-4 text-left">
				{(question?.explanation || question?.worked_solution || question?.source_citation) && (
					<div className="space-y-3">
						<p className="text-primary flex items-center gap-1.5 text-xs font-semibold uppercase">
							<BookOpen size={14} aria-hidden />
							Study notes
						</p>
						<ContentBlock label="Explanation" value={question.explanation} />
						<ContentBlock label="Worked solution" value={question.worked_solution} />
						{question.source_citation && (
							<p className="text-muted text-xs">Source: {question.source_citation}</p>
						)}
					</div>
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
				{correct ? 'Correct' : 'Review this answer'}
			</div>

			{!correct && correctAnswer && (
				<div>
					<p className="text-muted mb-1 text-[0.7rem] font-semibold tracking-wide uppercase">
						Correct answer
					</p>
					{math ? (
						<MathRenderer expression={correctAnswer} displayMode />
					) : (
						<p className="text-fg text-sm font-medium">{correctAnswer}</p>
					)}
				</div>
			)}

			{(question?.explanation || question?.worked_solution || question?.source_citation) && (
				<div className="border-line space-y-3 border-t pt-3">
					<p className="text-primary flex items-center gap-1.5 text-xs font-semibold uppercase">
						<BookOpen size={14} aria-hidden />
						Study notes
					</p>
					<ContentBlock label="Explanation" value={question.explanation} />
					<ContentBlock label="Worked solution" value={question.worked_solution} />
					{question.source_citation && (
						<p className="text-muted text-xs">Source: {question.source_citation}</p>
					)}
				</div>
			)}
		</div>
	);
}
