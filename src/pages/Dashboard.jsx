import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, BookOpen, Target, Clock, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { get } from '../lib/api';
import { formatDate, fromNow } from '../lib/format';
import { normalizeQuizList, quizQuestionCount } from '../lib/resources';
import { toast } from '../stores/toastStore';
import { useAuthStore } from '../stores/authStore';
import { PageHeader } from '../components/layout/PageHeader';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	EmptyState,
	Pagination,
	StatCard
} from '../components/ui';
import { useAttemptLauncher } from '../components/quiz/useAttemptLauncher';
import RoadmapNodeCard, { resolveNodeQuizUuid } from '../components/roadmap/RoadmapNodeCard';
import { paginateClient } from '../hooks/useListControls';

const DUE_TODAY_PAGE_SIZE = 5;

function greeting() {
	const hour = new Date().getHours();
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

export default function DashboardPage() {
	const user = useAuthStore((s) => s.user);
	const name = user?.full_name?.split(' ')[0] || 'there';
	const navigate = useNavigate();
	const { launchAttempt, attemptModal } = useAttemptLauncher();
	const [dueTodayPage, setDueTodayPage] = useState(1);

	const { data: quizzes, isLoading } = useQuery({
		queryKey: ['dashboard', 'quizzes'],
		queryFn: () => get('/quizzes/quiz/'),
		staleTime: 60_000,
		refetchOnMount: true
	});

	const { data: attempts } = useQuery({
		queryKey: ['dashboard', 'attempts'],
		queryFn: () => get('/quizzes/quiz/attempts/')
	});

	const { data: dueTodayData, isLoading: dueTodayLoading } = useQuery({
		queryKey: ['dashboard', 'roadmaps-due-today'],
		queryFn: () => get('/roadmaps/due-today/'),
		staleTime: 60_000,
		refetchOnMount: true
	});

	const quizList = normalizeQuizList(quizzes);
	const attemptList = attempts?.results || attempts?.data || attempts || [];
	const dueTodayItems = useMemo(() => {
		const items = Array.isArray(dueTodayData?.items) ? dueTodayData.items : [];
		return items.filter((item) => item.status === 'available');
	}, [dueTodayData]);
	const pagedDueToday = useMemo(
		() => paginateClient(dueTodayItems, dueTodayPage, DUE_TODAY_PAGE_SIZE),
		[dueTodayItems, dueTodayPage]
	);

	useEffect(() => {
		if (pagedDueToday.page !== dueTodayPage) setDueTodayPage(pagedDueToday.page);
	}, [pagedDueToday.page, dueTodayPage]);

	const stats = [
		{
			icon: BookOpen,
			label: 'Total Quizzes',
			value: Array.isArray(quizList) ? quizList.length : '—',
			tone: 'primary'
		},
		{
			icon: Target,
			label: 'Total Attempts',
			value: Array.isArray(attemptList) ? attemptList.length : '—',
			tone: 'success'
		},
		{
			icon: Clock,
			label: 'Recent Activity',
			value:
				Array.isArray(attemptList) && attemptList.length > 0
					? fromNow(attemptList[0]?.attempt_datetime || attemptList[0]?.created_at)
					: 'None',
			tone: 'warning'
		}
	];

	const openQuiz = (item) => {
		const quizUuid = resolveNodeQuizUuid(item, item.source_quiz_uuid);
		if (!quizUuid) {
			toast.error('This section is not linked to a quiz yet.');
			return;
		}
		navigate(`/quizzes/${quizUuid}`);
	};

	const attemptSection = (item) => {
		const quizUuid = resolveNodeQuizUuid(item, item.source_quiz_uuid);
		if (!quizUuid) {
			toast.error('This section is not linked to a quiz yet.');
			return;
		}
		const sectionId = item.section_id;
		const quiz = {
			uuid: quizUuid,
			quiz_title: item.roadmap_title || 'Quiz',
			sections: sectionId ? [{ id: sectionId, title: item.title, order: 0 }] : []
		};
		launchAttempt(quiz, {
			initialSectionIds: sectionId ? [sectionId] : [],
			highlightedSectionId: sectionId ?? undefined,
			presetHint: sectionId
				? 'Pre-selected from this roadmap section — you can change the selection below.'
				: undefined
		});
	};

	return (
		<div>
			{attemptModal}
			<PageHeader
				title={`${greeting()}, ${name}`}
				icon={LayoutDashboard}
				description="Here's a quick overview of your quizzes."
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{stats.map((stat) => (
					<StatCard key={stat.label} {...stat} />
				))}
			</div>

			<div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
				<Card className="flex h-full min-h-0 flex-col">
					<CardHeader
						title="Due Today"
						action={
							<Button variant="ghost" size="sm" onClick={() => navigate('/roadmap')}>
								View roadmaps
							</Button>
						}
					/>
					<CardBody className="flex flex-1 flex-col">
						{dueTodayLoading ? (
							<p className="text-muted text-sm">Loading…</p>
						) : dueTodayItems.length === 0 ? (
							<EmptyState
								icon={Map}
								title="Nothing due today"
								description="Unlocked roadmap sections due today (and overdue) will show up here."
								action={
									<Button size="sm" variant="secondary" onClick={() => navigate('/roadmap')}>
										Open Roadmap
									</Button>
								}
							/>
						) : (
							<>
								<div className="flex flex-1 flex-col space-y-1">
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

				<Card className="flex h-full min-h-0 flex-col">
					<CardHeader
						title="Recent Quizzes"
						action={
							<Button variant="ghost" size="sm" onClick={() => navigate('/quizzes')}>
								View all
							</Button>
						}
					/>
					<CardBody className="flex flex-1 flex-col">
						{isLoading ? (
							<p className="text-muted text-sm">Loading…</p>
						) : !Array.isArray(quizList) || quizList.length === 0 ? (
							<EmptyState
								icon={BookOpen}
								title="No quizzes yet"
								description="Create your first quiz to get started."
								action={
									<Button size="sm" onClick={() => navigate('/create-quiz')}>
										Create Quiz
									</Button>
								}
							/>
						) : (
							<div className="divide-line flex-1 divide-y">
								{quizList.slice(0, 5).map((quiz) => (
									<div
										key={quiz.uuid || quiz.quiz_id}
										className="hover:bg-surface-2 flex cursor-pointer items-center gap-3 rounded-md px-2 py-3 transition"
										onClick={() => navigate(`/quizzes/${quiz.uuid || quiz.quiz_id}`)}
									>
										{quiz.tag_color && (
											<div
												className="h-3 w-3 shrink-0 rounded-full"
												style={{ backgroundColor: quiz.tag_color }}
											/>
										)}
										<div className="min-w-0 flex-1">
											<p className="text-fg truncate text-sm font-medium">{quiz.quiz_title}</p>
											<p className="text-muted text-xs">
												{formatDate(quiz.created_at || quiz.date_created)} ·{' '}
												{quizQuestionCount(quiz)} questions
											</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												launchAttempt(quiz);
											}}
										>
											Attempt
										</Button>
									</div>
								))}
							</div>
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
