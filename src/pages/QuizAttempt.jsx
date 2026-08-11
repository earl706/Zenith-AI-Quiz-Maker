import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Target } from 'lucide-react';

import { api } from '../lib/api';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, LoadingScreen } from '../components/ui';
import QuestionCard from '../components/quiz/QuestionCard';
import FlashcardAttempt from '../components/quiz/FlashcardAttempt';
import QuizResultReview from '../components/quiz/QuizResultReview';
import AttemptStatusPanel from '../components/quiz/AttemptStatusPanel';
import QuizQuestionListLayout from '../components/quiz/QuizQuestionListLayout';
import { useAttemptLauncher } from '../components/quiz/useAttemptLauncher';
import {
	QUESTION_LAYOUT_SECTION,
	useQuestionDisplayLayout,
	useSectionPageIndex
} from '../components/quiz/useQuestionDisplayLayout';
import { tryFocusMathField } from '../components/quiz/MathFieldInput';
import {
	answersById,
	buildAnswerRecords,
	canUseSectionQuestionLayout,
	countAnswered,
	groupQuestionsByApiSection,
	identificationAnswerCorpus,
	isIdentification,
	parseAttemptScopeFromSearch,
	sampleArray,
	shuffleArray,
	sortQuestionsBySectionOrder
} from '../components/quiz/quizHelpers';

/** After checking an answer in list mode, wait briefly then focus the next question. */
const LIST_FOCUS_ADVANCE_MS = 2000;

function parseQuizPayload(data) {
	const quizData = data.data || data;
	const questions = data.questions || quizData.questions || [];
	return { quizData, questions };
}

function getAttemptScroller() {
	return document.getElementById('main-content');
}

/** Center an element in the app main scroller (nested overflow; works in Tauri WebKit). */
function scrollAttemptElementToCenter(el, { behavior = 'smooth' } = {}) {
	if (!el) return;
	const scroller = getAttemptScroller();
	if (!scroller) {
		el.scrollIntoView?.({ behavior, block: 'center' });
		return;
	}
	const scrollerRect = scroller.getBoundingClientRect();
	const elRect = el.getBoundingClientRect();
	const delta = elRect.top + elRect.height / 2 - (scrollerRect.top + scrollerRect.height / 2);
	if (Math.abs(delta) < 1) return;
	scroller.scrollBy({ top: delta, behavior });
}

function focusAttemptControl(el) {
	if (!el) return;
	const tag = el.tagName?.toLowerCase?.();
	if (tag === 'math-field') {
		tryFocusMathField(el, { preventScroll: true });
	} else {
		el.focus?.({ preventScroll: true });
	}
}

