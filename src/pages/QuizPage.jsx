import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
	BookOpen,
	Play,
	Pencil,
	Layers,
	Shuffle,
	ListOrdered,
	Clock,
	HelpCircle,
	SlidersHorizontal,
	Map as MapIcon,
	Merge,
	Download
} from 'lucide-react';

import { get } from '../lib/api';
import { downloadQuizAsJson } from '../lib/exportQuizJson';
import { formatDate, formatDurationSeconds, fromNow } from '../lib/format';
import { resolveQuizImageSrc } from '../lib/quizImages';
import { normalizeQuizList } from '../lib/resources';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import CreateRoadmapFromQuizModal from '../components/roadmap/CreateRoadmapFromQuizModal';
import {
	Badge,
	Button,
	Card,
	CardBody,
	EmptyState,
	LoadingScreen,
	ProgressRing
} from '../components/ui';
import MathRenderer from '../components/quiz/MathRenderer';
import MergeQuizzesModal from '../components/quiz/MergeQuizzesModal';
import QuestionTitle from '../components/quiz/QuestionTitle';
import { PersistedQuizSettingsModal } from '../components/quiz/QuizSettingsModal';
import QuizQuestionListLayout from '../components/quiz/QuizQuestionListLayout';
import {
	QUESTION_LAYOUT_SECTION,
	useQuestionDisplayLayout,
	useSectionPageIndex
} from '../components/quiz/useQuestionDisplayLayout';
import {
	accuracyTone,
	attemptScopeLabel,
	canUseSectionQuestionLayout,
	getAttemptStats,
	getChoiceData,
	groupQuestionsByApiSection,
	isMathematical,
	questionTypeLabel,
	sortQuestionsBySectionOrder
} from '../components/quiz/quizHelpers';
import { useAttemptLauncher } from '../components/quiz/useAttemptLauncher';

function parseQuizSummary(payload) {
	if (!payload || typeof payload !== 'object') {
		return { quiz: null, questions: [], attempts: [], meta: {} };
	}

	// Summary: { quiz, attempts, questions_length, ... }
	// Detail:   { data, questions }
	const quiz = payload.quiz || payload.data || (payload.quiz_title ? payload : null);
	const questions = payload.questions || quiz?.questions || [];
	const attempts = Array.isArray(payload.attempts) ? payload.attempts : [];

	return {
		quiz,
		questions: Array.isArray(questions) ? questions : [],
		attempts,
		meta: {
			questionsLength: payload.questions_length ?? questions.length,
			computational: payload.computational_questions,
			identification: payload.identification_questions,
			multipleChoice: payload.multiple_choice_questions
		}
	};
}

