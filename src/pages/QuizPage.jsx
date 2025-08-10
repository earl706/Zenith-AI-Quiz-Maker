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
			<div className="px-[30px] pt-[18px] pb-[30px] transition-all">
				<Header page={'Quiz'} />
				<div className="flex gap-[40px]">
					<div className="flex w-[67%] flex-col">
						<span className="mb-[20px] w-full text-center text-[30px] font-extrabold">
							{quizData.quiz_title}
						</span>

						{/* Quiz Image Display */}
						{quizData.quiz_image && (
							<div className="mb-[20px] flex justify-center">
								<img
									src={quizData.quiz_image}
									alt="Quiz"
									className="max-h-[200px] rounded-[15px] object-cover"
								/>
							</div>
						)}
						<div className="mb-[20px] flex w-full flex-col gap-[10px] rounded-[20px] bg-[#EFF7FF] p-[20px] drop-shadow-lg">
							<div className="flex w-full items-center rounded-full bg-white p-[10px]">
								<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
								<span className="w-[95px] text-[14px] font-semibold text-[#646464]">Tag Color</span>
								<div
									className="mr-[5px] h-[19px] w-[19px] rounded-full"
									style={{ backgroundColor: quizData.tag_color }}
								></div>
								<span className="text-[16px] font-bold text-[#646464]">{quizData.tag_color}</span>
							</div>
							<div className="flex w-full items-center rounded-full bg-white p-[10px]">
								<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
								<span className="w-[95px] text-[14px] font-semibold text-[#646464]">Type</span>
								<span className="text-[16px] font-bold text-[#646464]">
									{quizData.flashcard_quiz ? 'Flashcard' : 'List'}
								</span>
							</div>
							<div className="flex w-full items-center rounded-full bg-white p-[10px]">
								<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
								<span className="w-[95px] text-[14px] font-semibold text-[#646464]">
									Visibility
								</span>
								<span className="text-[16px] font-bold text-[#646464]">
									{quizData.public ? 'Public' : 'Private'}
								</span>
							</div>
							<div className="flex w-full items-center rounded-full bg-white p-[10px]">
								<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
								<span className="w-[95px] text-[14px] font-semibold text-[#646464]">Created</span>
								<span className="text-[16px] font-bold text-[#646464]">
									{new Date(quizData.date_created).toLocaleDateString()}
								</span>
							</div>
							<div className="flex w-full items-center rounded-full bg-white p-[10px]">
								<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
								<span className="w-[95px] text-[14px] font-semibold text-[#646464]">Sequence</span>
								<span className="text-[16px] font-bold text-[#646464]">
									{quizData.random_question_order ? 'Random' : 'Ordered'}
								</span>
							</div>
							<div className="flex w-full items-center rounded-full bg-white p-[10px]">
								<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
								<span className="w-[95px] text-[14px] font-semibold text-[#646464]">Questions</span>
								<span className="text-[16px] font-bold text-[#646464]">
									{quizData.questions.length}
								</span>
							</div>
						</div>
						<div className="mb-[40px] flex gap-[10px]">
							<button
								onClick={() => {
									navigate(`/quizzes/attempt/${quizData.quiz_id}`);
								}}
								className="flex-1 cursor-pointer rounded-full bg-[#00CA4E] p-[10px] text-center text-[19px] font-extrabold text-white transition-all hover:bg-[#00AA1E]"
							>
								Attempt
							</button>
							<button
								onClick={() => {
									navigate(`/quizzes/edit/${quizData.quiz_id}`);
								}}
								className="flex-1 cursor-pointer rounded-full bg-[#007AFF] p-[10px] text-center text-[19px] font-extrabold text-white transition-all hover:bg-[#0056CC]"
							>
								Edit
							</button>
						</div>
						<span className="mb-[20px] w-full text-center text-[20px] font-extrabold">
							Questions
						</span>
						<div className="flex flex-col gap-[20px]">
							{questions.map((question, index) => (
								<div
									className="w-full rounded-[20px] bg-[#EFF7FF] p-[20px] drop-shadow-lg"
									key={index}
								>
									<div className="mb-[10px] w-full text-center text-[16px] font-extrabold">
										{question.question}
									</div>

									{/* Question Image Display */}
									{question.question_image && (
										<div className="mb-[15px] flex justify-center">
											<img
												src={question.question_image}
												alt="Question"
												className="max-h-[150px] rounded-[10px] object-cover"
											/>
										</div>
									)}

									<div className="flex w-full flex-col items-center justify-center gap-[10px]">
										{question.choices.map((choice, choice_index) => {
											// Handle new choice structure with id, text, and image
											const choiceText = choice.text || choice;
											const choiceImage = choice.image;

											if (choiceText === '') {
												return null;
											}

											return (
												<div
													className="flex w-full flex-col items-center gap-[10px] rounded-[15px] bg-white p-[15px]"
													key={choice_index}
												>
													{/* Choice Image Display */}
													{choiceImage && (
														<div className="flex justify-center">
															<img
																src={choiceImage}
																alt={`Choice ${choice_index + 1}`}
																className="max-h-[100px] rounded-[8px] object-cover"
															/>
														</div>
													)}

													{/* Choice Text Display */}
													{question.question_type == 'COM' ||
													question.question_type == 'IDE-COM' ||
													question.question_type == 'MUL-COM' ? (
														<div className="flex items-center justify-center">
															<MathRenderer expression={choiceText} displayMode={false} />
														</div>
													) : (
														<div className="text-center text-[14px] font-extrabold text-[#646464]">
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
					<div className="flex w-[29%] flex-col">
						<span className="mb-[10px] gap-[10px] text-[16px] font-bold">Attempts</span>
						<div className="flex flex-col gap-[10px]">
							{attempts.map((attempt, index) => (
								<div
									className="flex w-full items-center justify-center rounded-[20px] bg-[#EFF7FF] p-[10px] drop-shadow-lg"
									key={index}
								>
									<div className="mr-[13px] h-[70px] w-[70px] rounded-full">
										<AttemptAccuracyDoughnutGraph data_points={[30, 20]} />
									</div>
									<div className="flex items-center">
										<div className="flex w-[70px] flex-col gap-[7px] font-light">
											<span className="text-[10px]">Date</span>
											<span className="text-[10px]">Ratio</span>
											<span className="text-[10px]">Percentage</span>
										</div>
										<div className="flex flex-col gap-[7px] font-semibold">
											<span className="text-[10px]">{attempt.date}</span>
											<span className="text-[10px]">{attempt.ratio}</span>
											<span className="text-[10px]">{attempt.percentage}</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
