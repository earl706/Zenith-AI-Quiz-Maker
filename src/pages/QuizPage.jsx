import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Play, Pencil } from 'lucide-react';

import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, Card, CardBody, CardHeader, Badge, LoadingScreen } from '../components/ui';
import MathRenderer from '../components/quiz/MathRenderer';
import AttemptAccuracyDoughnutGraph from '../components/quiz/AttemptAccuracyDoughnutGraph';

export default function QuizPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [quizData, setQuizData] = useState(null);
	const [questions, setQuestions] = useState([]);
	const [attempts, setAttempts] = useState([]);

	useEffect(() => {
		const fetchQuiz = async () => {
			try {
				setLoading(true);
				const response = await api
					.get(`/quizzes/quiz/summary/${id}/`)
					.catch(() => api.get(`/quizzes/quiz/${id}/`));
				const data = response.data;
				setQuizData(data.data || data);
				setQuestions(data.questions || data.data?.questions || []);
				setAttempts(data.attempts || []);
			} catch {
				navigate('/quizzes');
			} finally {
				setLoading(false);
			}
		};
		fetchQuiz();
	}, [id, navigate]);

	if (loading || !quizData) return <LoadingScreen />;

	return (
		<div>
			<PageHeader
				title={quizData.quiz_title}
				icon={BookOpen}
				actions={
					<div className="flex gap-2">
						<Button variant="secondary" onClick={() => navigate(`/quizzes/edit/${id}`)}>
							<Pencil size={14} /> Edit
						</Button>
						<Button onClick={() => navigate(`/quizzes/attempt/${id}`)}>
							<Play size={14} /> Attempt
						</Button>
					</div>
				}
			/>

			{quizData.quiz_image && (
				<div className="mb-6 flex justify-center">
					<img
						src={quizData.quiz_image}
						alt="Quiz"
						className="max-h-52 w-auto rounded-lg object-cover shadow-md"
					/>
				</div>
			)}

			<div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
				{[
					{ label: 'Questions', value: questions.length || quizData.questions?.length || 0 },
					{ label: 'Type', value: quizData.flashcard_quiz ? 'Flashcard' : 'List' },
					{ label: 'Created', value: formatDate(quizData.created_at || quizData.date_created) },
					{ label: 'Sequence', value: quizData.random_question_order ? 'Random' : 'Ordered' }
				].map(({ label, value }) => (
					<Card key={label} className="p-4 text-center">
						<p className="text-muted text-xs">{label}</p>
						<p className="text-fg font-semibold">{value}</p>
					</Card>
				))}
			</div>

			<div className="flex flex-col gap-8 lg:flex-row">
				<div className="flex-1 space-y-4">
					<h2 className="text-fg text-lg font-bold">Questions</h2>
					{questions.map((question, index) => (
						<Card key={index}>
							<CardBody className="space-y-3 p-5">
								<p className="text-fg text-center font-semibold">{question.question}</p>

								{question.question_image && (
									<div className="flex justify-center">
										<img
											src={question.question_image}
											alt="Question"
											className="max-h-40 rounded-md object-cover"
										/>
									</div>
								)}

								<div className="flex flex-wrap justify-center gap-2">
									{question.choices.map((choice, ci) => {
										const choiceText = choice.text || choice;
										const choiceImage = choice.image;
										if (choiceText === '') return null;

										return (
											<div
												key={ci}
												className="bg-surface-2 flex min-w-[100px] flex-col items-center gap-2 rounded-md p-3"
											>
												{choiceImage && (
													<img
														src={choiceImage}
														alt={`Choice ${ci + 1}`}
														className="max-h-20 rounded-md object-cover"
													/>
												)}
												{question.question_type === 'COM' ||
												question.question_type === 'IDE-COM' ||
												question.question_type === 'MUL-COM' ? (
													<MathRenderer expression={choiceText} displayMode={false} />
												) : (
													<span className="text-fg text-sm font-medium">{choiceText}</span>
												)}
											</div>
										);
									})}
								</div>
							</CardBody>
						</Card>
					))}
				</div>

				<aside className="w-full shrink-0 lg:w-72">
					<h2 className="text-fg mb-3 text-lg font-bold">Attempts</h2>
					{attempts.length === 0 ? (
						<Card className="p-6 text-center">
							<p className="text-muted text-sm">No attempts yet.</p>
						</Card>
					) : (
						<div className="space-y-3">
							{attempts.map((attempt, index) => (
								<Card key={index} className="flex items-center gap-3 p-4">
									<div className="h-14 w-14 shrink-0">
										<AttemptAccuracyDoughnutGraph
											data_points={[attempt.score || 30, attempt.total - attempt.score || 20]}
										/>
									</div>
									<div className="min-w-0 flex-1 text-xs">
										<div className="flex justify-between">
											<span className="text-muted">Date</span>
											<span className="text-fg">
												{attempt.date || formatDate(attempt.attempt_datetime)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted">Score</span>
											<span className="text-fg">{attempt.ratio || attempt.score || '—'}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted">Accuracy</span>
											<span className="text-fg">
												{attempt.percentage || attempt.accuracy || '—'}
											</span>
										</div>
									</div>
								</Card>
							))}
						</div>
					)}
				</aside>
			</div>
		</div>
	);
}
