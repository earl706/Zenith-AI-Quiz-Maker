import { useEffect, useState } from 'react';
import { Target } from 'lucide-react';

import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, EmptyState, LoadingScreen } from '../components/ui';
import AttemptAccuracyDoughnutGraph from '../components/quiz/AttemptAccuracyDoughnutGraph';

export default function AttemptsPage() {
	const [attempts, setAttempts] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchAttempts = async () => {
			try {
				const response = await api.get('/quizzes/quiz/attempts/');
				const data = response.data;
				setAttempts(data.results || data.data || data || []);
			} catch {
				setAttempts([]);
			} finally {
				setLoading(false);
			}
		};
		fetchAttempts();
	}, []);

	if (loading) return <LoadingScreen />;

	return (
		<div>
			<PageHeader title="Attempts" icon={Target} description="Review your quiz attempt history." />

			{attempts.length === 0 ? (
				<EmptyState
					icon={Target}
					title="No attempts yet"
					description="Attempt a quiz to see your results here."
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{attempts.map((attempt, index) => {
						const scoreData = attempt.score_accuracy_data || {};
						const quizInfo = attempt.quiz_data || attempt.quiz || {};
						const totalQuestions = quizInfo.questions?.length || attempt.total_questions || 0;
						const correctCount = scoreData.score ?? attempt.score ?? 0;
						const accuracyVal = scoreData.accuracy ?? attempt.accuracy ?? 0;

						return (
							<Card key={index} className="flex flex-col p-5">
								<div className="mb-3 flex items-center justify-between">
									<span className="text-fg max-w-[60%] truncate font-semibold">
										{attempt.quiz_title || quizInfo.quiz_title || 'Quiz'}
									</span>
									<span className="text-muted text-xs whitespace-nowrap">
										{formatDate(attempt.attempt_datetime)}
									</span>
								</div>
								<div className="flex items-center gap-4">
									<div className="h-14 w-14 shrink-0">
										<AttemptAccuracyDoughnutGraph
											data_points={[correctCount, Math.max(0, totalQuestions - correctCount)]}
										/>
									</div>
									<div className="flex-1 space-y-1 text-sm">
										<div className="flex justify-between">
											<span className="text-muted">Score</span>
											<span className="text-fg font-medium">
												{correctCount} / {totalQuestions}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted">Accuracy</span>
											<span className="text-fg font-medium">{accuracyVal}%</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted">Duration</span>
											<span className="text-fg font-medium">{attempt.duration || '—'}</span>
										</div>
									</div>
								</div>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
