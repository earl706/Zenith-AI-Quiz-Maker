import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
	BookOpen,
	Plus,
	Pencil,
	Trash2,
	Play,
	Eye,
	SlidersHorizontal,
	Map,
	Merge,
	CheckSquare,
	CircleHelp,
	Layers,
	LayoutList,
	GalleryVertical
} from 'lucide-react';

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
import RoadmapActivityStrip from '../components/roadmap/RoadmapActivityStrip';
import { Button, CoverCard, Modal, EmptyState, LoadingScreen, Pagination } from '../components/ui';
import MergeQuizzesModal from '../components/quiz/MergeQuizzesModal';
import { PersistedQuizSettingsModal } from '../components/quiz/QuizSettingsModal';
import { useAttemptLauncher } from '../components/quiz/useAttemptLauncher';
import { paginateClient } from '../hooks/useListControls';

const QUIZ_LIST_PAGE_SIZE = 9;

export default function QuizzesPage() {
	const navigate = useNavigate();
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [settingsQuiz, setSettingsQuiz] = useState(null);
	const [roadmapQuiz, setRoadmapQuiz] = useState(null);
	const [mergeOpen, setMergeOpen] = useState(false);
	const [selectMode, setSelectMode] = useState(false);
	const [selected, setSelected] = useState(() => new Set());
	const [page, setPage] = useState(1);
	const { launchAttempt, attemptModal } = useAttemptLauncher();

	const { data, isLoading } = useQuery({
		queryKey: ['quizzes', 'list'],
		queryFn: () => get('/quizzes/quiz/'),
		staleTime: 60_000,
		refetchOnMount: true
	});

	const quizList = useMemo(() => normalizeQuizList(data), [data]);
	const paged = useMemo(
		() => paginateClient(quizList, page, QUIZ_LIST_PAGE_SIZE),
		[quizList, page]
	);
	const selectedQuizzes = useMemo(
		() => quizList.filter((q) => selected.has(String(q.uuid || q.quiz_id))),
		[quizList, selected]
	);

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

	const toggleSelected = (id) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const exitSelectMode = () => {
		setSelectMode(false);
		setSelected(new Set());
	};

	if (isLoading) return <LoadingScreen />;

	return (
		<div>
			{attemptModal}
			<PageHeader
				title="My Quizzes"
				icon={BookOpen}
				description="Manage and attempt your quizzes."
				actions={
					<div className="flex flex-wrap items-center gap-1.5">
						{quizList.length >= 2 && (
							<Button
								variant={selectMode ? 'secondary' : 'ghost'}
								onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
							>
								<CheckSquare size={16} /> {selectMode ? 'Done' : 'Select'}
							</Button>
						)}
						{selectMode && selected.size >= 2 && (
							<Button onClick={() => setMergeOpen(true)}>
								<Merge size={16} /> Merge ({selected.size})
							</Button>
						)}
						<Button onClick={() => navigate('/create-quiz')}>
							<Plus size={16} /> New Quiz
						</Button>
					</div>
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
					{selectMode && (
						<p className="text-muted mb-3 text-xs">
							Select two or more quizzes, then Merge. You’ll choose the target and resolve section
							title conflicts.
						</p>
					)}
					<div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
						{paged.results.map((quiz) => {
							const id = String(quiz.uuid || quiz.quiz_id);
							const qCount = quizQuestionCount(quiz);
							const sCount = quizSectionCount(quiz);
							const imageSrc =
								resolveQuizImageSrc(quiz.quiz_image) ||
								resolveQuizImageSrc(quiz.quiz_image_url) ||
								null;
							const isSelected = selected.has(id);
							const isFlashcard = !!(quiz.flashcard_quiz || quiz.quizType === 'flashcard');
							const ModeIcon = isFlashcard ? GalleryVertical : LayoutList;
							const modeLabel = isFlashcard ? 'Flashcard' : 'List';

							return (
								<CoverCard
									key={id}
									title={quiz.quiz_title}
									subtitle={formatDate(quiz.created_at || quiz.date_created)}
									imageSrc={imageSrc}
									fallbackIcon={BookOpen}
									accentColor={quiz.tag_color || undefined}
									selected={selectMode && isSelected}
									onOpen={() => navigate(`/quizzes/${id}`)}
									openLabel={`Open ${quiz.quiz_title || 'quiz'}`}
									stats={[
										{
											icon: CircleHelp,
											value: qCount,
											label: `${qCount} question${qCount === 1 ? '' : 's'}`
										},
										sCount > 0
											? {
													icon: Layers,
													value: sCount,
													label: `${sCount} section${sCount === 1 ? '' : 's'}`
												}
											: null,
										{ icon: ModeIcon, label: modeLabel }
									]}
									select={
										selectMode
											? {
													checked: isSelected,
													onChange: () => toggleSelected(id),
													label: isSelected ? 'Deselect quiz' : 'Select quiz'
												}
											: undefined
									}
									actions={[
										{ icon: Eye, label: 'View', onClick: () => navigate(`/quizzes/${id}`) },
										{
											icon: SlidersHorizontal,
											label: 'Quiz settings',
											onClick: () => setSettingsQuiz(quiz)
										},
										sCount > 0
											? {
													icon: Map,
													label: 'Create roadmap',
													onClick: () => setRoadmapQuiz(quiz)
												}
											: null,
										{
											icon: Pencil,
											label: 'Edit',
											onClick: () => navigate(`/quizzes/edit/${id}`)
										},
										{
											icon: Trash2,
											label: 'Delete',
											onClick: () => setDeleteTarget(id),
											tone: 'danger'
										}
									]}
									primaryAction={{
										icon: Play,
										label: 'Attempt quiz',
										onClick: () => launchAttempt(quiz)
									}}
									footer={
										<RoadmapActivityStrip activity={quiz.activity} compact showHeader={false} />
									}
								/>
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

			<MergeQuizzesModal
				open={mergeOpen}
				onClose={() => setMergeOpen(false)}
				quizzes={selectedQuizzes.length >= 2 ? selectedQuizzes : quizList}
				onMerged={() => exitSelectMode()}
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
