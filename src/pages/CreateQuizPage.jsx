import { useState, useRef, useEffect } from 'react';
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
	Image as ImageIcon
} from 'lucide-react';

import { api } from '../lib/api';
import { cn } from '../lib/format';
import { invalidateQuizQueries } from '../lib/resources';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, Button, Card, CardBody, CardHeader, Input, Modal, Select } from '../components/ui';
import MathInput from '../components/quiz/MathInput';

const colors = [
	{ name: 'Red', hex: '#EF4444' },
	{ name: 'Green', hex: '#10B981' },
	{ name: 'Blue', hex: '#3B82F6' },
	{ name: 'Yellow', hex: '#FACC15' },
	{ name: 'Purple', hex: '#A855F7' },
	{ name: 'Orange', hex: '#F97316' },
	{ name: 'Teal', hex: '#14B8A6' },
	{ name: 'Pink', hex: '#EC4899' },
	{ name: 'Indigo', hex: '#6366F1' },
	{ name: 'Lime', hex: '#84CC16' },
	{ name: 'Cyan', hex: '#06B6D4' },
	{ name: 'Amber', hex: '#F59E0B' },
	{ name: 'Rose', hex: '#F43F5E' },
	{ name: 'Sky', hex: '#0EA5E9' },
	{ name: 'Emerald', hex: '#50C878' }
];

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

function getDefaultQuestion(id, randomChoices = false) {
	return {
		id,
		title: '',
		choices: ['', '', '', ''],
		choiceImages: [null, null, null, null],
		choiceImagePreviews: [null, null, null, null],
		correctAnswerIndex: 0,
		mathematical: false,
		identification: false,
		randomChoices,
		hasChoiceImages: false,
		showChoiceImages: false,
		question_image: null,
		question_image_preview: null
	};
}

function ToggleChip({ active, onClick, children, className }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={cn(
				'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.7rem] font-medium whitespace-nowrap transition',
				'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
				active
					? 'border-primary/40 bg-primary/12 text-primary shadow-primary/10 shadow-sm'
					: 'border-line bg-surface text-muted hover:border-primary/25 hover:bg-surface-2 hover:text-fg',
				className
			)}
		>
			<span
				aria-hidden
				className={cn(
					'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition',
					active ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-transparent'
				)}
			>
				{active && <Check size={9} strokeWidth={3} />}
			</span>
			{children}
		</button>
	);
}

function ImageDropzone({ preview, onClear, onChange, onPreview, label, compact = false }) {
	if (preview) {
		return (
			<div className="relative">
				<button
					type="button"
					onClick={() => onPreview?.(preview, label || 'Image preview')}
					className="block w-full cursor-pointer overflow-hidden rounded-md text-left"
					aria-label={`Preview ${label || 'image'}`}
				>
					<img
						src={preview}
						alt=""
						className={cn(
							'w-full object-cover transition hover:opacity-90',
							compact ? 'h-16' : 'h-24'
						)}
					/>
				</button>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onClear?.();
					}}
					aria-label="Remove image"
					className="bg-danger absolute top-1 right-1 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-white"
				>
					<X size={11} />
				</button>
			</div>
		);
	}

	return (
		<label
			className={cn(
				'border-line hover:border-primary/40 text-muted flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-xs transition',
				compact ? 'h-12 gap-0.5' : 'h-16 gap-1'
			)}
		>
			<input type="file" accept="image/*" onChange={onChange} className="hidden" />
			<Plus size={compact ? 14 : 16} />
			<span>{label}</span>
		</label>
	);
}

