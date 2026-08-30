import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { get } from '../lib/api';
import { formatDate } from '../lib/format';
import { toast } from '../stores/toastStore';
import { useAuthStore } from '../stores/authStore';
import { PageHeader } from '../components/layout/PageHeader';
import {
	Badge,
	Button,
	Card,
	CardBody,
	CardHeader,
	EmptyState,
	Pagination,
	ProgressRing
} from '../components/ui';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import { useAttemptLauncher } from '../components/quiz/useAttemptLauncher';
import RoadmapActivityStrip from '../components/roadmap/RoadmapActivityStrip';
import RoadmapNodeCard, {
	launchNodeSectionAttempt,
	resolveNodeQuizUuid
} from '../components/roadmap/RoadmapNodeCard';
import { paginateClient } from '../hooks/useListControls';

const DUE_TODAY_PAGE_SIZE = 6;

function greeting() {
	const hour = new Date().getHours();
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

function DashboardRoadmapCard({ roadmap, onOpen }) {
	const percent = roadmap.progress?.percent || 0;

	return (
		<Card
			className="flex h-full cursor-pointer flex-col transition-colors hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--line))]"
			onClick={onOpen}
		>
			<div className="flex flex-1 flex-col gap-2.5 p-3.5">
				<div className="flex items-center gap-2.5">
					<ProgressRing
						value={percent}
						size={40}
						stroke={4}
						tone="primary"
						label={`${Math.round(percent)}`}
					/>
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-1.5">
							<div className="min-w-0">
								<h3 className="text-fg truncate text-sm font-semibold">{roadmap.title}</h3>
								<p className="text-muted mt-0.5 text-[11px]">
									{roadmap.progress?.mastered}/{roadmap.progress?.total} mastered
								</p>
							</div>
							{roadmap.deadline ? (
								<Badge tone="warning" className="shrink-0 text-[10px]">
									{formatDate(roadmap.deadline, 'dd/MM/yyyy')}
								</Badge>
							) : null}
						</div>
					</div>
				</div>

				{roadmap.activity?.days?.length ? (
					<div onClick={(e) => e.stopPropagation()} className="min-w-0">
						<RoadmapActivityStrip activity={roadmap.activity} compact />
					</div>
				) : null}
			</div>
		</Card>
	);
}

export default function DashboardPage() {
	const user = useAuthStore((s) => s.user);
	const name = user?.full_name?.split(' ')[0] || 'there';
	const navigate = useNavigate();
	const { launchAttempt, attemptModal } = useAttemptLauncher();
	const [dueTodayPage, setDueTodayPage] = useState(1);

	const { data: activityData, isLoading: activityLoading } = useQuery({
		queryKey: ['dashboard', 'quiz-activity'],
		queryFn: () => get('/quizzes/quiz/activity/'),
		staleTime: 60_000,
		refetchOnMount: true
	});

	const { data: dueTodayData, isLoading: dueTodayLoading } = useQuery({
		queryKey: ['dashboard', 'roadmaps-due-today'],
		queryFn: () => get('/roadmaps/due-today/'),
		staleTime: 60_000,
		refetchOnMount: true
	});

	const { data: dashboardRoadmaps, isLoading: roadmapsLoading } = useQuery({
		queryKey: ['dashboard', 'roadmaps'],
		queryFn: () => get('/roadmaps/dashboard/'),
		staleTime: 60_000,
		refetchOnMount: true
	});

	const dueTodayItems = useMemo(() => {
		const items = Array.isArray(dueTodayData?.items) ? dueTodayData.items : [];
		return items.filter((item) => item.status === 'available');
	}, [dueTodayData]);
	const pagedDueToday = useMemo(
		() => paginateClient(dueTodayItems, dueTodayPage, DUE_TODAY_PAGE_SIZE),
		[dueTodayItems, dueTodayPage]
	);

	const roadmapList = useMemo(() => {
		if (Array.isArray(dashboardRoadmaps?.results)) return dashboardRoadmaps.results;
		if (Array.isArray(dashboardRoadmaps)) return dashboardRoadmaps;
		return [];
	}, [dashboardRoadmaps]);

	useEffect(() => {
		if (pagedDueToday.page !== dueTodayPage) setDueTodayPage(pagedDueToday.page);
	}, [pagedDueToday.page, dueTodayPage]);

	const openQuiz = (item, sourceQuizUuid) => {
		const quizUuid = resolveNodeQuizUuid(item, sourceQuizUuid ?? item.source_quiz_uuid);
		if (!quizUuid) {
			toast.error('This section is not linked to a quiz yet.');
			return;
		}
		navigate(`/quizzes/${quizUuid}`);
	};

	const attemptSection = (item, sourceQuizUuid) => {
		launchNodeSectionAttempt({
			node: item,
			sourceQuizUuid: sourceQuizUuid ?? item.source_quiz_uuid,
			launchAttempt,
			onUnlinked: () => toast.error('This section is not linked to a quiz yet.')
		});
	};

	const openRoadmap = (id) => {
		navigate('/roadmap', { state: { roadmapId: id } });
	};

	return (
		<div>
			{attemptModal}
			<PageHeader
				title={`${greeting()}, ${name}`}
				icon={LayoutDashboard}
				description="Activity, due today, and your roadmaps at a glance."
			/>

			<div className="mt-6 space-y-3">
				<Card>
					<CardBody className="py-3.5">
						<ActivityHeatmap activity={activityData} loading={activityLoading} />
					</CardBody>
				</Card>

				<Card>
					<CardHeader
						title="Due Today"
						action={
							<Button variant="ghost" size="sm" onClick={() => navigate('/roadmap')}>
								View roadmaps
							</Button>
						}
					/>
					<CardBody className="py-3">
						{dueTodayLoading ? (
							<p className="text-muted text-sm">Loading…</p>
						) : dueTodayItems.length === 0 ? (
							<p className="text-muted text-xs">
								Nothing due today.{' '}
								<button
									type="button"
									className="text-primary cursor-pointer underline-offset-2 hover:underline"
									onClick={() => navigate('/roadmap')}
								>
									Open Roadmap
								</button>
							</p>
						) : (
							<>
								<div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
									{pagedDueToday.results.map((item) => (
										<RoadmapNodeCard
											key={`${item.roadmap_id}-${item.id}`}
											node={item}
											compact
											sourceQuizUuid={item.source_quiz_uuid}
											showEdit={false}
											onViewQuiz={openQuiz}
											onAttemptSection={attemptSection}
										/>
									))}
								</div>
								<Pagination
									page={pagedDueToday.page}
									totalPages={pagedDueToday.total_pages}
									count={pagedDueToday.count}
									pageSize={DUE_TODAY_PAGE_SIZE}
									onPageChange={setDueTodayPage}
								/>
							</>
						)}
					</CardBody>
				</Card>

				<section>
					{roadmapsLoading ? (
						<p className="text-muted text-sm">Loading roadmaps…</p>
					) : roadmapList.length === 0 ? (
						<EmptyState
							icon={Map}
							title="No roadmaps yet"
							description="Fork a quiz template or one of your sectioned quizzes to get a mastery path."
							action={
								<div className="flex flex-wrap justify-center gap-2">
									<Button size="sm" variant="secondary" onClick={() => navigate('/roadmap')}>
										Open Roadmap
									</Button>
									<Button
										size="sm"
										onClick={() => navigate('/roadmap', { state: { openCreate: true } })}
									>
										Create roadmap
									</Button>
								</div>
							}
						/>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
							{roadmapList.map((roadmap) => (
								<DashboardRoadmapCard
									key={roadmap.id}
									roadmap={roadmap}
									onOpen={() => openRoadmap(roadmap.id)}
								/>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
