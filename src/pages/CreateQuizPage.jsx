import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Check,
	Plus,
	X,
	Import,
	ListChecks,
	SlidersHorizontal,
	Sparkles,
	FileUp,
	WandSparkles,
	LayoutTemplate
} from 'lucide-react';

import { api } from '../lib/api';
import { cn } from '../lib/format';
import { resolveQuizImageSrc } from '../lib/quizImages';
import { invalidateQuizQueries } from '../lib/resources';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, Button, Card, CardBody, CardHeader, Input, Modal, Select } from '../components/ui';
import MathInput from '../components/quiz/MathInput';
import { createSection, questionsGroupedBySection } from '../components/quiz/quizHelpers';
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
const AI_TYPE_MIX_OPTIONS = [
	{ value: 'mostly_mc', label: 'Mostly MC' },
	{ value: 'balanced', label: 'Balanced' },
	{ value: 'mostly_identification', label: 'Mostly ID' }
];

/** Mirror backend auto heuristic for timeout/preview (chars ≈ words*5). */
function estimateAutoQuestionCount(topic, referenceMarkdown) {
	const autoMin = 5;
	const autoMax = 200;
	const charsPer = 2500;
	const topicOnly = 10;
	const reference = String(referenceMarkdown || '').trim();
	if (reference) {
		let estimate = Math.max(1, Math.round(reference.length / charsPer));
		const headings = reference
			.split('\n')
			.filter((line) => line.trimStart().startsWith('#')).length;
		estimate += Math.min(8, Math.floor(headings / 3));
		return Math.min(autoMax, Math.max(autoMin, estimate));
	}
	const topicText = String(topic || '').trim();
	if (topicText.length >= 80) return Math.min(autoMax, Math.max(autoMin, topicOnly + 2));
	if (topicText.length <= 12) return Math.min(autoMax, Math.max(autoMin, topicOnly - 2));
	return topicOnly;
}

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

function flagsFromQuestionType(questionType) {
	const t = String(questionType || 'MUL');
	return {
		mathematical: t === 'MUL-COM' || t === 'IDE-COM' || t === 'COM',
		identification: t === 'IDE' || t === 'IDE-COM'
	};
}

