import React, { useContext, useEffect, useState } from 'react';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import AttemptAccuracyDoughnutGraph from '../components/AttemptAccuracyDoughnutGraph';
import MathRenderer from '../components/MathRenderer';

export default function QuizPage() {
	const { getQuiz, deleteMode, setDeleteMode, quizDeleteData, getQuizSummary } =
		useContext(AuthContext);
	const url_params = useParams();
	const [attempts, setAttempts] = useState([]);
	const [questions, setQuestions] = useState([]);
	const [quizData, setQuizData] = useState({
		quiz_id: null,
		owner: null,
		tag_color: '',
		quiz_title: '',
		quiz_image: null,
		questions: [],
		date_created: null,
		public: false,
		random_question_order: false,
		flashcard_quiz: false,
		attempts: []
	});

	const navigate = useNavigate();
	const quiz_id = useParams().id;

	const initializeQuizData = async () => {
		try {
			const quizdata_response = await getQuiz(quiz_id);

			console.log(quizdata_response.data);
			console.log(quizdata_response.data.data);
			console.log(quizdata_response.data.questions);
			setQuizData(quizdata_response.data.data);
			setQuestions(Array.from(quizdata_response.data.questions));
			setAttempts(Array.from(quizdata_response.data.attempts));
			return quizdata_response;
		} catch (err) {
			return err;
		}
	};

	const closeDeleteConfirmationModal = () => {
		setDeleteMode(false);
	};

	useEffect(() => {
		initializeQuizData();
	}, [quiz_id]);

	return (
		<>
			<div className="min-h-screen bg-gradient-to-br from-[#f7fbff] to-[#eaf6ff] px-2 py-4 transition-all sm:px-6 md:px-10 lg:px-16 xl:px-32">
				<Header page={'Quiz'} />
				<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row lg:gap-12 xl:gap-16">
					{/* Main Content */}
					<div className="flex flex-1 flex-col">
						<span className="mb-6 w-full text-center text-2xl font-extrabold text-gray-800 sm:text-3xl">
							{quizData.quiz_title}
						</span>

						{/* Quiz Image Display */}
						{quizData.quiz_image && (
							<div className="mb-6 flex justify-center">
								<img
									src={quizData.quiz_image}
									alt="Quiz"
									className="max-h-52 w-auto rounded-2xl object-cover shadow-md"
								/>
							</div>
						)}

						{/* Quiz Info Card */}
						<div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl bg-white/80 p-6 shadow-lg sm:grid-cols-2">
							<div className="flex items-center gap-3">
								<div
									className="h-5 w-5 rounded-full border-2 border-gray-200"
									style={{ backgroundColor: quizData.tag_color }}
								></div>
								<span className="text-sm font-semibold text-gray-500">Tag Color:</span>
								<span className="text-base font-bold text-gray-700">
									{quizData.tag_color || '—'}
								</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-5 w-5 rounded-full bg-blue-200"></div>
								<span className="text-sm font-semibold text-gray-500">Type:</span>
								<span className="text-base font-bold text-gray-700">
									{quizData.flashcard_quiz ? 'Flashcard' : 'List'}
								</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-5 w-5 rounded-full bg-yellow-200"></div>
								<span className="text-sm font-semibold text-gray-500">Visibility:</span>
								<span className="text-base font-bold text-gray-700">
									{quizData.public ? 'Public' : 'Private'}
								</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-5 w-5 rounded-full bg-green-200"></div>
								<span className="text-sm font-semibold text-gray-500">Created:</span>
								<span className="text-base font-bold text-gray-700">
									{quizData.date_created
										? new Date(quizData.date_created).toLocaleDateString()
										: '—'}
								</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-5 w-5 rounded-full bg-purple-200"></div>
								<span className="text-sm font-semibold text-gray-500">Sequence:</span>
								<span className="text-base font-bold text-gray-700">
									{quizData.random_question_order ? 'Random' : 'Ordered'}
								</span>
							</div>
							<div className="flex items-center gap-3">
								<div className="h-5 w-5 rounded-full bg-pink-200"></div>
								<span className="text-sm font-semibold text-gray-500">Questions:</span>
								<span className="text-base font-bold text-gray-700">
									{quizData.questions.length}
								</span>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="mb-10 flex flex-col gap-3 sm:flex-row">
							<button
								onClick={() => navigate(`/quizzes/attempt/${quizData.quiz_id}`)}
								className="flex-1 rounded-full bg-gradient-to-r from-green-500 to-lime-500 py-3 text-center text-lg font-bold text-white shadow transition hover:from-green-600 hover:to-lime-600 focus:ring-2 focus:ring-green-300 focus:outline-none"
							>
								Attempt
							</button>
							<button
								onClick={() => navigate(`/quizzes/edit/${quizData.quiz_id}`)}
								className="flex-1 rounded-full bg-gradient-to-r from-blue-500 to-sky-400 py-3 text-center text-lg font-bold text-white shadow transition hover:from-blue-600 hover:to-sky-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"
							>
								Edit
							</button>
						</div>

						<span className="mb-4 w-full text-center text-xl font-extrabold text-gray-800">
							Questions
						</span>
						<div className="flex flex-col gap-6">
							{questions.map((question, index) => (
								<div className="w-full rounded-2xl bg-white/80 p-6 shadow-md" key={index}>
									<div className="mb-3 w-full text-center text-base font-bold text-gray-700">
										{question.question}
									</div>

									{/* Question Image Display */}
									{question.question_image && (
										<div className="mb-4 flex justify-center">
											<img
												src={question.question_image}
												alt="Question"
												className="max-h-40 w-auto rounded-lg object-cover shadow"
											/>
										</div>
									)}

									<div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
										{question.choices.map((choice, choice_index) => {
											const choiceText = choice.text || choice;
											const choiceImage = choice.image;

											if (choiceText === '') {
												return null;
											}

											return (
												<div
													className="flex w-full max-w-xs min-w-[120px] flex-col items-center gap-2 rounded-xl bg-blue-50/60 p-4 shadow"
													key={choice_index}
												>
													{/* Choice Image Display */}
													{choiceImage && (
														<div className="flex justify-center">
															<img
																src={choiceImage}
																alt={`Choice ${choice_index + 1}`}
																className="max-h-24 w-auto rounded-md object-cover"
															/>
														</div>
													)}

													{/* Choice Text Display */}
													{question.question_type === 'COM' ||
													question.question_type === 'IDE-COM' ||
													question.question_type === 'MUL-COM' ? (
														<div className="flex items-center justify-center">
															<MathRenderer expression={choiceText} displayMode={false} />
														</div>
													) : (
														<div className="text-center text-sm font-semibold text-gray-700">
															{choiceText}
														</div>
													)}
												</div>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Sidebar: Attempts */}
					<aside className="mt-10 flex w-full flex-shrink-0 flex-col lg:mt-0 lg:w-80">
						<span className="mb-3 text-lg font-bold text-gray-700">Attempts</span>
						<div className="flex flex-col gap-4">
							{attempts.length === 0 ? (
								<div className="w-full py-8 text-center font-semibold text-gray-400">
									No attempts yet.
								</div>
							) : (
								attempts.map((attempt, index) => (
									<div
										className="flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow"
										key={index}
									>
										<div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-300">
											<AttemptAccuracyDoughnutGraph data_points={[30, 20]} />
										</div>
										<div className="flex flex-1 flex-col gap-1">
											<div className="flex justify-between text-xs text-gray-500">
												<span>Date</span>
												<span>{attempt.date}</span>
											</div>
											<div className="flex justify-between text-xs text-gray-500">
												<span>Ratio</span>
												<span>{attempt.ratio}</span>
											</div>
											<div className="flex justify-between text-xs text-gray-500">
												<span>Percentage</span>
												<span>{attempt.percentage}</span>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</aside>
				</div>
			</div>
		</>
	);
}
