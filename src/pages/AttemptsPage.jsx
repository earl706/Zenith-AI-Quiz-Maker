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
			<div className="px-[30px] pt-[18px] pb-[30px] transition-all">
				<Header page={'Attempts'} />
				<div className="flex gap-[40px]">
					<div className="flex w-[67%] flex-col gap-[20px]">
						{attempts.map((attempt, index) => (
							<div
								className="flex w-full flex-col rounded-[20px] bg-[#EFF7FF] px-[30px] py-[20px] drop-shadow-lg"
								key={index}
							>
								<span className="mb-[10px] w-full text-center text-[20px] font-bold">
									{attempt.quiz_title}
								</span>
								<div className="flex w-full items-center">
									<div className="flex w-1/2 flex-col gap-[13px]">
										<div className="flex items-center gap-[30px] text-[16px]">
											<div className="w-1/2 text-[#646464]">Duration</div>
											<div className="w-1/2 font-bold">{attempt.duration}</div>
										</div>
										<div className="flex items-center gap-[30px] text-[16px]">
											<div className="w-1/2 text-[#646464]">Ratio</div>
											<div className="w-1/2 font-bold">
												{attempt.score_accuracy_data.score} / {attempt.quiz_data.questions.length}
											</div>
										</div>
										<div className="flex items-center gap-[30px] text-[16px]">
											<div className="w-1/2 text-[#646464]">Percentage</div>
											<div className="w-1/2 font-bold">
												{attempt.score_accuracy_data.accuracy} %
											</div>
										</div>
										<div className="flex items-center gap-[30px] text-[16px]">
											<div className="w-1/2 text-[#646464]">Mathematical</div>
											<div className="w-1/2 font-bold">{attempt.mathematical_questions}</div>
										</div>
										<div className="flex items-center gap-[30px] text-[16px]">
											<div className="w-1/2 text-[#646464]">Identification</div>
											<div className="w-1/2 font-bold">{attempt.identification_questions}</div>
										</div>
										<div className="flex items-center gap-[30px] text-[16px]">
											<div className="w-1/2 text-[#646464]">Date</div>
											<div className="w-1/2 text-[10px] font-bold">
												{new Date(attempt.attempt_datetime).toDateString()}{' '}
												{new Date(attempt.attempt_datetime).toLocaleTimeString()}
											</div>
										</div>
									</div>
									<div className="flex w-1/2 items-center justify-center">
										<div className="h-[250px] w-[250px]">
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
					<div className="flex w-[29%] flex-col">
						<span className="mb-[20px] text-[16px] font-bold">Most Recent</span>
						<div className="mb-[20px] flex w-full flex-col gap-[20px]">
							{recent_attempts.map((attempt, index) => (
								<div
									className="flex h-full items-center justify-between rounded-[20px] bg-[#EFF7FF] p-[9px] drop-shadow-lg"
									key={index}
								>
									<div className="flex w-[80%] items-center">
										<div className="mr-[13px] h-[80px] w-[80px] rounded-[20px]">
											<img src={zenithLogoDark} alt="" />
										</div>
										<div className="flex w-[1/2] flex-col">
											<div className="mb-[5px] text-[15px] font-semibold">
												<span>{attempt.quiz_title}</span>
											</div>
											<div className="flex">
												<div className="mr-[20px] text-[10px]">
													<div className="flex flex-col gap-[5px] font-light">
														<span>Date</span>
														<span>Ratio</span>
														<span>Questions</span>
													</div>
												</div>
												<div className="text-[10px]">
													<div className="flex flex-col gap-[5px] font-semibold">
														<span>{attempt.date}</span>
														<span>{attempt.ratio}</span>
														<span>{attempt.questions}</span>
													</div>
												</div>
											</div>
										</div>
									</div>

									<div className="mr-[9px] flex h-full w-[20%] items-center justify-center text-gray-700">
										<div className="h-[50px] w-[50px]">
											<AttemptAccuracyDoughnutGraph data_points={[83, 17]} />
										</div>
									</div>
								</div>
							))}
						</div>

						<span className="mb-[20px] text-[16px] font-bold">Most Accurate</span>
						<div className="mb-[20px] flex w-full flex-col gap-[20px]">
							{recent_attempts.map((attempt, index) => (
								<div
									className="flex h-full items-center justify-between rounded-[20px] bg-[#EFF7FF] p-[9px] drop-shadow-lg"
									key={index}
								>
									<div className="flex w-[80%] items-center">
										<div className="mr-[13px] h-[80px] w-[80px] rounded-[20px]">
											<img src={zenithLogoDark} alt="" />
										</div>
										<div className="flex w-[1/2] flex-col">
											<div className="mb-[5px] text-[15px] font-semibold">
												<span>{attempt.quiz_title}</span>
											</div>
											<div className="flex">
												<div className="mr-[20px] text-[10px]">
													<div className="flex flex-col gap-[5px] font-light">
														<span>Date</span>
														<span>Ratio</span>
														<span>Questions</span>
													</div>
												</div>
												<div className="text-[10px]">
													<div className="flex flex-col gap-[5px] font-semibold">
														<span>{attempt.date}</span>
														<span>{attempt.ratio}</span>
														<span>{attempt.questions}</span>
													</div>
												</div>
											</div>
										</div>
									</div>

									<div className="mr-[9px] flex h-full w-[20%] items-center justify-center text-gray-700">
										<div className="h-[50px] w-[50px]">
											<AttemptAccuracyDoughnutGraph data_points={[83, 17]} />
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
