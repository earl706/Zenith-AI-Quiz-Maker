import React, { useContext, useEffect, useState } from 'react';
import {
	ChevronDown,
	ChevronsRight,
	CircleX,
	Move,
	Target,
	PieChart,
	Hourglass
} from 'lucide-react';
import zenithLogoDark from '/src/assets/ZENITH - LOGO DARK.png';
import AttemptAccuracyDoughnutGraph from '../components/AttemptAccuracyDoughnutGraph';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import LoadingComponent from '../components/LoadingComponent';

export default function Dashboard() {
	const { getQuizList, getUserData, deleteQuiz } = useContext(AuthContext);
	const [loading, setLoading] = useState(false);
	const [deleteQuizMode, setDeleteQuizMode] = useState(false);
	const [deleteQuizID, setDeleteQuizID] = useState('');
	const [scoresHistory, setScoresHistory] = useState([]);
	const [attempts, setAttempts] = useState([]);
	const [userData, setUserData] = useState({
		attempts: [],
		birthday: null,
		date_joined: '',
		email: '',
		full_name: '',
		gender: null,
		groups: [],
		id: 0,
		is_active: false,
		is_staff: false,
		is_superuser: false,
		is_verified: false,
		last_login: '',
		password: '',
		phone_number: '',
		user_permissions: []
	});

	const navigate = useNavigate();

	const [quizList, setQuizList] = useState([]);

	const initialQuizList = async () => {
		try {
			setLoading(true);
			const quizlist_response = await getQuizList();
			setQuizList(Array.from(quizlist_response.data.data));
			setLoading(false);
			return quizlist_response;
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

	const formatTimeInSeconds = (time) => {
		const hrs = Math.floor(time / 3600);
		const mins = Math.floor((time % 3600) / 60);
		const secs = time % 60;
		return {
			hrs: hrs,
			mins: mins,
			secs: secs
		};
	};

	const initializeUserData = async () => {
		try {
			setLoading(true);
			const user_data_response = await getUserData();
			setAttempts(Array.from(user_data_response.data.attempts));
			setScoresHistory(Array.from(user_data_response.data.scores_history));
			setUserData(user_data_response.data.user);
			setLoading(false);
			return user_data_response;
		} catch (err) {
			setLoading(false);
			return err;
		}
	};

	useEffect(() => {
		if (!deleteQuizMode) {
			initialQuizList();
			initializeUserData();
		}
	}, [deleteQuizMode]);

	return (
		<>
			{/* Delete Quiz Modal */}
			{deleteQuizMode && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
					<div className="flex w-full max-w-xs flex-col items-center rounded-xl bg-white p-6 shadow-xl">
						<span className="mb-6 text-center text-lg font-semibold text-gray-800">
							Delete this quiz?
						</span>
						<div className="flex w-full gap-3">
							<button
								onClick={handleDeleteQuiz}
								className="flex-1 rounded-lg bg-red-500 py-2 font-semibold text-white transition hover:bg-red-600"
							>
								Delete
							</button>
							<button
								onClick={() => setDeleteQuizMode(false)}
								className="flex-1 rounded-lg border border-blue-500 py-2 font-semibold text-blue-500 transition hover:bg-blue-500 hover:text-white"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Main Dashboard Content */}
			<div
				className={`transition-all ${
					deleteQuizMode ? 'pointer-events-none blur-sm select-none' : ''
				} px-2 pt-6 sm:px-4 md:px-10`}
			>
				<Header page="Dashboard" />

				{/* Filters */}
				<div className="mb-6 flex flex-wrap items-center gap-3">
					<span className="text-sm font-semibold text-gray-700">Filter by:</span>
					{['Time', 'Questions', 'Attempts', 'Mathematical', 'Identification'].map((filter) => (
						<button
							key={filter}
							className="flex items-center rounded-full bg-[#EFF7FF] px-4 py-2 text-xs font-medium text-[#6F8055] transition hover:bg-[#e0e9f2] focus:outline-none"
						>
							<span className="mr-2">{filter}</span>
							<ChevronDown className="h-3 w-3" />
						</button>
					))}
				</div>

				{/* Quizzes Section */}
				<section>
					<div className="mb-2 flex items-center justify-between">
						<h2 className="text-lg font-bold text-gray-800">Recent Quizzes</h2>
						<NavLink to="/quizzes" className="text-sm text-gray-600 hover:underline">
							View All
						</NavLink>
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{loading ? (
							<div className="col-span-full flex justify-center py-8">
								<LoadingComponent size={30} light={true} />
							</div>
						) : quizList.length < 1 ? (
							<div className="col-span-full text-center font-semibold text-gray-500">
								No quizzes to show
							</div>
						) : (
							quizList.slice(0, 6).map((quiz, index) => (
								<div
									key={index}
									className="flex flex-col items-center gap-4 rounded-xl bg-[#EFF7FF] p-4 shadow transition hover:shadow-md sm:flex-row"
								>
									<div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
										<img src={zenithLogoDark} alt="" className="h-12 w-12 object-contain" />
									</div>
									<div className="w-full flex-1">
										<div className="mb-1 flex items-center gap-2">
											<div
												className="h-3 w-3 rounded-full"
												style={{ backgroundColor: quiz.tag_color }}
											></div>
											<span className="truncate text-base font-semibold text-gray-800">
												{quiz.quiz_title}
											</span>
										</div>
										<div className="flex flex-wrap gap-4 text-xs text-gray-600">
											<div>
												<span className="font-light">Created: </span>
												<span className="font-medium">
													{new Date(quiz.date_created).toLocaleDateString('en-US', {
														year: 'numeric',
														month: 'short',
														day: 'numeric'
													})}
												</span>
											</div>
											<div>
												<span className="font-light">Questions: </span>
												<span className="font-medium">{quiz.questions.length}</span>
											</div>
											<div>
												<span className="font-light">Attempts: </span>
												<span className="font-medium">{quiz.attempts.length}</span>
											</div>
										</div>
									</div>
									<div className="flex flex-row gap-2 sm:flex-col">
										<button
											onClick={() => {
												setDeleteQuizMode(true);
												setDeleteQuizID(quiz.quiz_id);
											}}
											title="Delete"
											className="rounded-full bg-red-100 p-2 text-red-500 transition hover:bg-red-200"
										>
											<CircleX className="h-4 w-4" />
										</button>
										<button
											onClick={() => navigate(`/quizzes/${quiz.quiz_id}`)}
											title="View"
											className="rounded-full bg-yellow-100 p-2 text-yellow-600 transition hover:bg-yellow-200"
										>
											<Move className="h-4 w-4" />
										</button>
										<button
											onClick={() => navigate(`/quizzes/attempt/${quiz.quiz_id}`)}
											title="Attempt"
											className="rounded-full bg-green-100 p-2 text-green-600 transition hover:bg-green-200"
										>
											<ChevronsRight className="h-4 w-4" />
										</button>
									</div>
								</div>
							))
						)}
					</div>
				</section>

				{/* Attempts Section */}
				<section className="mt-10">
					<div className="mb-2 flex items-center justify-between">
						<h2 className="text-lg font-bold text-gray-800">Recent Attempts</h2>
						<NavLink to="/attempts" className="text-sm text-gray-600 hover:underline">
							View All
						</NavLink>
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{loading ? (
							<div className="col-span-full flex justify-center py-8">
								<LoadingComponent size={30} light={true} />
							</div>
						) : attempts.length < 1 ? (
							<div className="col-span-full text-center font-semibold text-gray-500">
								No attempts to show
							</div>
						) : (
							attempts.slice(0, 6).map((attempt, index) => (
								<div
									key={index}
									className="flex flex-col items-center gap-4 rounded-xl bg-[#EFF7FF] p-4 shadow transition hover:shadow-md sm:flex-row"
								>
									<div className="w-full flex-1">
										<div className="mb-1 truncate text-base font-semibold text-gray-800">
											{attempt.quiz.quiz_title}
											<span className="ml-2 text-xs font-light text-gray-400">
												| {new Date(attempt.attempt_datetime).toLocaleDateString()}
											</span>
										</div>
										<div className="flex flex-wrap gap-3 text-xs text-gray-600">
											<div className="flex items-center gap-1">
												<Hourglass className="h-3 w-3" />
												<span className="font-medium">{attempt.duration}</span>
											</div>
											<div className="flex items-center gap-1">
												<Target className="h-3 w-3" />
												<span className="font-medium">
													{attempt.score.accuracy ? attempt.score.accuracy : 'Unfinished'}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<PieChart className="h-3 w-3" />
												<span className="font-medium">
													{attempt.score_accuracy ? attempt.score_accuracy : 'Unfinished'}
												</span>
											</div>
										</div>
									</div>
									<div className="flex flex-shrink-0 items-center justify-center">
										<div className="flex h-20 w-20 items-center justify-center rounded-full bg-white sm:h-24 sm:w-24">
											<AttemptAccuracyDoughnutGraph data_points={[83, 17]} />
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</section>
			</div>
		</>
	);
}
