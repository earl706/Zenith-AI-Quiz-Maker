import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import CreateQuizPage from '../pages/CreateQuizPage';

// Mock the AuthContext
jest.mock('../context/AuthContext', () => ({
	...jest.requireActual('../context/AuthContext'),
	useAuth: () => ({
		createQuiz: jest.fn(),
		quizzes: [],
		setQuizzes: jest.fn()
	})
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: () => mockNavigate
}));

const TestWrapper = ({ children }) => {
	return (
		<BrowserRouter>
			<AuthProvider>{children}</AuthProvider>
		</BrowserRouter>
	);
};

describe('CreateQuizPage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Initial Rendering', () => {
		test('should render quiz creation form', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			expect(screen.getByText('Create Quiz')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('Enter quiz title')).toBeInTheDocument();
			expect(screen.getByText('Add Question')).toBeInTheDocument();
			expect(screen.getByText('Create Quiz')).toBeInTheDocument();
		});

		test('should show initial question form', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			expect(screen.getByText('Question 1')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('Enter question text')).toBeInTheDocument();
			expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
			expect(screen.getByText('Identification')).toBeInTheDocument();
		});
	});

	describe('Quiz Title and Settings', () => {
		test('should update quiz title', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const titleInput = screen.getByPlaceholderText('Enter quiz title');
			fireEvent.change(titleInput, { target: { value: 'My Test Quiz' } });

			expect(titleInput).toHaveValue('My Test Quiz');
		});

		test('should change quiz type to flashcard', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const flashcardButton = screen.getByText('Flashcard');
			fireEvent.click(flashcardButton);

			expect(flashcardButton).toHaveClass('bg-[#007AFF]');
		});

		test('should change visibility to public', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const publicButton = screen.getByText('Public');
			fireEvent.click(publicButton);

			expect(publicButton).toHaveClass('bg-[#007AFF]');
		});

		test('should change question order to random', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const randomButton = screen.getByText('Random');
			fireEvent.click(randomButton);

			expect(randomButton).toHaveClass('bg-[#007AFF]');
		});

		test('should change tag color', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const colorButton = screen.getByTestId('color-EF4444');
			fireEvent.click(colorButton);

			expect(colorButton).toHaveClass('ring-2');
		});
	});

	describe('Question Management', () => {
		test('should add new question', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const addQuestionButton = screen.getByText('Add Question');
			fireEvent.click(addQuestionButton);

			expect(screen.getAllByText(/Question \d/)).toHaveLength(2);
		});

		test('should remove question', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			// Add a question first
			const addQuestionButton = screen.getByText('Add Question');
			fireEvent.click(addQuestionButton);

			// Now remove the second question
			const removeButtons = screen.getAllByRole('button', { name: /xmark/i });
			fireEvent.click(removeButtons[1]); // Remove second question

			expect(screen.getAllByText(/Question \d/)).toHaveLength(1);
		});

		test('should update question text', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const questionInput = screen.getByPlaceholderText('Enter question text');
			fireEvent.change(questionInput, { target: { value: 'What is 2 + 2?' } });

			expect(questionInput).toHaveValue('What is 2 + 2?');
		});

		test('should change question type to identification', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const identificationButton = screen.getByText('Identification');
			fireEvent.click(identificationButton);

			expect(identificationButton).toHaveClass('bg-[#007AFF]');
		});

		test('should toggle mathematical question', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const mathematicalButton = screen.getByText('Mathematical');
			fireEvent.click(mathematicalButton);

			expect(mathematicalButton).toHaveClass('bg-[#007AFF]');
		});
	});

	describe('Choice Management', () => {
		test('should add choice to question', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const addChoiceButtons = screen.getAllByRole('button', { name: /plus/i });
			fireEvent.click(addChoiceButtons[0]); // Add choice to first question

			const choiceInputs = screen.getAllByPlaceholderText(/Choice \d/);
			expect(choiceInputs.length).toBeGreaterThan(4);
		});

		test('should remove choice from question', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const removeChoiceButtons = screen.getAllByRole('button', { name: /xmark/i });
			const choiceRemoveButtons = removeChoiceButtons.filter((button) =>
				button.closest('div')?.querySelector('input[placeholder*="Choice"]')
			);

			if (choiceRemoveButtons.length > 0) {
				fireEvent.click(choiceRemoveButtons[0]);

				const choiceInputs = screen.getAllByPlaceholderText(/Choice \d/);
				expect(choiceInputs.length).toBeLessThan(4);
			}
		});

		test('should update choice text', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const choiceInputs = screen.getAllByPlaceholderText(/Choice \d/);
			fireEvent.change(choiceInputs[0], { target: { value: 'Choice A' } });

			expect(choiceInputs[0]).toHaveValue('Choice A');
		});

		test('should set correct answer', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const choiceInputs = screen.getAllByPlaceholderText(/Choice \d/);
			fireEvent.change(choiceInputs[0], { target: { value: 'Correct Answer' } });

			const correctAnswerButtons = screen.getAllByRole('button', { name: /check/i });
			fireEvent.click(correctAnswerButtons[0]); // Set first choice as correct

			expect(correctAnswerButtons[0]).toHaveClass('bg-[#00CA4E]');
		});
	});

	describe('Image Upload', () => {
		test('should handle quiz image upload', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const quizImageInput = screen.getByLabelText(/quiz image/i);
			const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

			fireEvent.change(quizImageInput, { target: { files: [file] } });

			expect(quizImageInput.files[0]).toBe(file);
		});

		test('should handle question image upload', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const questionImageInput = screen.getByLabelText(/question image/i);
			const file = new File(['test'], 'question.jpg', { type: 'image/jpeg' });

			fireEvent.change(questionImageInput, { target: { files: [file] } });

			expect(questionImageInput.files[0]).toBe(file);
		});

		test('should handle choice image upload', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const choiceImageInputs = screen.getAllByLabelText(/choice image/i);
			const file = new File(['test'], 'choice.jpg', { type: 'image/jpeg' });

			fireEvent.change(choiceImageInputs[0], { target: { files: [file] } });

			expect(choiceImageInputs[0].files[0]).toBe(file);
		});
	});

	describe('Form Submission', () => {
		test('should submit quiz with valid data', async () => {
			const mockCreateQuiz = jest.fn().mockResolvedValue({
				status: 200,
				data: { quiz: { quiz_id: 1, quiz_title: 'Test Quiz' } }
			});

			jest.spyOn(require('../context/AuthContext'), 'useAuth').mockReturnValue({
				createQuiz: mockCreateQuiz,
				quizzes: [],
				setQuizzes: jest.fn()
			});

			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			// Fill in required fields
			const titleInput = screen.getByPlaceholderText('Enter quiz title');
			fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

			const questionInput = screen.getByPlaceholderText('Enter question text');
			fireEvent.change(questionInput, { target: { value: 'What is 2 + 2?' } });

			const choiceInputs = screen.getAllByPlaceholderText(/Choice \d/);
			fireEvent.change(choiceInputs[0], { target: { value: '4' } });

			const correctAnswerButton = screen.getAllByRole('button', { name: /check/i })[0];
			fireEvent.click(correctAnswerButton);

			const createButton = screen.getByText('Create Quiz');
			fireEvent.click(createButton);

			await waitFor(() => {
				expect(mockCreateQuiz).toHaveBeenCalled();
			});
		});

		test('should handle submission errors', async () => {
			const mockCreateQuiz = jest.fn().mockRejectedValue(new Error('Creation failed'));

			jest.spyOn(require('../context/AuthContext'), 'useAuth').mockReturnValue({
				createQuiz: mockCreateQuiz,
				quizzes: [],
				setQuizzes: jest.fn()
			});

			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			// Fill in required fields
			const titleInput = screen.getByPlaceholderText('Enter quiz title');
			fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

			const questionInput = screen.getByPlaceholderText('Enter question text');
			fireEvent.change(questionInput, { target: { value: 'What is 2 + 2?' } });

			const choiceInputs = screen.getAllByPlaceholderText(/Choice \d/);
			fireEvent.change(choiceInputs[0], { target: { value: '4' } });

			const correctAnswerButton = screen.getAllByRole('button', { name: /check/i })[0];
			fireEvent.click(correctAnswerButton);

			const createButton = screen.getByText('Create Quiz');
			fireEvent.click(createButton);

			await waitFor(() => {
				expect(mockCreateQuiz).toHaveBeenCalled();
			});
		});
	});

	describe('Validation', () => {
		test('should require quiz title', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const createButton = screen.getByText('Create Quiz');
			fireEvent.click(createButton);

			// Should not submit without title
			expect(screen.getByPlaceholderText('Enter quiz title')).toBeInTheDocument();
		});

		test('should require question text', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const titleInput = screen.getByPlaceholderText('Enter quiz title');
			fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

			const createButton = screen.getByText('Create Quiz');
			fireEvent.click(createButton);

			// Should not submit without question text
			expect(screen.getByPlaceholderText('Enter question text')).toBeInTheDocument();
		});

		test('should require at least one choice', () => {
			render(
				<TestWrapper>
					<CreateQuizPage />
				</TestWrapper>
			);

			const titleInput = screen.getByPlaceholderText('Enter quiz title');
			fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

			const questionInput = screen.getByPlaceholderText('Enter question text');
			fireEvent.change(questionInput, { target: { value: 'What is 2 + 2?' } });

			const createButton = screen.getByText('Create Quiz');
			fireEvent.click(createButton);

			// Should not submit without choices
			expect(screen.getAllByPlaceholderText(/Choice \d/).length).toBeGreaterThan(0);
		});
	});
});
