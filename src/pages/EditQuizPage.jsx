import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	Check,
	Plus,
	X,
	Save,
	ArrowLeft,
	Pencil,
	SlidersHorizontal,
	WandSparkles
} from 'lucide-react';

import { api } from '../lib/api';
import { cn } from '../lib/format';
import { isExternalOrStaticImageUrl, resolveQuizImageSrc } from '../lib/quizImages';
import { invalidateQuizQueries } from '../lib/resources';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, Card, CardBody, CardHeader, Input, LoadingScreen, Modal } from '../components/ui';
import MathInput from '../components/quiz/MathInput';
import {
	createSection,
	normalizeQuizSections,
	questionTypeFromFlags,
	questionsGroupedBySection
} from '../components/quiz/quizHelpers';
import {
	QUIZ_TAG_COLORS,
	ToggleChip,
	ImageDropzone,
	ChoiceImageControl
} from '../components/quiz/quizAuthoringUi';
import { useQuizAiProposal } from '../components/quiz/useQuizAiProposal';
import QuizAiInstructionModal from '../components/quiz/QuizAiInstructionModal';
import QuizAiReviewBar, { QuizAiChangeControls } from '../components/quiz/QuizAiReviewBar';
import { reviewCardClassName } from '../components/quiz/quizAiDiff';

const colors = QUIZ_TAG_COLORS;

function getDefaultQuestion(id, randomChoices = false, sectionKey = null) {
	return {
		id,
		title: '',
		choices: ['', '', '', ''],
		choiceImages: [null, null, null, null],
		choiceImagePreviews: [null, null, null, null],
		choiceImageUrls: ['', '', '', ''],
		correctAnswerIndex: 0,
		mathematical: false,
		identification: false,
		randomChoices,
		hasChoiceImages: false,
		showChoiceImages: false,
		question_image: null,
		question_image_preview: null,
		question_image_url: '',
		sectionKey
	};
}