export default function QuizAttempt() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const scope = useMemo(() => parseAttemptScopeFromSearch(location.search), [location.search]);
	const launchKey = location.state?.attemptLaunchAt;
	const { launchAttempt, attemptModal } = useAttemptLauncher();

	const [time, setTime] = useState(0);
	const [isRunning, setIsRunning] = useState(true);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [submittedAnswers, setSubmittedAnswers] = useState([]);
	const [questions, setQuestions] = useState([]);
	const [score, setScore] = useState(0);
	const [accuracy, setAccuracy] = useState(0);
	const [sectionScores, setSectionScores] = useState([]);
	const [roadmapProgress, setRoadmapProgress] = useState(null);
	const [quizResults, setQuizResults] = useState(false);
	const [answers, setAnswers] = useState([]);
	const [quizData, setQuizData] = useState({
		quiz_title: '',
		flashcard_quiz: false,
		quiz_image: null,
		per_question_timer_enabled: false,
		per_question_time_seconds: 30,
		answer_suggestions_enabled: true
	});

	const answersMap = useMemo(() => answersById(answers), [answers]);
	const answeredCount = useMemo(() => countAnswered(answers), [answers]);
	const suggestionCorpus = useMemo(() => identificationAnswerCorpus(questions), [questions]);
	const firstIdentificationId = useMemo(() => {
		const match = questions.find((q) => isIdentification(q.question_type));
		return match?.id ?? null;
	}, [questions]);
	const [questionLayout, setQuestionLayout] = useQuestionDisplayLayout();

	const sections = quizData.sections || [];
	const sectionGroups = useMemo(
		() => groupQuestionsByApiSection(questions, sections),
		[questions, sections]
	);
	const sectionLayoutAvailable = canUseSectionQuestionLayout(sections) && sectionGroups.length >= 2;
	const [sectionPage, setSectionPage] = useSectionPageIndex(sectionGroups);
	const visibleQuestions = useMemo(() => {
		if (questionLayout === QUESTION_LAYOUT_SECTION && sectionLayoutAvailable) {
			return sectionGroups[sectionPage]?.questions ?? [];
		}
		return questions;
	}, [questionLayout, sectionLayoutAvailable, sectionGroups, sectionPage, questions]);

	const inputRefs = useRef(new Map());
	const cardRefs = useRef(new Map());
	const submitButtonRef = useRef(null);
	const focusAdvanceTimer = useRef(null);
	const visibleQuestionsRef = useRef(visibleQuestions);
	visibleQuestionsRef.current = visibleQuestions;

	const registerInputRef = useCallback((questionId, el) => {
		if (el) inputRefs.current.set(questionId, el);
		else inputRefs.current.delete(questionId);
	}, []);

	const registerCardRef = useCallback((questionId, el) => {
		if (el) cardRefs.current.set(questionId, el);
		else cardRefs.current.delete(questionId);
	}, []);

	const focusQuestionCard = useCallback((questionId) => {
		const card = cardRefs.current.get(questionId);
		if (!card) return;

		const ideInput = inputRefs.current.get(questionId);
		if (ideInput && !ideInput.disabled) {
			focusAttemptControl(ideInput);
		} else {
			const nextControl = card.querySelector(
				'input:not([disabled]), textarea:not([disabled]), math-field:not([disabled]), button:not([disabled])'
			);
			focusAttemptControl(nextControl);
		}
		// Layout may still be settling (feedback block); center after paint.
		requestAnimationFrame(() => scrollAttemptElementToCenter(card));
	}, []);

	const handleListFocusCapture = useCallback((event) => {
		const card = event.target?.closest?.('[data-attempt-question-id]');
		if (!card || !event.currentTarget.contains(card)) return;
		scrollAttemptElementToCenter(card);
	}, []);

	const handleQuestionAnswered = useCallback(
		(questionId) => {
			if (focusAdvanceTimer.current) {
				clearTimeout(focusAdvanceTimer.current);
				focusAdvanceTimer.current = null;
			}
			focusAdvanceTimer.current = setTimeout(() => {
				focusAdvanceTimer.current = null;
				const visible = visibleQuestionsRef.current;
				const index = visible.findIndex((q) => q.id === questionId);
				const next = index >= 0 ? visible[index + 1] : undefined;
				if (next?.id != null) {
					focusQuestionCard(next.id);
				}
			}, LIST_FOCUS_ADVANCE_MS);
		},
		[focusQuestionCard]
	);

	useEffect(
		() => () => {
			if (focusAdvanceTimer.current) clearTimeout(focusAdvanceTimer.current);
		},
		[]
	);

	const handleAnswerChange = useCallback((qid, field, value) => {
		setAnswers((prev) => prev.map((a) => (a.id === qid ? { ...a, [field]: value } : a)));
	}, []);

	const handleIdentificationAnswerChange = useCallback((qid, value) => {
		setAnswers((prev) => prev.map((a) => (a.id === qid ? { ...a, userAnswer: value } : a)));
	}, []);

	const startAttempt = useCallback(async () => {
		try {
			await api.post(`/quizzes/quiz/attempt/${id}/`, {
				full_quiz: scope.fullQuiz,
				section_ids: scope.fullQuiz ? [] : scope.sectionIds
			});
		} catch {
			// Attempt start is best-effort; scoring still uses submit payload.
		}
	}, [id, scope.fullQuiz, scope.sectionIds]);

	const loadQuiz = useCallback(
		async (signal) => {
			setLoading(true);
			try {
				const sectionQuery =
					!scope.fullQuiz && scope.sectionIds.length
						? `&sections=${scope.sectionIds.join(',')}`
						: '';
				const response = await api
					.get(`/quizzes/quiz/${id}/?randomize=true${sectionQuery}`)
					.catch(() =>
						api.get(
							`/quizzes/quiz/${id}/${sectionQuery ? `?sections=${scope.sectionIds.join(',')}` : ''}`
						)
					);
				if (signal?.aborted) return;

				const { quizData: nextQuiz, questions: nextQuestions } = parseQuizPayload(response.data);

				let scopedQuestions = nextQuestions;
				if (scope.sample) {
					scopedQuestions = sampleArray(nextQuestions, scope.sample);
				} else if (scope.shuffle) {
					scopedQuestions = shuffleArray(nextQuestions);
				} else if (!nextQuiz.random_question_order) {
					scopedQuestions = sortQuestionsBySectionOrder(nextQuestions, nextQuiz.sections || []);
				}

				setQuizData(nextQuiz);
				setQuestions(scopedQuestions);
				setAnswers(buildAnswerRecords(scopedQuestions));
				setSubmittedAnswers([]);
				setScore(0);
				setAccuracy(0);
				setSectionScores([]);
				setRoadmapProgress(null);
				setQuizResults(false);
				setTime(0);
				setIsRunning(true);
				if (!signal?.aborted) {
					await startAttempt();
				}
			} catch {
				if (signal?.aborted) return;
				toast.error('Could not load quiz.');
				navigate('/quizzes');
			} finally {
				if (!signal?.aborted) setLoading(false);
			}
		},
		[id, navigate, scope.fullQuiz, scope.sectionIds, scope.shuffle, scope.sample, startAttempt]
	);

	useEffect(() => {
		const controller = new AbortController();
		// Initial load / scope change / same-URL retake via launcher state.
		// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
		loadQuiz(controller.signal);
		return () => controller.abort();
	}, [loadQuiz, launchKey]);

	useEffect(() => {
		if (!isRunning) return undefined;
		const interval = setInterval(() => setTime((t) => t + 1), 1000);
		return () => clearInterval(interval);
	}, [isRunning]);

	const submitAnswers = async () => {
		if (focusAdvanceTimer.current) {
			clearTimeout(focusAdvanceTimer.current);
			focusAdvanceTimer.current = null;
		}
		if (questions.length === 0) {
			toast.error('This quiz has no questions.');
			return;
		}
		try {
			setSubmitting(true);
			const response = await api.post(`/quizzes/quiz/submit/${id}/`, { answers, time });
			setSubmittedAnswers(Array.from(response.data.answers || []));
			setScore(response.data.score);
			setAccuracy(response.data.accuracy);
			setSectionScores(response.data.section_scores || []);
			setRoadmapProgress(response.data.roadmap_progress || null);
			setQuizResults(true);
			setIsRunning(false);
		} catch {
			toast.error('Failed to submit answers.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleRetake = () => {
		const quizSections = Array.isArray(quizData.sections) ? quizData.sections : [];
		if (quizSections.length === 0) {
			loadQuiz();
			return;
		}
		const initialSectionIds = scope.fullQuiz ? [] : scope.sectionIds;
		launchAttempt(
			{ ...quizData, uuid: quizData.uuid || id },
			{
				initialSectionIds,
				highlightedSectionId:
					!scope.fullQuiz && scope.sectionIds.length === 1 ? scope.sectionIds[0] : undefined,
				presetHint: 'Pre-selected from your last attempt — you can change the selection below.'
			}
		);
	};

	if (loading) {
		return (
			<>
				{attemptModal}
				<LoadingScreen />
			</>
		);
	}

	const modeLabel = quizData.flashcard_quiz ? 'Flashcard' : 'List';
	const scopeLabel = scope.sample
		? `${Math.min(scope.sample, questions.length)} random questions`
		: scope.fullQuiz
			? scope.shuffle
				? 'All sections (shuffled)'
				: 'All sections'
			: `${scope.sectionIds.length} section${scope.sectionIds.length === 1 ? '' : 's'}`;

	return (
		<div>
			{attemptModal}
			<PageHeader
				title={quizData.quiz_title || 'Quiz attempt'}
				icon={Target}
				description={quizResults ? 'Review your answers' : 'Answer each question, then submit'}
				actions={
					<div className="flex flex-wrap gap-1.5">
						<Badge tone="primary">{modeLabel}</Badge>
						{(quizData.sections?.length > 0 || !scope.fullQuiz) && (
							<Badge tone="accent">{scopeLabel}</Badge>
						)}
					</div>
				}
			/>

			<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
				<div className="min-w-0 flex-1">
					{quizResults ? (
						<QuizResultReview
							questions={questions}
							sections={quizData.sections || []}
							submittedAnswers={submittedAnswers}
							score={score}
							accuracy={accuracy}
							time={time}
							sectionScores={sectionScores}
							roadmapProgress={roadmapProgress}
							quiz={quizData.uuid || id ? { ...quizData, uuid: quizData.uuid || id } : null}
							onRoadmapCreated={setRoadmapProgress}
						/>
					) : quizData.flashcard_quiz ? (
						<FlashcardAttempt
							questions={questions}
							answersByIdMap={answersMap}
							onAnswerChange={handleAnswerChange}
							onIdentificationChange={handleIdentificationAnswerChange}
							onSubmit={submitAnswers}
							submitting={submitting}
							answerSuggestionsEnabled={quizData.answer_suggestions_enabled !== false}
							suggestionCorpus={suggestionCorpus}
							perQuestionTimerEnabled={!!quizData.per_question_timer_enabled}
							perQuestionTimeSeconds={quizData.per_question_time_seconds ?? 30}
						/>
					) : (
						<div onFocusCapture={handleListFocusCapture}>
							<QuizQuestionListLayout
								questions={questions}
								sections={quizData.sections || []}
								layout={questionLayout}
								onLayoutChange={setQuestionLayout}
								sectionPage={sectionPage}
								onSectionPageChange={setSectionPage}
								renderQuestion={(question) => (
									<div
										key={question.id}
										data-attempt-question-id={question.id}
										ref={(el) => registerCardRef(question.id, el)}
									>
										<QuestionCard
											question={question}
											answers={answers}
											handleAnswerChange={handleAnswerChange}
											handleIdentificationAnswerChange={handleIdentificationAnswerChange}
											answerSuggestionsEnabled={quizData.answer_suggestions_enabled !== false}
											suggestionCorpus={suggestionCorpus}
											autoFocus={
												firstIdentificationId != null && question.id === firstIdentificationId
											}
											onAnswered={handleQuestionAnswered}
											inputRef={
												isIdentification(question.question_type)
													? (el) => registerInputRef(question.id, el)
													: null
											}
										/>
									</div>
								)}
							/>
						</div>
					)}
				</div>

				<AttemptStatusPanel
					time={time}
					answeredCount={answeredCount}
					totalQuestions={questions.length}
					showResults={quizResults}
					score={score}
					accuracy={accuracy}
					sectionScores={sectionScores}
					hideElapsedTimer={!!quizData.per_question_timer_enabled && !quizResults}
					onSubmit={submitAnswers}
					submitting={submitting}
					onRetake={handleRetake}
					onBackToList={() => navigate('/quizzes')}
					quizImage={quizData.quiz_image || quizData.quiz_image_url || null}
					submitButtonRef={submitButtonRef}
				/>
			</div>
		</div>
	);
}
