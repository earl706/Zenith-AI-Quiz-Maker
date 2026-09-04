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
import { cn, formatDate } from '../lib/format';
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
import { Button, Card, Modal, EmptyState, LoadingScreen, Pagination } from '../components/ui';
import MergeQuizzesModal from '../components/quiz/MergeQuizzesModal';
import { PersistedQuizSettingsModal } from '../components/quiz/QuizSettingsModal';
import { useAttemptLauncher } from '../components/quiz/useAttemptLauncher';
import { LIST_PAGE_SIZE, paginateClient } from '../hooks/useListControls';

function OverlayStat({ icon: Icon, value, label }) {
	return (
		<span
			title={label}
			aria-label={label}
			className="inline-flex items-center gap-0.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums backdrop-blur-sm"
		>
			<Icon size={12} strokeWidth={2} aria-hidden />
			{value != null ? <span>{value}</span> : null}
		</span>
	);
}

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
	const paged = useMemo(() => paginateClient(quizList, page, LIST_PAGE_SIZE), [quizList, page]);
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
								<Card
									key={id}
									className={cn(
										'group flex flex-col overflow-hidden transition hover:shadow-md',
										quiz.tag_color && 'border-r-[3px]',
										selectMode && isSelected && 'ring-primary/40 ring-2'
									)}
									style={quiz.tag_color ? { borderRightColor: quiz.tag_color } : undefined}
								>
									<div
										role="link"
										tabIndex={0}
										className="relative h-40 cursor-pointer outline-none"
										onClick={() => navigate(`/quizzes/${id}`)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												navigate(`/quizzes/${id}`);
											}
										}}
										aria-label={`Open ${quiz.quiz_title || 'quiz'}`}
									>
										{imageSrc ? (
											<img
												src={imageSrc}
												alt=""
												className="absolute inset-0 h-full w-full object-cover"
											/>
										) : (
											<div
												className="bg-surface-2 text-muted absolute inset-0 flex items-center justify-center"
												aria-hidden
											>
												<BookOpen size={28} strokeWidth={1.5} />
											</div>
										)}
										<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-black/45" />

										{selectMode && (
											<label
												className="absolute top-2 left-2 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-black/50 backdrop-blur-sm"
												onClick={(e) => e.stopPropagation()}
												onKeyDown={(e) => e.stopPropagation()}
											>
												<input
													type="checkbox"
													checked={isSelected}
													onChange={() => toggleSelected(id)}
													className="accent-primary"
													aria-label={isSelected ? 'Deselect quiz' : 'Select quiz'}
												/>
											</label>
										)}

										<div
											className={cn(
												'absolute top-2 z-10 min-w-0 text-white',
												selectMode ? 'right-2 left-11' : 'inset-x-2'
											)}
										>
											<h3 className="truncate text-sm font-semibold drop-shadow-sm">
												{quiz.quiz_title}
											</h3>
											<p className="text-[10px] text-white/80 drop-shadow-sm">
												{formatDate(quiz.created_at || quiz.date_created)}
											</p>
											<div className="mt-1.5 flex flex-wrap gap-1">
												<OverlayStat
													icon={CircleHelp}
													value={qCount}
													label={`${qCount} question${qCount === 1 ? '' : 's'}`}
												/>
												{sCount > 0 && (
													<OverlayStat
														icon={Layers}
														value={sCount}
														label={`${sCount} section${sCount === 1 ? '' : 's'}`}
													/>
												)}
												<OverlayStat icon={ModeIcon} label={modeLabel} />
											</div>
										</div>

										<div
											className={cn(
												'absolute bottom-2 left-2 z-10 flex items-center gap-0.5 rounded-md bg-black/45 p-0.5 backdrop-blur-sm transition-opacity',
												'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
											)}
											onClick={(e) => e.stopPropagation()}
											onKeyDown={(e) => e.stopPropagation()}
										>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
												onClick={() => navigate(`/quizzes/${id}`)}
												title="View"
												aria-label="View"
											>
												<Eye size={14} />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
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
													className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
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
												className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
												onClick={() => navigate(`/quizzes/edit/${id}`)}
												title="Edit"
												aria-label="Edit"
											>
												<Pencil size={14} />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-danger h-8 w-8 hover:bg-white/15"
												onClick={() => setDeleteTarget(id)}
												title="Delete"
												aria-label="Delete"
											>
												<Trash2 size={14} />
											</Button>
										</div>

										<Button
											size="icon"
											className="absolute right-2 bottom-2 z-10 h-9 w-9 shadow-md"
											onClick={(e) => {
												e.stopPropagation();
												launchAttempt(quiz);
											}}
											title="Attempt"
											aria-label="Attempt quiz"
										>
											<Play size={16} />
										</Button>
									</div>

									<div className="p-1">
										<RoadmapActivityStrip activity={quiz.activity} compact showHeader={false} />
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
