import React, { useContext, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronsRight, Move, X, Pencil } from 'lucide-react';
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
			{/* Delete Confirmation Modal */}
			{deleteQuizMode && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
					<div className="flex w-full max-w-xs flex-col items-center rounded-xl bg-white p-6 shadow-xl">
						<span className="mb-6 text-center text-lg font-semibold text-gray-800">
							Delete this quiz?
						</span>
						<div className="flex w-full gap-3">
							<button
								onClick={handleDeleteQuiz}
								className="flex-1 rounded-lg bg-red-500 py-2 font-bold text-white transition hover:bg-red-600"
							>
								Delete
							</button>
							<button
								onClick={() => setDeleteQuizMode(false)}
								className="flex-1 rounded-lg border border-blue-500 py-2 font-bold text-blue-500 transition hover:bg-blue-500 hover:text-white"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			<div
				className={`transition-all duration-200 ${
					deleteQuizMode ? 'pointer-events-none blur-sm select-none' : ''
				} min-h-screen px-2 py-4 sm:px-6 md:px-10`}
			>
				<Header page="Quizzes" />

				{/* Main Content */}
				<div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:gap-8">
					{/* Quiz List Section */}
					<section className="flex flex-1 flex-col">
						{/* Filters */}
						<div className="mb-4 flex flex-wrap items-center gap-2">
							<span className="mr-2 text-sm font-semibold text-gray-700">Filter:</span>
							{['Time', 'Questions', 'Type', 'Mathematical'].map((label) => (
								<button
									key={label}
									className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-blue-50"
								>
									{label}
									<ChevronDown className="h-3 w-3" />
								</button>
							))}
						</div>

						{/* Quiz Cards */}
						<div className="flex flex-col gap-4">
							{!loading && quizList.length < 1 && (
								<div className="my-8 w-full text-center text-lg font-semibold text-gray-400">
									No quizzes to show
								</div>
							)}
							{loading ? (
								<div className="flex w-full items-center justify-center py-12">
									<LoadingComponent size={12} light={true} />
								</div>
							) : (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-2">
									{quizList.slice(0, 9).map((quiz) => (
										<div
											key={quiz.quiz_id}
											className="group relative flex flex-col rounded-2xl bg-white/90 p-5 shadow-lg ring-1 ring-gray-100 transition-all hover:scale-[1.015] hover:shadow-2xl"
										>
											{/* Card Main Content */}
											<div className="flex flex-col items-center gap-5">
												{/* Icon */}
												<div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#eaf3e2] to-[#b2c2a2] shadow-inner">
													<img src={zenithLogoDark} alt="" className="h-12 w-12 object-contain" />
												</div>
												{/* Title, Tag, Meta */}
												<div className="flex min-w-0 flex-1 flex-col">
													<div className="mb-1 flex items-center gap-2">
														<span className="truncate text-lg font-extrabold text-gray-800 transition-colors group-hover:text-[#6F8055]">
															{quiz.quiz_title}
														</span>
														{quiz.tag_color && (
															<div
																className="h-4 w-4 rounded-full border-2 border-white shadow"
																style={{ backgroundColor: quiz.tag_color }}
																title={quiz.tag_color}
															></div>
														)}
													</div>
													<div className="flex flex-wrap gap-2 text-xs font-medium text-gray-500">
														<span>
															{new Date(quiz.date_created).toLocaleDateString('en-US', {
																year: 'numeric',
																month: 'short',
																day: 'numeric'
															})}
														</span>
														<span className="hidden sm:inline">•</span>
														<span>{quiz.questions?.length ?? 0} Qs</span>
														<span className="hidden sm:inline">•</span>
														<span>{quiz.attempts?.length ?? 0} Attempts</span>
														<span className="hidden sm:inline">•</span>
														<span>
															{quiz.flashcard ? (
																<span className="inline-flex items-center rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
																	Flashcard
																</span>
															) : (
																<span className="inline-flex items-center rounded border border-green-100 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">
																	List
																</span>
															)}
														</span>
													</div>
												</div>
												{/* Actions */}
												<div className="ml-2 flex items-end gap-2">
													<button
														onClick={() => {
															setDeleteQuizMode(true);
															setDeleteQuizID(quiz.quiz_id);
														}}
														className="rounded-full bg-red-50 p-2 text-red-500 shadow-sm transition hover:bg-red-200 hover:text-red-700"
														title="Delete"
													>
														<X className="h-4 w-4" />
													</button>
													<button
														onClick={() => navigate(`/quizzes/${quiz.quiz_id}`)}
														className="rounded-full bg-yellow-50 p-2 text-yellow-600 shadow-sm transition hover:bg-yellow-200 hover:text-yellow-700"
														title="View"
													>
														<Move className="h-4 w-4" />
													</button>
													<button
														onClick={() => navigate(`/quizzes/edit/${quiz.quiz_id}`)}
														className="rounded-full bg-blue-50 p-2 text-blue-600 shadow-sm transition hover:bg-blue-200 hover:text-blue-700"
														title="Edit"
													>
														<Pencil className="h-4 w-4" />
													</button>
													<button
														onClick={() => navigate(`/quizzes/attempt/${quiz.quiz_id}`)}
														className="rounded-full bg-green-50 p-2 text-green-600 shadow-sm transition hover:bg-green-200 hover:text-green-700"
														title="Attempt"
													>
														<ChevronsRight className="h-4 w-4" />
													</button>
												</div>
											</div>
											{/* Divider */}
											<div className="my-3 border-t border-dashed border-gray-200"></div>
											{/* Bottom: Attempt Button */}
											<div className="flex">
												<NavLink
													to={`/quizzes/attempt/${quiz.quiz_id}`}
													className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-lime-500 px-4 py-2 text-sm font-bold text-white shadow transition hover:from-green-600 hover:to-lime-600 focus:ring-2 focus:ring-green-300 focus:outline-none"
												>
													Attempt
													<ChevronRight className="h-3 w-3" />
												</NavLink>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</section>

					{/* Sidebar Section */}
					<aside className="flex w-full flex-shrink-0 flex-col gap-8 md:w-80">
						{/* Newest */}
						<div>
							<span className="mb-3 block text-lg font-bold text-gray-700">Newest</span>
							{!loading && quizList.length < 1 ? (
								<div className="w-full text-center font-semibold text-gray-400">
									No quizzes to show
								</div>
							) : loading ? (
								<div className="flex w-full items-center justify-center py-6">
									<LoadingComponent size={12} light={true} />
								</div>
							) : (
								<div className="flex flex-col gap-3">
									{newest.map((quiz) => (
										<div
											key={quiz.quiz_id}
											className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm transition hover:shadow-md"
										>
											<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
												<img src={zenithLogoDark} alt="" className="h-8 w-8 object-contain" />
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<span className="truncate font-semibold text-gray-800">
														{quiz.quiz_title}
													</span>
												</div>
												<div className="flex flex-wrap gap-2 text-xs text-gray-500">
													<span>
														{new Date(quiz.date_created).toLocaleDateString('en-US', {
															year: 'numeric',
															month: 'short',
															day: 'numeric'
														})}
													</span>
													<span>• {quiz.questions?.length ?? 0} Qs</span>
													<span>• {quiz.attempts?.length ?? 0} Attempts</span>
												</div>
											</div>
											<div className="flex flex-col items-end gap-1">
												<button
													onClick={() => navigate(`/quizzes/edit/${quiz.quiz_id}`)}
													className="rounded-full bg-blue-100 p-1.5 text-blue-600 transition hover:bg-blue-200"
													title="Edit"
												>
													<Pencil className="h-3 w-3" />
												</button>
												<button
													onClick={() => navigate(`/quizzes/attempt/${quiz.quiz_id}`)}
													className="rounded-full bg-green-100 p-1.5 text-green-600 transition hover:bg-green-200"
													title="Attempt"
												>
													<ChevronsRight className="h-3 w-3" />
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
						{/* Most Attempted */}
						<div>
							<span className="mb-3 block text-lg font-bold text-gray-700">Most Attempted</span>
							{!loading && quizList.length < 1 ? (
								<div className="w-full text-center font-semibold text-gray-400">
									No quizzes to show
								</div>
							) : loading ? (
								<div className="flex w-full items-center justify-center py-6">
									<LoadingComponent size={12} light={true} />
								</div>
							) : (
								<div className="flex flex-col gap-3">
									{mostAttempted.map((quiz) => (
										<div
											key={quiz.quiz_id}
											className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm transition hover:shadow-md"
										>
											<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
												<img src={zenithLogoDark} alt="" className="h-8 w-8 object-contain" />
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<div
														className="h-3 w-3 rounded-full border"
														style={{ backgroundColor: quiz.tag_color }}
													></div>
													<span className="truncate font-semibold text-gray-800">
														{quiz.quiz_title}
													</span>
												</div>
												<div className="flex flex-wrap gap-2 text-xs text-gray-500">
													<span>
														{new Date(quiz.date_created).toLocaleDateString('en-US', {
															year: 'numeric',
															month: 'short',
															day: 'numeric'
														})}
													</span>
													<span>• {quiz.questions?.length ?? 0} Qs</span>
													<span>• {quiz.attempts?.length ?? 0} Attempts</span>
												</div>
											</div>
											<div className="flex flex-col items-end gap-1">
												<button
													onClick={() => navigate(`/quizzes/attempt/${quiz.quiz_id}`)}
													className="rounded-full bg-green-100 p-1.5 text-green-600 transition hover:bg-green-200"
													title="Attempt"
												>
													<ChevronsRight className="h-3 w-3" />
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</aside>
				</div>
			</div>
		</>
	);
}
