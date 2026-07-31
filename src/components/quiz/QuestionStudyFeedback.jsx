import { BookOpen, CheckCircle2, XCircle } from 'lucide-react';

import { cn } from '../../lib/format';
import MathRenderer from './MathRenderer';
import { isMathematical } from './quizHelpers';

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
	const selected = String(answer?.userAnswer ?? '').trim();
	const correctAnswer = String(answer?.correctAnswer ?? question?.correct_answer ?? '').trim();
	if (!selected) return null;

	const correct = selected === correctAnswer;
	const math = isMathematical(question?.question_type);

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