/** Compact choice image control: icon button empty, tiny thumb when set. */
function ChoiceImageControl({ preview, onChange, onClear, onPreview }) {
	if (preview) {
		return (
			<div className="relative shrink-0">
				<button
					type="button"
					onClick={() => onPreview?.(preview, 'Choice image')}
					className="block cursor-pointer overflow-hidden rounded"
					aria-label="Preview choice image"
				>
					<img src={preview} alt="" className="h-7 w-7 object-cover transition hover:opacity-90" />
				</button>
				<button
					type="button"
					aria-label="Remove choice image"
					onClick={(e) => {
						e.stopPropagation();
						onClear?.();
					}}
					className="bg-danger absolute -top-1 -right-1 z-10 flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full text-white"
				>
					<X size={7} />
				</button>
			</div>
		);
	}

	return (
		<label
			className="text-muted hover:bg-surface-2 hover:text-fg flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition"
			title="Add image"
		>
			<input type="file" accept="image/*" onChange={onChange} className="hidden" />
			<ImageIcon size={14} />
		</label>
	);
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

	const openImagePreview = (src, title = 'Image preview') => {
		if (!src) return;
		setImagePreview({ src, title });
	};

	const closeImagePreview = () => setImagePreview(null);

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
						correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
						mathematical: !!q.mathematical,
						identification: !!q.identification,
						randomChoices: !!q.randomChoices,
						hasChoiceImages: !!q.hasChoiceImages,
						showChoiceImages: !!q.hasChoiceImages,
						question_image: null,
						question_image_preview: null
					};
				});
				setQuestions(mappedQuestions);
			} catch (err) {
				setImportError('Failed to parse JSON: ' + err.message);
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
					choiceImagePreviews: q.choiceImagePreviews.map(() => null)
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
							choiceImagePreviews: q.choiceImagePreviews.filter((_, i) => i !== index)
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
							choiceImagePreviews: [...q.choiceImagePreviews, null]
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

	const addQuestion = () => {
		setQuestions((qs) => [...qs, getDefaultQuestion(qs.length + 1, randomQuestionChoices)]);
	};

	const handleQuizImageUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			setQuizImage(file);
			const reader = new FileReader();
			reader.onload = (e) => setQuizImagePreview(e.target.result);
			reader.readAsDataURL(file);
		}
	};

	const handleQuestionImageUpload = (questionId, event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setQuestions((qs) =>
					qs.map((q) =>
						q.id === questionId
							? { ...q, question_image: file, question_image_preview: e.target.result }
							: q
					)
				);
			};
			reader.readAsDataURL(file);
		}
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
									hasChoiceImages: true
								}
							: q
					)
				);
			};
			reader.readAsDataURL(file);
		}
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
							hasChoiceImages: q.choiceImages.some((img, i) => i !== choiceIndex && img !== null)
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

			questions.forEach((question, qi) => {
				formData.append(`questions[${qi}][title]`, question.title);
				formData.append(`questions[${qi}][correctAnswerIndex]`, question.correctAnswerIndex);
				formData.append(`questions[${qi}][randomChoices]`, question.randomChoices);
				formData.append(`questions[${qi}][identification]`, question.identification);
				formData.append(`questions[${qi}][mathematical]`, question.mathematical);
				formData.append(`questions[${qi}][hasChoiceImages]`, question.hasChoiceImages);
				question.choices.forEach((choice, ci) => {
					formData.append(`questions[${qi}][choices][${ci}]`, choice);
				});
				if (question.question_image) {
					formData.append(`questions[${qi}][question_image]`, question.question_image);
				}
				question.choiceImages.forEach((choiceImage, ci) => {
					if (choiceImage) formData.append(`questions[${qi}][choice_images][${ci}]`, choiceImage);
				});
			});

			const response = await api.post('/quizzes/quiz/', formData);
			if (response.status === 200 || response.status === 201) {
				const quizId =
					response.data?.quiz?.uuid || response.data?.quiz?.quiz_id || response.data?.uuid;
				await invalidateQuizQueries();
				toast.success('Quiz created!');
				navigate(`/quizzes/${quizId}`);
			}
		} catch (err) {
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

	const mapAiQuestion = (question, index) => {
		const identification = !!question?.identification;
		const rawChoices = Array.isArray(question?.choices) ? question.choices : [];
		let choices = rawChoices.map((choice) => String(choice));
		let correctAnswerIndex =
			typeof question?.correctAnswerIndex === 'number' ? question.correctAnswerIndex : 0;

		if (identification) {
			const answer = choices[correctAnswerIndex] ?? question?.correctAnswer ?? choices[0] ?? '';
			choices = [String(answer)];
			correctAnswerIndex = 0;
		} else {
			if (choices.length === 0) choices = ['', '', '', ''];
			while (choices.length < 4) choices.push('');
			choices = choices.slice(0, 4);
			correctAnswerIndex = Math.max(0, Math.min(correctAnswerIndex, choices.length - 1));
		}

		return {
			id: index + 1,
			title: question?.title || '',
			choices,
			choiceImages: new Array(choices.length).fill(null),
			choiceImagePreviews: new Array(choices.length).fill(null),
			correctAnswerIndex,
			mathematical: !!question?.mathematical,
			identification,
			randomChoices: question?.randomChoices ?? randomQuestionChoices,
			hasChoiceImages: false,
			showChoiceImages: false,
			question_image: null,
			question_image_preview: null
		};
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
		if (!trimmedTopic && !trimmedReference) {
			toast.error('Enter a topic or attach a reference file before generating.');
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
			const response = await api.post('/quizzes/quiz/generate/', body, {
				// Small batches + retries; allow ~6 minutes per batch of ~4.
				timeout: Math.max(300_000, batchCount * 6 * 60 * 1000)
			});
			const questionsPayload = response.data?.quiz_data?.questions;
			if (!Array.isArray(questionsPayload) || questionsPayload.length === 0) {
				toast.error('Ollama returned an empty quiz. Try again with a different topic.');
				return;
			}

			setQuestions(questionsPayload.map(mapAiQuestion));
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
						? `Auto-generated ${questionsPayload.length} questions with Ollama.`
						: `Generated ${questionsPayload.length} questions with Ollama.`
				);
			}
			setAiOpen(false);
		} catch (error) {
			toast.error(getGenerateErrorMessage(error));
		} finally {
			setGenerating(false);
		}
	};

	return (
		<div className="pb-20 lg:pb-0">
			<PageHeader
				title="Create Quiz"
				icon={ListChecks}
				description={`${questions.length} question${questions.length === 1 ? '' : 's'}`}
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
							aria-label="Quiz settings"
							title="Quiz settings"
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
							onClick={() => setAiOpen(true)}
						>
							<Sparkles size={16} />
						</Button>
						<Button
							variant="secondary"
							size="sm"
							className="cursor-pointer"
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
							onClick={handleCreateQuiz}
						>
							Create
						</Button>
					</div>
				}
			/>
			{importError && <p className="text-danger mb-3 text-xs">{importError}</p>}

			<div className="flex min-w-0 flex-col gap-3">
				{questions.map((question, index) => (
					<Card key={question.id} className="overflow-hidden">
						<CardHeader
							className="px-4 py-3"
							title={`Q${index + 1}`}
							action={
								<div className="flex items-center gap-1.5">
									<ToggleChip
										active={question.mathematical}
										onClick={() =>
											handleInputChange(question.id, 'mathematical', !question.mathematical)
										}
									>
										Math
									</ToggleChip>
									<ToggleChip
										active={question.identification}
										onClick={() =>
											handleInputChange(question.id, 'identification', !question.identification)
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
								</div>
							}
						/>
						<CardBody className="space-y-3 px-4 pb-4">
							<Input
								value={question.title}
								onChange={(e) => handleInputChange(question.id, 'title', e.target.value)}
								placeholder="Question text"
								className="py-1.5"
							/>

							<ImageDropzone
								preview={question.question_image_preview}
								compact
								label="Question image"
								onPreview={openImagePreview}
								onClear={() =>
									setQuestions((qs) =>
										qs.map((q) =>
											q.id === question.id
												? { ...q, question_image: null, question_image_preview: null }
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
											onClick={() => handleInputChange(question.id, 'correctAnswerIndex', 0)}
										>
											{question.correctAnswerIndex === 0 && (
												<Check size={10} className="text-primary-fg" />
											)}
										</button>
										<input
											type="text"
											value={question.choices[0]}
											onChange={(e) => handleChoicesChange(question.id, 0, e.target.value)}
											placeholder="Answer"
											className="border-line bg-surface text-fg focus:border-primary flex-1 rounded-md border px-2.5 py-1.5 text-sm focus:outline-none"
											required
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
												onClick={() => handleInputChange(question.id, 'correctAnswerIndex', ci)}
											>
												{question.correctAnswerIndex === ci && (
													<Check size={10} className="text-primary-fg" />
												)}
											</button>
											<input
												type="text"
												value={choice}
												onChange={(e) => handleChoicesChange(question.id, ci, e.target.value)}
												placeholder={`Choice ${ci + 1}`}
												className="border-line bg-surface text-fg focus:border-primary min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-sm focus:outline-none"
												required
											/>
											{question.showChoiceImages && (
												<ChoiceImageControl
													preview={question.choiceImagePreviews[ci]}
													onPreview={openImagePreview}
													onChange={(e) => handleChoiceImageUpload(question.id, ci, e)}
													onClear={() => removeChoiceImage(question.id, ci)}
												/>
											)}
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 shrink-0 cursor-pointer"
												aria-label={`Remove choice ${ci + 1}`}
												onClick={() => removeChoice(question.id, ci)}
											>
												<X size={13} className="text-danger" />
											</Button>
										</div>
									))
								)}
							</div>

							{!question.identification && (
								<Button
									variant="ghost"
									size="sm"
									className="w-full"
									onClick={() => addChoice(question.id)}
								>
									<Plus size={13} /> Add choice
								</Button>
							)}
						</CardBody>
					</Card>
				))}

				<Button
					variant="secondary"
					size="sm"
					className="w-full cursor-pointer"
					onClick={addQuestion}
				>
					<Plus size={14} /> Add question
				</Button>
			</div>

			{/* Mobile sticky create */}
			<div className="border-line bg-bg/95 fixed inset-x-0 bottom-0 z-20 border-t p-3 backdrop-blur lg:hidden">
				<Button className="w-full cursor-pointer" loading={creating} onClick={handleCreateQuiz}>
					Create quiz
				</Button>
			</div>

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
						onClear={() => {
							setQuizImage(null);
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
							(!topic.trim() && !referenceMarkdown.trim()) ||
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
