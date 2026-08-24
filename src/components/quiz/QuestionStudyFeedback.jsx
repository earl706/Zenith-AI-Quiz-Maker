import { BookOpen, CheckCircle2, XCircle } from 'lucide-react';

import { cn } from '../../lib/format';
import { answersEqual } from '../../lib/mathAnswersEqual';
import MathRenderer from './MathRenderer';
import { isMathematical, resolveCorrectAnswer } from './quizHelpers';

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
	const selected = String(answer?.userAnswer ?? '').trim();
	const correctAnswer = String(answer?.correctAnswer ?? '').trim()
		? String(answer.correctAnswer).trim()
		: String(resolveCorrectAnswer(question) ?? '').trim();
	if (!sequence && !selected) return null;
	const math = isMathematical(question?.question_type);
	const correct = sequence
		? false
		: answersEqual(correctAnswer, selected, {
				mathematical: math,
				questionType: question?.question_type ?? answer?.questionType
			});
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
