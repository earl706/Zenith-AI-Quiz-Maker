import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Pencil, Trash2, Play, Eye } from 'lucide-react';

import { get, del } from '../lib/api';
import { formatDate } from '../lib/format';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, Card, Badge, Modal, EmptyState, LoadingScreen } from '../components/ui';

export default function QuizzesPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [deleteTarget, setDeleteTarget] = useState(null);

	const { data, isLoading } = useQuery({
		queryKey: ['quizzes', 'list'],
		queryFn: () => get('/quizzes/quiz/')
	});

	const quizList = data?.results || data?.data || data || [];

	const removeMutation = useMutation({
		mutationFn: (uuid) => del(`/quizzes/quiz/${uuid}/`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['quizzes'] });
			toast.success('Quiz deleted.');
			setDeleteTarget(null);
		},
		onError: () => toast.error('Could not delete quiz.')
	});

	if (isLoading) return <LoadingScreen />;

	return (
		<div>
			<PageHeader
				title="My Quizzes"
				icon={BookOpen}
				description="Manage and attempt your quizzes."
				actions={
					<Button onClick={() => navigate('/create-quiz')}>
						<Plus size={16} /> New Quiz
					</Button>
				}
			/>

			{!Array.isArray(quizList) || quizList.length === 0 ? (
				<EmptyState
					icon={BookOpen}
					title="No quizzes yet"
					description="Create your first quiz to get started."
					action={
						<Button size="sm" onClick={() => navigate('/create-quiz')}>
							<Plus size={16} /> Create Quiz
						</Button>
					}
				/>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{quizList.map((quiz) => {
						const id = quiz.uuid || quiz.quiz_id;
						return (
							<Card key={id} className="flex flex-col p-5 transition hover:shadow-md">
								<div className="mb-3 flex items-start gap-2">
									{quiz.tag_color && (
										<div
											className="mt-1 h-3 w-3 shrink-0 rounded-full"
											style={{ backgroundColor: quiz.tag_color }}
										/>
									)}
									<div className="min-w-0 flex-1">
										<h3 className="text-fg truncate font-semibold">{quiz.quiz_title}</h3>
										<p className="text-muted text-xs">
											{formatDate(quiz.created_at || quiz.date_created)}
										</p>
									</div>
								</div>

								<div className="mb-4 flex flex-wrap gap-1.5">
									<Badge tone="primary">{quiz.questions?.length ?? 0} Qs</Badge>
									{quiz.flashcard_quiz || quiz.quizType === 'flashcard' ? (
										<Badge tone="accent">Flashcard</Badge>
									) : (
										<Badge tone="success">List</Badge>
									)}
								</div>

								<div className="mt-auto flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => navigate(`/quizzes/${id}`)}
										title="View"
									>
										<Eye size={14} />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => navigate(`/quizzes/edit/${id}`)}
										title="Edit"
									>
										<Pencil size={14} />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="text-danger"
										onClick={() => setDeleteTarget(id)}
										title="Delete"
									>
										<Trash2 size={14} />
									</Button>
									<div className="flex-1" />
									<Button size="sm" onClick={() => navigate(`/quizzes/attempt/${id}`)}>
										<Play size={14} /> Attempt
									</Button>
								</div>
							</Card>
						);
					})}
				</div>
			)}

			<Modal
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				title="Delete Quiz"
				size="sm"
				footer={
					<>
						<Button variant="secondary" onClick={() => setDeleteTarget(null)}>
							Cancel
						</Button>
						<Button
							variant="danger"
							loading={removeMutation.isPending}
							onClick={() => removeMutation.mutate(deleteTarget)}
						>
							Delete
						</Button>
					</>
				}
			>
				<p className="text-muted text-sm">
					Are you sure you want to delete this quiz? This action cannot be undone.
				</p>
			</Modal>
		</div>
	);
}
