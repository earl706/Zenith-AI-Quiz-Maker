import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BookOpen, Plus, Pencil, Trash2, Play, Eye, SlidersHorizontal, Map } from 'lucide-react';

import { get, del } from '../lib/api';
import { formatDate } from '../lib/format';
import { resolveQuizImageSrc } from '../lib/quizImages';
import {
	invalidateQuizQueries,
	normalizeQuizList,
	quizQuestionCount,
	quizSectionCount
} from '../lib/resources';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import CreateRoadmapFromQuizModal from '../components/roadmap/CreateRoadmapFromQuizModal';
import {
	Button,
	Card,
	Badge,
	Modal,
	EmptyState,
	LoadingScreen,
	Pagination
} from '../components/ui';
import { PersistedQuizSettingsModal } from '../components/quiz/QuizSettingsModal';
import { useAttemptLauncher } from '../components/quiz/useAttemptLauncher';
import { LIST_PAGE_SIZE, paginateClient } from '../hooks/useListControls';

export default function QuizzesPage() {
	const navigate = useNavigate();
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [settingsQuiz, setSettingsQuiz] = useState(null);
	const [roadmapQuiz, setRoadmapQuiz] = useState(null);
	const [page, setPage] = useState(1);
	const { launchAttempt, attemptModal } = useAttemptLauncher();

	const { data, isLoading } = useQuery({
		queryKey: ['quizzes', 'list'],
		queryFn: () => get('/quizzes/quiz/'),
		staleTime: 60_000,
		refetchOnMount: true
	});

	const quizList = normalizeQuizList(data);
	const paged = useMemo(() => paginateClient(quizList, page, LIST_PAGE_SIZE), [quizList, page]);

	useEffect(() => {
		if (paged.page !== page) setPage(paged.page);
	}, [paged.page, page]);

	const removeMutation = useMutation({
		mutationFn: (uuid) => del(`/quizzes/quiz/${uuid}/`),
		onSuccess: async () => {
			await invalidateQuizQueries();
			toast.success('Quiz deleted.');
			setDeleteTarget(null);
		},
		onError: () => toast.error('Could not delete quiz.')
	});

	if (isLoading) return <LoadingScreen />;

	return (
		<div>
			{attemptModal}
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
				<>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{paged.results.map((quiz) => {
							const id = quiz.uuid || quiz.quiz_id;
							const qCount = quizQuestionCount(quiz);
							const sCount = quizSectionCount(quiz);
							const imageSrc =
								resolveQuizImageSrc(quiz.quiz_image) ||
								resolveQuizImageSrc(quiz.quiz_image_url) ||
								null;
							return (
								<Card key={id} className="flex flex-col overflow-hidden transition hover:shadow-md">
									{imageSrc ? (
										<div className="border-line bg-surface-2 flex h-36 items-center justify-center border-b">
											<img src={imageSrc} alt="" className="object-fit h-full max-h-36 w-full" />
										</div>
									) : (
										<div
											className="border-line bg-surface-2 text-muted flex h-36 items-center justify-center border-b"
											aria-hidden
										>
											<BookOpen size={28} strokeWidth={1.5} />
										</div>
									)}
									<div className="flex flex-1 flex-col p-5">
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
											<Badge tone="primary">{qCount} Qs</Badge>
											{sCount > 0 && (
												<Badge tone="neutral">
													{sCount} section{sCount === 1 ? '' : 's'}
												</Badge>
											)}
											{quiz.flashcard_quiz || quiz.quizType === 'flashcard' ? (
												<Badge tone="accent">Flashcard</Badge>
											) : (
												<Badge tone="success">List</Badge>
											)}
										</div>

										<div className="mt-auto flex flex-col gap-3">
											<div className="flex flex-wrap items-center gap-0.5">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => navigate(`/quizzes/${id}`)}
													title="View"
													aria-label="View"
												>
													<Eye size={14} />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => setSettingsQuiz(quiz)}
													title="Quiz settings"
													aria-label="Quiz settings"
												>
													<SlidersHorizontal size={14} />
												</Button>
												{sCount > 0 && (
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={() => setRoadmapQuiz(quiz)}
														title="Create roadmap"
														aria-label="Create roadmap"
													>
														<Map size={14} />
													</Button>
												)}
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => navigate(`/quizzes/edit/${id}`)}
													title="Edit"
													aria-label="Edit"
												>
													<Pencil size={14} />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-danger h-8 w-8"
													onClick={() => setDeleteTarget(id)}
													title="Delete"
													aria-label="Delete"
												>
													<Trash2 size={14} />
												</Button>
											</div>
											<Button size="sm" className="w-full" onClick={() => launchAttempt(quiz)}>
												<Play size={14} /> Attempt
											</Button>
										</div>
									</div>
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

			<PersistedQuizSettingsModal
				quiz={settingsQuiz}
				open={!!settingsQuiz}
				onClose={() => setSettingsQuiz(null)}
			/>

			<CreateRoadmapFromQuizModal
				open={!!roadmapQuiz}
				onClose={() => setRoadmapQuiz(null)}
				quiz={roadmapQuiz}
				navigateOnSuccess
			/>

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