export default function QuizPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { launchAttempt, attemptModal } = useAttemptLauncher();
	const [questionLayout, setQuestionLayout] = useQuestionDisplayLayout();
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [roadmapOpen, setRoadmapOpen] = useState(false);
	const [mergeOpen, setMergeOpen] = useState(false);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ['quizzes', 'summary', id],
		queryFn: async () => {
			try {
				return await get(`/quizzes/quiz/summary/${id}/`);
			} catch {
				return await get(`/quizzes/quiz/${id}/`);
			}
		},
		staleTime: 0,
		refetchOnMount: 'always',
		retry: false
	});

	const { data: quizListData } = useQuery({
		queryKey: ['quizzes', 'list'],
		queryFn: () => get('/quizzes/quiz/'),
		staleTime: 60_000,
		enabled: mergeOpen
	});

	const { quiz, questions, attempts, meta } = parseQuizSummary(data);
	const mergeCandidates = useMemo(() => {
		const list = normalizeQuizList(quizListData);
		if (list.length) return list;
		return quiz ? [quiz] : [];
	}, [quizListData, quiz]);
	const settingsQuiz = useMemo(() => {
		if (!quiz) return null;
		const nested = Array.isArray(quiz.questions) ? quiz.questions : [];
		if (nested.length) return quiz;
		return { ...quiz, questions };
	}, [quiz, questions]);
	const sections = quiz?.sections || [];
	const orderedQuestions = useMemo(
		() => sortQuestionsBySectionOrder(questions, sections),
		[questions, sections]
	);
	const sectionGroups = useMemo(
		() => groupQuestionsByApiSection(orderedQuestions, sections),
		[orderedQuestions, sections]
	);
	const sectionLayoutAvailable = canUseSectionQuestionLayout(sections) && sectionGroups.length >= 2;
	const viewingSectionLayout = questionLayout === QUESTION_LAYOUT_SECTION && sectionLayoutAvailable;
	const [sectionPage, setSectionPage] = useSectionPageIndex(sectionGroups);
	const questionNumberById = useMemo(() => {
		const map = new Map();
		orderedQuestions.forEach((q, i) => {
			if (q?.id != null) map.set(q.id, i + 1);
		});
		return map;
	}, [orderedQuestions]);

	const handleHeaderAttempt = () => {
		if (!viewingSectionLayout) {
			launchAttempt(quiz);
			return;
		}
		const group = sectionGroups[sectionPage];
		const sectionId = group?.section?.id;
		const count = group?.questions?.length ?? 0;
		if (!sectionId || count === 0) {
			toast.error('This section has no questions to attempt.');
			return;
		}
		launchAttempt(quiz, {
			initialSectionIds: [sectionId],
			highlightedSectionId: sectionId
		});
	};

	const handleExportJson = () => {
		try {
			const { filename } = downloadQuizAsJson(quiz, orderedQuestions);
			toast.success(`Exported ${filename}`);
		} catch (error) {
			toast.error(error?.message || 'Could not export quiz JSON.');
		}
	};

	if (isLoading) return <LoadingScreen />;

	if (isError || !quiz) {
		return (
			<div>
				{attemptModal}
				<PageHeader title="Quiz" icon={BookOpen} />
				<EmptyState
					icon={BookOpen}
					title="Quiz not found"
					description="This quiz may have been deleted or you no longer have access."
					action={
						<Button size="sm" onClick={() => navigate('/quizzes')}>
							Back to quizzes
						</Button>
					}
				/>
			</div>
		);
	}

	const questionCount = meta.questionsLength || questions.length;
	const isFlashcard = Boolean(quiz.flashcard_quiz);
	const isRandom = Boolean(quiz.random_question_order);

	const stats = [
		{ label: 'Questions', value: questionCount, icon: HelpCircle },
		{ label: 'Format', value: isFlashcard ? 'Flashcard' : 'List', icon: Layers },
		{
			label: 'Created',
			value: formatDate(quiz.created_at || quiz.date_created) || '—',
			icon: Clock
		},
		{
			label: 'Sequence',
			value: isRandom ? 'Random' : 'Ordered',
			icon: isRandom ? Shuffle : ListOrdered
		}
	];

	return (
		<div>
			{attemptModal}
			<PageHeader
				title={
					<span className="inline-flex items-center gap-2.5">
						{quiz.tag_color && (
							<span
								className="inline-block h-3 w-3 shrink-0 rounded-full"
								style={{ backgroundColor: quiz.tag_color }}
								aria-hidden
							/>
						)}
						{quiz.quiz_title}
					</span>
				}
				icon={BookOpen}
				description={`${questionCount} question${questionCount === 1 ? '' : 's'}${
					attempts.length > 0
						? ` · ${attempts.length} attempt${attempts.length === 1 ? '' : 's'}`
						: ''
				}`}
				actions={
					<div className="flex items-center gap-1.5 sm:gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="cursor-pointer"
							aria-label="Quiz settings"
							title="Quiz settings"
							onClick={() => setSettingsOpen(true)}
						>
							<SlidersHorizontal size={16} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="cursor-pointer"
							aria-label="Export JSON"
							title="Export JSON"
							onClick={handleExportJson}
						>
							<Download size={16} />
						</Button>
						{sections.length > 0 && (
							<Button
								variant="secondary"
								onClick={() => setRoadmapOpen(true)}
								title="Create mastery roadmap from this quiz"
							>
								<MapIcon size={14} /> Roadmap
							</Button>
						)}
						<Button
							variant="secondary"
							onClick={() => setMergeOpen(true)}
							title="Merge this quiz into another"
						>
							<Merge size={14} /> Merge into…
						</Button>
						<Button variant="secondary" onClick={() => navigate(`/quizzes/edit/${id}`)}>
							<Pencil size={14} /> Edit
						</Button>
						<Button onClick={handleHeaderAttempt}>
							<Play size={14} /> Attempt
						</Button>
					</div>
				}
			/>

			<PersistedQuizSettingsModal
				quiz={settingsQuiz}
				open={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				onSaved={() => refetch()}
			/>
			<CreateRoadmapFromQuizModal
				open={roadmapOpen}
				onClose={() => setRoadmapOpen(false)}
				quiz={quiz}
				navigateOnSuccess
			/>
			<MergeQuizzesModal
				open={mergeOpen}
				onClose={() => setMergeOpen(false)}
				quizzes={mergeCandidates}
				initialSourceUuid={id}
				onMerged={(result) => {
					refetch();
					if (result?.target_uuid) {
						navigate(`/quizzes/${result.target_uuid}`);
					}
				}}
			/>
			{quiz.quiz_image && (
				<div className="border-line bg-surface mb-6 overflow-hidden rounded-md border">
					<img
						src={resolveQuizImageSrc(quiz.quiz_image) || quiz.quiz_image}
						alt=""
						className="max-h-56 w-full object-cover"
					/>
				</div>
			)}

			<div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
				{stats.map(({ label, value, icon: Icon }) => (
					<Card key={label} className="flex items-center gap-3 p-4">
						<div className="bg-primary/12 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-sm">
							<Icon size={16} />
						</div>
						<div className="min-w-0">
							<p className="text-muted text-xs">{label}</p>
							<p className="text-fg truncate text-sm font-semibold">{value}</p>
						</div>
					</Card>
				))}
			</div>

			{(meta.multipleChoice != null ||
				meta.identification != null ||
				meta.computational != null ||
				(quiz.sections?.length ?? 0) > 0) && (
				<div className="mb-8 flex flex-wrap gap-2">
					{(quiz.sections?.length ?? 0) > 0 && (
						<Badge tone="neutral">
							{quiz.sections.length} section{quiz.sections.length === 1 ? '' : 's'}
						</Badge>
					)}
					{meta.multipleChoice > 0 && (
						<Badge tone="primary">{meta.multipleChoice} multiple choice</Badge>
					)}
					{meta.identification > 0 && (
						<Badge tone="accent">{meta.identification} identification</Badge>
					)}
					{meta.computational > 0 && (
						<Badge tone="warning">{meta.computational} computational</Badge>
					)}
				</div>
			)}

			<div className="flex flex-col gap-8 lg:flex-row lg:items-start">
				<section className="min-w-0 flex-1">
					<h2 className="text-fg mb-4 text-lg font-bold tracking-tight">Questions</h2>

					{questions.length === 0 ? (
						<Card className="p-8 text-center">
							<p className="text-muted text-sm">This quiz has no questions yet.</p>
						</Card>
					) : (
						<QuizQuestionListLayout
							questions={orderedQuestions}
							sections={sections}
							layout={questionLayout}
							onLayoutChange={setQuestionLayout}
							sectionPage={sectionPage}
							onSectionPageChange={setSectionPage}
							listClassName="space-y-4"
							renderQuestion={(question, index) => {
								const questionNumber =
									(question?.id != null && questionNumberById.get(question.id)) || index + 1;
								const choices = Array.isArray(question.choices) ? question.choices : [];
								const math = isMathematical(question.question_type);

								return (
									<Card key={question.id ?? index} className="overflow-hidden">
										<div className="border-line flex items-center justify-between gap-3 border-b px-5 py-3">
											<span className="text-muted text-xs font-medium tracking-wide uppercase">
												Question {questionNumber}
											</span>
											<Badge tone="neutral">{questionTypeLabel(question.question_type)}</Badge>
										</div>
										<CardBody className="space-y-4 p-5">
											<QuestionTitle
												text={question.question}
												mathematical={math}
												className="text-base"
											/>

											{question.question_image && (
												<div className="flex justify-center">
													<img
														src={
															resolveQuizImageSrc(question.question_image) ||
															question.question_image
														}
														alt=""
														className="max-h-40 rounded-md object-cover"
													/>
												</div>
											)}

											{choices.length > 0 && (
												<div className="flex flex-wrap justify-center gap-2">
													{choices.map((choice, ci) => {
														const {
															text: choiceText,
															image: choiceImage,
															id: choiceId
														} = getChoiceData(choice);
														if (!choiceText && !choiceImage) return null;

														return (
															<div
																key={choiceId ?? ci}
																className="bg-surface-2 flex max-w-full min-w-30 flex-col items-center gap-2 rounded-md px-4 py-2.5 sm:max-w-3xl"
															>
																{choiceImage && (
																	<img
																		src={resolveQuizImageSrc(choiceImage) || choiceImage}
																		alt=""
																		className="max-h-20 rounded-md object-cover"
																	/>
																)}
																{choiceText &&
																	(math ? (
																		<div className="max-w-full overflow-x-auto text-center whitespace-nowrap">
																			<MathRenderer expression={choiceText} displayMode={false} />
																		</div>
																	) : (
																		<span className="text-fg text-center text-sm font-medium">
																			{choiceText}
																		</span>
																	))}
															</div>
														);
													})}
												</div>
											)}
										</CardBody>
									</Card>
								);
							}}
						/>
					)}
				</section>

				<aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-72 lg:self-start">
					<h2 className="text-fg mb-3 text-lg font-bold tracking-tight">Attempts</h2>

					{attempts.length === 0 ? (
						<Card className="p-6 text-center">
							<p className="text-muted text-sm">No attempts yet.</p>
							<Button size="sm" className="mt-3" onClick={() => launchAttempt(quiz)}>
								<Play size={14} /> Start one
							</Button>
						</Card>
					) : (
						<div className="space-y-3">
							{attempts.map((attempt) => {
								const key = attempt.uuid || attempt.id;
								const { score, total, accuracy, complete, sectionScores } =
									getAttemptStats(attempt);
								const tone = complete ? accuracyTone(accuracy) : 'primary';
								const when = attempt.attempt_datetime;
								const scope = attemptScopeLabel(attempt);

								return (
									<Card key={key} className="flex flex-col gap-3 p-4">
										<div className="flex items-center gap-3">
											{complete ? (
												<ProgressRing
													value={accuracy}
													size={56}
													stroke={5}
													tone={tone}
													label={`${Math.round(accuracy)}`}
												/>
											) : (
												<div className="bg-surface-2 text-muted flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xs font-medium">
													—
												</div>
											)}
											<div className="min-w-0 flex-1 space-y-1 text-xs">
												<div className="flex justify-between gap-2">
													<span className="text-muted">When</span>
													<span
														className="text-fg truncate"
														title={formatDate(when, 'MMM d, yyyy · h:mm a')}
													>
														{when ? fromNow(when) : '—'}
													</span>
												</div>
												<div className="flex justify-between gap-2">
													<span className="text-muted">Score</span>
													<span className="text-fg font-medium">
														{complete ? `${score} / ${total}` : 'Incomplete'}
													</span>
												</div>
												<div className="flex justify-between gap-2">
													<span className="text-muted">Scope</span>
													<span className="text-fg truncate" title={scope}>
														{scope}
													</span>
												</div>
												<div className="flex justify-between gap-2">
													<span className="text-muted">Duration</span>
													<span className="text-fg">
														{formatDurationSeconds(Number(attempt.duration) || 0)}
													</span>
												</div>
											</div>
										</div>
										{sectionScores.length > 0 && (
											<ul className="border-line space-y-1 border-t pt-2 text-[0.7rem]">
												{sectionScores.map((ss) => (
													<li
														key={`${ss.section ?? ss.section_title}-${ss.id ?? ss.section_title}`}
														className="text-muted flex justify-between gap-2"
													>
														<span className="truncate">{ss.section_title}</span>
														<span className="text-fg shrink-0">
															{ss.score}/{ss.total_score} · {Math.round(ss.accuracy)}%
														</span>
													</li>
												))}
											</ul>
										)}
									</Card>
								);
							})}
						</div>
					)}
				</aside>
			</div>
		</div>
	);
}
