import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';

// Mock the AuthContext
const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../context/AuthContext', () => ({
	...jest.requireActual('../context/AuthContext'),
	useAuth: () => ({
		login: mockLogin,
		user: null,
		isAuthenticated: false
	})
}));

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

describe('LoginPage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Initial Rendering', () => {
		test('should render login form', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			expect(screen.getByText('Login')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
		});

		test('should show registration link', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
			expect(screen.getByText('Register here')).toBeInTheDocument();
		});

		test('should show forgot password link', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
		});
	});

	describe('Form Input Handling', () => {
		test('should update username input', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const usernameInput = screen.getByPlaceholderText('Username');
			fireEvent.change(usernameInput, { target: { value: 'testuser' } });

			expect(usernameInput).toHaveValue('testuser');
		});

		test('should update password input', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const passwordInput = screen.getByPlaceholderText('Password');
			fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

			expect(passwordInput).toHaveValue('testpassword');
		});

		test('should toggle password visibility', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const passwordInput = screen.getByPlaceholderText('Password');
			const toggleButton = screen.getByRole('button', { name: /toggle password/i });

			// Initially password should be hidden
			expect(passwordInput).toHaveAttribute('type', 'password');

			// Click toggle button
			fireEvent.click(toggleButton);

			// Password should be visible
			expect(passwordInput).toHaveAttribute('type', 'text');

			// Click toggle button again
			fireEvent.click(toggleButton);

			// Password should be hidden again
			expect(passwordInput).toHaveAttribute('type', 'password');
		});
	});

	describe('Form Validation', () => {
		test('should show error for empty username', async () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const loginButton = screen.getByRole('button', { name: /login/i });
			fireEvent.click(loginButton);

			await waitFor(() => {
				expect(screen.getByText('Username is required')).toBeInTheDocument();
			});
		});

		test('should show error for empty password', async () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const usernameInput = screen.getByPlaceholderText('Username');
			fireEvent.change(usernameInput, { target: { value: 'testuser' } });

			const loginButton = screen.getByRole('button', { name: /login/i });
			fireEvent.click(loginButton);

			await waitFor(() => {
				expect(screen.getByText('Password is required')).toBeInTheDocument();
			});
		});

		test('should show error for short password', async () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const usernameInput = screen.getByPlaceholderText('Username');
			const passwordInput = screen.getByPlaceholderText('Password');

			fireEvent.change(usernameInput, { target: { value: 'testuser' } });
			fireEvent.change(passwordInput, { target: { value: '123' } });

			const loginButton = screen.getByRole('button', { name: /login/i });
			fireEvent.click(loginButton);

			await waitFor(() => {
				expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
			});
		});

		test('should clear errors when user starts typing', async () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const loginButton = screen.getByRole('button', { name: /login/i });
			fireEvent.click(loginButton);

			await waitFor(() => {
				expect(screen.getByText('Username is required')).toBeInTheDocument();
			});

			const usernameInput = screen.getByPlaceholderText('Username');
			fireEvent.change(usernameInput, { target: { value: 'testuser' } });

			await waitFor(() => {
				expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
			});
		});
	});

	describe('Form Submission', () => {
		test('should call login function with valid credentials', async () => {
			mockLogin.mockResolvedValue({ status: 200 });

			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const usernameInput = screen.getByPlaceholderText('Username');
			const passwordInput = screen.getByPlaceholderText('Password');

			fireEvent.change(usernameInput, { target: { value: 'testuser' } });
			fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });

			const loginButton = screen.getByRole('button', { name: /login/i });
			fireEvent.click(loginButton);

			await waitFor(() => {
				expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpassword123');
			});
		});

		test('should show loading state during submission', async () => {
			mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const usernameInput = screen.getByPlaceholderText('Username');
			const passwordInput = screen.getByPlaceholderText('Password');

			fireEvent.change(usernameInput, { target: { value: 'testuser' } });
			fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });

			const loginButton = screen.getByRole('button', { name: /login/i });
			fireEvent.click(loginButton);

			expect(screen.getByText('Logging in...')).toBeInTheDocument();
			expect(loginButton).toBeDisabled();
		});

		test('should handle successful login', async () => {
			mockLogin.mockResolvedValue({ status: 200 });

			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const usernameInput = screen.getByPlaceholderText('Username');
			const passwordInput = screen.getByPlaceholderText('Password');

			fireEvent.change(usernameInput, { target: { value: 'testuser' } });
			fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });

			const loginButton = screen.getByRole('button', { name: /login/i });
			fireEvent.click(loginButton);

			await waitFor(() => {
				expect(mockLogin).toHaveBeenCalled();
			});
		});

		test('should handle login errors', async () => {
			const errorMessage = 'Invalid credentials';
			mockLogin.mockRejectedValue(new Error(errorMessage));

			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const usernameInput = screen.getByPlaceholderText('Username');
			const passwordInput = screen.getByPlaceholderText('Password');

			fireEvent.change(usernameInput, { target: { value: 'testuser' } });
			fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });

			const loginButton = screen.getByRole('button', { name: /login/i });
			fireEvent.click(loginButton);

			await waitFor(() => {
				expect(screen.getByText(errorMessage)).toBeInTheDocument();
			});
		});

		test('should handle network errors', async () => {
			const networkError = 'Network error occurred';
			mockLogin.mockRejectedValue(new Error(networkError));

			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const usernameInput = screen.getByPlaceholderText('Username');
			const passwordInput = screen.getByPlaceholderText('Password');

			fireEvent.change(usernameInput, { target: { value: 'testuser' } });
			fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });

			const loginButton = screen.getByRole('button', { name: /login/i });
			fireEvent.click(loginButton);

			await waitFor(() => {
				expect(screen.getByText(networkError)).toBeInTheDocument();
			});
		});
	});

	describe('Navigation', () => {
		test('should navigate to registration page', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const registerLink = screen.getByText('Register here');
			fireEvent.click(registerLink);

			expect(mockNavigate).toHaveBeenCalledWith('/register');
		});

		test('should navigate to forgot password page', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const forgotPasswordLink = screen.getByText('Forgot Password?');
			fireEvent.click(forgotPasswordLink);

			expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
		});
	});

	describe('Accessibility', () => {
		test('should have proper form labels', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			expect(screen.getByLabelText('Username')).toBeInTheDocument();
			expect(screen.getByLabelText('Password')).toBeInTheDocument();
		});

		test('should have proper button types', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const loginButton = screen.getByRole('button', { name: /login/i });
			expect(loginButton).toHaveAttribute('type', 'submit');
		});

		test('should have proper input types', () => {
			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const usernameInput = screen.getByPlaceholderText('Username');
			const passwordInput = screen.getByPlaceholderText('Password');

			expect(usernameInput).toHaveAttribute('type', 'text');
			expect(passwordInput).toHaveAttribute('type', 'password');
		});
	});

	describe('Form Reset', () => {
		test('should clear form after successful submission', async () => {
			mockLogin.mockResolvedValue({ status: 200 });

			render(
				<TestWrapper>
					<LoginPage />
				</TestWrapper>
			);

			const usernameInput = screen.getByPlaceholderText('Username');
			const passwordInput = screen.getByPlaceholderText('Password');

			fireEvent.change(usernameInput, { target: { value: 'testuser' } });
			fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });

			const loginButton = screen.getByRole('button', { name: /login/i });
			fireEvent.click(loginButton);

			await waitFor(() => {
				expect(mockLogin).toHaveBeenCalled();
			});

			// Form should be cleared after successful submission
			expect(usernameInput).toHaveValue('');
			expect(passwordInput).toHaveValue('');
		});
	});
});
