import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';
import API_QUIZZES from '../services/apiQuizzes';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [deleteMode, setDeleteMode] = useState(false);
	const [quizzes, setQuizzes] = useState([]);
	const [quizAttempt, setQuizAttempt] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [quizDeleteData, setQuizDeleteData] = useState({
		quiz_id: '',
		questions: [],
		quiz_title: '',
		date_created: '',
		public: false,
		owner: 0
	});

	// Token management functions
	const getAccessToken = () => {
		return localStorage.getItem('zenithQuizMakerAccessToken');
	};

	const getRefreshToken = () => {
		return localStorage.getItem('zenithQuizMakerRefreshToken');
	};

	const setTokens = (access, refresh) => {
		localStorage.setItem('zenithQuizMakerAccessToken', access);
		localStorage.setItem('zenithQuizMakerRefreshToken', refresh);
	};

	const clearTokens = () => {
		localStorage.removeItem('zenithQuizMakerAccessToken');
		localStorage.removeItem('zenithQuizMakerRefreshToken');
		localStorage.removeItem('userData');
	};

	const isTokenExpired = (token) => {
		if (!token) return true;
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			return payload.exp * 1000 < Date.now();
		} catch (error) {
			return true;
		}
	};

	// Check authentication status on app load
	useEffect(() => {
		const checkAuthStatus = async () => {
			const accessToken = getAccessToken();
			const refreshToken = getRefreshToken();

			if (accessToken && !isTokenExpired(accessToken)) {
				setIsAuthenticated(true);
				const userData = localStorage.getItem('userData');
				if (userData) {
					setUser(JSON.parse(userData));
				}
			} else if (refreshToken) {
				// Try to refresh the token
				try {
					const response = await refreshToken(refreshToken);
					if (response.data) {
						setTokens(response.data.access, response.data.refresh);
						setIsAuthenticated(true);
						const userData = localStorage.getItem('userData');
						if (userData) {
							setUser(JSON.parse(userData));
						}
					}
				} catch (error) {
					// Refresh failed, clear tokens
					clearTokens();
					setIsAuthenticated(false);
					setUser(null);
				}
			}
		};

		checkAuthStatus();
	}, []);

	const logout = () => {
		clearTokens();
		setUser(null);
		setIsAuthenticated(false);
		// Optionally call logout endpoint to invalidate refresh token
		// API.post('api/users/logout/', { refresh: getRefreshToken() });
	};

	// resent verification email
	const resendVerification = async (email) => {
		try {
			const resend_verification_response = await API.post('api/users/email/resend/', {
				email: email
			});
		} catch (err) {
			return err;
		}
	};

	const login = async (username, password) => {
		try {
			const login_response = await API.post('api/users/login/', {
				username: username,
				password: password
			});
			console.log(login_response);

			// Store tokens securely
			setTokens(login_response.data.access, login_response.data.refresh);
			localStorage.setItem('userData', JSON.stringify(login_response.data.user_data));

			// Update authentication state
			setIsAuthenticated(true);
			setUser(login_response.data.user_data);

			return login_response;
		} catch (err) {
			console.log(err);
			return err;
		}
	};

	const refreshToken = async (refresh_token) => {
		try {
			const refresh_token_response = await API.post('api/users/token/refresh/', {
				refresh: refresh_token
			});

			// Update stored tokens if refresh was successful
			if (refresh_token_response.data && refresh_token_response.data.access) {
				setTokens(
					refresh_token_response.data.access,
					refresh_token_response.data.refresh || refresh_token
				);
			}

			return refresh_token_response;
		} catch (err) {
			// If refresh fails, clear tokens and logout
			clearTokens();
			setIsAuthenticated(false);
			setUser(null);
			return err;
		}
	};

	const register = async (data) => {
		try {
			const register_response = await API.post('dj-rest-auth/registration/', data);
			return register_response;
		} catch (error) {
			return error;
		}
	};

	const getUserData = async () => {
		try {
			const user_data_response = await API.get('api/users/profile/');
			return user_data_response;
		} catch (err) {
			return err;
		}
	};

	const getAttemptsList = async () => {
		try {
			const attempts_data_response = await API_QUIZZES.get('quiz/attempts/');
			return attempts_data_response;
		} catch (err) {
			return err;
		}
	};

	const updateUserData = async (userEditData) => {
		try {
			const user_update_response = await API.put('api/users/profile/', userEditData);
			return user_update_response;
		} catch (err) {
			return err;
		}
	};

	const createQuiz = async (quizData) => {
		try {
			const createquiz_response = await API_QUIZZES.post('quiz/', quizData);
			return createquiz_response;
		} catch (err) {
			return err;
		}
	};

	const updateQuiz = async (id, quizEditData) => {
		try {
			const quiz_update_response = await API_QUIZZES.put(`quiz/update/${id}/`, quizEditData);
			return quiz_update_response;
		} catch (err) {
			return err;
		}
	};

	const getQuizList = async () => {
		try {
			const getquizlist_response = await API_QUIZZES.get('quiz/');
			return getquizlist_response;
		} catch (err) {
			return err;
		}
	};

	const getQuiz = async (id, randomize = true) => {
		try {
			const getquiz_response = await API_QUIZZES.get(`quiz/${id}/`, {
				params: {
					randomize: randomize
				}
			});
			return getquiz_response;
		} catch (err) {
			return err;
		}
	};

	const getQuizSummary = async (id) => {
		try {
			const quiz_summary_response = await API_QUIZZES.get(`quiz/summary/${id}/`);
			return quiz_summary_response;
		} catch (err) {
			return err;
		}
	};

	const attemptQuiz = async (id) => {
		try {
			const quiz_attempt_response = await API_QUIZZES.post(`quiz/attempt/${id}/`);
			return quiz_attempt_response;
		} catch (err) {
			return err;
		}
	};

	const submitQuizAnswers = async (id, answers, time) => {
		try {
			const quiz_answers_submission_response = await API_QUIZZES.post(`quiz/submit/${id}/`, {
				answers: answers,
				time: time
			});
			return quiz_answers_submission_response;
		} catch (err) {
			return err;
		}
	};

	const deleteQuiz = async (id) => {
		try {
			const deletequiz_response = await API_QUIZZES.delete(`quiz/${id}/`);
			return deletequiz_response;
		} catch (err) {
			return err;
		}
	};

	const generateQuiz = async (topic, questionNumber) => {
		try {
			const response = await API_QUIZZES.post('quiz/generate/', {
				topic: topic,
				questionNumber: questionNumber
			});
			return response;
		} catch (err) {
			return err;
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated,
				login,
				logout,
				register,
				getUserData,
				updateUserData,
				refreshToken,
				getAccessToken,
				getRefreshToken,
				isTokenExpired,
				quizzes,
				setQuizzes,
				createQuiz,
				updateQuiz,
				generateQuiz,
				getQuizList,
				getQuiz,
				getQuizSummary,
				attemptQuiz,
				getAttemptsList,
				deleteMode,
				submitQuizAnswers,
				deleteQuiz,
				setDeleteMode,
				quizDeleteData,
				setQuizDeleteData,
				resendVerification
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