export default function CreateQuizPage() {
	const navigate = useNavigate();
	const [topic, setTopic] = useState('');
	const [questionNumber, setQuestionNumber] = useState(5);
	const [autoQuestionCount, setAutoQuestionCount] = useState(false);
	const [aiTypeMix, setAiTypeMix] = useState('balanced');
	const [ollamaModels, setOllamaModels] = useState([]);
	const [ollamaModel, setOllamaModel] = useState('');
	const [ollamaMode, setOllamaMode] = useState('local');
	const [modelsLoading, setModelsLoading] = useState(true);
	const [modelsError, setModelsError] = useState('');
	const [creating, setCreating] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [randomQuestionOrder, setRandomQuestionOrder] = useState(false);
	const [randomQuestionChoices, setRandomQuestionChoices] = useState(false);
	const [quizType, setQuizType] = useState('list');
	const [quizTitle, setQuizTitle] = useState('Quiz Title');
	const [selectedColor, setSelectedColor] = useState(colors[0].hex);
	const [quizImage, setQuizImage] = useState(null);
	const [quizImagePreview, setQuizImagePreview] = useState(null);
	const [questions, setQuestions] = useState([getDefaultQuestion(1)]);
	const [sections, setSections] = useState([]);
	const [importError, setImportError] = useState('');
	const fileInputRef = useRef(null);
	const referenceInputRef = useRef(null);
	const [referenceMarkdown, setReferenceMarkdown] = useState('');
	const [referenceMeta, setReferenceMeta] = useState(null);
	const [referenceLoading, setReferenceLoading] = useState(false);
	const [referenceError, setReferenceError] = useState('');
	const [referencePendingFile, setReferencePendingFile] = useState(false);
	const [imagePreview, setImagePreview] = useState(null);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [aiOpen, setAiOpen] = useState(false);
	const [reviseOpen, setReviseOpen] = useState(false);
	const [templatesOpen, setTemplatesOpen] = useState(false);
	const [templates, setTemplates] = useState([]);
	const [templatesLoading, setTemplatesLoading] = useState(false);
	const [templateLoadingSlug, setTemplateLoadingSlug] = useState('');
	const [aiTemplateSlug, setAiTemplateSlug] = useState('');
	const [quizImageUrl, setQuizImageUrl] = useState('');

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

	const loadTemplateCatalog = useCallback(async () => {
		setTemplatesLoading(true);
		try {
			const { data } = await api.get('/quizzes/templates/');
			setTemplates(Array.isArray(data?.templates) ? data.templates : []);
		} catch {
			toast.error('Could not load templates.');
			setTemplates([]);
		} finally {
			setTemplatesLoading(false);
		}
	}, []);

	const applyTemplate = async (slug) => {
		if (!slug) return;
		setTemplateLoadingSlug(slug);
		try {
			const { data } = await api.get(`/quizzes/templates/${slug}/`);
			const sectionList = Array.isArray(data.sections) ? data.sections : [];
			const nextSections = sectionList.map((sec, i) =>
				createSection({
					title: sec.title || `Section ${i + 1}`,
					order: sec.order ?? i
				})
			);
			const questionsRaw = Array.isArray(data.questions) ? data.questions : [];
			const mapped = questionsRaw.map((q, idx) => {
				const flags = flagsFromQuestionType(q.question_type);
				const rawChoices = Array.isArray(q.choices) ? q.choices : [];
				const choices = rawChoices.map((c) =>
					typeof c === 'object' && c !== null ? c.text || '' : String(c || '')
				);
				const choiceImageUrls = rawChoices.map((c) =>
					typeof c === 'object' && c !== null ? c.image_url || '' : ''
				);
				while (choices.length < (flags.identification ? 1 : 4)) choices.push('');
				while (choiceImageUrls.length < choices.length) choiceImageUrls.push('');
				const qUrl = q.question_image_url || '';
				const hasChoiceImages = !!q.has_choice_images || choiceImageUrls.some(Boolean);
				const sectionIndex = typeof q.section_index === 'number' ? q.section_index : null;
				return {
					id: idx + 1,
					title: q.title || '',
					choices,
					choiceImages: choices.map(() => null),
					choiceImagePreviews: choiceImageUrls.map((u) => resolveQuizImageSrc(u) || u || null),
					choiceImageUrls,
					correctAnswerIndex:
						typeof q.correct_answer_index === 'number' ? q.correct_answer_index : 0,
					mathematical: flags.mathematical,
					identification: flags.identification,
					randomChoices: !!q.random_choices,
					hasChoiceImages,
					showChoiceImages: hasChoiceImages,
					question_image: null,
					question_image_preview: resolveQuizImageSrc(qUrl) || qUrl || null,
					question_image_url: qUrl,
					sectionKey:
						sectionIndex != null && nextSections[sectionIndex]
							? nextSections[sectionIndex].clientKey
							: nextSections[0]?.clientKey || null
				};
			});
			setQuizTitle(data.title || 'Quiz Title');
			if (data.tag_color) setSelectedColor(data.tag_color);
			setQuizImage(null);
			const cover = data.cover_image_url || '';
			setQuizImageUrl(cover);
			setQuizImagePreview(resolveQuizImageSrc(cover) || cover || null);
			setSections(nextSections);
			setQuestions(
				mapped.length
					? mapped
					: [getDefaultQuestion(1, randomQuestionChoices, nextSections[0]?.clientKey || null)]
			);
			setAiTemplateSlug(slug);
			setTemplatesOpen(false);
			toast.success(`Loaded template: ${data.title || slug}`);
		} catch {
			toast.error('Failed to load template.');
		} finally {
			setTemplateLoadingSlug('');
		}
	};

	useEffect(() => {
		let cancelled = false;

		(async () => {
			setModelsLoading(true);
			setModelsError('');
			try {
				const { data } = await api.get('/quizzes/quiz/ollama/models/');
				if (cancelled) return;
				const models = Array.isArray(data?.models) ? data.models : [];
				const mode = data?.mode === 'cloud' ? 'cloud' : 'local';
				setOllamaMode(mode);
				setOllamaModels(models);
				const preferred =
					(data?.default && models.includes(data.default) && data.default) ||
					models[0] ||
					data?.default ||
					'';
				setOllamaModel(preferred);
				if (models.length === 0) {
					setModelsError(
						mode === 'cloud'
							? 'No free-tier Ollama Cloud models available. Check your API key or Settings provider.'
							: 'No Ollama models found. Pull a model locally (e.g. ollama pull llama3.1:8b).'
					);
				}
			} catch (error) {
				if (cancelled) return;
				const message =
					error?.response?.data?.error ||
					(ollamaMode === 'cloud'
						? 'Cannot reach Ollama Cloud. Check your API key in Settings.'
						: 'Cannot reach Ollama to list models. Start Ollama and refresh.');
				setModelsError(message);
				setOllamaModels([]);
				setOllamaModel('');
			} finally {
				if (!cancelled) setModelsLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	const handleImportQuiz = (event) => {
		const file = event.target.files[0];
		setImportError('');
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target.result);
				if (!data.quiz_title || !Array.isArray(data.questions) || data.questions.length === 0) {
					setImportError('Invalid quiz JSON structure.');
					return;
				}
				setQuizTitle(data.quiz_title);
				setSelectedColor(data.tag_color || colors[0].hex);
				setQuizType(data.quizType || 'list');
				setRandomQuestionOrder(!!data.randomQuestions);
				setRandomQuestionChoices(data.questions.some((q) => q.randomChoices === true));
				setQuizImage(null);
				setQuizImagePreview(null);

				const mappedQuestions = data.questions.map((q, idx) => {
					let choices;
					if (q.mathematical) {
						choices =
							Array.isArray(q.choices) && q.choices.length > 0
								? q.choices.map((c) => (typeof c === 'string' ? c : '').replace(/\\\\/g, '\\'))
								: ['', '', '', ''];
						while (choices.length < 4) choices.push('');
					} else {
						choices = Array.isArray(q.choices) ? q.choices : ['', '', '', ''];
						while (choices.length < 4) choices.push('');
					}
					return {
						id: idx + 1,
						title: q.title || '',
						choices,
						choiceImages: new Array(choices.length).fill(null),
						choiceImagePreviews: new Array(choices.length).fill(null),
						choiceImageUrls: new Array(choices.length).fill(''),
						correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
						mathematical: !!q.mathematical,
						identification: !!q.identification,
						randomChoices: !!q.randomChoices,
						hasChoiceImages: !!q.hasChoiceImages,
						showChoiceImages: !!q.hasChoiceImages,
						question_image: null,
						question_image_preview: null,
						question_image_url: '',
						sectionKey: null
					};
				});
				setSections([]);
				setQuestions(mappedQuestions);
			} catch {
				setImportError('Failed to parse JSON.');
			}
		};
		reader.readAsText(file);
	};

	const handleInputChange = (id, field, value) => {
		setQuestions((qs) =>
			qs.map((q) => {
				if (q.id !== id) return q;
				const next = { ...q, [field]: value };
				// Choice images only apply to standard multiple-choice rows.
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

	const removeQuestion = (questionID) => {
		setQuestions((qs) => qs.filter((q) => q.id !== questionID));
	};

	const removeChoice = (id, index) => {
		setQuestions((qs) =>
			qs.map((q) =>
				q.id === id
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

	const addChoice = (id) => {
		setQuestions((qs) =>
			qs.map((q) =>
				q.id === id
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

	const handleChoicesChange = (id, index, value) => {
		setQuestions((qs) =>
			qs.map((q) =>
				q.id === id ? { ...q, choices: q.choices.map((c, i) => (i === index ? value : c)) } : q
			)
		);
	};

	const addQuestion = (sectionKey = null) => {
		const key =
			sectionKey ?? (sections.length > 0 ? sections[sections.length - 1].clientKey : null);
		setQuestions((qs) => [...qs, getDefaultQuestion(qs.length + 1, randomQuestionChoices, key)]);
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
		setQuizImagePreview(resolveQuizImageSrc(trimmed) || trimmed || null);
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
								(q.choiceImageUrls || []).some((u, i) => i !== choiceIndex && u)
						}
					: q
			)
		);
	};

	const handleCreateQuiz = async (e) => {
		e.preventDefault();
		try {
			setCreating(true);
			const formData = new FormData();
			formData.append('quiz_title', quizTitle);
			formData.append('public', false);
			formData.append('randomQuestions', randomQuestionOrder);
			formData.append('tag_color', selectedColor);
			formData.append('quizType', quizType);
			if (quizImage) formData.append('quiz_image', quizImage);
			else if (quizImageUrl) formData.append('quiz_image_url', quizImageUrl);

			questions.forEach((question, qi) => {
				formData.append(`questions[${qi}][title]`, question.title);
				formData.append(`questions[${qi}][correctAnswerIndex]`, question.correctAnswerIndex);
				formData.append(`questions[${qi}][randomChoices]`, question.randomChoices);
				formData.append(`questions[${qi}][identification]`, question.identification);
				formData.append(`questions[${qi}][mathematical]`, question.mathematical);
				const choiceUrls = question.choiceImageUrls || [];
				const hasChoiceImages =
					!!question.hasChoiceImages ||
					question.choiceImages.some(Boolean) ||
					choiceUrls.some(Boolean);
				formData.append(`questions[${qi}][hasChoiceImages]`, hasChoiceImages);
				if (sections.length > 0 && question.sectionKey) {
					const sectionIndex = sections.findIndex((s) => s.clientKey === question.sectionKey);
					if (sectionIndex >= 0) {
						formData.append(`questions[${qi}][section_index]`, sectionIndex);
					}
				}
				question.choices.forEach((choice, ci) => {
					formData.append(`questions[${qi}][choices][${ci}]`, choice);
				});
				if (question.question_image) {
					formData.append(`questions[${qi}][question_image]`, question.question_image);
				} else if (question.question_image_url) {
					formData.append(`questions[${qi}][question_image_url]`, question.question_image_url);
				}
				question.choices.forEach((_, ci) => {
					const choiceImage = question.choiceImages?.[ci];
					const choiceUrl = choiceUrls[ci];
					if (choiceImage) {
						formData.append(`questions[${qi}][choice_images][${ci}]`, choiceImage);
					} else if (choiceUrl) {
						formData.append(`questions[${qi}][choice_image_urls][${ci}]`, choiceUrl);
					}
				});
			});

			sections.forEach((section, si) => {
				formData.append(`sections[${si}][title]`, section.title || `Section ${si + 1}`);
				formData.append(`sections[${si}][order]`, section.order ?? si);
			});

			const response = await api.post('/quizzes/quiz/', formData);
			if (response.status === 200 || response.status === 201) {
				const quizId =
					response.data?.quiz?.uuid || response.data?.quiz?.quiz_id || response.data?.uuid;
				await invalidateQuizQueries();
				toast.success('Quiz created!');
				navigate(`/quizzes/${quizId}`);
			}
		} catch {
			toast.error('Failed to create quiz.');
		} finally {
			setCreating(false);
		}
	};

	const MAX_AI_QUESTIONS = 200;
	const AI_BATCH_SIZE = 4;

	const clampQuestionCount = (value) => {
		const parsed = Number.parseInt(String(value), 10);
		if (Number.isNaN(parsed)) return 5;
		return Math.min(MAX_AI_QUESTIONS, Math.max(1, parsed));
	};

	const getGenerateErrorMessage = (error) => {
		const apiError = error?.response?.data?.error || error?.response?.data?.detail;
		if (apiError) return apiError;
		if (error?.response?.status === 403) {
			return 'Ollama Cloud denied access to this model. It may require a paid plan — try another model.';
		}
		if (error?.response?.status === 401) {
			return 'Ollama Cloud rejected your API key. Update it in Settings.';
		}
		if (error?.response?.status === 503) {
			return ollamaMode === 'cloud'
				? 'Cannot reach Ollama Cloud. Check your API key in Settings.'
				: 'Cannot reach Ollama. Start Ollama locally and try again.';
		}
		return 'Failed to generate quiz.';
	};

	const clearReference = () => {
		setReferenceMarkdown('');
		setReferenceMeta(null);
		setReferenceError('');
		setReferencePendingFile(false);
		if (referenceInputRef.current) {
			referenceInputRef.current.value = '';
		}
	};

	const handleReferenceFile = async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setReferencePendingFile(true);
		setReferenceLoading(true);
		setReferenceError('');
		setReferenceMarkdown('');
		setReferenceMeta(null);

		const formData = new FormData();
		formData.append('file', file);

		try {
			const { data } = await api.post('/quizzes/quiz/reference/extract/', formData, {
				timeout: 120_000
			});
			setReferenceMarkdown(data.markdown || '');
			setReferenceMeta({
				filename: data.filename || file.name,
				charCount: data.char_count ?? (data.markdown || '').length,
				truncated: Boolean(data.truncated),
				sourceType: data.source_type || '',
				warnings: Array.isArray(data.warnings) ? data.warnings : []
			});
			if (data.truncated) {
				toast.info('Reference was truncated for model context.');
			} else {
				toast.success('Reference ready for generation.');
			}
		} catch (error) {
			const message =
				error?.response?.data?.error ||
				error?.response?.data?.detail ||
				'Failed to convert reference file.';
			setReferenceError(message);
			toast.error(message);
			if (referenceInputRef.current) {
				referenceInputRef.current.value = '';
			}
		} finally {
			setReferenceLoading(false);
			setReferencePendingFile(false);
		}
	};

	const generateAIQuiz = async () => {
		if (generating) return;
		const trimmedTopic = topic.trim();
		const trimmedReference = referenceMarkdown.trim();
		if (!trimmedTopic && !trimmedReference && !aiTemplateSlug) {
			toast.error('Enter a topic, attach a reference, or pick a base template.');
			return;
		}
		if (!ollamaModel.trim()) {
			toast.error('Select an Ollama model before generating.');
			return;
		}
		if (referenceLoading || referencePendingFile) {
			toast.error('Wait for the reference file to finish converting.');
			return;
		}

		const autoCount = autoQuestionCount;
		const count = autoCount
			? estimateAutoQuestionCount(trimmedTopic, trimmedReference)
			: clampQuestionCount(questionNumber);
		if (!autoCount) {
			setQuestionNumber(count);
		}

		try {
			setGenerating(true);
			const batchCount = Math.max(1, Math.ceil(count / AI_BATCH_SIZE));
			const body = {
				topic: trimmedTopic,
				model: ollamaModel.trim(),
				typeMix: aiTypeMix,
				randomChoices: randomQuestionChoices
			};
			if (autoCount) {
				body.autoQuestionCount = true;
			} else {
				body.questionNumber = count;
			}
			if (trimmedReference) {
				body.referenceMarkdown = referenceMarkdown;
			}
			if (aiTemplateSlug) {
				body.templateSlug = aiTemplateSlug;
			}
			const response = await api.post('/quizzes/quiz/generate/', body, {
				// Small batches + retries; allow ~6 minutes per batch of ~4.
				timeout: Math.max(300_000, batchCount * 6 * 60 * 1000)
			});
			const questionsPayload = response.data?.quiz_data?.questions;
			if (!Array.isArray(questionsPayload) || questionsPayload.length === 0) {
				toast.error('Ollama returned an empty quiz. Try again with a different topic.');
				return;
			}

			const resolvedCount =
				typeof response.data?.questionNumber === 'number'
					? response.data.questionNumber
					: questionsPayload.length;
			if (autoCount) {
				setQuestionNumber(clampQuestionCount(resolvedCount));
			}
			const warning = response.data?.warning;
			if (warning) {
				toast.info(warning);
			} else {
				toast.success(
					response.data?.autoQuestionCount
						? `Auto-generated ${questionsPayload.length} questions — review to accept.`
						: `Generated ${questionsPayload.length} questions — review to accept.`
				);
			}
			setAiOpen(false);
			aiProposal.runGenerateAsProposal(response.data.quiz_data, {
				instructionText: trimmedTopic ? `Generate: ${trimmedTopic}` : 'Generate from reference'
			});
		} catch (error) {
			toast.error(getGenerateErrorMessage(error));
		} finally {
			setGenerating(false);
		}
	};

	return (
		<div className={cn('pb-20', reviewing ? 'lg:pb-24' : 'lg:pb-0')}>
			<PageHeader
				title="Create Quiz"
				icon={ListChecks}
				description={`${authoringQuestions.length} question${authoringQuestions.length === 1 ? '' : 's'}${
					reviewing ? ' · reviewing AI' : ''
				}`}
				actions={
					<div className="flex items-center gap-1.5 sm:gap-2">
						<input
							type="file"
							accept="application/json"
							ref={fileInputRef}
							onChange={handleImportQuiz}
							className="hidden"
						/>
						<Button
							variant="ghost"
							size="icon"
							className="cursor-pointer"
							aria-label="Quiz templates"
							title="Quiz templates"
							disabled={reviewing}
							onClick={() => {
								setTemplatesOpen(true);
								if (templates.length === 0) loadTemplateCatalog();
							}}
						>
							<LayoutTemplate size={16} />
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
							aria-label="AI quiz generation"
							title="AI quiz generation"
							disabled={reviewing || aiProposal.isLoading}
							onClick={() => setAiOpen(true)}
						>
							<Sparkles size={16} />
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
							variant="secondary"
							size="sm"
							className="cursor-pointer"
							disabled={reviewing}
							onClick={() => {
								fileInputRef.current.value = '';
								fileInputRef.current.click();
							}}
						>
							<Import size={14} /> Import
						</Button>
						<Button
							size="sm"
							className="cursor-pointer"
							loading={creating}
							disabled={reviewing}
							title={reviewing ? 'Accept or reject AI changes first' : undefined}
							onClick={handleCreateQuiz}
						>
							Create
						</Button>
					</div>
				}
			/>
			{importError && <p className="text-danger mb-3 text-xs">{importError}</p>}

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
														onChange={(e) => handleQuestionImageUpload(question.id, e)}
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
																	value={question.choices[0]}
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
																		className={cn(
																			'flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition',
																			question.correctAnswerIndex === ci
																				? 'border-primary bg-primary'
																				: 'border-line bg-surface'
																		)}
																		onClick={() =>
																			handleInputChange(question.id, 'correctAnswerIndex', ci)
																		}
																		disabled={reviewing}
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
																			onUrlChange={(url) => setChoiceImageUrl(question.id, ci, url)}
																			onPreview={openImagePreview}
																			onChange={(e) => handleChoiceImageUpload(question.id, ci, e)}
																			onClear={() => removeChoiceImage(question.id, ci)}
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

			{/* Mobile sticky create */}
			{!reviewing && (
				<div className="border-line bg-bg/95 fixed inset-x-0 bottom-0 z-20 border-t p-3 backdrop-blur lg:hidden">
					<Button className="w-full cursor-pointer" loading={creating} onClick={handleCreateQuiz}>
						Create quiz
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
				initialModel={ollamaModel}
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
						loading={creating}
						onClick={handleCreateQuiz}
					>
						Create quiz
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
						onClear={() => {
							setQuizImage(null);
							setQuizImageUrl('');
							setQuizImagePreview(null);
						}}
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
				open={aiOpen}
				onClose={() => setAiOpen(false)}
				title="AI quiz generation"
				size="md"
				footer={
					<Button
						variant="secondary"
						className="w-full cursor-pointer sm:w-auto"
						loading={generating}
						disabled={
							(!topic.trim() && !referenceMarkdown.trim() && !aiTemplateSlug) ||
							!ollamaModel.trim() ||
							generating ||
							modelsLoading ||
							referenceLoading ||
							referencePendingFile
						}
						onClick={generateAIQuiz}
					>
						{generating || modelsLoading ? (
							'Generating'
						) : (
							<>
								<Sparkles size={13} /> Generate
							</>
						)}
					</Button>
				}
			>
				<div className="space-y-2.5">
					<div className="flex items-center gap-2">
						<Badge tone="primary">Ollama</Badge>
						<Badge tone={ollamaMode === 'cloud' ? 'primary' : 'default'}>
							{ollamaMode === 'cloud' ? 'Cloud' : 'Local'}
						</Badge>
						<span className="text-muted text-xs">
							{ollamaMode === 'cloud'
								? 'Using your Ollama Cloud key from Settings'
								: 'Using server local Ollama'}
						</span>
					</div>
					<Select
						label={ollamaMode === 'cloud' ? 'Model (free tier)' : 'Model'}
						value={ollamaModel}
						disabled={modelsLoading || ollamaModels.length === 0}
						onChange={(e) => setOllamaModel(e.target.value)}
						error={modelsError || undefined}
						className="py-1.5"
					>
						{modelsLoading && <option value="">Loading…</option>}
						{!modelsLoading && ollamaModels.length === 0 && <option value="">No models</option>}
						{ollamaModels.map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</Select>

					<Input
						label={referenceMarkdown.trim() ? 'Topic (optional)' : 'Topic'}
						value={topic}
						onChange={(e) => setTopic(e.target.value)}
						placeholder={
							referenceMarkdown.trim() ? 'Optional focus, e.g. key dates' : 'e.g. World History'
						}
						className="py-1.5"
					/>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<Input
								label="Count"
								type="number"
								min={1}
								max={MAX_AI_QUESTIONS}
								value={
									autoQuestionCount
										? estimateAutoQuestionCount(topic, referenceMarkdown)
										: questionNumber
								}
								onChange={(e) => setQuestionNumber(clampQuestionCount(e.target.value))}
								disabled={autoQuestionCount}
								className={cn('py-1.5', autoQuestionCount && 'cursor-not-allowed opacity-60')}
							/>
							<label className="text-fg flex cursor-pointer items-center gap-2 text-xs">
								<input
									type="checkbox"
									checked={autoQuestionCount}
									onChange={(e) => setAutoQuestionCount(e.target.checked)}
									className="border-line text-primary focus-visible:ring-primary/40 size-3.5 rounded accent-[var(--primary)]"
								/>
								Auto (from topic / reference)
							</label>
						</div>
						<Select
							label="Mix"
							value={aiTypeMix}
							onChange={(e) => setAiTypeMix(e.target.value)}
							className="py-1.5"
						>
							{AI_TYPE_MIX_OPTIONS.map(({ value, label }) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</Select>
					</div>
					<Select
						label="Base template (optional)"
						value={aiTemplateSlug}
						onChange={(e) => setAiTemplateSlug(e.target.value)}
						className="py-1.5"
						onFocus={() => {
							if (templates.length === 0) loadTemplateCatalog();
						}}
					>
						<option value="">None</option>
						{templates.map((t) => (
							<option key={t.slug} value={t.slug}>
								{t.title}
							</option>
						))}
					</Select>
					{autoQuestionCount && (
						<p className="text-muted text-[0.65rem]">
							Auto sizes count from the reference (or topic). Preview:{' '}
							{estimateAutoQuestionCount(topic, referenceMarkdown)}.
						</p>
					)}

					<div className="space-y-1.5">
						<label className="text-fg text-xs font-medium">Reference (optional)</label>
						<label className="border-line hover:border-primary/40 text-muted flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-2.5 py-2 text-xs transition">
							<input
								type="file"
								accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
								ref={referenceInputRef}
								onChange={handleReferenceFile}
								className="hidden"
							/>
							<FileUp size={13} />
							<span className="truncate">{referenceMeta?.filename || 'TXT / MD / PDF'}</span>
						</label>
						{referenceLoading && <p className="text-muted text-[0.65rem]">Converting…</p>}
						{referenceError && <p className="text-danger text-[0.65rem]">{referenceError}</p>}
						{referenceMeta && !referenceLoading && (
							<div className="flex flex-wrap items-center gap-1.5 text-[0.65rem]">
								<span className="text-muted">{referenceMeta.charCount.toLocaleString()} chars</span>
								{referenceMeta.truncated && <Badge tone="warning">Truncated</Badge>}
								<button
									type="button"
									className="text-primary cursor-pointer hover:underline"
									onClick={clearReference}
								>
									Clear
								</button>
							</div>
						)}
					</div>
				</div>
			</Modal>

			<Modal
				open={templatesOpen}
				onClose={() => setTemplatesOpen(false)}
				title="Quiz templates"
				size="lg"
			>
				<div className="space-y-3">
					<p className="text-muted text-xs">
						Load a global template into this draft. You can edit questions and image URLs before
						creating.
					</p>
					{templatesLoading && <p className="text-muted text-sm">Loading templates…</p>}
					{!templatesLoading && templates.length === 0 && (
						<p className="text-muted text-sm">No templates found. Run seed_quiz_templates.</p>
					)}
					<div className="grid max-h-[min(60vh,28rem)] gap-2 overflow-y-auto sm:grid-cols-2">
						{templates.map((t) => (
							<button
								key={t.slug}
								type="button"
								disabled={!!templateLoadingSlug}
								onClick={() => applyTemplate(t.slug)}
								className="border-line bg-surface hover:border-primary/40 flex cursor-pointer flex-col items-start gap-1 rounded-md border p-3 text-left transition disabled:opacity-60"
							>
								<span className="text-fg flex items-center gap-2 text-sm font-semibold">
									{t.tag_color && (
										<span
											className="inline-block h-2.5 w-2.5 rounded-full"
											style={{ backgroundColor: t.tag_color }}
											aria-hidden
										/>
									)}
									{t.title}
								</span>
								<span className="text-muted text-[0.7rem] capitalize">
									{String(t.topic || '').replace(/_/g, ' ')} · {t.question_count ?? 0} questions
								</span>
								{t.description && (
									<span className="text-muted line-clamp-2 text-[0.65rem]">{t.description}</span>
								)}
								{templateLoadingSlug === t.slug && (
									<span className="text-primary text-[0.65rem]">Loading…</span>
								)}
							</button>
						))}
					</div>
				</div>
			</Modal>

			<Modal
				open={Boolean(imagePreview)}
				onClose={closeImagePreview}
				title={imagePreview?.title || 'Image preview'}
				size="xl"
				bodyClassName="flex h-[min(70vh,calc(100dvh-8rem))] max-h-[min(70vh,calc(100dvh-8rem))] items-center justify-center overflow-hidden p-3"
			>
				{imagePreview?.src && (
					<img
						src={imagePreview.src}
						alt={imagePreview.title || 'Preview'}
						className="max-h-full max-w-full rounded-md object-contain"
					/>
				)}
			</Modal>
		</div>
	);
}
