import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import MathInput from '../components/MathInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCheck,
	faEdit,
	faPlus,
	faXmark,
	faSave,
	faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
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

export default function EditQuizPage() {
	const { getQuiz, updateQuiz, setQuizzes, quizzes } = useContext(AuthContext);
	const navigate = useNavigate();
	const { id } = useParams();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [randomQuestionOrder, setRandomQuestionOrder] = useState(false);
	const [randomQuestionChoices, setRandomQuestionChoices] = useState(false);
	const [view, setView] = useState('list');
	const [quizType, setQuizType] = useState('list');
	const [quizTitle, setQuizTitle] = useState('');
	const [quizTitleInput, setQuizTitleInput] = useState('');
	const [editQuizTitle, setEditQuizTitle] = useState(false);
	const [selectedColor, setSelectedColor] = useState(colors[0].hex);
	const [quizImage, setQuizImage] = useState(null);
	const [quizImagePreview, setQuizImagePreview] = useState(null);
	const [originalQuizImage, setOriginalQuizImage] = useState(null);
	const [questions, setQuestions] = useState([]);
	const [isPublic, setIsPublic] = useState(false);

	// Load existing quiz data
	useEffect(() => {
		const loadQuizData = async () => {
			try {
				setLoading(true);
				const response = await getQuiz(id, false); // Don't randomize for editing

				const quizData = response.data.data;
				const questionsData = response.data.questions;

				// Set quiz properties
				setQuizTitle(quizData.quiz_title);
				setQuizTitleInput(quizData.quiz_title);
				setSelectedColor(quizData.tag_color);
				setRandomQuestionOrder(quizData.random_question_order);
				setIsPublic(quizData.public);
				setQuizType(quizData.flashcard_quiz ? 'flashcard' : 'list');
				setOriginalQuizImage(quizData.quiz_image);
				setQuizImagePreview(quizData.quiz_image);

				// Transform questions data to match the form structure
				const transformedQuestions = questionsData.map((question, index) => {
					// Determine question type based on choices and properties
					let questionType = 'MUL';
					if (question.question_type === 'IDE' || question.question_type === 'IDE-COM') {
						questionType = 'IDE';
					} else if (question.question_type === 'MUL-COM' || question.question_type === 'COM') {
						questionType = 'MUL-COM';
					}

					// Transform choices to handle both string and object formats
					const transformedChoices = question.choices.map((choice) => {
						if (typeof choice === 'object' && choice !== null) {
							return choice.text || choice;
						}
						return choice;
					});

					// Find correct answer index
					const correctAnswerIndex = transformedChoices.findIndex(
						(choice) => choice === question.correct_answer
					);

					return {
						id: question.id || index + 1,
						title: question.question,
						choices: transformedChoices,
						choiceImages: Array(transformedChoices.length).fill(null),
						choiceImagePreviews: Array(transformedChoices.length).fill(null),
						correctAnswerIndex: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
						mathematical: question.question_type === 'MUL-COM' || question.question_type === 'COM',
						identification:
							question.question_type === 'IDE' || question.question_type === 'IDE-COM',
						randomChoices: question.random_choices || false,
						hasChoiceImages: false,
						question_image: null,
						question_image_preview: question.question_image
					};
				});

				setQuestions(transformedQuestions);
				setLoading(false);
			} catch (error) {
				console.error('Error loading quiz:', error);
				setLoading(false);
				// Redirect to quizzes page if quiz not found or not accessible
				navigate('/quizzes');
			}
		};

		loadQuizData();
	}, [id, getQuiz, navigate]);

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
						choices: question.choices.filter((choice, indx) => indx !== index),
						choiceImages: question.choiceImages.filter((img, indx) => indx !== index),
						choiceImagePreviews: question.choiceImagePreviews.filter(
							(preview, indx) => indx !== index
						)
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
						choices: [...question.choices, ''],
						choiceImages: [...question.choiceImages, null],
						choiceImagePreviews: [...question.choiceImagePreviews, null]
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
			reader.onload = (e) => setQuizImagePreview(e.target.result);
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

	// Helper function to convert file to base64
	const fileToBase64 = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = (error) => reject(error);
		});
	};

	const handleUpdateQuiz = async (e) => {
		e.preventDefault();
		try {
			setSaving(true);

			// Prepare quiz data
			const quizData = {
				quiz_title: quizTitle,
				public: isPublic,
				randomQuestions: randomQuestionOrder,
				tag_color: selectedColor,
				quizType: quizType === 'flashcard' ? 'flashcard' : 'quiz'
			};

			// Handle quiz image
			if (quizImage) {
				quizData.quiz_image = await fileToBase64(quizImage);
			} else if (originalQuizImage) {
				// Keep existing image if no new image is uploaded
				quizData.quiz_image = originalQuizImage;
			}

			// Prepare questions data
			const questionsData = await Promise.all(
				questions.map(async (question) => {
					const questionData = {
						title: question.title,
						correctAnswerIndex: question.correctAnswerIndex,
						randomChoices: question.randomChoices,
						identification: question.identification,
						mathematical: question.mathematical,
						hasChoiceImages: question.hasChoiceImages,
						choices: question.choices
					};

					// Handle question image
					if (question.question_image) {
						questionData.question_image = await fileToBase64(question.question_image);
					} else if (
						question.question_image_preview &&
						question.question_image_preview !== originalQuizImage
					) {
						// Keep existing image if no new image is uploaded
						questionData.question_image = question.question_image_preview;
					}

					// Handle choice images
					if (question.hasChoiceImages) {
						const choiceImages = [];
						for (let i = 0; i < question.choiceImages.length; i++) {
							if (question.choiceImages[i]) {
								choiceImages[i] = await fileToBase64(question.choiceImages[i]);
							} else if (question.choiceImagePreviews[i]) {
								choiceImages[i] = question.choiceImagePreviews[i];
							}
						}
						questionData.choice_images = choiceImages;
					}

					return questionData;
				})
			);

			quizData.questions = questionsData;

			const update_response = await updateQuiz(id, quizData);
			console.log(update_response);
			if (update_response.status == 200 || update_response.statusText == 'OK') {
				// Update the quiz in the quizzes list
				const updatedQuizzes = quizzes.map((quiz) =>
					quiz.quiz_id == id ? update_response.data.quiz : quiz
				);
				setQuizzes(updatedQuizzes);
				navigate(`/quizzes/${id}`);
			}
			setSaving(false);
			return update_response;
		} catch (err) {
			setSaving(false);
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
			? [
					...questions,
					{
						id: questions.length + 1,
						title: '',
						choices: ['', '', '', ''],
						choiceImages: [null, null, null, null],
						choiceImagePreviews: [null, null, null, null],
						correctAnswerIndex: 0,
						mathematical: false,
						identification: false,
						randomChoices: false,
						hasChoiceImages: false,
						question_image: null,
						question_image_preview: null
					}
				]
			: [
					...questions,
					{
						id: questions.length + 1,
						title: '',
						choices: ['', '', '', ''],
						choiceImages: [null, null, null, null],
						choiceImagePreviews: [null, null, null, null],
						correctAnswerIndex: 0,
						mathematical: false,
						identification: false,
						randomChoices: false,
						hasChoiceImages: false,
						question_image: null,
						question_image_preview: null
					}
				];
		setQuestions(updatedQuestions);
	};

	const randomizeQuestionChoices = (randomize) => {
		setRandomQuestionChoices(randomize);
		if (randomize) {
			const updatedQuestions = questions.map((question) => ({
				...question,
				randomChoices: true
			}));
			setQuestions(updatedQuestions);
		} else {
			const updatedQuestions = questions.map((question) => ({
				...question,
				randomChoices: false
			}));
			setQuestions(updatedQuestions);
		}
	};

	if (loading) {
		return <LoadingComponent />;
	}

	return (
		<div className="px-[30px] pt-[18px] pb-[30px] transition-all">
			<Header page={'Edit Quiz'} />

			{/* Back Button */}
			<button
				onClick={() => navigate(`/quizzes/${id}`)}
				className="mb-4 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
			>
				<FontAwesomeIcon icon={faArrowLeft} />
				Back to Quiz
			</button>

			<div className="flex gap-[40px]">
				<div className="flex w-[67%] flex-col">
					{/* Quiz Title */}
					<div className="mb-[20px] flex items-center gap-[10px]">
						{editQuizTitle ? (
							<form onSubmit={updateQuizTitle} className="flex items-center gap-[10px]">
								<input
									type="text"
									value={quizTitleInput}
									onChange={handleQuizTitleChange}
									className="rounded-lg border border-gray-300 px-3 py-2 text-2xl font-bold focus:border-blue-500 focus:outline-none"
									autoFocus
								/>
								<button
									type="submit"
									className="rounded-lg bg-green-500 p-2 text-white hover:bg-green-600"
								>
									<FontAwesomeIcon icon={faCheck} />
								</button>
								<button
									type="button"
									onClick={() => {
										setEditQuizTitle(false);
										setQuizTitleInput(quizTitle);
									}}
									className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
								>
									<FontAwesomeIcon icon={faXmark} />
								</button>
							</form>
						) : (
							<>
								<h1 className="text-2xl font-bold">{quizTitle}</h1>
								<button
									onClick={() => setEditQuizTitle(true)}
									className="rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600"
								>
									<FontAwesomeIcon icon={faEdit} />
								</button>
							</>
						)}
					</div>

					{/* Quiz Image */}
					<div className="mb-[20px] flex flex-col items-center">
						{quizImagePreview ? (
							<div className="relative">
								<img
									src={quizImagePreview}
									alt="Quiz"
									className="max-h-[200px] rounded-[15px] object-cover"
								/>
								<button
									onClick={removeQuizImage}
									className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
								>
									<FontAwesomeIcon icon={faXmark} />
								</button>
							</div>
						) : (
							<div className="flex h-[200px] w-full items-center justify-center rounded-[15px] border-2 border-dashed border-gray-300">
								<input
									type="file"
									accept="image/*"
									onChange={handleQuizImageUpload}
									className="hidden"
									id="quiz-image-upload"
								/>
								<label
									htmlFor="quiz-image-upload"
									className="cursor-pointer text-gray-500 hover:text-gray-700"
								>
									Click to upload quiz image
								</label>
							</div>
						)}
					</div>

					{/* Quiz Settings */}
					<div className="mb-[20px] flex flex-col gap-[10px] rounded-[20px] bg-[#EFF7FF] p-[20px] drop-shadow-lg">
						{/* Tag Color */}
						<div className="flex w-full items-center rounded-full bg-white p-[10px]">
							<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
							<span className="w-[95px] text-[14px] font-semibold text-[#646464]">Tag Color</span>
							<div className="flex gap-2">
								{colors.map((color) => (
									<button
										key={color.hex}
										onClick={() => setSelectedColor(color.hex)}
										className={`h-[19px] w-[19px] rounded-full border-2 ${
											selectedColor === color.hex ? 'border-black' : 'border-gray-300'
										}`}
										style={{ backgroundColor: color.hex }}
									></button>
								))}
							</div>
						</div>

						{/* Quiz Type */}
						<div className="flex w-full items-center rounded-full bg-white p-[10px]">
							<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
							<span className="w-[95px] text-[14px] font-semibold text-[#646464]">Type</span>
							<div className="flex gap-2">
								<button
									onClick={() => setQuizType('list')}
									className={`rounded-full px-4 py-1 text-sm font-semibold ${
										quizType === 'list' ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-700'
									}`}
								>
									List
								</button>
								<button
									onClick={() => setQuizType('flashcard')}
									className={`rounded-full px-4 py-1 text-sm font-semibold ${
										quizType === 'flashcard'
											? 'bg-[#007AFF] text-white'
											: 'bg-gray-200 text-gray-700'
									}`}
								>
									Flashcard
								</button>
							</div>
						</div>

						{/* Public/Private */}
						<div className="flex w-full items-center rounded-full bg-white p-[10px]">
							<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
							<span className="w-[95px] text-[14px] font-semibold text-[#646464]">Visibility</span>
							<div className="flex gap-2">
								<button
									onClick={() => setIsPublic(true)}
									className={`rounded-full px-4 py-1 text-sm font-semibold ${
										isPublic ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-700'
									}`}
								>
									Public
								</button>
								<button
									onClick={() => setIsPublic(false)}
									className={`rounded-full px-4 py-1 text-sm font-semibold ${
										!isPublic ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-700'
									}`}
								>
									Private
								</button>
							</div>
						</div>

						{/* Random Question Order */}
						<div className="flex w-full items-center rounded-full bg-white p-[10px]">
							<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
							<span className="w-[95px] text-[14px] font-semibold text-[#646464]">Sequence</span>
							<div className="flex gap-2">
								<button
									onClick={() => setRandomQuestionOrder(false)}
									className={`rounded-full px-4 py-1 text-sm font-semibold ${
										!randomQuestionOrder ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-700'
									}`}
								>
									Ordered
								</button>
								<button
									onClick={() => setRandomQuestionOrder(true)}
									className={`rounded-full px-4 py-1 text-sm font-semibold ${
										randomQuestionOrder ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-700'
									}`}
								>
									Random
								</button>
							</div>
						</div>

						{/* Random Choices */}
						<div className="flex w-full items-center rounded-full bg-white p-[10px]">
							<div className="mr-[10px] h-[19px] w-[19px] rounded-full bg-[#34C759]"></div>
							<span className="w-[95px] text-[14px] font-semibold text-[#646464]">
								Random Choices
							</span>
							<div className="flex gap-2">
								<button
									onClick={() => randomizeQuestionChoices(false)}
									className={`rounded-full px-4 py-1 text-sm font-semibold ${
										!randomQuestionChoices ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-700'
									}`}
								>
									Off
								</button>
								<button
									onClick={() => randomizeQuestionChoices(true)}
									className={`rounded-full px-4 py-1 text-sm font-semibold ${
										randomQuestionChoices ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-700'
									}`}
								>
									On
								</button>
							</div>
						</div>
					</div>

					{/* Questions */}
					<div className="flex flex-col gap-[20px]">
						{questions.map((question, index) => (
							<div
								key={question.id}
								className="flex w-full flex-col rounded-[20px] bg-[#EFF7FF] p-[30px] drop-shadow-lg"
							>
								<div className="mb-[20px] flex items-center justify-between">
									<h3 className="text-lg font-bold">Question {index + 1}</h3>
									<button
										onClick={() => removeQuestion(question.id)}
										className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
									>
										<FontAwesomeIcon icon={faXmark} />
									</button>
								</div>

								{/* Question Text */}
								<input
									type="text"
									value={question.title}
									onChange={(e) => handleInputChange(question.id, 'title', e.target.value)}
									placeholder="Enter question text"
									className="mb-[15px] w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
								/>

								{/* Question Image */}
								<div className="mb-[15px] flex flex-col items-center">
									{question.question_image_preview ? (
										<div className="relative">
											<img
												src={question.question_image_preview}
												alt="Question"
												className="max-h-[200px] rounded-[10px] object-cover"
											/>
											<button
												onClick={() => removeQuestionImage(question.id)}
												className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
											>
												<FontAwesomeIcon icon={faXmark} />
											</button>
										</div>
									) : (
										<div className="flex h-[100px] w-full items-center justify-center rounded-[10px] border-2 border-dashed border-gray-300">
											<input
												type="file"
												accept="image/*"
												onChange={(e) => handleQuestionImageUpload(question.id, e)}
												className="hidden"
												id={`question-image-${question.id}`}
											/>
											<label
												htmlFor={`question-image-${question.id}`}
												className="cursor-pointer text-gray-500 hover:text-gray-700"
											>
												Add question image
											</label>
										</div>
									)}
								</div>

								{/* Question Type */}
								<div className="mb-[15px] flex gap-2">
									<button
										onClick={() => handleInputChange(question.id, 'identification', false)}
										className={`rounded-full px-4 py-1 text-sm font-semibold ${
											!question.identification
												? 'bg-[#007AFF] text-white'
												: 'bg-gray-200 text-gray-700'
										}`}
									>
										Multiple Choice
									</button>
									<button
										onClick={() => handleInputChange(question.id, 'identification', true)}
										className={`rounded-full px-4 py-1 text-sm font-semibold ${
											question.identification
												? 'bg-[#007AFF] text-white'
												: 'bg-gray-200 text-gray-700'
										}`}
									>
										Identification
									</button>
									<button
										onClick={() =>
											handleInputChange(question.id, 'mathematical', !question.mathematical)
										}
										className={`rounded-full px-4 py-1 text-sm font-semibold ${
											question.mathematical
												? 'bg-[#007AFF] text-white'
												: 'bg-gray-200 text-gray-700'
										}`}
									>
										Mathematical
									</button>
								</div>

								{/* Choices */}
								{!question.identification && (
									<div className="flex flex-col gap-[10px]">
										<div className="flex items-center justify-between">
											<h4 className="font-semibold">Choices:</h4>
											<button
												onClick={() => addChoice(question.id)}
												className="rounded-lg bg-green-500 p-2 text-white hover:bg-green-600"
											>
												<FontAwesomeIcon icon={faPlus} />
											</button>
										</div>
										{question.mathematical ? (
											<MathInput
												handleChoicesChange={handleChoicesChange}
												handleInputChange={handleInputChange}
												question={question}
												removeChoice={removeChoice}
											/>
										) : (
											question.choices.map((choice, choiceIndex) => (
												<div key={choiceIndex} className="flex items-center gap-[10px]">
													<input
														type="radio"
														name={`correct-${question.id}`}
														checked={question.correctAnswerIndex === choiceIndex}
														onChange={() =>
															handleInputChange(question.id, 'correctAnswerIndex', choiceIndex)
														}
														className="h-4 w-4"
													/>
													<input
														type="text"
														value={choice}
														onChange={(e) =>
															handleChoicesChange(question.id, choiceIndex, e.target.value)
														}
														placeholder={`Choice ${choiceIndex + 1}`}
														className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
													/>

													{question.choiceImagePreviews[choiceIndex] ? (
														<div className="relative">
															<img
																src={question.choiceImagePreviews[choiceIndex]}
																alt={`Choice ${choiceIndex + 1}`}
																className="h-[40px] w-[40px] rounded object-cover"
															/>
															<button
																onClick={() => removeChoiceImage(question.id, choiceIndex)}
																className="absolute -top-1 -right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
															>
																<FontAwesomeIcon icon={faXmark} />
															</button>
														</div>
													) : (
														<div className="flex h-[40px] w-[40px] items-center justify-center rounded border-2 border-dashed border-gray-300">
															<input
																type="file"
																accept="image/*"
																onChange={(e) =>
																	handleChoiceImageUpload(question.id, choiceIndex, e)
																}
																className="hidden"
																id={`choice-image-${question.id}-${choiceIndex}`}
															/>
															<label
																htmlFor={`choice-image-${question.id}-${choiceIndex}`}
																className="cursor-pointer text-xs text-gray-500 hover:text-gray-700"
															>
																+
															</label>
														</div>
													)}
													{question.choices.length > 2 && (
														<button
															onClick={() => removeChoice(question.id, choiceIndex)}
															className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
														>
															<FontAwesomeIcon icon={faXmark} />
														</button>
													)}
												</div>
											))
										)}
									</div>
								)}
							</div>
						))}

						{/* Add Question Button */}
						<button
							onClick={addQuestion}
							className="flex w-full items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-gray-300 p-[30px] text-gray-500 hover:border-gray-400 hover:text-gray-700"
						>
							<FontAwesomeIcon icon={faPlus} />
							Add Question
						</button>
					</div>

					{/* Save Button */}
					<div className="mt-[30px] flex justify-center">
						<button
							onClick={handleUpdateQuiz}
							disabled={saving}
							className="flex items-center gap-2 rounded-full bg-[#007AFF] px-8 py-3 font-bold text-white transition hover:bg-[#0056CC] disabled:bg-gray-400"
						>
							{saving ? (
								<LoadingComponent />
							) : (
								<>
									<FontAwesomeIcon icon={faSave} />
									Save Changes
								</>
							)}
						</button>
					</div>
				</div>

				{/* Preview Panel */}
				<div className="flex w-[33%] flex-col">
					<div className="sticky top-4 rounded-[20px] bg-[#EFF7FF] p-[20px] drop-shadow-lg">
						<h3 className="mb-[20px] text-lg font-bold">Preview</h3>
						<div className="flex flex-col gap-[10px]">
							<div className="flex items-center justify-between rounded-full bg-white p-[10px]">
								<span className="text-sm font-semibold text-[#646464]">Questions</span>
								<span className="text-lg font-bold text-[#646464]">{questions.length}</span>
							</div>
							<div className="flex items-center justify-between rounded-full bg-white p-[10px]">
								<span className="text-sm font-semibold text-[#646464]">Type</span>
								<span className="text-lg font-bold text-[#646464]">
									{quizType === 'flashcard' ? 'Flashcard' : 'List'}
								</span>
							</div>
							<div className="flex items-center justify-between rounded-full bg-white p-[10px]">
								<span className="text-sm font-semibold text-[#646464]">Visibility</span>
								<span className="text-lg font-bold text-[#646464]">
									{isPublic ? 'Public' : 'Private'}
								</span>
							</div>
							<div className="flex items-center justify-between rounded-full bg-white p-[10px]">
								<span className="text-sm font-semibold text-[#646464]">Sequence</span>
								<span className="text-lg font-bold text-[#646464]">
									{randomQuestionOrder ? 'Random' : 'Ordered'}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
