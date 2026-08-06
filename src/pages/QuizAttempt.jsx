import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Target } from 'lucide-react';

import { api } from '../lib/api';
import { toast } from '../stores/toastStore';
import { resolveQuizImageSrc } from '../lib/quizImages';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, LoadingScreen } from '../components/ui';
import QuestionCard from '../components/quiz/QuestionCard';
import FlashcardAttempt from '../components/quiz/FlashcardAttempt';
import QuizResultReview from '../components/quiz/QuizResultReview';
import AttemptStatusPanel from '../components/quiz/AttemptStatusPanel';
import QuizQuestionListLayout from '../components/quiz/QuizQuestionListLayout';
import { useQuestionDisplayLayout } from '../components/quiz/useQuestionDisplayLayout';
import {
	answersById,
	buildAnswerRecords,
	countAnswered,
	identificationAnswerCorpus,
	parseAttemptScopeFromSearch,
	sampleArray,
	shuffleArray,
	sortQuestionsBySectionOrder
} from '../components/quiz/quizHelpers';

function parseQuizPayload(data) {
	const quizData = data.data || data;
	const questions = data.questions || quizData.questions || [];
	return { quizData, questions };
}

export default function QuizAttempt() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const scope = useMemo(() => parseAttemptScopeFromSearch(location.search), [location.search]);

	const [time, setTime] = useState(0);
	const [isRunning, setIsRunning] = useState(true);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [submittedAnswers, setSubmittedAnswers] = useState([]);
	const [questions, setQuestions] = useState([]);
	const [score, setScore] = useState(0);
	const [accuracy, setAccuracy] = useState(0);
	const [sectionScores, setSectionScores] = useState([]);
	const [quizResults, setQuizResults] = useState(false);
	const [answers, setAnswers] = useState([]);
	const [quizData, setQuizData] = useState({
		quiz_title: '',
		flashcard_quiz: false,
		quiz_image: null,
		per_question_timer_enabled: false,
		per_question_time_seconds: 30
	});

	const answersMap = useMemo(() => answersById(answers), [answers]);
	const answeredCount = useMemo(() => countAnswered(answers), [answers]);
	const suggestionCorpus = useMemo(() => identificationAnswerCorpus(questions), [questions]);
	const [questionLayout, setQuestionLayout] = useQuestionDisplayLayout();

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
		// Initial load / scope change — loadQuiz owns loading state.
		// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
		loadQuiz(controller.signal);
		return () => controller.abort();
	}, [loadQuiz]);

	useEffect(() => {
		if (!isRunning) return undefined;
		const interval = setInterval(() => setTime((t) => t + 1), 1000);
		return () => clearInterval(interval);
	}, [isRunning]);

	const submitAnswers = async () => {
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
			setQuizResults(true);
			setIsRunning(false);
		} catch {
			toast.error('Failed to submit answers.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleRetake = () => {
		loadQuiz();
	};

	if (loading) return <LoadingScreen />;

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

			{(resolveQuizImageSrc(quizData.quiz_image) ||
				resolveQuizImageSrc(quizData.quiz_image_url) ||
				quizData.quiz_image) && (
				<div className="mb-5 flex justify-center">
					<img
						src={
							resolveQuizImageSrc(quizData.quiz_image) ||
							resolveQuizImageSrc(quizData.quiz_image_url) ||
							quizData.quiz_image
						}
						alt=""
						className="h-auto max-h-36 w-auto max-w-full object-contain"
					/>
				</div>
			)}

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
						/>
					) : quizData.flashcard_quiz ? (
						<FlashcardAttempt
							questions={questions}
							answersByIdMap={answersMap}
							onAnswerChange={handleAnswerChange}
							onIdentificationChange={handleIdentificationAnswerChange}
							onSubmit={submitAnswers}
							submitting={submitting}
							answerSuggestionsEnabled={scope.answerSuggestions}
							suggestionCorpus={suggestionCorpus}
							perQuestionTimerEnabled={!!quizData.per_question_timer_enabled}
							perQuestionTimeSeconds={quizData.per_question_time_seconds ?? 30}
						/>
					) : (
						<QuizQuestionListLayout
							questions={questions}
							sections={quizData.sections || []}
							layout={questionLayout}
							onLayoutChange={setQuestionLayout}
							renderQuestion={(question) => (
								<QuestionCard
									key={question.id}
									question={question}
									answers={answers}
									handleAnswerChange={handleAnswerChange}
									handleIdentificationAnswerChange={handleIdentificationAnswerChange}
									answerSuggestionsEnabled={scope.answerSuggestions}
									suggestionCorpus={suggestionCorpus}
								/>
							)}
						/>
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
				/>
			</div>
		</div>
	);
}
