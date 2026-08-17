import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Check, GitBranch, Sparkles, X } from 'lucide-react';

import { cn, formatDurationSeconds } from '../../lib/format';
import { answersEqual } from '../../lib/mathAnswersEqual';
import { resolveQuestionImageSrc, resolveQuizImageSrc } from '../../lib/quizImages';
import CreateRoadmapFromQuizModal from '../roadmap/CreateRoadmapFromQuizModal';
import { Badge, Button, Card, CardBody, ProgressRing } from '../ui';
import MathRenderer from './MathRenderer';
import { getChoiceData, accuracyTone, isIdentification, isMathematical } from './quizHelpers';
import QuizQuestionListLayout from './QuizQuestionListLayout';
import { useQuestionDisplayLayout } from './useQuestionDisplayLayout';

function roadmapProgressFromFork(data) {
	const nodes = data?.nodes || [];
	const progress = data?.progress || {
		total: nodes.length,
		mastered: nodes.filter((n) => n.status === 'mastered').length,
		percent: 0
	};
	return {
		roadmap: {
			id: data.id,
			uuid: data.uuid,
			title: data.title,
			color: data.color,
			status: data.status,
			progress,
			progress_before: progress,
			nodes_delta: []
		},
		can_create: false,
		created_after_attempt: true
	};
}

function settingsFailureLabel(key) {
	switch (key) {
		case 'flashcard':
			return 'flashcard';
		case 'random_question_order':
			return 'shuffle questions';
		case 'per_question_timer':
			return 'per-question timer';
		default:
			return key;
	}
}

function deltaOutcomeLabel(delta) {
	switch (delta.outcome) {
		case 'mastered':
			return 'Just mastered';
		case 'qualified':
			return '+1 qualifying';
		case 'below_gate':
			return delta.attempt_accuracy != null
				? `Below gate — accuracy was ${Math.round(delta.attempt_accuracy)}%`
				: 'Below gate';
		case 'settings_not_met': {
			const failures = Array.isArray(delta.settings_failures) ? delta.settings_failures : [];
			const needed = failures.map(settingsFailureLabel).filter(Boolean);
			if (needed.length) {
				return `Didn’t count — need ${needed.join(', ')}`;
			}
			return 'Didn’t count — quiz settings don’t match';
		}
		case 'locked':
			return 'Locked';
		case 'already_mastered':
			return 'Already mastered';
		case 'no_score':
			return 'No section score';
		default:
			return null;
	}
}

function RoadmapMasteryOverview({ roadmapProgress, quiz, onRoadmapCreated }) {
	const [createOpen, setCreateOpen] = useState(false);
	const roadmap = roadmapProgress?.roadmap ?? null;
	const canCreate = !!roadmapProgress?.can_create;
	const createdAfter = !!roadmapProgress?.created_after_attempt;
	const progress = roadmap?.progress;
	const deltas = useMemo(
		() => (roadmap?.nodes_delta || []).filter((d) => d.outcome !== 'already_mastered'),
		[roadmap?.nodes_delta]
	);

	if (!roadmap && !canCreate) return null;

	if (!roadmap) {
		return (
			<>
				<Card className="overflow-hidden">
					<div className="from-primary/8 via-surface to-surface space-y-3 bg-linear-to-br p-5">
						<div className="flex items-start gap-3">
							<div className="bg-surface-2 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
								<GitBranch size={18} aria-hidden />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-fg text-sm font-semibold">Roadmap mastery</p>
								<p className="text-muted mt-0.5 text-xs leading-relaxed">
									No mastery roadmap for this quiz yet. Create one to track section mastery (N
									attempts × ≥X% accuracy).
								</p>
							</div>
						</div>
						{canCreate && (
							<Button size="sm" onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
								Create roadmap
							</Button>
						)}
					</div>
				</Card>
				<CreateRoadmapFromQuizModal
					open={createOpen}
					onClose={() => setCreateOpen(false)}
					quiz={quiz}
					onCreated={onRoadmapCreated}
				/>
			</>
		);
	}

	return (
		<Card className="overflow-hidden">
			<div className="from-primary/8 via-surface to-surface bg-linear-to-br p-5">
				<div className="flex items-start gap-4">
					<div className="flex shrink-0 flex-col items-center gap-0.5">
						<ProgressRing
							value={progress?.percent || 0}
							size={52}
							stroke={5}
							tone="primary"
							label={`${Math.round(progress?.percent || 0)}`}
						/>
						<p className="text-muted text-[10px] tabular-nums">
							{progress?.mastered}/{progress?.total}
						</p>
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<p className="text-fg truncate text-sm font-semibold">{roadmap.title}</p>
							<Link
								to="/roadmap"
								className="text-primary shrink-0 text-xs font-medium hover:underline"
							>
								View roadmap
							</Link>
						</div>
						<p className="text-muted mt-0.5 text-xs">
							Mastery path
							{roadmap.progress_before &&
								roadmap.progress_before.mastered !== progress?.mastered && (
									<>
										{' '}
										· was {roadmap.progress_before.mastered}/{roadmap.progress_before.total}
									</>
								)}
						</p>
						{createdAfter && (
							<p className="text-muted mt-2 text-xs leading-relaxed">
								Created after this attempt — future qualifying attempts will count here.
							</p>
						)}
					</div>
				</div>

				{deltas.length > 0 && (
					<ul className="border-line mt-4 space-y-2 border-t pt-3">
						{deltas.map((delta) => {
							const label = deltaOutcomeLabel(delta);
							const tone =
								delta.outcome === 'mastered' || delta.outcome === 'qualified'
									? 'success'
									: delta.outcome === 'below_gate' || delta.outcome === 'settings_not_met'
										? 'warning'
										: 'neutral';
							return (
								<li key={delta.id} className="flex items-start gap-2 text-xs">
									{delta.outcome === 'mastered' ? (
										<Sparkles size={14} className="text-success mt-0.5 shrink-0" aria-hidden />
									) : (
										<GitBranch size={14} className="text-primary mt-0.5 shrink-0" aria-hidden />
									)}
									<div className="min-w-0 flex-1">
										<p className="text-fg truncate font-medium">{delta.title}</p>
										<p className="text-muted tabular-nums">
											{delta.qualifying_attempts}/{delta.mastery_attempts_required} at ≥
											{delta.mastery_accuracy_threshold}%
										</p>
									</div>
									{label && (
										<Badge
											tone={tone}
											className="max-w-44 shrink-0 text-right text-[10px] leading-tight whitespace-normal"
										>
											{label}
										</Badge>
									)}
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</Card>
	);
}

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
	const pct = Number.parseFloat(accuracy) || 0;
	const tone = accuracyTone(accuracy);
	return (
		<Card className="overflow-hidden">
			<div className="from-primary/8 via-surface to-surface bg-linear-to-br p-5">
				<div className="grid grid-cols-3 items-center gap-3">
					<SummaryStat label="Score" value={`${score}/${total}`} />
					<div className="min-w-0 text-center">
						<p className="text-muted text-[0.65rem] font-medium tracking-wider uppercase">
							Accuracy
						</p>
						<div className="mt-1 flex justify-center">
							<ProgressRing
								value={pct}
								size={72}
								stroke={6}
								tone={tone}
								label={`${Math.round(pct)}`}
							/>
						</div>
					</div>
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
	sectionScores = [],
	roadmapProgress = null,
	quiz = null,
	onRoadmapCreated
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

			<RoadmapMasteryOverview
				roadmapProgress={roadmapProgress}
				quiz={quiz}
				onRoadmapCreated={(data) => onRoadmapCreated?.(roadmapProgressFromFork(data))}
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
