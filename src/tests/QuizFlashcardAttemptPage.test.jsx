import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuizFlashcardAttemptPage from '../pages/QuizFlashcardAttemptPage';

// Mock MathRenderer
jest.mock('../components/MathRenderer', () => {
	return function MockMathRenderer({ expression, displayMode }) {
		return (
			<div data-testid="math-renderer" data-expression={expression} data-display={displayMode}>
				Math: {expression}
			</div>
		);
	};
});

describe('QuizFlashcardAttemptPage', () => {
	const mockQuestions = [
		{
			id: 1,
			question: 'What is 2 + 2?',
			question_type: 'MUL',
			choices: ['3', '4', '5', '6'],
			correct_answer: '4'
		},
		{
			id: 2,
			question: 'Solve for x: x^2 = 4',
			question_type: 'MUL-COM',
			choices: ['x = 2', 'x = -2', 'x = ±2'],
			correct_answer: 'x = ±2'
		},
		{
			id: 3,
			question: 'What is the capital of France?',
			question_type: 'IDE',
			choices: ['Answer']
		}
	];

	const mockAnswers = [
		{ id: 1, userAnswer: '' },
		{ id: 2, userAnswer: '' },
		{ id: 3, userAnswer: '' }
	];

	const mockHandlers = {
		submitAnswers: jest.fn(),
		handleAnswerChange: jest.fn(),
		handleIdentificationAnswerChange: jest.fn()
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Navigation', () => {
		test('should navigate to next question', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			// Should start with first question
			expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
			expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();

			// Click next
			fireEvent.click(screen.getByText('Next'));

			// Should show second question
			expect(screen.getByText('Solve for x: x^2 = 4')).toBeInTheDocument();
			expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
		});

		test('should navigate to previous question', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			// Go to second question first
			fireEvent.click(screen.getByText('Next'));

			// Then go back
			fireEvent.click(screen.getByText('Prev'));

			// Should be back to first question
			expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
			expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
		});

		test('should wrap around to first question when navigating past last question', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			// Navigate to last question
			fireEvent.click(screen.getByText('Next'));
			fireEvent.click(screen.getByText('Next'));

			// Should be on third question
			expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
			expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();

			// Navigate to next (should wrap to first)
			fireEvent.click(screen.getByText('Next'));

			// Should be back to first question
			expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
			expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
		});

		test('should wrap around to last question when navigating before first question', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			// Navigate to previous (should wrap to last)
			fireEvent.click(screen.getByText('Prev'));

			// Should be on last question
			expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
			expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
		});
	});

	describe('Question Rendering', () => {
		test('should render multiple choice question correctly', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
			expect(screen.getByText('3')).toBeInTheDocument();
			expect(screen.getByText('4')).toBeInTheDocument();
			expect(screen.getByText('5')).toBeInTheDocument();
			expect(screen.getByText('6')).toBeInTheDocument();
		});

		test('should render mathematical question with MathRenderer', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			// Navigate to second question (mathematical)
			fireEvent.click(screen.getByText('Next'));

			expect(screen.getByText('Solve for x: x^2 = 4')).toBeInTheDocument();
			expect(screen.getAllByTestId('math-renderer')).toHaveLength(3);
		});

		test('should render identification question', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			// Navigate to third question (identification)
			fireEvent.click(screen.getByText('Next'));
			fireEvent.click(screen.getByText('Next'));

			expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
			// Should not show multiple choice buttons for identification
			expect(screen.queryByText('3')).not.toBeInTheDocument();
			expect(screen.queryByText('4')).not.toBeInTheDocument();
		});

		test('should handle question images', () => {
			const questionsWithImages = [
				{
					...mockQuestions[0],
					question_image: 'question1.jpg'
				}
			];

			render(
				<QuizFlashcardAttemptPage
					questionsParam={questionsWithImages}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			const questionImage = screen.getByAltText('Question');
			expect(questionImage).toBeInTheDocument();
			expect(questionImage).toHaveAttribute('src', 'question1.jpg');
		});

		test('should handle choice images', () => {
			const questionsWithChoiceImages = [
				{
					...mockQuestions[0],
					choices: [
						{ text: 'Choice A', image: 'choice1.jpg' },
						{ text: 'Choice B', image: 'choice2.jpg' }
					]
				}
			];

			render(
				<QuizFlashcardAttemptPage
					questionsParam={questionsWithChoiceImages}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			const choiceImages = screen.getAllByAltText(/Choice \d/);
			expect(choiceImages).toHaveLength(2);
			expect(choiceImages[0]).toHaveAttribute('src', 'choice1.jpg');
			expect(choiceImages[1]).toHaveAttribute('src', 'choice2.jpg');
		});
	});

	describe('Answer Handling', () => {
		test('should handle choice selection for multiple choice', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			fireEvent.click(screen.getByText('4'));

			expect(mockHandlers.handleAnswerChange).toHaveBeenCalledWith(1, 'userAnswer', '4');
		});

		test('should highlight selected choice', () => {
			const answersWithSelection = [
				{ id: 1, userAnswer: '4' },
				{ id: 2, userAnswer: '' },
				{ id: 3, userAnswer: '' }
			];

			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={answersWithSelection}
				/>
			);

			const selectedChoice = screen.getByText('4');
			expect(selectedChoice.closest('button')).toHaveClass('bg-[#007AFF]');
		});

		test('should handle mathematical choice selection', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			// Navigate to mathematical question
			fireEvent.click(screen.getByText('Next'));

			// Click on a mathematical choice
			const mathChoice = screen.getByText('x = 2');
			fireEvent.click(mathChoice);

			expect(mockHandlers.handleAnswerChange).toHaveBeenCalledWith(2, 'userAnswer', 'x = 2');
		});
	});

	describe('Submit Functionality', () => {
		test('should call submitAnswers when submit button is clicked', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			fireEvent.click(screen.getByText('Submit'));

			expect(mockHandlers.submitAnswers).toHaveBeenCalled();
		});
	});

	describe('Loading State', () => {
		test('should show loading when no current question', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={[]}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={[]}
				/>
			);

			expect(screen.getByText('Loading...')).toBeInTheDocument();
		});
	});

	describe('Question Counter', () => {
		test('should display correct question counter', () => {
			render(
				<QuizFlashcardAttemptPage
					questionsParam={mockQuestions}
					submitAnswers={mockHandlers.submitAnswers}
					handleAnswerChange={mockHandlers.handleAnswerChange}
					handleIdentificationAnswerChange={mockHandlers.handleIdentificationAnswerChange}
					answers={mockAnswers}
				/>
			);

			expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();

			// Navigate to second question
			fireEvent.click(screen.getByText('Next'));
			expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();

			// Navigate to third question
			fireEvent.click(screen.getByText('Next'));
			expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
		});
	});
});
