import React, { useContext, useEffect, useState } from 'react';
import AttemptAccuracyDoughnutGraph from '../components/AttemptAccuracyDoughnutGraph';
import zenithLogoDark from '/src/assets/ZENITH - LOGO DARK.png';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';

const attempts = [0, 1, 2].map(() => ({
	quiz_title: 'Quiz Title',
	date_created: '2/8/24',
	duration: '8 mins 3 secs',
	ratio: '83/100',
	accuracy: '83%',
	mathematical: 4,
	identification: 4
}));

const recent_attempts = [
	{
		quiz_title: 'Quiz Title',
		date: '2/8/25',
		ratio: '50/50',
		questions: '50/50'
	},
	{
		quiz_title: 'Quiz Title',
		date: '2/8/25',
		ratio: '50/50',
		questions: '50/50'
	},
	{
		quiz_title: 'Quiz Title',
		date: '2/8/25',
		ratio: '50/50',
		questions: '50/50'
	}
];
const most_accurate_attempts = [
	{
		quiz_title: 'Quiz Title',
		date: '2/8/25',
		ratio: '50/50',
		questions: '50/50'
	},
	{
		quiz_title: 'Quiz Title',
		date: '2/8/25',
		ratio: '50/50',
		questions: '50/50'
	},
	{
		quiz_title: 'Quiz Title',
		date: '2/8/25',
		ratio: '50/50',
		questions: '50/50'
	}
];

export default function AttemptsPage() {
	const { getAttemptsList } = useContext(AuthContext);

	const [attempts, setAttempts] = useState([]);

	const initializeAttempts = async () => {
		try {
			const response = await getAttemptsList();
			console.log(response.data);
			setAttempts(Array.from(response.data.data));
			return response;
		} catch (err) {
			return response;
		}
	};

	useEffect(() => {
		initializeAttempts();
	}, []);

	return (
		<>
			<div className="min-h-screen px-4 py-6 transition-all sm:px-6 md:px-10">
				<Header page="Attempts" />
				<div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:gap-8">
					{/* Main Attempts List */}
					<section className="flex flex-1 flex-col gap-4">
						{attempts.length === 0 ? (
							<div className="flex h-40 items-center justify-center text-lg font-semibold text-gray-400">
								No attempts yet.
							</div>
						) : (
							<div className="grid grid-cols-1 gap-6">
								{attempts.map((attempt, index) => (
									<div
										key={index}
										className="flex flex-col rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg"
									>
										<div className="mb-4 flex items-center justify-between">
											<span className="truncate text-lg font-bold text-gray-800">
												{attempt.quiz_title}
											</span>
											<span className="text-xs text-gray-400">
												{new Date(attempt.attempt_datetime).toLocaleDateString()}{' '}
												{new Date(attempt.attempt_datetime).toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit'
												})}
											</span>
										</div>
										<div className="flex flex-col items-center gap-4 sm:flex-row">
											<div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
												<div className="text-gray-500">Duration</div>
												<div className="font-medium text-gray-700">{attempt.duration}</div>
												<div className="text-gray-500">Score</div>
												<div className="font-medium text-gray-700">
													{attempt.score_accuracy_data.score} / {attempt.quiz_data.questions.length}
												</div>
												<div className="text-gray-500">Accuracy</div>
												<div className="font-medium text-gray-700">
													{attempt.score_accuracy_data.accuracy}%
												</div>
												<div className="text-gray-500">Mathematical</div>
												<div className="font-medium text-gray-700">
													{attempt.mathematical_questions}
												</div>
												<div className="text-gray-500">Identification</div>
												<div className="font-medium text-gray-700">
													{attempt.identification_questions}
												</div>
											</div>
											<div className="flex flex-shrink-0 items-center justify-center">
												<div className="h-24 w-24 sm:h-32 sm:w-32">
													<AttemptAccuracyDoughnutGraph
														data_points={[
															attempt.score_accuracy_data.score,
															attempt.quiz_data.questions.length - attempt.score_accuracy_data.score
														]}
													/>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</section>

					{/* Sidebar: Most Recent & Most Accurate */}
					<aside className="mt-8 flex w-full flex-col gap-8 lg:mt-0 lg:w-80">
						<div>
							<span className="mb-3 block text-base font-semibold text-gray-700">Most Recent</span>
							<div className="flex flex-col gap-4">
								{recent_attempts.map((attempt, index) => (
									<div
										key={index}
										className="flex items-center gap-3 rounded-xl bg-white p-3 shadow"
									>
										<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
											<img src={zenithLogoDark} alt="" className="h-8 w-8 object-contain" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="truncate text-sm font-semibold text-gray-800">
												{attempt.quiz_title}
											</div>
											<div className="mt-1 flex gap-2 text-xs text-gray-500">
												<span>{attempt.date}</span>
												<span>• {attempt.ratio}</span>
												<span>• {attempt.questions}</span>
											</div>
										</div>
										<div className="flex-shrink-0">
											<div className="h-10 w-10">
												<AttemptAccuracyDoughnutGraph data_points={[83, 17]} />
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
						<div>
							<span className="mb-3 block text-base font-semibold text-gray-700">
								Most Accurate
							</span>
							<div className="flex flex-col gap-4">
								{most_accurate_attempts.map((attempt, index) => (
									<div
										key={index}
										className="flex items-center gap-3 rounded-xl bg-white p-3 shadow"
									>
										<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
											<img src={zenithLogoDark} alt="" className="h-8 w-8 object-contain" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="truncate text-sm font-semibold text-gray-800">
												{attempt.quiz_title}
											</div>
											<div className="mt-1 flex gap-2 text-xs text-gray-500">
												<span>{attempt.date}</span>
												<span>• {attempt.ratio}</span>
												<span>• {attempt.questions}</span>
											</div>
										</div>
										<div className="flex-shrink-0">
											<div className="h-10 w-10">
												<AttemptAccuracyDoughnutGraph data_points={[83, 17]} />
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</aside>
				</div>
			</div>
		</>
	);
}
