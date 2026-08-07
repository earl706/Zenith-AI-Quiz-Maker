import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Check, X } from 'lucide-react';

import { cn, formatDurationSeconds } from '../../lib/format';
import { answersEqual } from '../../lib/mathAnswersEqual';
import { resolveQuestionImageSrc, resolveQuizImageSrc } from '../../lib/quizImages';
import { Badge, Card, CardBody } from '../ui';
import MathRenderer from './MathRenderer';
import { getChoiceData, isIdentification, isMathematical } from './quizHelpers';
import QuizQuestionListLayout from './QuizQuestionListLayout';
import { useQuestionDisplayLayout } from './useQuestionDisplayLayout';

const RESULT_FILTER_ALL = 'all';
const RESULT_FILTER_WRONG = 'wrong';
const RESULT_FILTER_CORRECT = 'correct';

const RESULT_FILTER_OPTIONS = [
	{ value: RESULT_FILTER_ALL, label: 'All' },
	{ value: RESULT_FILTER_WRONG, label: 'Only wrong' },
	{ value: RESULT_FILTER_CORRECT, label: 'Only correct' }
];

function ResultAnswerFilter({ value, onChange, className }) {
	return (
		<div
			className={cn('border-line bg-surface-2 inline-flex rounded-md border p-0.5', className)}
			role="group"
			aria-label="Filter reviewed questions"
		>
			{RESULT_FILTER_OPTIONS.map((option) => (
				<button
					key={option.value}
					type="button"
					onClick={() => onChange(option.value)}
					className={cn(
						'cursor-pointer rounded-sm px-2.5 py-1.5 text-xs font-medium transition',
						value === option.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
					)}
					aria-pressed={value === option.value}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}

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

function ResultSummary({ score, accuracy, time, correctCount, total, sectionScores = [] }) {
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
				{sectionScores.length > 0 && (
					<ul className="border-line mt-4 space-y-1.5 border-t pt-3 text-left text-xs">
						{sectionScores.map((ss) => (
							<li
								key={`${ss.section ?? 'x'}-${ss.section_title}`}
								className="flex justify-between gap-2"
							>
								<span className="text-fg truncate">{ss.section_title}</span>
								<span className="text-muted shrink-0">
									{ss.score}/{ss.total_score} · {Math.round(ss.accuracy)}%
								</span>
							</li>
						))}
					</ul>
				)}
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
								src={resolveQuizImageSrc(choiceData.image) || choiceData.image}
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

function TeachingContent({ question }) {
	const explanation = String(question?.explanation || '').trim();
	const workedSolution = String(question?.worked_solution || '').trim();
	const citation = String(question?.source_citation || '').trim();
	if (!explanation && !workedSolution && !citation) return null;

	return (
		<div className="border-primary/20 bg-primary/5 space-y-3 rounded-md border p-4 text-left">
			<p className="text-primary flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
				<BookOpen size={14} aria-hidden />
				Study notes
			</p>
			{explanation && (
				<div>
					<p className="text-muted mb-1 text-[0.7rem] font-semibold uppercase">Explanation</p>
					<p className="text-fg text-sm leading-relaxed whitespace-pre-wrap">{explanation}</p>
				</div>
			)}
			{workedSolution && (
				<div>
					<p className="text-muted mb-1 text-[0.7rem] font-semibold uppercase">Worked solution</p>
					<p className="text-fg text-sm leading-relaxed whitespace-pre-wrap">{workedSolution}</p>
				</div>
			)}
			{citation && (
				<p className="text-muted border-line border-t pt-2 text-xs">Source: {citation}</p>
			)}
		</div>
	);
}

function ResultQuestionCard({ question, submitted, index }) {
	const correct = answersEqual(submitted?.correctAnswer, submitted?.userAnswer, {
		questionType: question?.question_type ?? submitted?.questionType
	});
	const math = isMathematical(question.question_type);
	const identification = isIdentification(question.question_type);
	const questionImage = resolveQuestionImageSrc(question);

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

				<p className="text-fg text-center text-2xl leading-snug font-semibold">
					{question.question}
				</p>

				{questionImage && (
					<div className="flex w-full justify-center">
						<img
							src={questionImage}
							alt=""
							className="h-auto max-h-44 w-full max-w-md object-contain"
						/>
					</div>
				)}

				{identification ? (
					<IdentificationResult submitted={submitted} correct={correct} math={math} />
				) : (
					<ChoiceResult choices={question.choices} submitted={submitted} math={math} />
				)}
				<TeachingContent question={question} />
			</CardBody>
		</Card>
	);
}

export default function QuizResultReview({
	questions = [],
	sections = [],
	submittedAnswers = [],
	score,
	accuracy,
	time,
	sectionScores = []
}) {
	const [questionLayout, setQuestionLayout] = useQuestionDisplayLayout();
	const [answerFilter, setAnswerFilter] = useState(RESULT_FILTER_ALL);

	const reviewItems = useMemo(
		() =>
			questions.map((question, index) => ({
				question,
				submitted: submittedAnswers[index],
				correct: answersEqual(
					submittedAnswers[index]?.correctAnswer,
					submittedAnswers[index]?.userAnswer,
					{
						mathematical: isMathematical(question.question_type),
						questionType: question.question_type ?? submittedAnswers[index]?.questionType
					}
				)
			})),
		[questions, submittedAnswers]
	);

	const submittedByQuestionId = useMemo(() => {
		const map = new Map();
		reviewItems.forEach(({ question, submitted }) => {
			if (question?.id != null) map.set(question.id, submitted);
		});
		return map;
	}, [reviewItems]);

	const correctByQuestionId = useMemo(() => {
		const map = new Map();
		reviewItems.forEach(({ question, correct }) => {
			if (question?.id != null) map.set(question.id, correct);
		});
		return map;
	}, [reviewItems]);

	const filteredQuestions = useMemo(() => {
		if (answerFilter === RESULT_FILTER_ALL) return questions;
		return questions.filter((question) => {
			const correct = correctByQuestionId.get(question.id);
			if (answerFilter === RESULT_FILTER_CORRECT) return !!correct;
			return !correct;
		});
	}, [answerFilter, questions, correctByQuestionId]);

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
				sectionScores={sectionScores}
			/>

			{total === 0 ? (
				<Card className="p-8 text-center">
					<p className="text-muted text-sm">No questions to review.</p>
				</Card>
			) : (
				<>
					<QuizQuestionListLayout
						questions={filteredQuestions}
						sections={sections}
						layout={questionLayout}
						onLayoutChange={setQuestionLayout}
						listClassName="space-y-3"
						headerExtra={<ResultAnswerFilter value={answerFilter} onChange={setAnswerFilter} />}
						renderQuestion={(question, index) => {
							const globalIndex = questions.findIndex((q) => q.id === question.id);
							const resolvedIndex = globalIndex >= 0 ? globalIndex : index;
							return (
								<ResultQuestionCard
									key={question.id ?? resolvedIndex}
									question={question}
									submitted={
										submittedByQuestionId.get(question.id) ?? submittedAnswers[resolvedIndex]
									}
									index={resolvedIndex}
								/>
							);
						}}
					/>
					{filteredQuestions.length === 0 && (
						<Card className="p-8 text-center">
							<p className="text-muted text-sm">
								{answerFilter === RESULT_FILTER_CORRECT
									? 'No correct answers in this attempt.'
									: 'No incorrect answers in this attempt.'}
							</p>
						</Card>
					)}
				</>
			)}
		</motion.div>
	);
}
