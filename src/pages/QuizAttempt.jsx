import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Target } from 'lucide-react';

import { api } from '../lib/api';
import { formatDurationSeconds } from '../lib/format';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, Card, CardBody, LoadingScreen } from '../components/ui';
import QuestionCard from '../components/quiz/QuestionCard';
import IdentificationAnswerInput from '../components/quiz/IdentificationAnswerInput';
import MathRenderer from '../components/quiz/MathRenderer';

function QuizFlashcardAttemptView({
	questions,
	submitAnswers,
	handleAnswerChange,
	handleIdentificationAnswerChange,
	answers
}) {
	const [questionNumber, setQuestionNumber] = useState(0);
	const currentQuestion = questions[questionNumber];
	const answer = answers.find((a) => a.id === currentQuestion?.id);

	if (!currentQuestion) return <LoadingScreen />;

	const getChoiceData = (choice) =>
		typeof choice === 'object' && choice !== null
			? { text: choice.text || choice, image: choice.image }
			: { text: choice, image: null };

	const isMathematical = ['MUL-COM', 'COM', 'IDE-COM'].includes(currentQuestion.question_type);

	return (
		<div className="space-y-4">
			<div className="flex gap-3">
				<Button
					variant="secondary"
					className="flex-1"
					onClick={() => setQuestionNumber((p) => (p - 1 + questions.length) % questions.length)}
				>
					Prev
				</Button>
				<Button
					variant="secondary"
					className="flex-1"
					onClick={() => setQuestionNumber((p) => (p + 1) % questions.length)}
				>
					Next
				</Button>
			</div>
			<Button className="w-full" onClick={submitAnswers}>
				Submit
			</Button>
			<p className="text-muted text-center text-sm">
				Question {questionNumber + 1} of {questions.length}
			</p>

			{currentQuestion.question_type === 'IDE' || currentQuestion.question_type === 'IDE-COM' ? (
				<IdentificationAnswerInput
					answer={answer}
					question={currentQuestion}
					handleIdentificationAnswerChange={handleIdentificationAnswerChange}
				/>
			) : (
				<Card>
					<CardBody className="space-y-4 p-6">
						<p className="text-fg text-center text-base font-semibold">
							{currentQuestion.question}
						</p>
						{currentQuestion.question_image && (
							<div className="flex justify-center">
								<img
									src={currentQuestion.question_image}
									alt="Question"
									className="max-h-[200px] rounded-md object-cover"
								/>
							</div>
						)}
						<div className="space-y-2">
							{currentQuestion.choices.map((choice, index) => {
								const choiceData = getChoiceData(choice);
								return (
									<button
										key={index}
										type="button"
										onClick={() =>
											handleAnswerChange(currentQuestion.id, 'userAnswer', choiceData.text)
										}
										className={`w-full cursor-pointer rounded-md px-4 py-3 text-center font-semibold transition ${
											answer?.userAnswer === choiceData.text
												? 'bg-primary text-primary-fg'
												: 'bg-surface-2 text-fg hover:bg-primary/10'
										}`}
									>
										<div className="flex flex-col items-center gap-2">
											{choiceData.image && (
												<img
													src={choiceData.image}
													alt=""
													className="max-h-[100px] rounded-md object-cover"
												/>
											)}
											{isMathematical ? (
												<MathRenderer expression={choiceData.text} displayMode={false} />
											) : (
												<span className="text-sm">{choiceData.text}</span>
											)}
										</div>
									</button>
								);
							})}
						</div>
					</CardBody>
				</Card>
			)}
		</div>
	);
}

function QuizResultView({ questions, answers, submittedAnswers }) {
	const getChoiceData = (choice) =>
		typeof choice === 'object' && choice !== null
			? { text: choice.text || choice, image: choice.image }
			: { text: choice, image: null };

	return (
		<div className="space-y-4">
			{questions.map((question, index) => {
				const submitted = submittedAnswers[index];
				const correct = submitted?.correctAnswer === submitted?.userAnswer;
				const isMathematical = ['COM', 'IDE-COM', 'MUL-COM'].includes(question.question_type);
				const isIdentification =
					question.question_type === 'IDE' || question.question_type === 'IDE-COM';

				return (
					<Card key={index} className={correct ? 'border-success/30' : 'border-danger/30'}>
						<CardBody className="space-y-3 p-5">
							<p className="text-fg text-center font-semibold">{question.question}</p>
							{question.question_image && (
								<div className="flex justify-center">
									<img
										src={question.question_image}
										alt="Question"
										className="max-h-[200px] rounded-md object-cover"
									/>
								</div>
							)}

							{isIdentification ? (
								<div className="space-y-2">
									<div>
										<p className="text-muted text-xs font-medium">Correct Answer:</p>
										<div className="bg-success/10 rounded-md p-2">
											{isMathematical ? (
												<MathRenderer expression={submitted?.correctAnswer} displayMode={true} />
											) : (
												<p className="text-sm">{submitted?.correctAnswer}</p>
											)}
										</div>
									</div>
									<div>
										<p className="text-muted text-xs font-medium">Your Answer:</p>
										<div className={`rounded-md p-2 ${correct ? 'bg-success/10' : 'bg-danger/10'}`}>
											{isMathematical ? (
												<MathRenderer expression={submitted?.userAnswer} displayMode={true} />
											) : (
												<p className="text-sm">{submitted?.userAnswer}</p>
											)}
										</div>
									</div>
								</div>
							) : (
								<div className="space-y-1.5">
									{question.choices.map((choice, ci) => {
										const choiceData = getChoiceData(choice);
										const isCorrectChoice = choiceData.text === submitted?.correctAnswer;
										const isUserChoice = choiceData.text === submitted?.userAnswer;
										let bg = 'bg-surface-2';
										if (isCorrectChoice) bg = 'bg-success/15 text-success';
										else if (isUserChoice) bg = 'bg-danger/15 text-danger';
										return (
											<div
												key={ci}
												className={`rounded-md px-4 py-2 text-center text-sm font-medium ${bg}`}
											>
												{choiceData.image && (
													<img
														src={choiceData.image}
														alt=""
														className="mx-auto mb-2 max-h-[80px] rounded-md object-cover"
													/>
												)}
												{isMathematical ? (
													<MathRenderer expression={choiceData.text} displayMode={false} />
												) : (
													choiceData.text
												)}
											</div>
										);
									})}
								</div>
							)}
						</CardBody>
					</Card>
				);
			})}
		</div>
	);
}

