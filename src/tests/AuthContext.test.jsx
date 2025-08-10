import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import API from '../services/api';
import API_QUIZZES from '../services/apiQuizzes';

// Mock the API services
jest.mock('../services/api');
jest.mock('../services/apiQuizzes');

const mockAPI = API;
const mockAPIQuizzes = API_QUIZZES;

// Test wrapper component
const TestComponent = ({ children }) => {
	return <AuthProvider>{children}</AuthProvider>;
};

// Custom hook to access context
const useAuth = () => {
	const context = React.useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

describe('AuthContext', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		localStorage.clear();
	});

	describe('Token Management', () => {
		test('should store tokens in localStorage after login', async () => {
			const mockLoginResponse = {
				data: {
					access: 'mock-access-token',
					refresh: 'mock-refresh-token',
					user_data: { id: 1, username: 'testuser' }
				}
			};

			mockAPI.post.mockResolvedValue(mockLoginResponse);

			const TestLogin = () => {
				const { login } = useAuth();

				const handleLogin = async () => {
					await login('testuser', 'password');
				};

				return <button onClick={handleLogin}>Login</button>;
			};

			render(
				<TestComponent>
					<TestLogin />
				</TestComponent>
			);

			fireEvent.click(screen.getByText('Login'));

			await waitFor(() => {
				expect(localStorage.getItem('zenithQuizMakerAccessToken')).toBe('mock-access-token');
				expect(localStorage.getItem('zenithQuizMakerRefreshToken')).toBe('mock-refresh-token');
				expect(localStorage.getItem('userData')).toBe(
					JSON.stringify({ id: 1, username: 'testuser' })
				);
			});
		});

		test('should clear tokens on logout', () => {
			// Set up initial tokens
			localStorage.setItem('zenithQuizMakerAccessToken', 'test-token');
			localStorage.setItem('zenithQuizMakerRefreshToken', 'test-refresh');
			localStorage.setItem('userData', '{"id": 1}');

			const TestLogout = () => {
				const { logout } = useAuth();
				return <button onClick={logout}>Logout</button>;
			};

			render(
				<TestComponent>
					<TestLogout />
				</TestComponent>
			);

			fireEvent.click(screen.getByText('Logout'));

			expect(localStorage.getItem('zenithQuizMakerAccessToken')).toBeNull();
			expect(localStorage.getItem('zenithQuizMakerRefreshToken')).toBeNull();
			expect(localStorage.getItem('userData')).toBeNull();
		});

		test('should check if token is expired', () => {
			const TestTokenCheck = () => {
				const { isTokenExpired } = useAuth();

				// Create a token that expires in the past
				const expiredToken =
					'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MzQ1Njc4NzF9.signature';

				return (
					<div>
						<span data-testid="expired">{isTokenExpired(expiredToken).toString()}</span>
					</div>
				);
			};

			render(
				<TestComponent>
					<TestTokenCheck />
				</TestComponent>
			);

			expect(screen.getByTestId('expired').textContent).toBe('true');
		});
	});

	describe('API Calls', () => {
		test('should call login API with correct parameters', async () => {
			const mockLoginResponse = {
				data: {
					access: 'mock-access-token',
					refresh: 'mock-refresh-token',
					user_data: { id: 1, username: 'testuser' }
				}
			};

			mockAPI.post.mockResolvedValue(mockLoginResponse);

			const TestLogin = () => {
				const { login } = useAuth();

				const handleLogin = async () => {
					await login('testuser', 'password');
				};

				return <button onClick={handleLogin}>Login</button>;
			};

			render(
				<TestComponent>
					<TestLogin />
				</TestComponent>
			);

			fireEvent.click(screen.getByText('Login'));

			await waitFor(() => {
				expect(mockAPI.post).toHaveBeenCalledWith('api/users/login/', {
					username: 'testuser',
					password: 'password'
				});
			});
		});

		test('should call createQuiz API with correct data', async () => {
			const mockCreateResponse = {
				data: { quiz: { quiz_id: 1, quiz_title: 'Test Quiz' } }
			};

			mockAPIQuizzes.post.mockResolvedValue(mockCreateResponse);

			const TestCreateQuiz = () => {
				const { createQuiz } = useAuth();

				const handleCreate = async () => {
					const quizData = {
						quiz_title: 'Test Quiz',
						public: false,
						questions: []
					};
					await createQuiz(quizData);
				};

				return <button onClick={handleCreate}>Create Quiz</button>;
			};

			render(
				<TestComponent>
					<TestCreateQuiz />
				</TestComponent>
			);

			fireEvent.click(screen.getByText('Create Quiz'));

			await waitFor(() => {
				expect(mockAPIQuizzes.post).toHaveBeenCalledWith('quiz/', {
					quiz_title: 'Test Quiz',
					public: false,
					questions: []
				});
			});
		});

		test('should call updateQuiz API with correct data', async () => {
			const mockUpdateResponse = {
				data: { quiz: { quiz_id: 1, quiz_title: 'Updated Quiz' } }
			};

			mockAPIQuizzes.put.mockResolvedValue(mockUpdateResponse);

			const TestUpdateQuiz = () => {
				const { updateQuiz } = useAuth();

				const handleUpdate = async () => {
					const quizData = {
						quiz_title: 'Updated Quiz',
						public: true,
						questions: []
					};
					await updateQuiz(1, quizData);
				};

				return <button onClick={handleUpdate}>Update Quiz</button>;
			};

			render(
				<TestComponent>
					<TestUpdateQuiz />
				</TestComponent>
			);

			fireEvent.click(screen.getByText('Update Quiz'));

			await waitFor(() => {
				expect(mockAPIQuizzes.put).toHaveBeenCalledWith('quiz/update/1/', {
					quiz_title: 'Updated Quiz',
					public: true,
					questions: []
				});
			});
		});
	});

	describe('Error Handling', () => {
		test('should handle login errors gracefully', async () => {
			const mockError = new Error('Invalid credentials');
			mockAPI.post.mockRejectedValue(mockError);

			const TestLoginError = () => {
				const { login } = useAuth();
				const [error, setError] = React.useState(null);

				const handleLogin = async () => {
					try {
						await login('wronguser', 'wrongpass');
					} catch (err) {
						setError(err.message);
					}
				};

				return (
					<div>
						<button onClick={handleLogin}>Login</button>
						{error && <span data-testid="error">{error}</span>}
					</div>
				);
			};

			render(
				<TestComponent>
					<TestLoginError />
				</TestComponent>
			);

			fireEvent.click(screen.getByText('Login'));

			await waitFor(() => {
				expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
			});
		});

		test('should handle API errors in quiz operations', async () => {
			const mockError = new Error('Network error');
			mockAPIQuizzes.post.mockRejectedValue(mockError);

			const TestCreateError = () => {
				const { createQuiz } = useAuth();
				const [error, setError] = React.useState(null);

				const handleCreate = async () => {
					try {
						await createQuiz({});
					} catch (err) {
						setError(err.message);
					}
				};

				return (
					<div>
						<button onClick={handleCreate}>Create</button>
						{error && <span data-testid="error">{error}</span>}
					</div>
				);
			};

			render(
				<TestComponent>
					<TestCreateError />
				</TestComponent>
			);

			fireEvent.click(screen.getByText('Create'));

			await waitFor(() => {
				expect(screen.getByTestId('error').textContent).toBe('Network error');
			});
		});
	});
});