export default function EditQuizPage() {
	const navigate = useNavigate();
	const { id } = useParams();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [randomQuestionOrder, setRandomQuestionOrder] = useState(false);
	const [randomQuestionChoices, setRandomQuestionChoices] = useState(false);
	const [quizType, setQuizType] = useState('list');
	const [quizTitle, setQuizTitle] = useState('');
	const [selectedColor, setSelectedColor] = useState(colors[0].hex);
	const [quizImage, setQuizImage] = useState(null);
	const [quizImagePreview, setQuizImagePreview] = useState(null);
	const [quizImageUrl, setQuizImageUrl] = useState('');
	const [originalQuizImage, setOriginalQuizImage] = useState(null);
	const [questions, setQuestions] = useState([]);
	const [sections, setSections] = useState([]);
	const [isPublic, setIsPublic] = useState(false);
	const [imagePreview, setImagePreview] = useState(null);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [reviseOpen, setReviseOpen] = useState(false);

	const getDraft = useCallback(
		() => ({
			questions,
			sections,
			quizTitle,
			randomChoices: randomQuestionChoices
		}),
		[questions, sections, quizTitle, randomQuestionChoices]
	);

	const aiProposal = useQuizAiProposal({
		getDraft,
		onCommit: ({ questions: nextQuestions, sections: nextSections }) => {
			setQuestions(nextQuestions);
			setSections(nextSections);
		},
		onQuizTitle: (title) => {
			if (title?.trim()) setQuizTitle(title.trim());
		}
	});

	const reviewing = aiProposal.isReviewing;
	const authoringQuestions = reviewing ? aiProposal.displayQuestions || [] : questions;
	const authoringSections = reviewing ? aiProposal.displaySections || [] : sections;

	const openImagePreview = (src, title = 'Image preview') => {
		if (!src) return;
		setImagePreview({ src: resolveQuizImageSrc(src) || src, title });
	};

	const closeImagePreview = () => setImagePreview(null);

	useEffect(() => {
		const loadQuizData = async () => {
			try {
				setLoading(true);
				const response = await api.get(`/quizzes/quiz/${id}/`);
				const quizData = response.data.data || response.data;
				const questionsData = response.data.questions || quizData.questions || [];

				setQuizTitle(quizData.quiz_title);
				setSelectedColor(quizData.tag_color);
				setRandomQuestionOrder(!!quizData.random_question_order);
				setIsPublic(!!quizData.public);
				setQuizType(quizData.flashcard_quiz ? 'flashcard' : 'list');
				setOriginalQuizImage(quizData.quiz_image);
				const coverUrl = quizData.quiz_image_url || '';
				const coverDisplay = quizData.quiz_image || coverUrl;
				setQuizImageUrl(
					isExternalOrStaticImageUrl(coverUrl)
						? coverUrl
						: isExternalOrStaticImageUrl(coverDisplay)
							? coverDisplay
							: ''
				);
				setQuizImagePreview(resolveQuizImageSrc(coverDisplay) || coverDisplay);

				const loadedSections = normalizeQuizSections(quizData);
				setSections(loadedSections);
				const sectionKeyById = new Map(
					loadedSections.filter((s) => s.id != null).map((s) => [s.id, s.clientKey])
				);

				const transformedQuestions = questionsData.map((question, index) => {
					const rawChoices = question.choices || [];
					const transformedChoices = rawChoices.map((choice) =>
						typeof choice === 'object' && choice !== null ? choice.text || '' : choice
					);
					const choiceImageUrls = rawChoices.map((choice) => {
						if (typeof choice !== 'object' || choice === null) return '';
						if (choice.image_url) return choice.image_url;
						if (isExternalOrStaticImageUrl(choice.image)) return choice.image;
						return '';
					});
					const choiceImagePreviews = rawChoices.map((choice, i) => {
						const fromObj =
							typeof choice === 'object' && choice !== null
								? choice.image || choice.image_url || null
								: null;
						return resolveQuizImageSrc(fromObj || choiceImageUrls[i]) || fromObj || null;
					});
					const mathematical =
						question.question_type === 'MUL-COM' || question.question_type === 'COM';
					const identification =
						question.question_type === 'IDE' || question.question_type === 'IDE-COM';
					const padTo = Math.max(transformedChoices.length, identification ? 1 : 4);
					while (transformedChoices.length < padTo) transformedChoices.push('');
					while (choiceImagePreviews.length < padTo) choiceImagePreviews.push(null);
					while (choiceImageUrls.length < padTo) choiceImageUrls.push('');

					const correctAnswerIndex = transformedChoices.findIndex(
						(choice) => choice === question.correct_answer
					);
					const hasChoiceImages =
						!!question.has_choice_images ||
						choiceImagePreviews.some(Boolean) ||
						choiceImageUrls.some(Boolean);
					const qUrl =
						question.question_image_url ||
						(isExternalOrStaticImageUrl(question.question_image) ? question.question_image : '');

					return {
						id: question.id || index + 1,
						title: question.question,
						choices: transformedChoices,
						choiceImages: Array(padTo).fill(null),
						choiceImagePreviews,
						choiceImageUrls,
						correctAnswerIndex: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
						mathematical,
						identification,
						randomChoices: !!question.random_choices,
						hasChoiceImages,
						showChoiceImages: hasChoiceImages,
						question_image: null,
						question_image_preview:
							resolveQuizImageSrc(question.question_image || qUrl) ||
							question.question_image ||
							null,
						question_image_url: qUrl || '',
						sectionKey: sectionKeyById.get(question.section) || null
					};
				});

				setQuestions(transformedQuestions);
				setRandomQuestionChoices(transformedQuestions.some((q) => q.randomChoices));
				setLoading(false);
			} catch {
				setLoading(false);
				toast.error('Could not load quiz.');
				navigate('/quizzes');
			}
		};
		loadQuizData();
	}, [id, navigate]);

	const handleInputChange = (qid, field, value) => {
		setQuestions((qs) =>
			qs.map((q) => {
				if (q.id !== qid) return q;
				const next = { ...q, [field]: value };
				if ((field === 'identification' || field === 'mathematical') && value === true) {
					next.showChoiceImages = false;
					next.hasChoiceImages = false;
					next.choiceImages = q.choiceImages.map(() => null);
					next.choiceImagePreviews = q.choiceImagePreviews.map(() => null);
					next.choiceImageUrls = (q.choiceImageUrls || q.choices.map(() => '')).map(() => '');
				}
				return next;
			})
		);
	};

	const toggleChoiceImages = (questionId) => {
		setQuestions((qs) =>
			qs.map((q) => {
				if (q.id !== questionId) return q;
				const next = !q.showChoiceImages;
				if (next) {
					return { ...q, showChoiceImages: true };
				}
				return {
					...q,
					showChoiceImages: false,
					hasChoiceImages: false,
					choiceImages: q.choiceImages.map(() => null),
					choiceImagePreviews: q.choiceImagePreviews.map(() => null),
					choiceImageUrls: (q.choiceImageUrls || q.choices.map(() => '')).map(() => '')
				};
			})
		);
	};

	const removeQuestion = (qid) => {
		setQuestions((qs) => qs.filter((q) => q.id !== qid));
	};

	const removeChoice = (qid, index) => {
		setQuestions((qs) =>
			qs.map((q) =>
				q.id === qid
					? {
							...q,
							choices: q.choices.filter((_, i) => i !== index),
							choiceImages: q.choiceImages.filter((_, i) => i !== index),
							choiceImagePreviews: q.choiceImagePreviews.filter((_, i) => i !== index),
							choiceImageUrls: (q.choiceImageUrls || []).filter((_, i) => i !== index)
						}
					: q
			)
		);
	};

	const addChoice = (qid) => {
		setQuestions((qs) =>
			qs.map((q) =>
				q.id === qid
					? {
							...q,
							choices: [...q.choices, ''],
							choiceImages: [...q.choiceImages, null],
							choiceImagePreviews: [...q.choiceImagePreviews, null],
							choiceImageUrls: [...(q.choiceImageUrls || []), '']
						}
					: q
			)
		);
	};

	const handleChoicesChange = (qid, index, value) => {
		setQuestions((qs) =>
			qs.map((q) =>
				q.id === qid ? { ...q, choices: q.choices.map((c, i) => (i === index ? value : c)) } : q
			)
		);
	};

	const addQuestion = (sectionKey = null) => {
		const key =
			sectionKey ?? (sections.length > 0 ? sections[sections.length - 1].clientKey : null);
		setQuestions((qs) => [
			...qs,
			getDefaultQuestion(`new-${Date.now()}`, randomQuestionChoices, key)
		]);
	};

	const addSection = () => {
		const next = createSection({
			title: `Section ${sections.length + 1}`,
			order: sections.length
		});
		setSections((prev) => {
			if (prev.length === 0) {
				setQuestions((qs) => qs.map((q) => ({ ...q, sectionKey: next.clientKey })));
			}
			return [...prev, next];
		});
	};

	const updateSectionTitle = (clientKey, title) => {
		setSections((prev) => prev.map((s) => (s.clientKey === clientKey ? { ...s, title } : s)));
	};

	const removeSection = (clientKey) => {
		const remaining = sections.filter((s) => s.clientKey !== clientKey);
		setSections(remaining);
		const fallback = remaining[0]?.clientKey ?? null;
		setQuestions((qs) =>
			qs.map((q) => (q.sectionKey === clientKey ? { ...q, sectionKey: fallback } : q))
		);
	};

	const moveSection = (clientKey, direction) => {
		setSections((prev) => {
			const idx = prev.findIndex((s) => s.clientKey === clientKey);
			if (idx < 0) return prev;
			const swapWith = idx + direction;
			if (swapWith < 0 || swapWith >= prev.length) return prev;
			const next = [...prev];
			[next[idx], next[swapWith]] = [next[swapWith], next[idx]];
			return next.map((s, order) => ({ ...s, order }));
		});
	};

	const handleQuizImageUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			setQuizImage(file);
			setQuizImageUrl('');
			const reader = new FileReader();
			reader.onload = (e) => setQuizImagePreview(e.target.result);
			reader.readAsDataURL(file);
		}
	};

	const setQuizCoverUrl = (url) => {
		const trimmed = String(url || '').trim();
		setQuizImageUrl(trimmed);
		setQuizImage(null);
		setOriginalQuizImage(null);
		setQuizImagePreview(resolveQuizImageSrc(trimmed) || trimmed || null);
	};

	const clearQuizImage = () => {
		setQuizImage(null);
		setQuizImagePreview(null);
		setQuizImageUrl('');
		setOriginalQuizImage(null);
	};

	const handleQuestionImageUpload = (questionId, event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setQuestions((qs) =>
					qs.map((q) =>
						q.id === questionId
							? {
									...q,
									question_image: file,
									question_image_preview: e.target.result,
									question_image_url: ''
								}
							: q
					)
				);
			};
			reader.readAsDataURL(file);
		}
	};

	const setQuestionImageUrl = (questionId, url) => {
		const trimmed = String(url || '').trim();
		setQuestions((qs) =>
			qs.map((q) =>
				q.id === questionId
					? {
							...q,
							question_image: null,
							question_image_url: trimmed,
							question_image_preview: resolveQuizImageSrc(trimmed) || trimmed || null
						}
					: q
			)
		);
	};

	const handleChoiceImageUpload = (questionId, choiceIndex, event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setQuestions((qs) =>
					qs.map((q) =>
						q.id === questionId
							? {
									...q,
									choiceImages: q.choiceImages.map((img, i) => (i === choiceIndex ? file : img)),
									choiceImagePreviews: q.choiceImagePreviews.map((p, i) =>
										i === choiceIndex ? e.target.result : p
									),
									choiceImageUrls: (q.choiceImageUrls || q.choices.map(() => '')).map((u, i) =>
										i === choiceIndex ? '' : u
									),
									hasChoiceImages: true
								}
							: q
					)
				);
			};
			reader.readAsDataURL(file);
		}
	};

	const setChoiceImageUrl = (questionId, choiceIndex, url) => {
		const trimmed = String(url || '').trim();
		setQuestions((qs) =>
			qs.map((q) => {
				if (q.id !== questionId) return q;
				const urls = [...(q.choiceImageUrls || q.choices.map(() => ''))];
				while (urls.length < q.choices.length) urls.push('');
				urls[choiceIndex] = trimmed;
				return {
					...q,
					choiceImages: q.choiceImages.map((img, i) => (i === choiceIndex ? null : img)),
					choiceImagePreviews: q.choiceImagePreviews.map((p, i) =>
						i === choiceIndex ? resolveQuizImageSrc(trimmed) || trimmed || null : p
					),
					choiceImageUrls: urls,
					hasChoiceImages:
						urls.some(Boolean) || q.choiceImages.some((img, i) => i !== choiceIndex && img)
				};
			})
		);
	};

	const removeChoiceImage = (questionId, choiceIndex) => {
		setQuestions((qs) =>
			qs.map((q) =>
				q.id === questionId
					? {
							...q,
							choiceImages: q.choiceImages.map((img, i) => (i === choiceIndex ? null : img)),
							choiceImagePreviews: q.choiceImagePreviews.map((p, i) =>
								i === choiceIndex ? null : p
							),
							choiceImageUrls: (q.choiceImageUrls || q.choices.map(() => '')).map((u, i) =>
								i === choiceIndex ? '' : u
							),
							hasChoiceImages:
								q.choiceImages.some((img, i) => i !== choiceIndex && img !== null) ||
								(q.choiceImageUrls || []).some((u, i) => i !== choiceIndex && u) ||
								q.choiceImagePreviews.some((p, i) => i !== choiceIndex && p !== null)
						}
					: q
			)
		);
	};

	const fileToBase64 = (file) =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
		});

	/** Keep URL strings as URLs; only convert Files / data URLs for upload fields. */
	const toSaveableImage = async (value) => {
		if (!value) return null;
		if (typeof value === 'string') {
			if (value.startsWith('data:image')) return value;
			if (isExternalOrStaticImageUrl(value)) return null;
			return null;
		}
		return fileToBase64(value);
	};

	const resolveStoredUrl = (fileOrNull, urlField, preview) => {
		if (urlField) return urlField;
		if (isExternalOrStaticImageUrl(preview)) return preview;
		return '';
	};

	const handleUpdateQuiz = async (e) => {
		e?.preventDefault?.();
		try {
			setSaving(true);
			const quizData = {
				quiz_title: quizTitle,
				public: isPublic,
				random_question_order: randomQuestionOrder,
				tag_color: selectedColor,
				flashcard_quiz: quizType === 'flashcard',
				sections: sections.map((section, si) => ({
					...(section.id ? { id: section.id } : {}),
					title: section.title || `Section ${si + 1}`,
					order: section.order ?? si
				}))
			};

			if (quizImage) {
				quizData.quiz_image = await toSaveableImage(quizImage);
				quizData.quiz_image_url = '';
			} else if (quizImageUrl) {
				quizData.quiz_image = null;
				quizData.quiz_image_url = quizImageUrl;
			} else if (originalQuizImage || quizImagePreview) {
				const asUrl = resolveStoredUrl(null, '', originalQuizImage || quizImagePreview);
				if (asUrl) {
					quizData.quiz_image = null;
					quizData.quiz_image_url = asUrl;
				} else {
					quizData.quiz_image = await toSaveableImage(originalQuizImage || quizImagePreview);
					quizData.quiz_image_url = '';
				}
			} else {
				quizData.quiz_image = null;
				quizData.quiz_image_url = '';
			}

			quizData.questions = await Promise.all(
				questions.map(async (question) => {
					const choices = question.choices || [];
					const correctIndex = Math.max(
						0,
						Math.min(question.correctAnswerIndex || 0, Math.max(choices.length - 1, 0))
					);
					const choiceImageUrls = [];
					const choiceImages = await Promise.all(
						choices.map(async (_c, i) => {
							const file = question.choiceImages?.[i];
							const url = question.choiceImageUrls?.[i] || '';
							const preview = question.choiceImagePreviews?.[i];
							if (file) {
								choiceImageUrls.push('');
								return toSaveableImage(file);
							}
							const stored = resolveStoredUrl(null, url, preview);
							choiceImageUrls.push(stored);
							return null;
						})
					);
					const hasChoiceImages =
						!!question.hasChoiceImages ||
						choiceImages.some(Boolean) ||
						choiceImageUrls.some(Boolean);

					const qData = {
						...(typeof question.id === 'number' ? { id: question.id } : {}),
						question: question.title,
						question_type: questionTypeFromFlags(question),
						choices_array: choices,
						choice_images: choiceImages,
						choice_image_urls: choiceImageUrls,
						correct_answer: choices[correctIndex] || '',
						correct_answer_index: correctIndex,
						random_choices: !!question.randomChoices,
						has_choice_images: hasChoiceImages
					};
					if (sections.length > 0 && question.sectionKey) {
						const sectionIndex = sections.findIndex((s) => s.clientKey === question.sectionKey);
						if (sectionIndex >= 0) {
							qData.section_index = sectionIndex;
							const sec = sections[sectionIndex];
							if (sec.id) qData.section = sec.id;
						}
					} else {
						qData.section = null;
					}
					if (question.question_image) {
						qData.question_image = await toSaveableImage(question.question_image);
						qData.question_image_url = '';
					} else {
						const stored = resolveStoredUrl(
							null,
							question.question_image_url,
							question.question_image_preview
						);
						qData.question_image = null;
						qData.question_image_url = stored || '';
					}
					return qData;
				})
			);

			const response = await api.put(`/quizzes/quiz/${id}/`, quizData);
			if (response.status === 200) {
				await invalidateQuizQueries();
				toast.success('Quiz updated!');
				navigate(`/quizzes/${id}`);
			}
		} catch {
			toast.error('Failed to update quiz.');
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <LoadingScreen />;

	return (
		<div className={cn('pb-20', reviewing ? 'lg:pb-24' : 'lg:pb-0')}>
			<PageHeader
				title="Edit Quiz"
				icon={Pencil}
				description={`${authoringQuestions.length} question${authoringQuestions.length === 1 ? '' : 's'}${
					quizTitle ? ` · ${quizTitle}` : ''
				}${reviewing ? ' · reviewing AI' : ''}`}
				actions={
					<div className="flex items-center gap-1.5 sm:gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="cursor-pointer"
							aria-label="Back to quiz"
							title="Back"
							onClick={() => navigate(`/quizzes/${id}`)}
						>
							<ArrowLeft size={16} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="cursor-pointer"
							aria-label="Quiz settings"
							title="Quiz settings"
							disabled={reviewing}
							onClick={() => setSettingsOpen(true)}
						>
							<SlidersHorizontal size={16} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="cursor-pointer"
							aria-label="Edit quiz with AI"
							title="Edit quiz with AI"
							disabled={reviewing || aiProposal.isLoading}
							onClick={() => setReviseOpen(true)}
						>
							<WandSparkles size={16} />
						</Button>
						<Button
							size="sm"
							className="cursor-pointer"
							loading={saving}
							disabled={reviewing}
							title={reviewing ? 'Accept or reject AI changes first' : undefined}
							onClick={handleUpdateQuiz}
						>
							<Save size={14} /> Save
						</Button>
					</div>
				}
			/>

			<div className="flex min-w-0 flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						disabled={reviewing}
						onClick={addSection}
					>
						<Plus size={14} /> Add section
					</Button>
					{authoringSections.length > 0 && (
						<p className="text-muted text-xs">Questions must belong to a section.</p>
					)}
				</div>

				{questionsGroupedBySection(authoringQuestions, authoringSections).map(
					({ section, questions: groupQuestions }) => (
						<div key={section?.clientKey || 'ungrouped'} className="space-y-3">
							{section && (
								<div
									className={cn(
										'border-line bg-surface-2 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2',
										reviewCardClassName(aiProposal.metaFor(section.clientKey)),
										section._reviewKind === 'removed' && 'line-through opacity-60'
									)}
								>
									<Input
										value={section.title}
										onChange={(e) => updateSectionTitle(section.clientKey, e.target.value)}
										placeholder="Section title"
										className="min-w-[10rem] flex-1 py-1.5"
										disabled={reviewing}
									/>
									{reviewing ? (
										<QuizAiChangeControls
											meta={aiProposal.metaFor(section.clientKey)}
											onAccept={() => aiProposal.accept(String(section.clientKey))}
											onReject={() => aiProposal.reject(String(section.clientKey))}
										/>
									) : (
										<>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => moveSection(section.clientKey, -1)}
											>
												Up
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => moveSection(section.clientKey, 1)}
											>
												Down
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => removeSection(section.clientKey)}
												aria-label="Remove section"
											>
												<X size={15} />
											</Button>
										</>
									)}
								</div>
							)}
							{groupQuestions.map((question) => {
								const index = authoringQuestions.findIndex((q) => q.id === question.id);
								const reviewMeta = aiProposal.metaFor(question.id);
								const isRemoved = question._reviewKind === 'removed';
								return (
									<Card
										key={question.id}
										className={cn('overflow-hidden', reviewCardClassName(reviewMeta))}
									>
										<CardHeader
											className="px-4 py-3"
											title={`Q${index + 1}`}
											action={
												<div className="flex items-center gap-1.5">
													{reviewing ? (
														<QuizAiChangeControls
															meta={reviewMeta}
															onAccept={() => aiProposal.accept(String(question.id))}
															onReject={() => aiProposal.reject(String(question.id))}
														/>
													) : (
														<>
															<ToggleChip
																active={question.mathematical}
																onClick={() =>
																	handleInputChange(
																		question.id,
																		'mathematical',
																		!question.mathematical
																	)
																}
															>
																Math
															</ToggleChip>
															<ToggleChip
																active={question.identification}
																onClick={() =>
																	handleInputChange(
																		question.id,
																		'identification',
																		!question.identification
																	)
																}
															>
																ID
															</ToggleChip>
															{!question.identification && !question.mathematical && (
																<ToggleChip
																	active={question.showChoiceImages}
																	onClick={() => toggleChoiceImages(question.id)}
																>
																	Images
																</ToggleChip>
															)}
															<Button
																variant="ghost"
																size="icon"
																className="cursor-pointer"
																aria-label={`Remove question ${index + 1}`}
																onClick={() => removeQuestion(question.id)}
															>
																<X size={15} />
															</Button>
														</>
													)}
												</div>
											}
										/>
										<CardBody
											className={cn('space-y-3 px-4 pb-4', isRemoved && 'pointer-events-none')}
										>
											{question._priorTitle && question._reviewKind === 'modified' && (
												<p className="text-muted text-[0.65rem]">Was: {question._priorTitle}</p>
											)}
											<Input
												value={question.title}
												onChange={(e) => handleInputChange(question.id, 'title', e.target.value)}
												placeholder="Question text"
												className={cn('py-1.5', isRemoved && 'line-through')}
												disabled={reviewing}
											/>

											{!isRemoved && (
												<>
													<ImageDropzone
														preview={question.question_image_preview}
														compact
														label="Question image"
														onPreview={openImagePreview}
														urlValue={question.question_image_url || ''}
														onUrlChange={(url) => setQuestionImageUrl(question.id, url)}
														onClear={() =>
															!reviewing &&
															setQuestions((qs) =>
																qs.map((q) =>
																	q.id === question.id
																		? {
																				...q,
																				question_image: null,
																				question_image_preview: null,
																				question_image_url: ''
																			}
																		: q
																)
															)
														}
														onChange={(e) =>
															!reviewing && handleQuestionImageUpload(question.id, e)
														}
													/>

													<div className="space-y-1.5">
														{question.mathematical ? (
															<MathInput
																handleChoicesChange={handleChoicesChange}
																handleInputChange={handleInputChange}
																question={question}
																removeChoice={removeChoice}
															/>
														) : question.identification ? (
															<div className="flex items-center gap-2">
																<button
																	type="button"
																	aria-label="Mark as correct"
																	disabled={reviewing}
																	className={cn(
																		'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition',
																		question.correctAnswerIndex === 0
																			? 'border-primary bg-primary'
																			: 'border-line bg-surface'
																	)}
																	onClick={() =>
																		handleInputChange(question.id, 'correctAnswerIndex', 0)
																	}
																>
																	{question.correctAnswerIndex === 0 && (
																		<Check size={10} className="text-primary-fg" />
																	)}
																</button>
																<input
																	type="text"
																	value={question.choices[0] || ''}
																	onChange={(e) =>
																		handleChoicesChange(question.id, 0, e.target.value)
																	}
																	placeholder="Answer"
																	className="border-line bg-surface text-fg focus:border-primary flex-1 rounded-md border px-2.5 py-1.5 text-sm focus:outline-none"
																	required
																	disabled={reviewing}
																/>
															</div>
														) : (
															question.choices.map((choice, ci) => (
																<div className="flex items-center gap-1.5" key={ci}>
																	<button
																		type="button"
																		aria-label={`Mark choice ${ci + 1} correct`}
																		disabled={reviewing}
																		className={cn(
																			'flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition',
																			question.correctAnswerIndex === ci
																				? 'border-primary bg-primary'
																				: 'border-line bg-surface'
																		)}
																		onClick={() =>
																			handleInputChange(question.id, 'correctAnswerIndex', ci)
																		}
																	>
																		{question.correctAnswerIndex === ci && (
																			<Check size={10} className="text-primary-fg" />
																		)}
																	</button>
																	<input
																		type="text"
																		value={choice}
																		onChange={(e) =>
																			handleChoicesChange(question.id, ci, e.target.value)
																		}
																		placeholder={`Choice ${ci + 1}`}
																		className="border-line bg-surface text-fg focus:border-primary min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-sm focus:outline-none"
																		required
																		disabled={reviewing}
																	/>
																	{question.showChoiceImages && (
																		<ChoiceImageControl
																			preview={question.choiceImagePreviews[ci]}
																			urlValue={(question.choiceImageUrls || [])[ci] || ''}
																			onUrlChange={(url) =>
																				!reviewing && setChoiceImageUrl(question.id, ci, url)
																			}
																			onPreview={openImagePreview}
																			onChange={(e) =>
																				!reviewing && handleChoiceImageUpload(question.id, ci, e)
																			}
																			onClear={() =>
																				!reviewing && removeChoiceImage(question.id, ci)
																			}
																		/>
																	)}
																	{!reviewing && (
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-7 w-7 shrink-0 cursor-pointer"
																			aria-label={`Remove choice ${ci + 1}`}
																			onClick={() => removeChoice(question.id, ci)}
																		>
																			<X size={13} className="text-danger" />
																		</Button>
																	)}
																</div>
															))
														)}
													</div>

													{!question.identification && !reviewing && (
														<Button
															variant="ghost"
															size="sm"
															className="w-full"
															onClick={() => addChoice(question.id)}
														>
															<Plus size={13} /> Add choice
														</Button>
													)}
												</>
											)}
										</CardBody>
									</Card>
								);
							})}
							{section && !reviewing && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="w-full"
									onClick={() => addQuestion(section.clientKey)}
								>
									<Plus size={14} /> Add question to section
								</Button>
							)}
						</div>
					)
				)}

				{authoringSections.length === 0 && !reviewing && (
					<Button
						variant="secondary"
						size="sm"
						className="w-full cursor-pointer"
						onClick={() => addQuestion()}
					>
						<Plus size={14} /> Add question
					</Button>
				)}
			</div>

			{!reviewing && (
				<div className="border-line bg-bg/95 fixed inset-x-0 bottom-0 z-20 border-t p-3 backdrop-blur lg:hidden">
					<Button className="w-full cursor-pointer" loading={saving} onClick={handleUpdateQuiz}>
						Save changes
					</Button>
				</div>
			)}

			{reviewing && (
				<QuizAiReviewBar
					summaryLabel={aiProposal.summaryLabel}
					instruction={aiProposal.instruction}
					pendingCount={aiProposal.pendingCount}
					onAcceptAll={aiProposal.acceptAll}
					onRejectAll={aiProposal.rejectAll}
					onDone={aiProposal.done}
				/>
			)}

			<QuizAiInstructionModal
				open={reviseOpen}
				onClose={() => setReviseOpen(false)}
				loading={aiProposal.isLoading}
				onSubmit={(instruction, model) => aiProposal.runRevise(instruction, model)}
			/>

			<Modal
				open={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				title="Quiz settings"
				size="md"
				footer={
					<Button
						className="w-full cursor-pointer sm:w-auto"
						loading={saving}
						disabled={reviewing}
						onClick={handleUpdateQuiz}
					>
						Save changes
					</Button>
				}
			>
				<div className="space-y-3">
					<Input
						label="Title"
						value={quizTitle}
						onChange={(e) => setQuizTitle(e.target.value)}
						className="py-1.5"
					/>

					<ImageDropzone
						preview={quizImagePreview}
						compact
						label="Cover image"
						onPreview={openImagePreview}
						urlValue={quizImageUrl}
						onUrlChange={setQuizCoverUrl}
						onClear={clearQuizImage}
						onChange={handleQuizImageUpload}
					/>

					<div>
						<p className="text-fg mb-1.5 text-xs font-medium">Type</p>
						<div className="flex gap-1.5">
							{['list', 'flashcard'].map((t) => (
								<button
									key={t}
									type="button"
									className={cn(
										'flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium capitalize transition',
										quizType === t
											? 'bg-primary text-primary-fg'
											: 'bg-surface-2 text-fg hover:bg-line'
									)}
									onClick={() => setQuizType(t)}
								>
									{t}
								</button>
							))}
						</div>
					</div>

					<div className="flex flex-col flex-nowrap gap-1.5">
						<ToggleChip
							active={randomQuestionOrder}
							onClick={() => setRandomQuestionOrder(!randomQuestionOrder)}
						>
							Shuffle questions
						</ToggleChip>
						<ToggleChip
							active={randomQuestionChoices}
							onClick={() => {
								setRandomQuestionChoices(!randomQuestionChoices);
								setQuestions((qs) =>
									qs.map((q) => ({ ...q, randomChoices: !randomQuestionChoices }))
								);
							}}
						>
							Shuffle choices
						</ToggleChip>
					</div>

					<div>
						<p className="text-fg mb-1.5 text-xs font-medium">Tag</p>
						<div className="grid grid-cols-8 gap-1.5">
							{colors.map((color) => (
								<button
									key={color.hex}
									type="button"
									title={color.name}
									aria-label={color.name}
									onClick={() => setSelectedColor(color.hex)}
									className={cn(
										'h-5 w-5 cursor-pointer rounded-full border transition',
										selectedColor === color.hex
											? 'border-fg ring-primary/40 scale-110 ring-2'
											: 'border-line hover:scale-105'
									)}
									style={{ backgroundColor: color.hex }}
								/>
							))}
						</div>
					</div>
				</div>
			</Modal>

			<Modal
				open={!!imagePreview}
				onClose={closeImagePreview}
				title={imagePreview?.title || 'Image preview'}
				size="lg"
			>
				{imagePreview?.src && (
					<img
						src={imagePreview.src}
						alt=""
						className="max-h-[70vh] w-full rounded-md object-contain"
					/>
				)}
			</Modal>
		</div>
	);
}
