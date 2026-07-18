import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Plus, X, Save, ArrowLeft, Pencil } from 'lucide-react';

import { api } from '../lib/api';
import { invalidateQuizQueries } from '../lib/resources';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, Card, CardBody, CardHeader, Input, LoadingScreen } from '../components/ui';
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
	const [originalQuizImage, setOriginalQuizImage] = useState(null);
	const [questions, setQuestions] = useState([]);
	const [isPublic, setIsPublic] = useState(false);

	useEffect(() => {
		const loadQuizData = async () => {
			try {
				setLoading(true);
				const response = await api.get(`/quizzes/quiz/${id}/`);
				const quizData = response.data.data || response.data;
				const questionsData = response.data.questions || quizData.questions || [];

				setQuizTitle(quizData.quiz_title);
				setSelectedColor(quizData.tag_color);
				setRandomQuestionOrder(quizData.random_question_order);
				setIsPublic(quizData.public);
				setQuizType(quizData.flashcard_quiz ? 'flashcard' : 'list');
				setOriginalQuizImage(quizData.quiz_image);
				setQuizImagePreview(quizData.quiz_image);

				const transformedQuestions = questionsData.map((question, index) => {
					const transformedChoices = question.choices.map((choice) =>
						typeof choice === 'object' && choice !== null ? choice.text || choice : choice
					);
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
			} catch {
				setLoading(false);
				toast.error('Could not load quiz.');
				navigate('/quizzes');
			}
		};
		loadQuizData();
	}, [id, navigate]);

	const handleInputChange = (qid, field, value) => {
		setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, [field]: value } : q)));
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
							choiceImagePreviews: q.choiceImagePreviews.filter((_, i) => i !== index)
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
							choiceImagePreviews: [...q.choiceImagePreviews, null]
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

	const addQuestion = () => {
		setQuestions((qs) => [
			...qs,
			{
				id: qs.length + 1,
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

	const fileToBase64 = (file) =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
		});

	const handleUpdateQuiz = async (e) => {
		e.preventDefault();
		try {
			setSaving(true);
			const quizData = {
				quiz_title: quizTitle,
				public: isPublic,
				randomQuestions: randomQuestionOrder,
				tag_color: selectedColor,
				quizType: quizType === 'flashcard' ? 'flashcard' : 'quiz'
			};

			if (quizImage) {
				quizData.quiz_image = await fileToBase64(quizImage);
			} else if (originalQuizImage) {
				quizData.quiz_image = originalQuizImage;
			}

			quizData.questions = await Promise.all(
				questions.map(async (question) => {
					const qData = {
						title: question.title,
						correctAnswerIndex: question.correctAnswerIndex,
						randomChoices: question.randomChoices,
						identification: question.identification,
						mathematical: question.mathematical,
						hasChoiceImages: question.hasChoiceImages,
						choices: question.choices
					};
					if (question.question_image) {
						qData.question_image = await fileToBase64(question.question_image);
					} else if (question.question_image_preview) {
						qData.question_image = question.question_image_preview;
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
		<div>
			<PageHeader
				title="Edit Quiz"
				icon={Pencil}
				description={quizTitle}
				actions={
					<Button variant="secondary" onClick={() => navigate(`/quizzes/${id}`)}>
						<ArrowLeft size={14} /> Back
					</Button>
				}
			/>

			<div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
				<div className="flex flex-1 flex-col gap-4">
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
									placeholder="Enter question text"
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
											className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${question[key] ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-fg hover:bg-line'}`}
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
												value={question.choices[0] || ''}
												onChange={(e) => handleChoicesChange(question.id, 0, e.target.value)}
												placeholder="Answer"
												className="border-line bg-surface text-fg focus:border-primary flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
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
												/>
												{question.choices.length > 2 && (
													<Button
														variant="ghost"
														size="icon"
														onClick={() => removeChoice(question.id, ci)}
													>
														<X size={14} className="text-danger" />
													</Button>
												)}
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

					<Button className="w-full" loading={saving} onClick={handleUpdateQuiz}>
						<Save size={16} /> Save Changes
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

							<div>
								<span className="text-fg mb-1.5 block text-sm font-medium">Quiz Type</span>
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
							</div>

							<div>
								<span className="text-fg mb-1.5 block text-sm font-medium">Tag Color</span>
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
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardHeader title="Preview" />
						<CardBody className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted">Questions</span>
								<span className="text-fg font-medium">{questions.length}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted">Type</span>
								<span className="text-fg font-medium capitalize">{quizType}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted">Visibility</span>
								<span className="text-fg font-medium">{isPublic ? 'Public' : 'Private'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted">Sequence</span>
								<span className="text-fg font-medium">
									{randomQuestionOrder ? 'Random' : 'Ordered'}
								</span>
							</div>
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);
}
