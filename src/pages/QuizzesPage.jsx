import React, { useContext, useEffect, useState } from 'react';
import {
	faAngleDown,
	faAngleRight,
	faAnglesRight,
	faUpDownLeftRight,
	faXmark,
	faEdit
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import zenithLogoDark from '/src/assets/ZENITH - LOGO DARK.png';
import Header from '../components/Header';
import LoadingComponent from '../components/LoadingComponent';

export default function QuizzesPage() {
	const { getQuizList, deleteQuiz } = useContext(AuthContext);
	const [deleteQuizMode, setDeleteQuizMode] = useState(false);
	const [deleteQuizID, setDeleteQuizID] = useState('');
	const [loading, setLoading] = useState(false);
	const [quizList, setQuizList] = useState([]);
	const [newest, setNewest] = useState([]);
	const [mostAttempted, setMostAttempted] = useState([]);

	const navigate = useNavigate();

	const initializeQuizzes = async () => {
		try {
			setLoading(true);
			const quizList_response = await getQuizList();
			setQuizList(Array.from(quizList_response.data.data));
			setNewest(Array.from(quizList_response.data.newest));
			setMostAttempted(Array.from(quizList_response.data.most_attempted));
			setLoading(false);
			return quizzes;
		} catch (err) {
			setLoading(false);
			return err;
		}
	};

	const handleDeleteQuiz = async () => {
		try {
			setLoading(true);
			const response = await deleteQuiz(deleteQuizID);
			console.log(response);
			setDeleteQuizMode(false);
			setLoading(false);
			return response;
		} catch (err) {
			setLoading(false);
			return err;
		}
	};

	useEffect(() => {
		if (!deleteQuizMode) {
			initializeQuizzes();
		}
	}, [deleteQuizMode]);

	return (
		<>
			<div
				className={
					deleteQuizMode
						? 'fixed z-10 flex h-screen w-full items-center justify-center pr-[300px]'
						: 'hidden'
				}
			>
				<div className="flex w-[300px] flex-col rounded-[20px] bg-white px-[40px] py-[30px] drop-shadow-lg">
					<span className="mb-[20px] w-full text-center font-semibold">
						Are you sure you want to delete this quiz?
					</span>
					<div className="flex gap-[5px]">
						<button
							onClick={() => handleDeleteQuiz()}
							className="w-1/2 cursor-pointer rounded-full bg-red-500 py-[10px] text-center font-bold text-white transition-all hover:bg-transparent hover:text-red-500 hover:outline"
						>
							Delete
						</button>
						<button
							onClick={() => setDeleteQuizMode(false)}
							className="w-1/2 cursor-pointer rounded-full py-[10px] text-center font-bold text-blue-500 outline-[1px] outline-blue-300 transition-all hover:bg-blue-500 hover:text-white hover:outline-transparent"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
			<div
				className={`px-[30px] pt-[18px] pb-[30px] transition-all ${
					deleteQuizMode ? 'blur-xl' : ''
				}`}
			>
				<Header page={'Quizzes'} />

				<div className="flex gap-[40px]">
					<div className="flex w-[67%] flex-col">
						<div className="mb-[35px] flex items-center justify-between">
							<span className="mr-[40px] text-[15px] font-semibold">Filter by:</span>
							<div className="flex w-[84%] justify-between gap-[20px]">
								<button className="flex cursor-pointer items-center justify-center rounded-full bg-[#EFF7FF] px-[15px] py-[10px] text-[#6F8055]">
									<span className="mr-[5px] text-[12px] font-semibold">Time</span>
									<div className="flex h-[13px] w-[13px] items-center justify-center">
										<FontAwesomeIcon icon={faAngleDown} className="h-[7px] w-[7px]" />
									</div>
								</button>
								<button className="flex cursor-pointer items-center justify-center rounded-full bg-[#EFF7FF] px-[15px] py-[10px] text-[#6F8055]">
									<span className="mr-[5px] text-[12px] font-semibold">Questions</span>
									<div className="flex h-[13px] w-[13px] items-center justify-center">
										<FontAwesomeIcon icon={faAngleDown} className="h-[7px] w-[7px]" />
									</div>
								</button>
								<button className="flex cursor-pointer items-center justify-center rounded-full bg-[#EFF7FF] px-[15px] py-[10px] text-[#6F8055]">
									<span className="mr-[5px] text-[12px] font-semibold">Type</span>
									<div className="flex h-[13px] w-[13px] items-center justify-center">
										<FontAwesomeIcon icon={faAngleDown} className="h-[7px] w-[7px]" />
									</div>
								</button>
								<button className="flex cursor-pointer items-center justify-center rounded-full bg-[#EFF7FF] px-[15px] py-[10px] text-[#6F8055]">
									<span className="mr-[5px] text-[12px] font-semibold">Mathematical</span>
									<div className="flex h-[13px] w-[13px] items-center justify-center">
										<FontAwesomeIcon icon={faAngleDown} className="h-[7px] w-[7px]" />
									</div>
								</button>
							</div>
						</div>
						<div className="flex flex-col gap-[20px]">
							{!loading && quizList.length < 1 ? (
								<div className="col-span-3 my-[20px] w-full text-center font-bold">
									No quizzes to show
								</div>
							) : (
								''
							)}
							{loading ? (
								<div className="flex w-full items-center justify-center">
									<LoadingComponent size={12} light={true} />
								</div>
							) : (
								quizList.slice(0, 9).map((quiz, index) => (
									<div
										className="flex items-center justify-between rounded-[20px] bg-[#EFF7FF] p-[20px] drop-shadow-lg"
										key={index}
									>
										<div className="mr-[20px] h-[210px] w-[210px] rounded-[20px]">
											<img src={zenithLogoDark} alt="" />
										</div>
										<div className="flex w-[47%] flex-col">
											<div className="mb-[9px] text-[20px] font-bold">
												<span>{quiz.quiz_title}</span>
											</div>
											<div className="flex flex-col gap-[8px]">
												<div className="flex items-center">
													<span className="w-[100px] text-left text-[12px]">Tag Color</span>
													<div className="flex w-[170px] items-center text-left">
														<div
															className={`mr-[10px] h-[20px] w-[20px] rounded-full`}
															style={{ backgroundColor: `${quiz.tag_color}` }}
														></div>
														<span className="text-[14px] font-semibold">{quiz.tag_color}</span>
													</div>
												</div>
												<div className="flex items-center">
													<span className="w-[100px] text-left text-[12px]">Created</span>
													<div className="flex w-[170px] items-center text-left">
														<span className="text-[14px] font-semibold">
															{new Date(quiz.date_created).toLocaleDateString('en-US', {
																year: 'numeric',
																month: 'long',
																day: 'numeric'
															})}
														</span>
													</div>
												</div>
												<div className="flex items-center">
													<span className="w-[100px] text-left text-[12px]">Public</span>
													<div className="flex w-[170px] items-center text-left">
														<div
															className={`mr-[10px] h-[20px] w-[20px] rounded-full`}
															style={{ backgroundColor: `${quiz.tag_color}` }}
														></div>
													</div>
												</div>
												<div className="flex items-center">
													<span className="w-[100px] text-left text-[12px]">Quiz Type</span>
													<div className="flex w-[170px] items-center text-left">
														<span className="text-[14px] font-semibold">
															{quiz.flashcard ? 'Flashcard' : 'List'}
														</span>
													</div>
												</div>
												<div className="flex items-center">
													<span className="w-[100px] text-left text-[12px]">Attempts</span>
													<div className="flex w-[170px] items-center text-left">
														<span className="text-[14px] font-semibold">
															{quiz.attempts.length}
														</span>
													</div>
												</div>
												<div className="flex items-center">
													<span className="w-[100px] text-left text-[12px]">Randomized</span>
													<div className="flex w-[170px] items-center text-left">
														<div
															className={`mr-[10px] h-[20px] w-[20px] rounded-full`}
															style={{ backgroundColor: `${quiz.tag_color}` }}
														></div>
													</div>
												</div>
											</div>
										</div>
										<div className="flex h-full w-[14%] flex-col justify-between">
											<div className="flex w-full items-start justify-between gap-[10px] text-gray-700">
												<button
													onClick={() => {
														setDeleteQuizMode(true);
														setDeleteQuizID(quiz.quiz_id);
													}}
													className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full bg-[#FF605C] font-bold"
												>
													<FontAwesomeIcon icon={faXmark} className="h-[7px] w-[7px]" />
												</button>

												<button
													onClick={() => navigate(`/quizzes/${quiz.quiz_id}`)}
													className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full bg-[#FFBD44] font-bold"
												>
													<FontAwesomeIcon icon={faUpDownLeftRight} className="h-[7px] w-[7px]" />
												</button>
												<button
													onClick={() => navigate(`/quizzes/edit/${quiz.quiz_id}`)}
													className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full bg-[#007AFF] font-bold"
												>
													<FontAwesomeIcon icon={faEdit} className="h-[7px] w-[7px]" />
												</button>
												<button
													onClick={() => navigate(`/quizzes/attempt/${quiz.quiz_id}`)}
													className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full bg-[#00CA4E] font-bold"
												>
													<FontAwesomeIcon icon={faAnglesRight} className="h-[7px] w-[7px]" />
												</button>
											</div>
											<NavLink
												to={`/quizzes/attempt/${quiz.quiz_id}`}
												className="flex w-full cursor-pointer items-center justify-evenly rounded-full bg-[#00CA4E] px-[10px] py-[3px] hover:bg-[#00CA4E]"
											>
												<span className="mr-[5px] text-center text-[12px] font-bold text-white">
													Attempt
												</span>
												<div className="flex h-[5px] w-[5px] items-center justify-center text-white">
													<FontAwesomeIcon icon={faAngleRight} className="h-[7px] w-[7px]" />
												</div>
											</NavLink>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					<div className="flex w-[29%] flex-col">
						<span className="mb-[20px] text-[16px] font-bold">Newest</span>
						{!loading && quizList.length < 1 ? (
							<div className="col-span-3 w-full text-center font-bold">No quizzes to show</div>
						) : (
							''
						)}
						<div className="mb-[40px] flex w-full flex-col gap-[20px]">
							{loading ? (
								<div className="flex w-full items-center justify-center">
									<LoadingComponent size={12} light={true} />
								</div>
							) : (
								newest.map((quiz, index) => (
									<div
										className="flex items-center justify-between rounded-[20px] bg-[#EFF7FF] p-[9px] drop-shadow-lg"
										key={index}
									>
										<div className="flex w-[80%] items-center">
											<div className="mr-[13px] h-[80px] w-[80px] rounded-[20px]">
												<img src={zenithLogoDark} alt="" />
											</div>
											<div className="flex w-[1/2] flex-col">
												<div className="mb-[5px] text-[15px] font-semibold">
													<span>{quiz.quiz_title}</span>
												</div>
												<div className="flex">
													<div className="mr-[5px] text-[10px]">
														<div className="flex flex-col gap-[5px] font-light">
															<span>Created</span>
															<span>Questions</span>
															<span>Attempts</span>
														</div>
													</div>
													<div className="text-[10px]">
														<div className="flex flex-col gap-[5px] font-semibold">
															<span>
																{new Date(quiz.date_created).toLocaleDateString('en-US', {
																	year: 'numeric',
																	month: 'long',
																	day: 'numeric'
																})}
															</span>
															<span>{quiz.questions.length}</span>
															<span>{quiz.attempts.length}</span>
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className="flex h-full w-[20%] flex-col items-end justify-center gap-[10px] text-gray-700">
											<button className="flex h-[15px] w-[15px] cursor-pointer items-center justify-center rounded-full bg-[#FF605C] font-bold">
												<FontAwesomeIcon icon={faXmark} className="h-[7px] w-[7px]" />
											</button>

											<button className="flex h-[15px] w-[15px] cursor-pointer items-center justify-center rounded-full bg-[#FFBD44] font-bold">
												<FontAwesomeIcon icon={faUpDownLeftRight} className="h-[7px] w-[7px]" />
											</button>
											<button
												onClick={() => navigate(`/quizzes/edit/${quiz.quiz_id}`)}
												className="flex h-[15px] w-[15px] cursor-pointer items-center justify-center rounded-full bg-[#007AFF] font-bold"
											>
												<FontAwesomeIcon icon={faEdit} className="h-[7px] w-[7px]" />
											</button>
											<button
												onClick={() => navigate(`/quizzes/edit/${quiz.quiz_id}`)}
												className="flex h-[15px] w-[15px] cursor-pointer items-center justify-center rounded-full bg-[#007AFF] font-bold"
											>
												<FontAwesomeIcon icon={faEdit} className="h-[7px] w-[7px]" />
											</button>
											<button className="flex h-[15px] w-[15px] cursor-pointer items-center justify-center rounded-full bg-[#00CA4E] font-bold">
												<FontAwesomeIcon icon={faAnglesRight} className="h-[7px] w-[7px]" />
											</button>
										</div>
									</div>
								))
							)}
						</div>
						<span className="mb-[20px] text-[16px] font-bold">Most Attempted</span>
						{!loading && quizList.length < 1 ? (
							<div className="col-span-3 w-full text-center font-bold">No quizzes to show</div>
						) : (
							''
						)}
						<div className="flex w-full flex-col gap-[20px]">
							{loading ? (
								<div className="flex w-full items-center justify-center">
									<LoadingComponent size={12} light={true} />
								</div>
							) : (
								mostAttempted.map((quiz, index) => (
									<div
										className="flex items-center justify-between rounded-[20px] bg-[#EFF7FF] p-[9px] drop-shadow-lg"
										key={index}
									>
										<div className="flex w-[80%] items-center">
											<div className="mr-[13px] h-[80px] w-[80px] rounded-[20px]">
												<img src={zenithLogoDark} alt="" />
											</div>
											<div className="flex w-[1/2] flex-col">
												<div className="mb-[5px] flex items-center gap-[5px] text-[15px] font-semibold">
													<div
														className="h-[15px] w-[15px] rounded-full"
														style={{ backgroundColor: `${quiz.tag_color}` }}
													></div>
													<span>{quiz.quiz_title}</span>
												</div>
												<div className="flex">
													<div className="mr-[5px] text-[10px]">
														<div className="flex flex-col gap-[5px] font-light">
															<span>Created</span>
															<span>Questions</span>
															<span>Attempts</span>
														</div>
													</div>
													<div className="text-[10px]">
														<div className="flex flex-col gap-[5px] font-semibold">
															<span>
																{new Date(quiz.date_created).toLocaleDateString('en-US', {
																	year: 'numeric',
																	month: 'long',
																	day: 'numeric'
																})}
															</span>
															<span>{quiz.questions.length}</span>
															<span>{quiz.attempts.length}</span>
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className="flex h-full w-[20%] flex-col items-end justify-center gap-[10px] text-gray-700">
											<button className="flex h-[15px] w-[15px] cursor-pointer items-center justify-center rounded-full bg-[#FF605C] font-bold">
												<FontAwesomeIcon icon={faXmark} className="h-[7px] w-[7px]" />
											</button>

											<button className="flex h-[15px] w-[15px] cursor-pointer items-center justify-center rounded-full bg-[#FFBD44] font-bold">
												<FontAwesomeIcon icon={faUpDownLeftRight} className="h-[7px] w-[7px]" />
											</button>
											<button className="flex h-[15px] w-[15px] cursor-pointer items-center justify-center rounded-full bg-[#00CA4E] font-bold">
												<FontAwesomeIcon icon={faAnglesRight} className="h-[7px] w-[7px]" />
											</button>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
