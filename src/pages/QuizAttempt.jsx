import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Target } from 'lucide-react';

import { api } from '../lib/api';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, Button, LoadingScreen } from '../components/ui';
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
	parseAttemptScopeFromSearch
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
		quiz_image: null
	});

	const answersMap = useMemo(() => answersById(answers), [answers]);
	const answeredCount = useMemo(() => countAnswered(answers), [answers]);
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

	const loadQuiz = useCallback(async () => {
		setLoading(true);
		try {
			const sectionQuery =
				!scope.fullQuiz && scope.sectionIds.length ? `&sections=${scope.sectionIds.join(',')}` : '';
			const response = await api
				.get(`/quizzes/quiz/${id}/?randomize=true${sectionQuery}`)
				.catch(() =>
					api.get(
						`/quizzes/quiz/${id}/${sectionQuery ? `?sections=${scope.sectionIds.join(',')}` : ''}`
					)
				);
			const { quizData: nextQuiz, questions: nextQuestions } = parseQuizPayload(response.data);

			setQuizData(nextQuiz);
			setQuestions(nextQuestions);
			setAnswers(buildAnswerRecords(nextQuestions));
			setSubmittedAnswers([]);
			setScore(0);
			setAccuracy(0);
			setSectionScores([]);
			setQuizResults(false);
			setTime(0);
			setIsRunning(true);
			await startAttempt();
		} catch {
			toast.error('Could not load quiz.');
			navigate('/quizzes');
		} finally {
			setLoading(false);
		}
	}, [id, navigate, scope.fullQuiz, scope.sectionIds, startAttempt]);

	useEffect(() => {
		// Initial load / scope change — loadQuiz owns loading state.
		// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
		loadQuiz();
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
	const scopeLabel = scope.fullQuiz
		? 'All sections'
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

			{quizData.quiz_image && (
				<div className="mb-5 flex justify-center">
					<img
						src={quizData.quiz_image}
						alt=""
						className="max-h-36 w-auto rounded-md object-cover"
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
							onRetake={handleRetake}
							onBackToList={() => navigate('/quizzes')}
						/>
					) : quizData.flashcard_quiz ? (
						<FlashcardAttempt
							questions={questions}
							answersByIdMap={answersMap}
							onAnswerChange={handleAnswerChange}
							onIdentificationChange={handleIdentificationAnswerChange}
							onSubmit={submitAnswers}
							submitting={submitting}
							answeredCount={answeredCount}
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
								/>
							)}
							footer={
								<div className="border-line space-y-2 border-t pt-4">
									<p className="text-muted text-center text-xs">
										Answered {answeredCount} of {questions.length}
									</p>
									<Button
										className="w-full"
										loading={submitting}
										disabled={questions.length === 0}
										onClick={submitAnswers}
									>
										Submit quiz
									</Button>
								</div>
							}
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
				/>
			</div>
		</div>
	);
}
