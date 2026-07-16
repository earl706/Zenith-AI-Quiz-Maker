import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, BookOpen, Target, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { get } from '../lib/api';
import { formatDate, fromNow } from '../lib/format';
import { useAuthStore } from '../stores/authStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, Card, CardBody, CardHeader, StatCard, EmptyState } from '../components/ui';

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

	const { data: quizzes, isLoading } = useQuery({
		queryKey: ['dashboard', 'quizzes'],
		queryFn: () => get('/quizzes/quiz/')
	});

	const { data: attempts } = useQuery({
		queryKey: ['dashboard', 'attempts'],
		queryFn: () => get('/quizzes/quiz/attempts/')
	});

	const quizList = quizzes?.results || quizzes?.data || quizzes || [];
	const attemptList = attempts?.results || attempts?.data || attempts || [];

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

	return (
		<div>
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

			<Card className="mt-6">
				<CardHeader
					title="Recent Quizzes"
					action={
						<Button variant="ghost" size="sm" onClick={() => navigate('/quizzes')}>
							View all
						</Button>
					}
				/>
				<CardBody>
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
						<div className="divide-line divide-y">
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
											{quiz.questions?.length ?? 0} questions
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											navigate(`/quizzes/attempt/${quiz.uuid || quiz.quiz_id}`);
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
	);
}