export default function QuizAttempt() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [time, setTime] = useState(0);
	const [isRunning, setIsRunning] = useState(true);
	const [loading, setLoading] = useState(true);
	const [submittedAnswers, setSubmittedAnswers] = useState([]);
	const [questions, setQuestions] = useState([]);
	const [score, setScore] = useState(0);
	const [accuracy, setAccuracy] = useState(0);
	const [quizResults, setQuizResults] = useState(false);
	const [answers, setAnswers] = useState([]);
	const [quizData, setQuizData] = useState({
		quiz_title: '',
		flashcard_quiz: false,
		quiz_image: null
	});

	const handleAnswerChange = (qid, field, value) => {
		setAnswers((prev) => prev.map((a) => (a.id === qid ? { ...a, [field]: value } : a)));
	};

	const handleIdentificationAnswerChange = (qid, value) => {
		setAnswers((prev) => prev.map((a) => (a.id === qid ? { ...a, userAnswer: value } : a)));
	};

	useEffect(() => {
		const initializeQuiz = async () => {
			try {
				const response = await api
					.get(`/quizzes/quiz/${id}/?randomize=true`)
					.catch(() => api.get(`/quizzes/quiz/${id}/`));
				const data = response.data;
				const qData = data.data || data;
				const questionsArr = data.questions || qData.questions || [];

				setQuizData(qData);
				setQuestions(questionsArr);
				setAnswers(
					questionsArr.map((q) => ({
						id: q.id,
						question: q.question,
						correctAnswer: q.correct_answer,
						questionType: q.question_type,
						userAnswer: ''
					}))
				);
				setLoading(false);
			} catch {
				toast.error('Could not load quiz.');
				navigate('/quizzes');
			}
		};
		initializeQuiz();
	}, [id, navigate]);

	useEffect(() => {
		api.post(`/quizzes/quiz/attempt/${id}/`).catch(() => {});
	}, [id]);

	useEffect(() => {
		if (!isRunning) return;
		const interval = setInterval(() => setTime((t) => t + 1), 1000);
		return () => clearInterval(interval);
	}, [isRunning]);

	const submitAnswers = async () => {
		try {
			const response = await api.post(`/quizzes/quiz/submit/${id}/`, { answers, time });
			setSubmittedAnswers(Array.from(response.data.answers));
			setScore(response.data.score);
			setAccuracy(response.data.accuracy);
			setQuizResults(true);
			setIsRunning(false);
		} catch {
			toast.error('Failed to submit answers.');
		}
	};

	if (loading) return <LoadingScreen />;

	return (
		<div>
			<PageHeader title={quizData.quiz_title} icon={Target} />

			{quizData.quiz_image && (
				<div className="mb-6 flex justify-center">
					<img
						src={quizData.quiz_image}
						alt="Quiz"
						className="max-h-40 rounded-lg object-cover shadow"
					/>
				</div>
			)}

			<div className="flex flex-col gap-6 md:flex-row">
				<div className="flex-1">
					{quizResults ? (
						<div className="space-y-4">
							<QuizResultView
								questions={questions}
								answers={answers}
								submittedAnswers={submittedAnswers}
							/>
							<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
								<Button
									onClick={() => {
										navigate(0);
									}}
								>
									Retake Quiz
								</Button>
								<Button variant="secondary" onClick={() => navigate('/quizzes')}>
									Go to Quiz List
								</Button>
							</div>
						</div>
					) : quizData.flashcard_quiz ? (
						<QuizFlashcardAttemptView
							questions={questions}
							submitAnswers={submitAnswers}
							handleAnswerChange={handleAnswerChange}
							handleIdentificationAnswerChange={handleIdentificationAnswerChange}
							answers={answers}
						/>
					) : (
						<div className="space-y-4">
							{questions.map((question, index) => (
								<QuestionCard
									key={index}
									question={question}
									answers={answers}
									handleAnswerChange={handleAnswerChange}
									handleIdentificationAnswerChange={handleIdentificationAnswerChange}
								/>
							))}
							<Button className="w-full" onClick={submitAnswers}>
								Submit
							</Button>
						</div>
					)}
				</div>

				<div className="flex w-full shrink-0 flex-col items-center gap-4 md:w-64">
					<Card className="w-full p-6 text-center">
						<p className="text-muted mb-2 text-sm font-medium">
							<Clock size={14} className="mr-1 inline" />
							Time
						</p>
						<p className="text-fg font-mono text-3xl font-bold">{formatDurationSeconds(time)}</p>
					</Card>
					{quizResults && (
						<Card className="w-full p-6 text-center">
							<p className="text-fg text-lg font-bold">Score: {score}</p>
							<p className="text-fg text-lg font-bold">Accuracy: {accuracy}</p>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
