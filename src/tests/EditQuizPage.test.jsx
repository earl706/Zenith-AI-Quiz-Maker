import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import EditQuizPage from '../pages/EditQuizPage';
import API_QUIZZES from '../services/apiQuizzes';

// Mock the API service
jest.mock('../services/apiQuizzes');

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn()
}));

// Mock the API response
const mockQuizData = {
  data: {
    quiz_id: 1,
    quiz_title: 'Test Quiz',
    tag_color: '#EF4444',
    random_question_order: false,
    public: false,
    flashcard_quiz: false,
    quiz_image: 'quiz-image.jpg',
    date_created: '2024-01-01T00:00:00Z'
  },
  questions: [
    {
      id: 1,
      question: 'What is 2 + 2?',
      question_type: 'MUL',
      choices: ['3', '4', '5', '6'],
      correct_answer: '4',
      question_image: 'question1.jpg'
    },
    {
      id: 2,
      question: 'Solve for x: x^2 = 4',
      question_type: 'MUL-COM',
      choices: ['x = 2', 'x = -2', 'x = ±2'],
      correct_answer: 'x = ±2'
    }
  ]
};

const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('EditQuizPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Data Loading', () => {
    test('should load quiz data on mount', async () => {
      API_QUIZZES.get.mockResolvedValue(mockQuizData);

      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(API_QUIZZES.get).toHaveBeenCalledWith('1/', {
          params: { randomize: false }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });
    });

    test('should handle loading state', () => {
      API_QUIZZES.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should handle API errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      API_QUIZZES.get.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Quiz Title Editing', () => {
    beforeEach(async () => {
      API_QUIZZES.get.mockResolvedValue(mockQuizData);
    });

    test('should allow editing quiz title', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      const titleInput = screen.getByDisplayValue('Test Quiz');
      fireEvent.change(titleInput, { target: { value: 'Updated Quiz Title' } });

      const saveButton = screen.getByRole('button', { name: /check/i });
      fireEvent.click(saveButton);

      expect(screen.getByText('Updated Quiz Title')).toBeInTheDocument();
    });

    test('should cancel title editing', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      const titleInput = screen.getByDisplayValue('Test Quiz');
      fireEvent.change(titleInput, { target: { value: 'Changed Title' } });

      const cancelButton = screen.getByRole('button', { name: /xmark/i });
      fireEvent.click(cancelButton);

      expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    });
  });

  describe('Quiz Settings', () => {
    beforeEach(async () => {
      API_QUIZZES.get.mockResolvedValue(mockQuizData);
    });

    test('should change quiz type', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const flashcardButton = screen.getByText('Flashcard');
      fireEvent.click(flashcardButton);

      expect(flashcardButton).toHaveClass('bg-[#007AFF]');
    });

    test('should change visibility', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const publicButton = screen.getByText('Public');
      fireEvent.click(publicButton);

      expect(publicButton).toHaveClass('bg-[#007AFF]');
    });

    test('should change question order', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const randomButton = screen.getByText('Random');
      fireEvent.click(randomButton);

      expect(randomButton).toHaveClass('bg-[#007AFF]');
    });
  });

  describe('Question Management', () => {
    beforeEach(async () => {
      API_QUIZZES.get.mockResolvedValue(mockQuizData);
    });

    test('should add new question', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const addQuestionButton = screen.getByText('Add Question');
      fireEvent.click(addQuestionButton);

      // Should now have 3 questions (2 original + 1 new)
      expect(screen.getAllByText(/Question \d/)).toHaveLength(3);
    });

    test('should remove question', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole('button', { name: /xmark/i });
      fireEvent.click(removeButtons[0]); // Remove first question

      // Should now have 1 question
      expect(screen.getAllByText(/Question \d/)).toHaveLength(1);
    });

    test('should edit question text', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const questionInputs = screen.getAllByPlaceholderText('Enter question text');
      fireEvent.change(questionInputs[0], { target: { value: 'Updated question text' } });

      expect(questionInputs[0]).toHaveValue('Updated question text');
    });

    test('should change question type', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const identificationButton = screen.getByText('Identification');
      fireEvent.click(identificationButton);

      expect(identificationButton).toHaveClass('bg-[#007AFF]');
    });
  });

  describe('Choice Management', () => {
    beforeEach(async () => {
      API_QUIZZES.get.mockResolvedValue(mockQuizData);
    });

    test('should add choice to question', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const addChoiceButtons = screen.getAllByRole('button', { name: /plus/i });
      fireEvent.click(addChoiceButtons[0]); // Add choice to first question

      // Should have more choice inputs
      const choiceInputs = screen.getAllByPlaceholderText(/Choice \d/);
      expect(choiceInputs.length).toBeGreaterThan(4);
    });

    test('should remove choice from question', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const removeChoiceButtons = screen.getAllByRole('button', { name: /xmark/i });
      const choiceRemoveButtons = removeChoiceButtons.filter(button => 
        button.closest('div')?.querySelector('input[placeholder*="Choice"]')
      );

      if (choiceRemoveButtons.length > 0) {
        fireEvent.click(choiceRemoveButtons[0]);
        
        // Should have fewer choice inputs
        const choiceInputs = screen.getAllByPlaceholderText(/Choice \d/);
        expect(choiceInputs.length).toBeLessThan(4);
      }
    });

    test('should edit choice text', async () => {
      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const choiceInputs = screen.getAllByPlaceholderText(/Choice \d/);
      fireEvent.change(choiceInputs[0], { target: { value: 'Updated choice' } });

      expect(choiceInputs[0]).toHaveValue('Updated choice');
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      API_QUIZZES.get.mockResolvedValue(mockQuizData);
    });

    test('should submit updated quiz data', async () => {
      const mockUpdateResponse = {
        status: 200,
        data: { quiz: { quiz_id: 1, quiz_title: 'Updated Quiz' } }
      };
      API_QUIZZES.put.mockResolvedValue(mockUpdateResponse);

      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(API_QUIZZES.put).toHaveBeenCalledWith('quiz/update/1/', expect.any(Object));
      });
    });

    test('should handle submission errors', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      API_QUIZZES.put.mockRejectedValue(new Error('Update failed'));

      render(
        <TestWrapper>
          <EditQuizPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
}); 