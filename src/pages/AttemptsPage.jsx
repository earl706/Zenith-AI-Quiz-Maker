import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, ChevronRight } from 'lucide-react';

import { get } from '../lib/api';
import { formatDate, formatDurationSeconds, fromNow } from '../lib/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, Card, EmptyState, LoadingScreen, Pagination, ProgressRing } from '../components/ui';
import {
	accuracyTone,
	attemptQuizMeta,
	attemptScopeLabel,
	getAttemptStats,
	normalizeAttemptList,
	formatScore
} from '../components/quiz/quizHelpers';
import { LIST_PAGE_SIZE, paginateClient } from '../hooks/useListControls';

export default function AttemptsPage() {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);

	const { data, isLoading } = useQuery({
		queryKey: ['attempts', 'list'],
		queryFn: () => get('/quizzes/quiz/attempts/'),
		staleTime: 0,
		refetchOnMount: 'always'
	});

	const attempts = normalizeAttemptList(data);
	const paged = useMemo(() => paginateClient(attempts, page, 15), [attempts, page]);

	useEffect(() => {
		if (paged.page !== page) setPage(paged.page);
	}, [paged.page, page]);

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
				<>
					<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
						{paged.results.map((attempt) => {
							const key = attempt.uuid || attempt.id;
							const { title, id: quizId } = attemptQuizMeta(attempt);
							const { score, total, accuracy, complete } = getAttemptStats(attempt);
							const tone = complete ? accuracyTone(accuracy) : 'primary';
							const when = attempt.attempt_datetime;
							const scope = attemptScopeLabel(attempt);

							return (
								<Card
									key={key}
									className={`flex items-center gap-3 px-3.5 py-2.5 transition hover:shadow-md ${
										quizId ? 'cursor-pointer' : ''
									}`}
									onClick={() => quizId && navigate(`/quizzes/${quizId}`)}
								>
									{complete ? (
										<ProgressRing
											value={accuracy}
											size={40}
											stroke={4}
											tone={tone}
											label={`${Math.round(accuracy)}`}
										/>
									) : (
										<div className="bg-surface-2 text-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-medium">
											—
										</div>
									)}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<h3 className="text-fg min-w-0 flex-1 truncate text-sm font-semibold">
												{title}
											</h3>
											{!complete && (
												<Badge tone="neutral" className="shrink-0">
													Incomplete
												</Badge>
											)}
										</div>
										<p className="text-muted mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
											<span title={formatDate(when, 'MMM d, yyyy · h:mm a')}>
												{when ? fromNow(when) : '—'}
											</span>
											{complete && (
												<span className="text-fg tabular-nums">
													{formatScore(score)}/{total}
												</span>
											)}
											<span className="inline-flex items-center gap-1">
												<Clock size={11} aria-hidden />
												{formatDurationSeconds(Number(attempt.duration) || 0)}
											</span>
											<span className="truncate" title={scope}>
												{scope}
											</span>
										</p>
									</div>
									{quizId && <ChevronRight size={14} className="text-muted shrink-0" aria-hidden />}
								</Card>
							);
						})}
					</div>
					<Pagination
						page={paged.page}
						totalPages={paged.total_pages}
						count={paged.count}
						pageSize={paged.page_size}
						onPageChange={setPage}
					/>
				</>
			)}
		</div>
	);
}
