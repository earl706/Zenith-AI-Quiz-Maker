import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionCard from '../components/QuestionCard';
import MathRenderer from '../components/MathRenderer';
import QuizResultsPage from '../pages/QuizResultsPage';

// Mock MathRenderer for testing
jest.mock('../components/MathRenderer', () => {
	return function MockMathRenderer({ expression, displayMode }) {
		return (
			<div data-testid="math-renderer" data-expression={expression} data-display={displayMode}>
				Math: {expression}
			</div>
		);
	};
});

describe('Quiz Components', () => {
	describe('QuestionCard', () => {
		const mockQuestion = {
			id: 1,
			question: 'What is 2 + 2?',
			question_type: 'MUL',
			choices: ['3', '4', '5', '6'],
			correct_answer: '4'
		};

		const mockAnswers = [{ id: 1, userAnswer: '4' }];

		const mockHandlers = {
			handleAnswerChange: jest.fn(),
			handleIdentificationAnswerChange: jest.fn()
		};

		beforeEach(() => {
			jest.clearAllMocks();
		});

		test('should render multiple choice question correctly', () => {
			render(
				<QuestionCard
					question={mockQuestion}
					answers={mockAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
				/>
			);

			expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
			expect(screen.getByText('3')).toBeInTheDocument();
			expect(screen.getByText('4')).toBeInTheDocument();
			expect(screen.getByText('5')).toBeInTheDocument();
			expect(screen.getByText('6')).toBeInTheDocument();
		});

		test('should handle choice selection', () => {
			render(
				<QuestionCard
					question={mockQuestion}
					answers={mockAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
				/>
			);

			fireEvent.click(screen.getByText('4'));

			expect(mockHandlers.handleAnswerChange).toHaveBeenCalledWith(1, 'userAnswer', '4');
		});

		test('should render mathematical question with MathRenderer', () => {
			const mathQuestion = {
				...mockQuestion,
				question_type: 'MUL-COM',
				choices: ['x^2', 'x^3', 'x^4']
			};

			render(
				<QuestionCard
					question={mathQuestion}
					answers={mockAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
				/>
			);

			expect(screen.getAllByTestId('math-renderer')).toHaveLength(3);
			expect(screen.getByTestId('math-renderer')).toHaveAttribute('data-expression', 'x^2');
		});

		test('should render identification question', () => {
			const identificationQuestion = {
				...mockQuestion,
				question_type: 'IDE',
				choices: ['Answer']
			};

			render(
				<QuestionCard
					question={identificationQuestion}
					answers={mockAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
				/>
			);

			// Should render IdentificationAnswerInput instead of choices
			expect(screen.queryByText('3')).not.toBeInTheDocument();
			expect(screen.queryByText('4')).not.toBeInTheDocument();
		});

		test('should handle choice images', () => {
			const questionWithImages = {
				...mockQuestion,
				choices: [
					{ text: 'Choice A', image: 'image1.jpg' },
					{ text: 'Choice B', image: 'image2.jpg' }
				]
			};

			render(
				<QuestionCard
					question={questionWithImages}
					answers={mockAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
				/>
			);

			const images = screen.getAllByAltText(/Choice \d/);
			expect(images).toHaveLength(2);
			expect(images[0]).toHaveAttribute('src', 'image1.jpg');
			expect(images[1]).toHaveAttribute('src', 'image2.jpg');
		});
	});

	describe('MathRenderer', () => {
		test('should render mathematical expression', () => {
			render(<MathRenderer expression="x^2 + 2x + 1" displayMode={false} />);

			expect(screen.getByTestId('math-renderer')).toBeInTheDocument();
			expect(screen.getByTestId('math-renderer')).toHaveAttribute(
				'data-expression',
				'x^2 + 2x + 1'
			);
			expect(screen.getByTestId('math-renderer')).toHaveAttribute('data-display', 'false');
		});

		test('should render in display mode', () => {
			render(<MathRenderer expression="\\frac{1}{2}" displayMode={true} />);

			expect(screen.getByTestId('math-renderer')).toHaveAttribute('data-display', 'true');
		});

		test('should handle empty expression', () => {
			render(<MathRenderer expression="" displayMode={false} />);

			expect(screen.getByText('Empty')).toBeInTheDocument();
		});
	});

	describe('QuizResultsPage', () => {
		const mockQuestion = {
			id: 1,
			question: 'What is 2 + 2?',
			question_type: 'MUL',
			choices: ['3', '4', '5', '6'],
			correct_answer: '4'
		};

		const mockSubmittedAnswers = [
			{
				correctAnswer: '4',
				userAnswer: '4'
			}
		];

		beforeEach(() => {
			jest.clearAllMocks();
		});

		test('should render correct answer with green background', () => {
			render(
				<QuizResultsPage
					question={mockQuestion}
					answer={{ id: 1, userAnswer: '4' }}
					correct={true}
					submittedAnswers={mockSubmittedAnswers}
					index={0}
				/>
			);

			const correctChoice = screen.getByText('4');
			expect(correctChoice).toBeInTheDocument();
			expect(correctChoice.closest('div')).toHaveClass('bg-[#00CA4E]');
		});

		test('should render incorrect answer with red background', () => {
			const incorrectSubmittedAnswers = [
				{
					correctAnswer: '4',
					userAnswer: '3'
				}
			];

			render(
				<QuizResultsPage
					question={mockQuestion}
					answer={{ id: 1, userAnswer: '3' }}
					correct={false}
					submittedAnswers={incorrectSubmittedAnswers}
					index={0}
				/>
			);

			const incorrectChoice = screen.getByText('3');
			expect(incorrectChoice).toBeInTheDocument();
			expect(incorrectChoice.closest('div')).toHaveClass('bg-[#FF605C]');
		});

		test('should render identification question results', () => {
			const identificationQuestion = {
				...mockQuestion,
				question_type: 'IDE',
				choices: ['Answer']
			};

			render(
				<QuizResultsPage
					question={identificationQuestion}
					answer={{ id: 1, userAnswer: 'Answer' }}
					correct={true}
					submittedAnswers={mockSubmittedAnswers}
					index={0}
				/>
			);

			expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
			expect(screen.getByText('Your Answer:')).toBeInTheDocument();
		});

		test('should render mathematical question results', () => {
			const mathQuestion = {
				...mockQuestion,
				question_type: 'MUL-COM',
				choices: ['x^2', 'x^3', 'x^4']
			};

			render(
				<QuizResultsPage
					question={mathQuestion}
					answer={{ id: 1, userAnswer: 'x^2' }}
					correct={true}
					submittedAnswers={mockSubmittedAnswers}
					index={0}
				/>
			);

			expect(screen.getAllByTestId('math-renderer')).toHaveLength(3);
		});

		test('should handle question images', () => {
			const questionWithImage = {
				...mockQuestion,
				question_image: 'question.jpg'
			};

			render(
				<QuizResultsPage
					question={questionWithImage}
					answer={{ id: 1, userAnswer: '4' }}
					correct={true}
					submittedAnswers={mockSubmittedAnswers}
					index={0}
				/>
			);

			const questionImage = screen.getByAltText('Question');
			expect(questionImage).toBeInTheDocument();
			expect(questionImage).toHaveAttribute('src', 'question.jpg');
		});

		test('should handle choice images', () => {
			const questionWithChoiceImages = {
				...mockQuestion,
				choices: [
					{ text: 'Choice A', image: 'choice1.jpg' },
					{ text: 'Choice B', image: 'choice2.jpg' }
				]
			};

			render(
				<QuizResultsPage
					question={questionWithChoiceImages}
					answer={{ id: 1, userAnswer: 'Choice A' }}
					correct={true}
					submittedAnswers={mockSubmittedAnswers}
					index={0}
				/>
			);

			const choiceImages = screen.getAllByAltText(/Choice \d/);
			expect(choiceImages).toHaveLength(2);
			expect(choiceImages[0]).toHaveAttribute('src', 'choice1.jpg');
			expect(choiceImages[1]).toHaveAttribute('src', 'choice2.jpg');
		});
	});
});
