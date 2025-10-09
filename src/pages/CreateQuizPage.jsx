import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import MathInput from '../components/MathInput';
import { Check, Pencil, Plus, X, Import } from 'lucide-react';
import Header from '../components/Header';
import LoadingComponent from '../components/LoadingComponent';

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
	const { createQuiz, setQuizzes, quizzes, generateQuiz } = useContext(AuthContext);
	const navigate = useNavigate();
	const [topic, setTopic] = useState('');
	const [questionNumber, setQuestionNumber] = useState(5);
	const [loading, setLoading] = useState(false);
	const [randomQuestionOrder, setRandomQuestionOrder] = useState(false);
	const [randomQuestionChoices, setRandomQuestionChoices] = useState(false);
	const [view, setView] = useState('list');
	const [quizType, setQuizType] = useState('list');
	const [quizTitle, setQuizTitle] = useState('Quiz Title');
	const [quizTitleInput, setQuizTitleInput] = useState(quizTitle);
	const [editQuizTitle, setEditQuizTitle] = useState(false);
	const [selectedColor, setSelectedColor] = useState(colors[0].hex);
	const [quizImage, setQuizImage] = useState(null);
	const [quizImagePreview, setQuizImagePreview] = useState(null);
	const [questions, setQuestions] = useState([getDefaultQuestion(1)]);
	const [importError, setImportError] = useState('');
	const fileInputRef = useRef(null);

	// --- Import Quiz JSON functionality ---

	/**
	 * Sample JSON for importing a quiz with 4 questions:
	 * - 1. Mathematical Identification
	 * - 2. Mathematical Multiple Choice
	 * - 3. Non-mathematical Identification
	 * - 4. Non-mathematical Multiple Choice
	 *
	 * {
	 *   "quiz_title": "Sample Quiz",
	 *   "tag_color": "#3B82F6",
	 *   "quizType": "list",
	 *   "randomQuestions": false,
	 *   "questions": [
	 *     {
	 *       "title": "What is the derivative of x^2?",
	 *       "choices": ["2x", "x^2", "x", "2"],
	 *       "correctAnswerIndex": 0,
	 *       "mathematical": true,
	 *       "identification": true,
	 *       "randomChoices": false,
	 *       "hasChoiceImages": false
	 *     },
	 *     {
	 *       "title": "Which of the following is the integral of 2x?",
	 *       "choices": ["x^2 + C", "2x^2 + C", "x + C", "2x + C"],
	 *       "correctAnswerIndex": 0,
	 *       "mathematical": true,
	 *       "identification": false,
	 *       "randomChoices": false,
	 *       "hasChoiceImages": false
	 *     },
	 *     {
	 *       "title": "Who wrote 'To Kill a Mockingbird'?",
	 *       "choices": ["Harper Lee", "Mark Twain", "J.K. Rowling", "Ernest Hemingway"],
	 *       "correctAnswerIndex": 0,
	 *       "mathematical": false,
	 *       "identification": true,
	 *       "randomChoices": false,
	 *       "hasChoiceImages": false
	 *     },
	 *     {
	 *       "title": "What is the capital of France?",
	 *       "choices": ["Paris", "London", "Berlin", "Madrid"],
	 *       "correctAnswerIndex": 0,
	 *       "mathematical": false,
	 *       "identification": false,
	 *       "randomChoices": false,
	 *       "hasChoiceImages": false
	 *     }
	 *   ]
	 * }
	 */

	const handleImportQuiz = (event) => {
		const file = event.target.files[0];
		setImportError('');
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target.result);

				// Validate structure
				if (
					typeof data !== 'object' ||
					!data.quiz_title ||
					!Array.isArray(data.questions) ||
					data.questions.length === 0
				) {
					setImportError('Invalid quiz JSON structure.');
					return;
				}

				// Set quiz-level fields
				setQuizTitle(data.quiz_title);
				setQuizTitleInput(data.quiz_title);
				setSelectedColor(data.tag_color || colors[0].hex);
				setQuizType(data.quizType || 'list');
				setRandomQuestionOrder(!!data.randomQuestions);
				setRandomQuestionChoices(data.questions.some((q) => q.randomChoices === true));

				// Quiz image: not supported via JSON (file), so clear
				setQuizImage(null);
				setQuizImagePreview(null);

				// Map questions, ensure all required fields, and assign unique IDs
				const mappedQuestions = data.questions.map((q, idx) => {
					let choices;
					// For mathematical questions, ensure choices are always an array of strings (for input fields)
					if (!!q.mathematical) {
						// If choices is not an array or is empty, provide 4 empty strings for input fields
						if (!Array.isArray(q.choices) || q.choices.length === 0) {
							choices = ['', '', '', ''];
						} else {
							// If choices exist, ensure all are strings (for input fields)
							choices = q.choices.map((c) => {
								let val = typeof c === 'string' ? c : '';
								// Fix: If the string contains a single backslash, replace with a single backslash.
								// This is to ensure that JSON-encoded LaTeX like "\\frac{a}{b}" or "\frac{a}{b}" is normalized to "\frac{a}{b}"
								// Only do this for mathematical questions
								val = val.replace(/\\\\/g, '\\'); // Replace double backslash with single
								// If any remaining single backslash not followed by another backslash, keep as is (for LaTeX)
								return val;
							});
							// Pad to at least 4 choices for UI consistency
							while (choices.length < 4) choices.push('');
						}
					} else {
						// For non-mathematical, use choices as is or default to 4 blanks
						choices = Array.isArray(q.choices) ? q.choices : ['', '', '', ''];
						while (choices.length < 4) choices.push('');
					}

					const base = {
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
					return base;
				});
				setQuestions(mappedQuestions);
			} catch (err) {
				console.log(err);
				setImportError('Failed to parse JSON: ' + err.message);
			}
		};
		reader.readAsText(file);
	};

	const triggerImport = () => {
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
			fileInputRef.current.click();
		}
	};

	const handleQuizTitleChange = (event) => {
		const newTitle = event.target.value;
		setQuizTitleInput(newTitle);
	};

	const handleInputChange = (id, field, value) => {
		const updatedQuestions = questions.map((question) =>
			question.id === id ? { ...question, [field]: value } : question
		);
		setQuestions(updatedQuestions);
	};

	const removeQuestion = (questionID) => {
		const updatedQuestions = questions.filter((question) => question.id !== questionID);
		setQuestions(updatedQuestions);
	};

	const removeChoice = (id, index) => {
		const updatedQuestions = questions.map((question) =>
			question.id === id
				? {
						...question,
						choices: question.choices.filter((_, indx) => indx !== index),
						choiceImages: question.choiceImages.filter((_, indx) => indx !== index),
						choiceImagePreviews: question.choiceImagePreviews.filter((_, indx) => indx !== index)
					}
				: question
		);
		setQuestions(updatedQuestions);
	};

	const addChoice = (id) => {
		const updatedQuestions = questions.map((question) =>
			question.id === id
				? {
						...question,
						choices: question.choices.concat(''),
						choiceImages: question.choiceImages.concat(null),
						choiceImagePreviews: question.choiceImagePreviews.concat(null)
					}
				: question
		);
		setQuestions(updatedQuestions);
	};

	const updateQuizTitle = (event) => {
		event.preventDefault();
		setQuizTitle(quizTitleInput);
		setEditQuizTitle(false);
	};

	const handleQuizImageUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			setQuizImage(file);
			const reader = new FileReader();
			reader.onload = (e) => {
				setQuizImagePreview(e.target.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleQuestionImageUpload = (questionId, event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const updatedQuestions = questions.map((question) =>
					question.id === questionId
						? {
								...question,
								question_image: file,
								question_image_preview: e.target.result
							}
						: question
				);
				setQuestions(updatedQuestions);
			};
			reader.readAsDataURL(file);
		}
	};

	const removeQuizImage = () => {
		setQuizImage(null);
		setQuizImagePreview(null);
	};

	const removeQuestionImage = (questionId) => {
		const updatedQuestions = questions.map((question) =>
			question.id === questionId
				? {
						...question,
						question_image: null,
						question_image_preview: null
					}
				: question
		);
		setQuestions(updatedQuestions);
	};

	const handleChoiceImageUpload = (questionId, choiceIndex, event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const updatedQuestions = questions.map((question) =>
					question.id === questionId
						? {
								...question,
								choiceImages: question.choiceImages.map((img, idx) =>
									idx === choiceIndex ? file : img
								),
								choiceImagePreviews: question.choiceImagePreviews.map((preview, idx) =>
									idx === choiceIndex ? e.target.result : preview
								),
								hasChoiceImages: true
							}
						: question
				);
				setQuestions(updatedQuestions);
			};
			reader.readAsDataURL(file);
		}
	};

	const removeChoiceImage = (questionId, choiceIndex) => {
		const updatedQuestions = questions.map((question) =>
			question.id === questionId
				? {
						...question,
						choiceImages: question.choiceImages.map((img, idx) =>
							idx === choiceIndex ? null : img
						),
						choiceImagePreviews: question.choiceImagePreviews.map((preview, idx) =>
							idx === choiceIndex ? null : preview
						),
						hasChoiceImages: question.choiceImages.some(
							(img, idx) => idx !== choiceIndex && img !== null
						)
					}
				: question
		);
		setQuestions(updatedQuestions);
	};

	const handleCreateQuiz = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);

			// Create FormData for file uploads
			const formData = new FormData();

			// Add quiz data
			formData.append('quiz_title', quizTitle);
			formData.append('public', false);
			formData.append('randomQuestions', randomQuestionOrder);
			formData.append('tag_color', selectedColor);
			formData.append('quizType', quizType);

			// Add quiz image if exists
			if (quizImage) {
				formData.append('quiz_image', quizImage);
			}

			// Add questions data
			questions.forEach((question, questionIndex) => {
				// Add question text data
				formData.append(`questions[${questionIndex}][title]`, question.title);
				formData.append(
					`questions[${questionIndex}][correctAnswerIndex]`,
					question.correctAnswerIndex
				);
				formData.append(`questions[${questionIndex}][randomChoices]`, question.randomChoices);
				formData.append(`questions[${questionIndex}][identification]`, question.identification);
				formData.append(`questions[${questionIndex}][mathematical]`, question.mathematical);
				formData.append(`questions[${questionIndex}][hasChoiceImages]`, question.hasChoiceImages);

				// Add question choices
				question.choices.forEach((choice, choiceIndex) => {
					formData.append(`questions[${questionIndex}][choices][${choiceIndex}]`, choice);
				});

				// Add question image if exists
				if (question.question_image) {
					formData.append(`questions[${questionIndex}][question_image]`, question.question_image);
				}

				// Add choice images if they exist
				question.choiceImages.forEach((choiceImage, choiceIndex) => {
					if (choiceImage) {
						formData.append(
							`questions[${questionIndex}][choice_images][${choiceIndex}]`,
							choiceImage
						);
					}
				});
			});

			const createquiz_response = await createQuiz(formData);
			console.log(createquiz_response);
			if (createquiz_response.status == 200 || createquiz_response.statusText == 'OK') {
				navigate(`/quizzes/${createquiz_response.data.quiz.quiz_id}`);
				setQuizzes([...quizzes, createquiz_response.data.quiz]);
			}
			setLoading(false);
			return createquiz_response;
		} catch (err) {
			setLoading(false);
			return err;
		}
	};

	const handleChoicesChange = (id, index, value) => {
		const updatedQuestions = questions.map((question) =>
			question.id === id
				? {
						...question,
						choices: question.choices.map((choice, indx) => (indx === index ? value : choice))
					}
				: question
		);

		setQuestions(updatedQuestions);
	};

	const addQuestion = () => {
		const updatedQuestions = randomQuestionChoices
			? [...questions, getDefaultQuestion(questions.length + 1, true)]
			: [...questions, getDefaultQuestion(questions.length + 1, false)];
		setQuestions(updatedQuestions);
	};

	const randomizeQuestionChoices = (randomize) => {
		const updatedQuestions = questions.map((question) =>
			randomize
				? {
						...question,
						randomChoices: true
					}
				: {
						...question,
						randomChoices: false
					}
		);
		setQuestions(updatedQuestions);
	};

	const generateAIQuiz = async () => {
		try {
			setLoading(true);
			const response = await generateQuiz(topic, questionNumber);
			if (response.status == 200 || response.statusText == 'OK') {
				// Map AI-generated questions to our internal structure
				const aiQuestions = response.data.quiz_data.questions.map((q, idx) => ({
					id: idx + 1,
					title: q.title || '',
					choices: Array.isArray(q.choices) ? q.choices : ['', '', '', ''],
					choiceImages: Array.isArray(q.choices)
						? new Array(q.choices.length).fill(null)
						: [null, null, null, null],
					choiceImagePreviews: Array.isArray(q.choices)
						? new Array(q.choices.length).fill(null)
						: [null, null, null, null],
					correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
					mathematical: !!q.mathematical,
					identification: !!q.identification,
					randomChoices: !!q.randomChoices,
					hasChoiceImages: !!q.hasChoiceImages,
					question_image: null,
					question_image_preview: null
				}));
				setQuestions(aiQuestions);
			}
			setLoading(false);
			return response;
		} catch (error) {
			setLoading(false);
			return error;
		}
	};

	useEffect(() => {}, [questions, selectedColor]);
	useEffect(() => {}, [quizTitle]);

	return (
		<div className="mx-auto max-w-7xl px-4 pt-6 pb-10 transition-all sm:px-6 md:px-10">
			<Header page={'Create Quiz'} />

			<div className="mt-4 flex flex-col gap-8 lg:flex-row lg:gap-12">
				{/* Main Content: Questions */}
				<div className="flex flex-1 flex-col">
					{/* Import Quiz JSON */}
					<div className="mb-4 flex items-center gap-3">
						<input
							type="file"
							accept="application/json"
							ref={fileInputRef}
							onChange={handleImportQuiz}
							className="hidden"
						/>
						<button
							type="button"
							onClick={triggerImport}
							className="flex items-center gap-2 rounded-lg bg-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-blue-100"
						>
							<Import className="h-4 w-4" />
							Import Quiz (JSON)
						</button>
						{importError && <span className="text-xs text-red-500">{importError}</span>}
					</div>
					{questions.map((question, index) => (
						<div
							className="mb-6 w-full rounded-xl border border-gray-100 bg-white/80 p-4 shadow-md md:p-6"
							key={index}
						>
							<div className="mb-4 flex w-full items-center justify-between">
								<span className="text-base font-semibold text-gray-800 md:text-lg">{`Question ${question.id}`}</span>
								<button
									className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 transition hover:bg-red-200"
									onClick={() => removeQuestion(question.id)}
									aria-label="Remove question"
								>
									<X className="h-4 w-4 text-red-500" />
								</button>
							</div>
							<input
								type="text"
								value={question.title}
								onChange={(e) => handleInputChange(question.id, 'title', e.target.value)}
								className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-blue-200 focus:outline-none"
								placeholder="Enter your question"
							/>

							{/* Question Image Upload */}
							<div className="mb-4">
								<span className="mb-2 block text-sm font-medium text-gray-700">Question Image</span>
								{question.question_image_preview ? (
									<div className="relative mb-2">
										<img
											src={question.question_image_preview}
											alt="Question preview"
											className="h-36 w-full rounded-md object-cover"
										/>
										<button
											onClick={() => removeQuestionImage(question.id)}
											className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 transition hover:bg-red-600"
											aria-label="Remove image"
										>
											<X className="h-3 w-3 text-white" />
										</button>
									</div>
								) : (
									<label className="flex h-24 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-blue-400">
										<input
											type="file"
											accept="image/*"
											onChange={(e) => handleQuestionImageUpload(question.id, e)}
											className="hidden"
										/>
										<div className="flex flex-col items-center">
											<Plus className="mb-1 h-5 w-5 text-gray-400" />
											<p className="text-xs text-gray-400">Add Image</p>
										</div>
									</label>
								)}
							</div>
							<div className="mb-2">
								<span className="text-base font-semibold text-gray-800">Choices</span>
							</div>
							<div className="mb-4 flex flex-wrap gap-2">
								<button
									className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
										question.mathematical
											? 'bg-green-500 text-white'
											: 'bg-gray-200 text-gray-700 hover:bg-green-100'
									}`}
									onClick={() =>
										handleInputChange(question.id, 'mathematical', !question.mathematical)
									}
								>
									<Check className={`h-3 w-3 ${question.mathematical ? '' : 'opacity-0'}`} />
									Mathematical
								</button>
								<button
									className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
										question.identification
											? 'bg-green-500 text-white'
											: 'bg-gray-200 text-gray-700 hover:bg-green-100'
									}`}
									onClick={() =>
										handleInputChange(question.id, 'identification', !question.identification)
									}
								>
									<Check className={`h-3 w-3 ${question.identification ? '' : 'opacity-0'}`} />
									Identification
								</button>
								<button
									className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
										question.identification
											? 'cursor-not-allowed bg-gray-100 text-gray-400'
											: question.randomChoices
												? 'bg-green-500 text-white'
												: 'bg-gray-200 text-gray-700 hover:bg-green-100'
									}`}
									onClick={() =>
										handleInputChange(question.id, 'randomChoices', !question.randomChoices)
									}
									disabled={question.identification}
								>
									<Check
										className={`h-3 w-3 ${question.randomChoices && !question.identification ? '' : 'opacity-0'}`}
									/>
									Random Choices
								</button>
							</div>
							<div className="mb-4 flex flex-col gap-3">
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
											className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-400 transition ${
												question.correctAnswerIndex == 0 ? 'bg-blue-500' : 'bg-white'
											}`}
											onClick={() => handleInputChange(question.id, 'correctAnswerIndex', 0)}
											aria-label="Mark as correct"
										>
											{question.correctAnswerIndex == 0 && <Check className="h-3 w-3 text-white" />}
										</button>
										<input
											type="text"
											value={question.choices[0]}
											onChange={(e) => handleChoicesChange(question.id, 0, e.target.value)}
											placeholder={`Answer`}
											className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-200 focus:outline-none"
											required
										/>
									</div>
								) : (
									question.choices.map((choice, choice_index) => (
										<div className="flex items-center gap-3" key={choice_index}>
											<button
												className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-400 transition ${
													question.correctAnswerIndex == choice_index ? 'bg-blue-500' : 'bg-white'
												}`}
												onClick={() =>
													handleInputChange(question.id, 'correctAnswerIndex', choice_index)
												}
												aria-label="Mark as correct"
											>
												{question.correctAnswerIndex == choice_index && (
													<Check className="h-3 w-3 text-white" />
												)}
											</button>
											<input
												type="text"
												value={question.choices[choice_index]}
												onChange={(e) =>
													handleChoicesChange(question.id, choice_index, e.target.value)
												}
												placeholder={`Choice ${choice_index + 1}`}
												className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-200 focus:outline-none"
												required
											/>
											<button
												className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 transition hover:bg-red-200"
												onClick={() => removeChoice(question.id, choice_index)}
												aria-label="Remove choice"
											>
												<X className="h-3 w-3 text-red-500" />
											</button>
											{/* Choice Image Upload */}
											<div className="ml-2 w-24">
												{question.choiceImagePreviews[choice_index] ? (
													<div className="relative">
														<img
															src={question.choiceImagePreviews[choice_index]}
															alt={`Choice ${choice_index + 1} preview`}
															className="h-12 w-full rounded object-cover"
														/>
														<button
															onClick={() => removeChoiceImage(question.id, choice_index)}
															className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 transition hover:bg-red-600"
															aria-label="Remove choice image"
														>
															<X className="h-2 w-2 text-white" />
														</button>
													</div>
												) : (
													<label className="flex h-10 w-full cursor-pointer items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-blue-400">
														<input
															type="file"
															accept="image/*"
															onChange={(e) =>
																handleChoiceImageUpload(question.id, choice_index, e)
															}
															className="hidden"
														/>
														<div className="flex flex-col items-center">
															<Plus className="h-3 w-3 text-gray-400" />
															<p className="text-[10px] text-gray-400">Add</p>
														</div>
													</label>
												)}
											</div>
										</div>
									))
								)}
							</div>
							<button
								className="mb-2 flex h-8 w-full items-center justify-center rounded-lg bg-green-500 text-xs font-semibold text-white transition hover:bg-green-600"
								onClick={() => addChoice(question.id)}
							>
								<Plus className="mr-1 h-4 w-4" />
								Add Choice
							</button>
						</div>
					))}
					<button
						className="flex h-10 w-full items-center justify-center rounded-lg bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600"
						onClick={addQuestion}
					>
						<Plus className="mr-2 h-5 w-5" />
						Add Question
					</button>
				</div>
				{/* Sidebar: Quiz Settings */}
				<div className="flex w-full flex-shrink-0 flex-col gap-6 lg:w-[350px]">
					<div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white/80 p-4 shadow-md md:p-6">
						<div>
							<span className="mb-2 block text-base font-semibold text-gray-800">Quiz Title</span>
							<div className="flex items-center gap-2">
								<button
									type="button"
									className={`flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white transition hover:bg-gray-100`}
									onClick={() => {
										if (!editQuizTitle) {
											setQuizTitleInput(quizTitle);
										} else {
											setQuizTitleInput('');
										}
										setEditQuizTitle(!editQuizTitle);
									}}
									aria-label={editQuizTitle ? 'Cancel edit' : 'Edit title'}
								>
									{editQuizTitle ? (
										<X className="h-4 w-4 text-gray-500" />
									) : (
										<Pencil className="h-4 w-4 text-gray-500" />
									)}
								</button>
								{editQuizTitle ? (
									<form onSubmit={updateQuizTitle} className="flex flex-1 items-center gap-2">
										<input
											type="text"
											value={quizTitleInput}
											onChange={handleQuizTitleChange}
											className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-200 focus:outline-none"
										/>
										<button
											type="submit"
											className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 transition hover:bg-green-600"
											aria-label="Save title"
										>
											<Check className="h-4 w-4 text-white" />
										</button>
									</form>
								) : (
									<span className="text-sm font-semibold text-gray-700">{quizTitle}</span>
								)}
							</div>
						</div>
						{/* Quiz Image Upload */}
						<div>
							<span className="mb-2 block text-base font-semibold text-gray-800">Quiz Image</span>
							{quizImagePreview ? (
								<div className="relative mb-2">
									<img
										src={quizImagePreview}
										alt="Quiz preview"
										className="h-28 w-full rounded-md object-cover"
									/>
									<button
										onClick={removeQuizImage}
										className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 transition hover:bg-red-600"
										aria-label="Remove quiz image"
									>
										<X className="h-3 w-3 text-white" />
									</button>
								</div>
							) : (
								<label className="flex h-20 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-blue-400">
									<input
										type="file"
										accept="image/*"
										onChange={handleQuizImageUpload}
										className="hidden"
									/>
									<div className="flex flex-col items-center">
										<Plus className="mb-1 h-4 w-4 text-gray-400" />
										<p className="text-xs text-gray-400">Add Quiz Image</p>
									</div>
								</label>
							)}
						</div>
						<button
							onClick={handleCreateQuiz}
							className="flex h-10 w-full items-center justify-center rounded-lg bg-green-500 text-sm font-semibold text-white transition hover:bg-green-600"
						>
							{loading ? (
								<div className="flex w-full items-center justify-center">
									<LoadingComponent size={16} light={false} />
								</div>
							) : (
								<span>Create Quiz</span>
							)}
						</button>
					</div>
					{/* AI Quiz Generator */}
					<div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white/80 p-4 shadow-md md:p-6">
						<span className="mb-2 text-base font-semibold text-gray-800">AI-Quiz Generate</span>
						<input
							type="text"
							value={topic}
							placeholder="Topic"
							onChange={(e) => setTopic(e.target.value)}
							className="mb-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-200 focus:outline-none"
						/>
						<input
							type="number"
							placeholder="Number of Questions"
							onChange={(e) => setQuestionNumber(e.target.value)}
							max={15}
							className="mb-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-200 focus:outline-none"
						/>
						<button
							onClick={() => generateAIQuiz()}
							className="flex h-8 w-full items-center justify-center rounded-lg bg-blue-500 text-xs font-semibold text-white transition hover:bg-blue-600"
						>
							<span>Generate</span>
						</button>
					</div>
					{/* Options */}
					<div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white/80 p-4 shadow-md md:p-6">
						<span className="mb-2 text-base font-semibold text-gray-800">Options</span>
						<button
							className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
								randomQuestionOrder
									? 'bg-green-500 text-white'
									: 'bg-gray-200 text-gray-700 hover:bg-green-100'
							}`}
							onClick={() => setRandomQuestionOrder(!randomQuestionOrder)}
						>
							<Check className={`h-3 w-3 ${randomQuestionOrder ? '' : 'opacity-0'}`} />
							Randomize Questions
						</button>
						<button
							className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
								randomQuestionChoices
									? 'bg-green-500 text-white'
									: 'bg-gray-200 text-gray-700 hover:bg-green-100'
							}`}
							onClick={() => {
								setRandomQuestionChoices(!randomQuestionChoices);
								randomizeQuestionChoices(!randomQuestionChoices);
							}}
						>
							<Check className={`h-3 w-3 ${randomQuestionChoices ? '' : 'opacity-0'}`} />
							Randomize Choices
						</button>
					</div>
					{/* Quiz Type */}
					<div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white/80 p-4 shadow-md md:p-6">
						<span className="mb-2 text-base font-semibold text-gray-800">Quiz Type</span>
						<div className="flex gap-2">
							<button
								className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
									quizType === 'list'
										? 'bg-blue-500 text-white'
										: 'bg-gray-200 text-gray-700 hover:bg-blue-100'
								}`}
								onClick={() => setQuizType('list')}
							>
								List
							</button>
							<button
								className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
									quizType === 'flashcard'
										? 'bg-blue-500 text-white'
										: 'bg-gray-200 text-gray-700 hover:bg-blue-100'
								}`}
								onClick={() => setQuizType('flashcard')}
							>
								Flashcard
							</button>
						</div>
					</div>
					{/* Tag Color */}
					<div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white/80 p-4 shadow-md md:p-6">
						<span className="mb-2 text-base font-semibold text-gray-800">Tag Color</span>
						<div className="grid grid-cols-5 gap-2">
							{colors.map((color) => (
								<label
									key={color.hex}
									className="relative flex cursor-pointer items-center justify-center"
								>
									<input
										type="radio"
										name="color"
										value={color.hex}
										checked={selectedColor === color.hex}
										onChange={() => setSelectedColor(color.hex)}
										className="hidden"
									/>
									<span
										className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-200 transition-all ${
											selectedColor === color.hex ? 'ring-2 ring-blue-400' : ''
										}`}
										style={{ backgroundColor: color.hex }}
									></span>
								</label>
							))}
						</div>
					</div>
					{/* Layout */}
					<div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white/80 p-4 shadow-md md:p-6">
						<span className="mb-2 text-base font-semibold text-gray-800">Layout</span>
						<div className="flex gap-2">
							<button
								className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
									view === 'list'
										? 'bg-blue-500 text-white'
										: 'bg-gray-200 text-gray-700 hover:bg-blue-100'
								}`}
								onClick={() => setView('list')}
							>
								List
							</button>
							<button
								className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
									view === 'grid'
										? 'bg-blue-500 text-white'
										: 'bg-gray-200 text-gray-700 hover:bg-blue-100'
								}`}
								onClick={() => setView('grid')}
							>
								Grid
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
