import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, ChevronRight } from 'lucide-react';

import { get } from '../lib/api';
import { formatDate, formatDurationSeconds, fromNow } from '../lib/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, Card, EmptyState, LoadingScreen, ProgressRing } from '../components/ui';
import {
	accuracyTone,
	attemptQuizMeta,
	attemptScopeLabel,
	getAttemptStats,
	normalizeAttemptList
} from '../components/quiz/quizHelpers';

export default function AttemptsPage() {
	const navigate = useNavigate();

	const { data, isLoading } = useQuery({
		queryKey: ['attempts', 'list'],
		queryFn: () => get('/quizzes/quiz/attempts/'),
		staleTime: 0,
		refetchOnMount: 'always'
	});

	const attempts = normalizeAttemptList(data);

	if (isLoading) return <LoadingScreen />;

	return (
		<div>
			<PageHeader
				title="Attempts"
				icon={Target}
				description="Review your quiz attempt history and accuracy."
			/>

			{attempts.length === 0 ? (
				<EmptyState
					icon={Target}
					title="No attempts yet"
					description="Attempt a quiz to see your results here."
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{attempts.map((attempt) => {
						const key = attempt.uuid || attempt.id;
						const { title, id: quizId } = attemptQuizMeta(attempt);
						const { score, total, accuracy, complete, sectionScores } = getAttemptStats(attempt);
						const tone = complete ? accuracyTone(accuracy) : 'primary';
						const when = attempt.attempt_datetime;
						const scope = attemptScopeLabel(attempt);

						return (
							<Card
								key={key}
								className={`flex flex-col gap-4 p-5 transition hover:shadow-md ${
									quizId ? 'cursor-pointer' : ''
								}`}
								onClick={() => quizId && navigate(`/quizzes/${quizId}`)}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<h3 className="text-fg truncate font-semibold">{title}</h3>
										<p
											className="text-muted mt-0.5 text-xs"
											title={formatDate(when, 'MMM d, yyyy · h:mm a')}
										>
											{when ? fromNow(when) : '—'}
										</p>
									</div>
									{quizId && (
										<ChevronRight size={16} className="text-muted mt-1 shrink-0" aria-hidden />
									)}
								</div>

								<div className="flex items-center gap-4">
									{complete ? (
										<ProgressRing
											value={accuracy}
											size={64}
											stroke={6}
											tone={tone}
											label={`${Math.round(accuracy)}`}
										/>
									) : (
										<div className="bg-surface-2 text-muted flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xs font-medium">
											—
										</div>
									)}

									<div className="min-w-0 flex-1 space-y-2 text-sm">
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted">Score</span>
											<span className="text-fg font-medium">
												{complete ? `${score} / ${total}` : 'Incomplete'}
											</span>
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted">Accuracy</span>
											{complete ? (
												<Badge tone={tone}>{Math.round(accuracy)}%</Badge>
											) : (
												<span className="text-muted">—</span>
											)}
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted">Scope</span>
											<span className="text-fg truncate text-xs" title={scope}>
												{scope}
											</span>
										</div>
										<div className="text-muted flex items-center gap-1.5 text-xs">
											<Clock size={12} />
											{formatDurationSeconds(Number(attempt.duration) || 0)}
										</div>
									</div>
								</div>

								{sectionScores.length > 0 && (
									<ul className="border-line space-y-1 border-t pt-3 text-xs">
										{sectionScores.map((ss) => (
											<li
												key={`${ss.section ?? 'x'}-${ss.section_title}`}
												className="text-muted flex justify-between gap-2"
											>
												<span className="truncate">{ss.section_title}</span>
												<span className="text-fg shrink-0">
													{ss.score}/{ss.total_score} · {Math.round(ss.accuracy)}%
												</span>
											</li>
										))}
									</ul>
								)}
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
