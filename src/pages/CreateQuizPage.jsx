import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, X, Import, ListChecks, Sparkles } from 'lucide-react';

import { api } from '../lib/api';
import { invalidateQuizQueries } from '../lib/resources';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, Card, CardBody, CardHeader, Input, Select } from '../components/ui';
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
	{ value: 'mostly_mc', label: 'Mostly multiple choice' },
	{ value: 'balanced', label: 'Balanced (50/50)' },
	{ value: 'mostly_identification', label: 'Mostly identification' }
];

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
		question_image: null,
		question_image_preview: null
	};
}

export default function CreateQuizPage() {
	const navigate = useNavigate();
	const [topic, setTopic] = useState('');
	const [questionNumber, setQuestionNumber] = useState(5);
	const [aiTypeMix, setAiTypeMix] = useState('balanced');
	const [ollamaModels, setOllamaModels] = useState([]);
	const [ollamaModel, setOllamaModel] = useState('');
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

	useEffect(() => {
		let cancelled = false;

		(async () => {
			setModelsLoading(true);
			setModelsError('');
			try {
				const { data } = await api.get('/quizzes/quiz/ollama/models/');
				if (cancelled) return;
				const models = Array.isArray(data?.models) ? data.models : [];
				setOllamaModels(models);
				const preferred =
					(data?.default && models.includes(data.default) && data.default) ||
					models[0] ||
					data?.default ||
					'';
				setOllamaModel(preferred);
				if (models.length === 0) {
					setModelsError(
						'No Ollama models found. Pull a model locally (e.g. ollama pull llama3.1:8b).'
					);
				}
			} catch (error) {
				if (cancelled) return;
				const message =
					error?.response?.data?.error ||
					'Cannot reach Ollama to list models. Start Ollama and refresh.';
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
		setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
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

	const MAX_AI_QUESTIONS = 100;
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
			question_image: null,
			question_image_preview: null
		};
	};

	const getGenerateErrorMessage = (error) => {
		const apiError = error?.response?.data?.error || error?.response?.data?.detail;
		if (apiError) return apiError;
		if (error?.response?.status === 503) {
			return 'Cannot reach Ollama. Start Ollama locally and try again.';
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
		const trimmedTopic = topic.trim();
		if (!trimmedTopic) {
			toast.error('Enter a topic before generating.');
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

		const count = clampQuestionCount(questionNumber);
		setQuestionNumber(count);

		try {
			setGenerating(true);
			const batchCount = Math.max(1, Math.ceil(count / AI_BATCH_SIZE));
			const body = {
				topic: trimmedTopic,
				questionNumber: count,
				model: ollamaModel.trim(),
				typeMix: aiTypeMix,
				randomChoices: randomQuestionChoices
			};
			if (referenceMarkdown.trim()) {
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
			const warning = response.data?.warning;
			if (warning) {
				toast.info(warning);
			} else {
				toast.success(`Generated ${questionsPayload.length} questions with Ollama.`);
			}
		} catch (error) {
			toast.error(getGenerateErrorMessage(error));
		} finally {
			setGenerating(false);
		}
	};

	return (
		<div>
			<PageHeader
				title="Create Quiz"
				icon={ListChecks}
				description="Build a new quiz with custom questions."
			/>

			<div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
				<div className="flex flex-1 flex-col gap-4">
					<div className="flex items-center gap-3">
						<input
							type="file"
							accept="application/json"
							ref={fileInputRef}
							onChange={handleImportQuiz}
							className="hidden"
						/>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								fileInputRef.current.value = '';
								fileInputRef.current.click();
							}}
						>
							<Import size={14} /> Import JSON
						</Button>
						{importError && <span className="text-danger text-xs">{importError}</span>}
					</div>

					{questions.map((question, index) => (
						<Card key={question.id}>
							<CardHeader
								title={`Question ${index + 1}`}
								action={
									<Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}>
										<X size={16} />
									</Button>
								}
							/>
							<CardBody className="space-y-4">
								<Input
									value={question.title}
									onChange={(e) => handleInputChange(question.id, 'title', e.target.value)}
									placeholder="Enter your question"
								/>

								{question.question_image_preview ? (
									<div className="relative">
										<img
											src={question.question_image_preview}
											alt="Question"
											className="h-36 w-full rounded-md object-cover"
										/>
										<button
											onClick={() =>
												setQuestions((qs) =>
													qs.map((q) =>
														q.id === question.id
															? { ...q, question_image: null, question_image_preview: null }
															: q
													)
												)
											}
											className="bg-danger absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-white"
										>
											<X size={12} />
										</button>
									</div>
								) : (
									<label className="border-line hover:border-primary/40 flex h-20 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed transition">
										<input
											type="file"
											accept="image/*"
											onChange={(e) => handleQuestionImageUpload(question.id, e)}
											className="hidden"
										/>
										<div className="text-muted flex flex-col items-center text-xs">
											<Plus size={16} />
											<span>Add Image</span>
										</div>
									</label>
								)}

								<div className="flex flex-wrap gap-2">
									{[
										{ key: 'mathematical', label: 'Mathematical' },
										{ key: 'identification', label: 'Identification' }
									].map(({ key, label }) => (
										<button
											key={key}
											type="button"
											className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
												question[key]
													? 'bg-primary text-primary-fg'
													: 'bg-surface-2 text-fg hover:bg-line'
											}`}
											onClick={() => handleInputChange(question.id, key, !question[key])}
										>
											<Check size={12} className={question[key] ? '' : 'opacity-0'} />
											{label}
										</button>
									))}
								</div>

								<div className="space-y-2">
									{question.mathematical ? (
										<MathInput
											handleChoicesChange={handleChoicesChange}
											handleInputChange={handleInputChange}
											question={question}
											removeChoice={removeChoice}
										/>
									) : question.identification ? (
										<div className="flex items-center gap-3">
											<button
												type="button"
												className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${question.correctAnswerIndex === 0 ? 'border-primary bg-primary' : 'border-line bg-surface'}`}
												onClick={() => handleInputChange(question.id, 'correctAnswerIndex', 0)}
											>
												{question.correctAnswerIndex === 0 && (
													<Check size={12} className="text-primary-fg" />
												)}
											</button>
											<input
												type="text"
												value={question.choices[0]}
												onChange={(e) => handleChoicesChange(question.id, 0, e.target.value)}
												placeholder="Answer"
												className="border-line bg-surface text-fg focus:border-primary flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
												required
											/>
										</div>
									) : (
										question.choices.map((choice, ci) => (
											<div className="flex items-center gap-3" key={ci}>
												<button
													type="button"
													className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${question.correctAnswerIndex === ci ? 'border-primary bg-primary' : 'border-line bg-surface'}`}
													onClick={() => handleInputChange(question.id, 'correctAnswerIndex', ci)}
												>
													{question.correctAnswerIndex === ci && (
														<Check size={12} className="text-primary-fg" />
													)}
												</button>
												<input
													type="text"
													value={choice}
													onChange={(e) => handleChoicesChange(question.id, ci, e.target.value)}
													placeholder={`Choice ${ci + 1}`}
													className="border-line bg-surface text-fg focus:border-primary flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
													required
												/>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => removeChoice(question.id, ci)}
												>
													<X size={14} className="text-danger" />
												</Button>
												<div className="w-20">
													{question.choiceImagePreviews[ci] ? (
														<div className="relative">
															<img
																src={question.choiceImagePreviews[ci]}
																alt=""
																className="h-10 w-full rounded object-cover"
															/>
															<button
																onClick={() => removeChoiceImage(question.id, ci)}
																className="bg-danger absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white"
															>
																<X size={8} />
															</button>
														</div>
													) : (
														<label className="border-line hover:border-primary/40 flex h-10 w-full cursor-pointer items-center justify-center rounded border-2 border-dashed text-xs transition">
															<input
																type="file"
																accept="image/*"
																onChange={(e) => handleChoiceImageUpload(question.id, ci, e)}
																className="hidden"
															/>
															<Plus size={12} className="text-muted" />
														</label>
													)}
												</div>
											</div>
										))
									)}
								</div>

								{!question.identification && (
									<Button
										variant="secondary"
										size="sm"
										className="w-full"
										onClick={() => addChoice(question.id)}
									>
										<Plus size={14} /> Add Choice
									</Button>
								)}
							</CardBody>
						</Card>
					))}

					<Button variant="secondary" className="w-full" onClick={addQuestion}>
						<Plus size={16} /> Add Question
					</Button>
				</div>

				<div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
					<Card>
						<CardHeader title="Quiz Settings" />
						<CardBody className="space-y-4">
							<Input
								label="Quiz Title"
								value={quizTitle}
								onChange={(e) => setQuizTitle(e.target.value)}
							/>

							{quizImagePreview ? (
								<div className="relative">
									<img
										src={quizImagePreview}
										alt="Quiz"
										className="h-28 w-full rounded-md object-cover"
									/>
									<button
										onClick={() => {
											setQuizImage(null);
											setQuizImagePreview(null);
										}}
										className="bg-danger absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-white"
									>
										<X size={12} />
									</button>
								</div>
							) : (
								<label className="border-line hover:border-primary/40 flex h-20 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed transition">
									<input
										type="file"
										accept="image/*"
										onChange={handleQuizImageUpload}
										className="hidden"
									/>
									<div className="text-muted flex flex-col items-center text-xs">
										<Plus size={16} />
										<span>Quiz Image</span>
									</div>
								</label>
							)}

							<Button className="w-full" loading={creating} onClick={handleCreateQuiz}>
								Create Quiz
							</Button>
						</CardBody>
					</Card>

					<Card>
						<CardHeader title="AI Generate (Ollama)" />
						<CardBody className="space-y-3">
							<p className="text-muted text-xs">
								Generate draft questions locally with any model installed in Ollama. Requests over 8
								questions are batched automatically (max 100). Prefer llama3.1:8b for speed; run
								ollama run MODEL once first to warm the model before large generates.
							</p>
							<Select
								label="Model"
								value={ollamaModel}
								disabled={modelsLoading || ollamaModels.length === 0}
								onChange={(e) => setOllamaModel(e.target.value)}
								error={modelsError || undefined}
							>
								{modelsLoading && <option value="">Loading models…</option>}
								{!modelsLoading && ollamaModels.length === 0 && (
									<option value="">No models available</option>
								)}
								{ollamaModels.map((name) => (
									<option key={name} value={name}>
										{name}
									</option>
								))}
							</Select>
							<Input
								label="Topic"
								value={topic}
								onChange={(e) => setTopic(e.target.value)}
								placeholder="e.g., World History"
							/>
							<Input
								label="Questions"
								type="number"
								min={1}
								max={MAX_AI_QUESTIONS}
								value={questionNumber}
								onChange={(e) => setQuestionNumber(clampQuestionCount(e.target.value))}
							/>
							<Select
								label="Question mix"
								value={aiTypeMix}
								onChange={(e) => setAiTypeMix(e.target.value)}
							>
								{AI_TYPE_MIX_OPTIONS.map(({ value, label }) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</Select>
							<p className="text-muted text-xs">
								Math questions are added only when the topic is math-related (50/50 math split).
								Uses Options above for randomize questions/choices. Text only — add images after
								generate.
							</p>
							<div className="space-y-2">
								<label className="text-foreground text-sm font-medium">
									Reference file (optional)
								</label>
								<input
									type="file"
									accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
									ref={referenceInputRef}
									onChange={handleReferenceFile}
									className="text-muted file:bg-secondary file:text-foreground block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-medium"
								/>
								<p className="text-muted text-xs">
									PDF/TXT/MD is converted to Markdown for the model; not saved on the server.
								</p>
								{referenceLoading && <p className="text-muted text-xs">Converting reference…</p>}
								{referenceError && <p className="text-danger text-xs">{referenceError}</p>}
								{referenceMeta && !referenceLoading && (
									<div className="flex flex-wrap items-center gap-2 text-xs">
										<span className="text-foreground">
											{referenceMeta.filename} · {referenceMeta.charCount.toLocaleString()} chars
										</span>
										{referenceMeta.truncated && (
											<span className="rounded bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">
												Truncated
											</span>
										)}
										<Button type="button" variant="ghost" size="sm" onClick={clearReference}>
											Clear
										</Button>
									</div>
								)}
							</div>
							<Button
								variant="secondary"
								className="w-full"
								loading={generating}
								disabled={
									!topic.trim() ||
									!ollamaModel.trim() ||
									generating ||
									modelsLoading ||
									referenceLoading ||
									referencePendingFile
								}
								onClick={generateAIQuiz}
							>
								<Sparkles size={14} /> Generate with Ollama
							</Button>
						</CardBody>
					</Card>

					<Card>
						<CardHeader title="Options" />
						<CardBody className="space-y-3">
							{[
								{
									label: 'Randomize Questions',
									value: randomQuestionOrder,
									toggle: () => setRandomQuestionOrder(!randomQuestionOrder)
								},
								{
									label: 'Randomize Choices',
									value: randomQuestionChoices,
									toggle: () => {
										setRandomQuestionChoices(!randomQuestionChoices);
										setQuestions((qs) =>
											qs.map((q) => ({ ...q, randomChoices: !randomQuestionChoices }))
										);
									}
								}
							].map(({ label, value, toggle }) => (
								<button
									key={label}
									type="button"
									className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition ${value ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-fg hover:bg-line'}`}
									onClick={toggle}
								>
									<Check size={12} className={value ? '' : 'opacity-0'} />
									{label}
								</button>
							))}
						</CardBody>
					</Card>

					<Card>
						<CardHeader title="Quiz Type" />
						<CardBody>
							<div className="flex gap-2">
								{['list', 'flashcard'].map((t) => (
									<button
										key={t}
										type="button"
										className={`flex-1 rounded-md px-3 py-2 text-xs font-medium capitalize transition ${quizType === t ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-fg hover:bg-line'}`}
										onClick={() => setQuizType(t)}
									>
										{t}
									</button>
								))}
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardHeader title="Tag Color" />
						<CardBody>
							<div className="grid grid-cols-5 gap-2">
								{colors.map((color) => (
									<button
										key={color.hex}
										type="button"
										onClick={() => setSelectedColor(color.hex)}
										className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 transition ${selectedColor === color.hex ? 'border-primary ring-primary/30 ring-2' : 'border-line'}`}
										style={{ backgroundColor: color.hex }}
									/>
								))}
							</div>
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);
}
