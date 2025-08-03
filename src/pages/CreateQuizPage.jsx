import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import MathInput from '../components/MathInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEdit, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
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
	const [questions, setQuestions] = useState([
		{
			id: 1,
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
	]);

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
						randomChoices: true,
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
				setQuestions(response.data.quiz_data.questions);
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
		<div className="px-[30px] pt-[18px] pb-[30px] transition-all">
			<Header page={'Create Quiz'} />

			<div className="flex gap-[40px]">
				<div className="flex w-[67%] flex-col">
					{questions.map((question, index) => (
						<div
							className="mb-[20px] w-full rounded-[20px] bg-[#EFF7FF] p-[20px] drop-shadow-lg"
							key={index}
						>
							<div className="mb-[20px] flex w-full items-center justify-between">
								<span className="text-[16px] font-bold">{`Question ${question.id}`}</span>
								<button
									className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full bg-[#FF605C]"
									onClick={() => removeQuestion(question.id)}
								>
									<FontAwesomeIcon icon={faXmark} className="h-[8px] w-[8px] text-black" />
								</button>
							</div>
							<input
								type="text"
								value={question.title}
								onChange={(e) => handleInputChange(question.id, 'title', e.target.value)}
								className="mb-[20px] w-full rounded-full bg-white px-[20px] py-[12px] text-[12px] text-[#919191]"
								placeholder="Question"
							/>

							{/* Question Image Upload */}
							<div className="mb-[20px]">
								<span className="mb-[10px] block text-[14px] font-bold">Question Image</span>
								{question.question_image_preview ? (
									<div className="relative mb-[10px]">
										<img
											src={question.question_image_preview}
											alt="Question preview"
											className="h-[150px] w-full rounded-[10px] object-cover"
										/>
										<button
											onClick={() => removeQuestionImage(question.id)}
											className="absolute top-2 right-2 flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full bg-[#FF605C]"
										>
											<FontAwesomeIcon icon={faXmark} className="h-[8px] w-[8px] text-white" />
										</button>
									</div>
								) : (
									<label className="flex h-[100px] w-full cursor-pointer items-center justify-center rounded-[10px] border-2 border-dashed border-gray-300 transition-all hover:border-[#3C6B9F]">
										<input
											type="file"
											accept="image/*"
											onChange={(e) => handleQuestionImageUpload(question.id, e)}
											className="hidden"
										/>
										<div className="text-center">
											<FontAwesomeIcon
												icon={faPlus}
												className="mb-[5px] h-[20px] w-[20px] text-gray-400"
											/>
											<p className="text-[12px] text-gray-500">Add Image</p>
										</div>
									</label>
								)}
							</div>
							<div className="mb-[20px]">
								<span className="text-[16px] font-bold">Choices</span>
							</div>
							<div className="mb-[30px] flex justify-between gap-[20px]">
								<button
									className={`flex h-[21px] w-full cursor-pointer items-center rounded-full px-[3px] text-[10px] font-bold text-white transition-all ${
										question.mathematical ? 'bg-[#00CA4E]' : 'bg-[#FF605C]'
									}`}
									onClick={() =>
										handleInputChange(question.id, 'mathematical', !question.mathematical)
									}
								>
									<div className="mr-[5px] h-[15px] w-[15px] rounded-full bg-white"></div>
									<span>Mathematical</span>
								</button>
								<button
									className={`flex h-[21px] w-full cursor-pointer items-center rounded-full px-[3px] text-[10px] font-bold text-white transition-all ${
										question.identification ? 'bg-[#00CA4E]' : 'bg-[#FF605C]'
									}`}
									onClick={() =>
										handleInputChange(question.id, 'identification', !question.identification)
									}
								>
									<div className="mr-[5px] h-[15px] w-[15px] rounded-full bg-white"></div>
									<span>Identification</span>
								</button>
								<button
									className={`flex h-[21px] w-full items-center rounded-full px-[3px] text-[10px] font-bold text-white transition-all ${
										question.identification
											? 'bg-gray-300'
											: question.randomChoices
												? 'cursor-pointer bg-[#00CA4E]'
												: 'cursor-pointer bg-[#FF605C]'
									}`}
									onClick={() =>
										handleInputChange(question.id, 'randomChoices', !question.randomChoices)
									}
									disabled={question.identification}
								>
									<div className="mr-[5px] h-[15px] w-[15px] rounded-full bg-white"></div>
									<span>Random Choices</span>
								</button>
							</div>
							<div className="mb-[20px] flex flex-col gap-[10px]">
								{question.mathematical ? (
									<MathInput
										handleChoicesChange={handleChoicesChange}
										handleInputChange={handleInputChange}
										question={question}
										removeChoice={removeChoice}
									/>
								) : question.identification ? (
									<div className="flex items-center">
										<div className="mr-[20px] flex w-[3%] items-center">
											<button
												className={`h-[20px] w-[20px] rounded-full bg-[#007AFF] transition-all ${
													question.correctAnswerIndex == 0
														? 'ring-2 ring-[#007AFF] ring-offset-3'
														: ''
												}`}
												onClick={() => handleInputChange(question.id, 'correctAnswerIndex', 0)}
											></button>
										</div>
										<input
											type="text"
											value={question.choices[0]}
											onChange={(e) => handleChoicesChange(question.id, 0, e.target.value)}
											placeholder={`Answer`}
											className="mr-[20px] w-full rounded-full bg-white px-[20px] py-[12px] text-[12px] text-[#919191]"
											required
										/>
									</div>
								) : (
									question.choices.map((choice, choice_index) => (
										<div className="mb-[15px] flex flex-col" key={choice_index}>
											<div className="flex items-center">
												<div className="mr-[20px] flex w-[3%] items-center">
													<button
														className={`h-[20px] w-[20px] cursor-pointer rounded-full bg-[#007AFF] transition-all ${
															question.correctAnswerIndex == choice_index
																? 'ring-2 ring-[#007AFF] ring-offset-3'
																: ''
														}`}
														onClick={() =>
															handleInputChange(question.id, 'correctAnswerIndex', choice_index)
														}
													></button>
												</div>
												<input
													type="text"
													value={question.choices[choice_index]}
													onChange={(e) =>
														handleChoicesChange(question.id, choice_index, e.target.value)
													}
													placeholder={`Choice ${choice_index + 1}`}
													className="mr-[20px] w-full rounded-full bg-white px-[20px] py-[12px] text-[12px] text-[#919191]"
													required
												/>
												<div className="flex w-[3%] items-center">
													<button
														className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full bg-[#FF605C]"
														onClick={() => removeChoice(question.id, choice_index)}
													>
														<FontAwesomeIcon
															icon={faXmark}
															className="h-[8px] w-[8px] text-black"
														/>
													</button>
												</div>
											</div>

											{/* Choice Image Upload */}
											<div className="mt-[10px] ml-[40px]">
												{question.choiceImagePreviews[choice_index] ? (
													<div className="relative">
														<img
															src={question.choiceImagePreviews[choice_index]}
															alt={`Choice ${choice_index + 1} preview`}
															className="h-[80px] w-full rounded-[8px] object-cover"
														/>
														<button
															onClick={() => removeChoiceImage(question.id, choice_index)}
															className="absolute top-1 right-1 flex h-[16px] w-[16px] cursor-pointer items-center justify-center rounded-full bg-[#FF605C]"
														>
															<FontAwesomeIcon
																icon={faXmark}
																className="h-[6px] w-[6px] text-white"
															/>
														</button>
													</div>
												) : (
													<label className="flex h-[60px] w-full cursor-pointer items-center justify-center rounded-[8px] border-2 border-dashed border-gray-300 transition-all hover:border-[#3C6B9F]">
														<input
															type="file"
															accept="image/*"
															onChange={(e) =>
																handleChoiceImageUpload(question.id, choice_index, e)
															}
															className="hidden"
														/>
														<div className="text-center">
															<FontAwesomeIcon
																icon={faPlus}
																className="mb-[2px] h-[12px] w-[12px] text-gray-400"
															/>
															<p className="text-[10px] text-gray-500">Add Image</p>
														</div>
													</label>
												)}
											</div>
										</div>
									))
								)}
							</div>
							<button
								className="mb-[20px] flex h-[20px] w-full cursor-pointer items-center justify-center rounded-full bg-[#00CA4E] transition-all hover:bg-[#00AA1E]"
								onClick={() => addChoice(question.id)}
							>
								<FontAwesomeIcon icon={faPlus} className="h-[8px] w-[8px] text-white" />
							</button>
						</div>
					))}
					<button
						className={`flex h-[30px] w-full cursor-pointer items-center justify-center rounded-full bg-[#00CA4E] transition-all hover:bg-[#00AA1E]`}
						onClick={addQuestion}
					>
						<FontAwesomeIcon icon={faPlus} className="h-[10px] w-[10px] text-white" />
					</button>
				</div>
				<div className="flex w-[29%] flex-col">
					<span className="mb-[10px] text-[16px] font-bold">Quiz Title</span>
					<button
						className={`mb-[10px] flex w-full items-center ${
							editQuizTitle ? 'bg-[#00CA4E]' : 'bg-[#EFF7FF]'
						} h-[40px] rounded-full p-[5px] transition-all`}
					>
						<div
							className="mr-[10px] flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full bg-white"
							onClick={() => {
								if (!editQuizTitle) {
									setQuizTitleInput(quizTitle);
								} else {
									setQuizTitleInput('');
								}
								setEditQuizTitle(!editQuizTitle);
							}}
						>
							{editQuizTitle ? (
								<FontAwesomeIcon
									icon={faXmark}
									className="h-[12px] w-[12px] text-black transition-all"
								/>
							) : (
								<FontAwesomeIcon
									icon={faEdit}
									className="h-[12px] w-[12px] text-black transition-all"
								/>
							)}
						</div>
						{editQuizTitle ? (
							<form
								onSubmit={updateQuizTitle}
								className="flex w-[87%] items-center justify-between"
							>
								<input
									type="text"
									value={quizTitleInput}
									onChange={(event) => handleQuizTitleChange(event)}
									className={`text-[12px] font-bold ${editQuizTitle ? 'text-white' : 'text-black'}`}
								/>
								<button
									type="submit"
									className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full bg-white"
								>
									<FontAwesomeIcon icon={faCheck} className="h-[12px] w-[12px] text-black" />
								</button>
							</form>
						) : (
							<span
								className={`text-[12px] font-bold ${editQuizTitle ? 'text-white' : 'text-black'}`}
							>
								{quizTitle}
							</span>
						)}
					</button>

					{/* Quiz Image Upload */}
					<span className="mb-[10px] text-[16px] font-bold">Quiz Image</span>
					{quizImagePreview ? (
						<div className="relative mb-[20px]">
							<img
								src={quizImagePreview}
								alt="Quiz preview"
								className="h-[120px] w-full rounded-[10px] object-cover"
							/>
							<button
								onClick={removeQuizImage}
								className="absolute top-2 right-2 flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full bg-[#FF605C]"
							>
								<FontAwesomeIcon icon={faXmark} className="h-[8px] w-[8px] text-white" />
							</button>
						</div>
					) : (
						<label className="mb-[20px] flex h-[80px] w-full cursor-pointer items-center justify-center rounded-[10px] border-2 border-dashed border-gray-300 transition-all hover:border-[#3C6B9F]">
							<input
								type="file"
								accept="image/*"
								onChange={handleQuizImageUpload}
								className="hidden"
							/>
							<div className="text-center">
								<FontAwesomeIcon
									icon={faPlus}
									className="mb-[5px] h-[16px] w-[16px] text-gray-400"
								/>
								<p className="text-[10px] text-gray-500">Add Quiz Image</p>
							</div>
						</label>
					)}

					<button
						onClick={handleCreateQuiz}
						className="mb-[30px] flex h-[40px] w-full cursor-pointer items-center justify-center rounded-full bg-[#00CA4E] font-bold text-white transition-all hover:bg-[#00AA1E]"
					>
						{loading ? (
							<div className="flex w-full items-center justify-center">
								<LoadingComponent size={12} light={false} />
							</div>
						) : (
							<span className="text-[14px]">Create Quiz</span>
						)}
					</button>
					<span className="mb-[10px] text-[16px] font-bold">AI-Quiz Generate</span>
					<input
						type="text"
						value={topic}
						placeholder="Topic"
						onChange={(e) => setTopic(e.target.value)}
						className="mb-[10px] h-[40x] w-full rounded-full bg-[#EFF7FF] px-[17px] py-[12px] text-[12px] font-bold text-[#919191]"
					/>
					<input
						type="number"
						name=""
						id=""
						placeholder="Number of Questions"
						onChange={(e) => setQuestionNumber(e.target.value)}
						max={15}
						className="mb-[10px] h-[40x] w-full rounded-full bg-[#EFF7FF] px-[17px] py-[12px] text-[12px] font-bold text-[#919191]"
					/>
					<button
						onClick={() => generateAIQuiz()}
						className="mb-[30px] flex h-[30px] w-full cursor-pointer items-center justify-center rounded-full bg-[#00CA4E] font-bold text-white transition-all hover:bg-[#00AA1E]"
					>
						<span className="text-[14px]">Generate</span>
					</button>

					<span className="mb-[10px] text-[16px] font-bold">Options</span>
					<div className="mb-[20px] flex flex-col gap-[10px]">
						<button
							className={`flex w-full items-center ${
								randomQuestionOrder ? 'bg-[#00CA4E]' : 'bg-[#FF605C]'
							} h-[30px] cursor-pointer rounded-full p-[5px] transition-all`}
							onClick={() => setRandomQuestionOrder(!randomQuestionOrder)}
						>
							<div className="mr-[10px] h-[20px] w-[20px] rounded-full bg-white"></div>
							<span className={'text-[12px] font-bold text-white'}>Randomize Questions</span>
						</button>
						<button
							className={`flex w-full items-center ${
								randomQuestionChoices ? 'bg-[#00CA4E]' : 'bg-[#FF605C]'
							} h-[30px] cursor-pointer rounded-full p-[5px]`}
							onClick={() => {
								setRandomQuestionChoices(!randomQuestionChoices);
								randomizeQuestionChoices(!randomQuestionChoices);
							}}
						>
							<div className="mr-[10px] h-[20px] w-[20px] rounded-full bg-white"></div>
							<span className="text-[12px] font-bold text-white">Randomize Choices</span>
						</button>
					</div>
					<span className="mb-[10px] text-[16px] font-bold">Quiz Type</span>
					<div className="mb-[20px] flex flex-col gap-[10px]">
						<button
							className={`flex w-full items-center ${
								quizType == 'flashcard' ? 'bg-[#FF605C]' : 'bg-[#00CA4E]'
							} h-[30px] cursor-pointer rounded-full p-[5px] transition-all`}
							onClick={() => setQuizType('list')}
						>
							<div className="mr-[10px] h-[20px] w-[20px] rounded-full bg-white"></div>
							<span className="text-[12px] font-bold text-white">List</span>
						</button>
						<button
							className={`flex w-full items-center ${
								quizType == 'list' ? 'bg-[#FF605C]' : 'bg-[#00CA4E]'
							} h-[30px] cursor-pointer rounded-full p-[5px] transition-all`}
							onClick={() => setQuizType('flashcard')}
						>
							<div className="mr-[10px] h-[20px] w-[20px] rounded-full bg-white"></div>
							<span className="text-[12px] font-bold text-white">Flashcard</span>
						</button>
					</div>
					<span className="mb-[10px] text-[16px] font-bold">Tag Color</span>
					<div className="mb-[20px] grid grid-cols-5 gap-[10px]">
						{colors.map((color) => (
							<label key={color.hex} className="relative cursor-pointer">
								<input
									type="radio"
									name="color"
									value={color.hex}
									checked={selectedColor === color.hex}
									onChange={() => setSelectedColor(color.hex)}
									className="hidden"
								/>
								<span
									className={`flex h-[20px] w-[20px] items-center justify-center rounded-full transition-all ${
										selectedColor === color.hex ? 'ring-2 ring-[#6F8055] ring-offset-2' : ''
									}`}
									style={{ backgroundColor: color.hex }}
								></span>
							</label>
						))}
					</div>
					<span className="mb-[10px] text-[16px] font-bold">Layout</span>
					<div className="mb-[20px] flex flex-col gap-[10px]">
						<button
							className={`flex w-full cursor-pointer items-center ${
								view == 'grid' ? 'bg-[#FF605C]' : 'bg-[#00CA4E]'
							} h-[30px] rounded-full p-[5px] transition-all`}
							onClick={() => setView('list')}
						>
							<div className="mr-[10px] h-[20px] w-[20px] rounded-full bg-white"></div>
							<span className="text-[12px] font-bold text-white">List</span>
						</button>
						<button
							className={`flex w-full cursor-pointer items-center ${
								view == 'list' ? 'bg-[#FF605C]' : 'bg-[#00CA4E]'
							} h-[30px] rounded-full p-[5px] transition-all`}
							onClick={() => setView('grid')}
						>
							<div className="mr-[10px] h-[20px] w-[20px] rounded-full bg-white"></div>
							<span className="text-[12px] font-bold text-white">Grid</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
