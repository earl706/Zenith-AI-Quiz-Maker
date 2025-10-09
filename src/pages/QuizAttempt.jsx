import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import QuizFlashcardAttemptPage from './QuizFlashcardAttemptPage';
import QuestionCard from '../components/QuestionCard';
import QuizResultsPage from './QuizResultsPage';
import { AuthContext } from '../context/AuthContext';

export default function QuizAttempt() {
	const { attemptQuiz, getQuiz, deleteMode, setDeleteMode, quizDeleteData, submitQuizAnswers } =
		useContext(AuthContext);
	const navigate = useNavigate();

	const questions_data = [
		{
			id: 0,
			question: 'Question 1',
			question_type: 'MUL',
			choices: ['', '', '', ''],
			correct_answer: '',
			random_choices: true,
			correct_answer_index: 0
		}
	];

	const answers_data = questions_data.map((question) => ({
		id: question.id,
		question: question.question,
		correctAnswer: question.correct_answer,
		questionType: question.question_type,
		userAnswer: ''
	}));

	const [time, setTime] = useState(0);
	const [isRunning, setIsRunning] = useState(true);
	const [submittedAnswers, setSubmittedAnswers] = useState([]);

	const [questions, setQuestions] = useState(questions_data);
	const [score, setScore] = useState(0);
	const [accuracy, setAccuracy] = useState(0);
	const [quizResults, setQuizResults] = useState(false);
	const [answers, setAnswers] = useState(answers_data);
	const [quizData, setQuizData] = useState({
		quiz_id: '',
		questions: [],
		quiz_title: '',
		quiz_image: null,
		date_created: '',
		public: false,
		flashcard_quiz: true,
		owner: 0
	});

	const quiz_id = useParams().id;
	const handleAnswerChange = (id, field, index) => {
		const updatedAnswers = answers.map((answer) =>
			answer.id === id ? { ...answer, [field]: index } : answer
		);
		setAnswers(updatedAnswers);
	};

	const handleMathematicalAnswerChange = (id, index, value) => {
		const updatedAnswers = answers.map((answer) =>
			answer.id === id ? { ...answer, [field]: index } : answer
		);
		setAnswers(updatedAnswers);
	};

	const handleIdentificationAnswerChange = (id, value) => {
		const updatedAnswers = answers.map((answer) =>
			answer.id === id ? { ...answer, userAnswer: value } : answer
		);
		setAnswers(updatedAnswers);
	};

	const initializeQuiz = async () => {
		try {
			const response = await getQuiz(quiz_id);
			setQuizData(response.data.data);
			setQuestions(Array.from(response.data.questions));
			console.log(response.data.questions);
			const answersInitialization = response.data.questions.map((question) => ({
				id: question.id,
				question: question.question,
				correctAnswer: question.correct_answer,
				questionType: question.question_type,
				userAnswer: ''
			}));
			setAnswers(answersInitialization);
			return response;
		} catch (err) {
			return err;
		}
	};

	const submitAnswers = async () => {
		try {
			const answers_submission_response = await submitQuizAnswers(quiz_id, answers, time);
			setSubmittedAnswers(Array.from(answers_submission_response.data.answers));
			setScore(answers_submission_response.data.score);
			setAccuracy(answers_submission_response.data.accuracy);
			setQuizResults(true);
			setIsRunning(false);
			return answers_submission_response;
		} catch (err) {
			return err;
		}
	};

	const closeDeleteConfirmationModal = () => {
		setDeleteMode(false);
	};

	const formatTime = (milliseconds) => {
		const mins = String(Math.floor((milliseconds / 6000) % 60)).padStart(2, '0');
		const secs = String(Math.floor((milliseconds / 60) % 60)).padStart(2, '0');
		const ms = String(milliseconds % 60).padStart(2, '0');
		return `${mins}:${secs}:${ms}`;
	};

	useEffect(() => {
		initializeQuiz();
	}, []);

	useEffect(() => {
		const controller = new AbortController();

		const initializeQuizAttempt = async () => {
			try {
				const response = await attemptQuiz(quiz_id);
				return response;
			} catch (err) {}
		};

		initializeQuizAttempt();

		return () => controller.abort();
	}, []);

	useEffect(() => {
		console.log(answers);
	}, [answers]);

	useEffect(() => {
		let interval;
		if (isRunning) {
			interval = setInterval(() => {
				setTime((prevTime) => prevTime + 1);
			}, 1000);
		} else {
			clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [isRunning]);

	return (
		<>
			<div className="min-h-screen px-2 py-4 transition-all sm:px-6 md:px-10 lg:px-16 xl:px-32">
				<Header page={'Attempt'} />

				{/* Quiz Title and Image */}
				<div className="mb-8 flex flex-col items-center">
					<h1 className="mb-2 text-center text-2xl font-extrabold text-gray-800 sm:text-3xl">
						{quizData.quiz_title}
					</h1>
					{quizData.quiz_image && (
						<div className="mb-4 flex justify-center">
							<img
								src={quizData.quiz_image}
								alt="Quiz"
								className="max-h-52 w-auto rounded-2xl object-cover shadow-md"
							/>
						</div>
					)}
				</div>

				<div className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:flex-row md:gap-10">
					{/* Main Content */}
					<div className="flex flex-1 flex-col gap-6">
						{quizResults ? (
							<div className="flex flex-col gap-4">
								{questions.map((question, index) => {
									const answer = answers.find((a) => a.id === question.id);
									const correct =
										submittedAnswers[index].correctAnswer === submittedAnswers[index].userAnswer;
									return (
										<QuizResultsPage
											question={question}
											answer={answer}
											correct={correct}
											handleIdentificationAnswerChange={handleIdentificationAnswerChange}
											submittedAnswers={submittedAnswers}
											index={index}
											key={index}
										/>
									);
								})}
								{/* Retake and Go Back Buttons */}
								<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
									<button
										onClick={() => {
											// Use react-router-dom navigation to retake (reload) the quiz attempt page
											navigate(`/quizzes/attempt/${quiz_id}`, { replace: true });
										}}
										className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-3 text-lg font-bold text-white shadow transition hover:from-blue-600 hover:to-blue-800 focus:ring-2 focus:ring-blue-300 focus:outline-none"
									>
										Retake Quiz
									</button>
									<button
										onClick={() => {
											navigate('/quizzes');
										}}
										className="rounded-xl bg-gradient-to-r from-gray-400 to-gray-600 px-6 py-3 text-lg font-bold text-white shadow transition hover:from-gray-500 hover:to-gray-700 focus:ring-2 focus:ring-gray-300 focus:outline-none sm:ml-3"
									>
										Go to Quiz List
									</button>
								</div>
							</div>
						) : quizData.flashcard_quiz ? (
							<div className="flex flex-col">
								<QuizFlashcardAttemptPage
									questionsParam={questions}
									submitAnswers={submitAnswers}
									handleAnswerChange={handleAnswerChange}
									handleIdentificationAnswerChange={handleIdentificationAnswerChange}
									answers={answers}
								/>
							</div>
						) : (
							<div className="flex flex-col gap-4">
								{questions.map((question, index) => (
									<QuestionCard
										question={question}
										answers={answers}
										handleAnswerChange={handleAnswerChange}
										handleIdentificationAnswerChange={handleIdentificationAnswerChange}
										key={index}
									/>
								))}
								<button
									onClick={submitAnswers}
									className="mt-4 w-full rounded-xl bg-gradient-to-r from-green-500 to-lime-500 py-3 text-lg font-bold text-white shadow transition hover:from-green-600 hover:to-lime-600 focus:ring-2 focus:ring-green-300 focus:outline-none"
								>
									Submit
								</button>
							</div>
						)}
					</div>

					{/* Sidebar: Timer and Results */}
					<div className="mt-8 flex w-full flex-col items-center md:mt-0 md:w-80">
						<span className="mb-4 w-full text-center text-base font-semibold tracking-wide text-gray-700">
							Time
						</span>
						<div className="mb-6 flex w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 shadow-lg">
							<p className="font-mono text-4xl text-white">{formatTime(time)}</p>
						</div>
						{quizResults && (
							<div className="flex w-full flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-green-500 to-lime-500 py-6 text-center font-bold text-white shadow">
								<span className="text-lg">
									Score: <span className="font-extrabold">{score}</span>
								</span>
								<span className="text-lg">
									Accuracy: <span className="font-extrabold">{accuracy}</span>
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
