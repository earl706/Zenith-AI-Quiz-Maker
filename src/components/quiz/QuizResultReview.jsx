import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, List, RotateCcw, X } from 'lucide-react';

import { cn, formatDurationSeconds } from '../../lib/format';
import { Badge, Button, Card, CardBody } from '../ui';
import MathRenderer from './MathRenderer';
import { getChoiceData, isIdentification, isMathematical } from './quizHelpers';

function AnswerText({ value, mathematical, displayMode = false, className }) {
	const text = String(value ?? '').trim();
	if (!text) {
		return <p className={cn('text-muted text-sm italic', className)}>No answer</p>;
	}
	if (mathematical) {
		return <MathRenderer expression={text} displayMode={displayMode} />;
	}
	return <p className={cn('text-sm', className)}>{text}</p>;
}

function SummaryStat({ label, value, mono = false }) {
	return (
		<div className="min-w-0 text-center">
			<p className="text-muted text-[0.65rem] font-medium tracking-wider uppercase">{label}</p>
			<p
				className={cn('text-fg mt-1 truncate text-xl font-bold tabular-nums', mono && 'font-mono')}
			>
				{value}
			</p>
		</div>
	);
}

function ResultSummary({ score, accuracy, time, correctCount, total }) {
	return (
		<Card className="overflow-hidden">
			<div className="from-primary/8 via-surface to-surface bg-linear-to-br p-5">
				<div className="grid grid-cols-3 gap-3">
					<SummaryStat label="Score" value={`${score}/${total}`} />
					<SummaryStat label="Accuracy" value={`${accuracy}%`} />
					<SummaryStat label="Time" value={formatDurationSeconds(time)} mono />
				</div>
				<p className="text-muted mt-4 text-center text-xs">
					{correctCount} correct · {total - correctCount} incorrect
				</p>
			</div>
		</Card>
	);
}

function IdentificationResult({ submitted, correct, math }) {
	return (
		<div className="grid gap-2 sm:grid-cols-2">
			<div>
				<p className="text-muted mb-1.5 text-xs font-medium">Correct answer</p>
				<div className="border-success/20 bg-success/10 rounded-md border p-2.5">
					<AnswerText value={submitted?.correctAnswer} mathematical={math} displayMode />
				</div>
			</div>
			<div>
				<p className="text-muted mb-1.5 text-xs font-medium">Your answer</p>
				<div
					className={cn(
						'rounded-md border p-2.5',
						correct ? 'border-success/20 bg-success/10' : 'border-danger/20 bg-danger/10'
					)}
				>
					<AnswerText value={submitted?.userAnswer} mathematical={math} displayMode />
				</div>
			</div>
		</div>
	);
}

function ChoiceResult({ choices, submitted, math }) {
	return (
		<ul className="space-y-1.5">
			{(choices || []).map((choice, ci) => {
				const choiceData = getChoiceData(choice);
				const isCorrectChoice = choiceData.text === submitted?.correctAnswer;
				const isUserChoice = choiceData.text === submitted?.userAnswer;
				const isWrongPick = isUserChoice && !isCorrectChoice;

				return (
					<li
						key={choiceData.id ?? ci}
						className={cn(
							'rounded-md px-3 py-2.5 text-center text-sm font-medium',
							isCorrectChoice && 'bg-success/15 text-success',
							isWrongPick && 'bg-danger/15 text-danger',
							!isCorrectChoice && !isWrongPick && 'bg-surface-2 text-fg'
						)}
					>
						{choiceData.image && (
							<img
								src={choiceData.image}
								alt=""
								className="mx-auto mb-2 max-h-20 rounded-md object-cover"
							/>
						)}
						{math ? (
							<MathRenderer expression={choiceData.text} displayMode={false} />
						) : (
							<span>{choiceData.text}</span>
						)}
					</li>
				);
			})}
		</ul>
	);
}

function ResultQuestionCard({ question, submitted, index }) {
	const correct = submitted?.correctAnswer === submitted?.userAnswer;
	const math = isMathematical(question.question_type);
	const identification = isIdentification(question.question_type);

	return (
		<Card
			className={cn(
				'overflow-hidden border-l-4',
				correct ? 'border-l-success border-success/25' : 'border-l-danger border-danger/25'
			)}
		>
			<CardBody className="space-y-3 p-5">
				<div className="flex items-center justify-between gap-3 pt-4">
					<p className="text-muted text-xs font-medium tabular-nums">Q{index + 1}</p>
					<Badge tone={correct ? 'success' : 'danger'}>
						{correct ? <Check size={12} aria-hidden /> : <X size={12} aria-hidden />}
					</Badge>
				</div>

				<p className="text-fg text-center text-[0.95rem] leading-snug font-semibold">
					{question.question}
				</p>

				{question.question_image && (
					<div className="flex justify-center">
						<img
							src={question.question_image}
							alt=""
							className="max-h-44 rounded-md object-cover"
						/>
					</div>
				)}

				{identification ? (
					<IdentificationResult submitted={submitted} correct={correct} math={math} />
				) : (
					<ChoiceResult choices={question.choices} submitted={submitted} math={math} />
				)}
			</CardBody>
		</Card>
	);
}

export default function QuizResultReview({
	questions = [],
	submittedAnswers = [],
	score,
	accuracy,
	time,
	onRetake,
	onBackToList
}) {
	const reviewItems = useMemo(
		() =>
			questions.map((question, index) => ({
				question,
				submitted: submittedAnswers[index],
				correct: submittedAnswers[index]?.correctAnswer === submittedAnswers[index]?.userAnswer
			})),
		[questions, submittedAnswers]
	);

	const correctCount = useMemo(
		() => reviewItems.filter((item) => item.correct).length,
		[reviewItems]
	);
	const total = questions.length;

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
			className="space-y-5"
		>
			<ResultSummary
				score={score}
				accuracy={accuracy}
				time={time}
				correctCount={correctCount}
				total={total}
			/>

			{total === 0 ? (
				<Card className="p-8 text-center">
					<p className="text-muted text-sm">No questions to review.</p>
				</Card>
			) : (
				<div className="space-y-3">
					{reviewItems.map(({ question, submitted }, index) => (
						<ResultQuestionCard
							key={question.id ?? index}
							question={question}
							submitted={submitted}
							index={index}
						/>
					))}
				</div>
			)}

			<div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
				<Button onClick={onRetake}>
					<RotateCcw size={14} /> Retake quiz
				</Button>
				<Button variant="secondary" onClick={onBackToList}>
					<List size={14} /> Quiz list
				</Button>
			</div>
		</motion.div>
	);
}
