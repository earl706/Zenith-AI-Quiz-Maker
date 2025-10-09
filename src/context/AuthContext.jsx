import React, { createContext, useState, useEffect } from 'react';

// Lazy import API services to reduce initial bundle size
let API = null;
let API_QUIZZES = null;

const getAPI = async () => {
	if (!API) {
		const module = await import('../services/api');
		API = module.default;
	}
	return API;
};

const getAPIQuizzes = async () => {
	if (!API_QUIZZES) {
		const module = await import('../services/apiQuizzes');
		API_QUIZZES = module.default;
	}
	return API_QUIZZES;
};

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
			const refreshTokenValue = getRefreshToken();

			console.log(accessToken, refreshTokenValue);

			// Quick synchronous check first for immediate UI update
			if (accessToken && !isTokenExpired(accessToken)) {
				const userData = localStorage.getItem('userData');
				if (userData) {
					setUser(JSON.parse(userData));
				}
				setIsAuthenticated(true);
			} else if (refreshTokenValue) {
				// Try to refresh the token asynchronously
				try {
					const response = await refreshToken(refreshTokenValue);
					if (response.data) {
						setTokens(response.data.access, response.data.refresh);
						const userData = localStorage.getItem('userData');
						if (userData) {
							setUser(JSON.parse(userData));
						}
						setIsAuthenticated(true);
					}
				} catch (error) {
					// Refresh failed, clear tokens
					clearTokens();
					setIsAuthenticated(false);
					setUser(null);
				}
			} else {
				// No tokens available
				setIsAuthenticated(false);
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
			const api = await getAPI();
			const resend_verification_response = await api.post('api/users/email/resend/', {
				email: email
			});
		} catch (err) {
			return err;
		}
	};

	const login = async (username, password) => {
		try {
			const api = await getAPI();
			const login_response = await api.post('api/users/login/', {
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
			const api = await getAPI();
			const refresh_token_response = await api.post('api/users/token/refresh/', {
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
			const api = await getAPI();
			const register_response = await api.post('dj-rest-auth/registration/', data);
			return register_response;
		} catch (error) {
			return error;
		}
	};

	const getUserData = async () => {
		try {
			const api = await getAPI();
			const user_data_response = await api.get('api/users/profile/');
			return user_data_response;
		} catch (err) {
			return err;
		}
	};

	const getAttemptsList = async () => {
		try {
			const apiQuizzes = await getAPIQuizzes();
			const attempts_data_response = await apiQuizzes.get('quiz/attempts/');
			return attempts_data_response;
		} catch (err) {
			return err;
		}
	};

	const updateUserData = async (userEditData) => {
		try {
			const api = await getAPI();
			const user_update_response = await api.put('api/users/profile/', userEditData);
			return user_update_response;
		} catch (err) {
			return err;
		}
	};

	const createQuiz = async (quizData) => {
		try {
			const apiQuizzes = await getAPIQuizzes();
			const createquiz_response = await apiQuizzes.post('quiz/', quizData);
			return createquiz_response;
		} catch (err) {
			return err;
		}
	};

	const updateQuiz = async (id, quizEditData) => {
		try {
			const apiQuizzes = await getAPIQuizzes();
			const quiz_update_response = await apiQuizzes.put(`quiz/update/${id}/`, quizEditData);
			return quiz_update_response;
		} catch (err) {
			return err;
		}
	};

	const getQuizList = async () => {
		try {
			const apiQuizzes = await getAPIQuizzes();
			const getquizlist_response = await apiQuizzes.get('quiz/');
			return getquizlist_response;
		} catch (err) {
			console.log(err);
			return err;
		}
	};

	const getQuiz = async (id, randomize = true) => {
		try {
			const apiQuizzes = await getAPIQuizzes();
			const getquiz_response = await apiQuizzes.get(`quiz/${id}/`, {
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
			const apiQuizzes = await getAPIQuizzes();
			const quiz_summary_response = await apiQuizzes.get(`quiz/summary/${id}/`);
			return quiz_summary_response;
		} catch (err) {
			return err;
		}
	};

	const attemptQuiz = async (id) => {
		try {
			const apiQuizzes = await getAPIQuizzes();
			const quiz_attempt_response = await apiQuizzes.post(`quiz/attempt/${id}/`);
			return quiz_attempt_response;
		} catch (err) {
			return err;
		}
	};

	const submitQuizAnswers = async (id, answers, time) => {
		try {
			const apiQuizzes = await getAPIQuizzes();
			const quiz_answers_submission_response = await apiQuizzes.post(`quiz/submit/${id}/`, {
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
			const apiQuizzes = await getAPIQuizzes();
			const deletequiz_response = await apiQuizzes.delete(`quiz/${id}/`);
			return deletequiz_response;
		} catch (err) {
			return err;
		}
	};

	const generateQuiz = async (topic, questionNumber) => {
		try {
			const apiQuizzes = await getAPIQuizzes();
			const response = await apiQuizzes.post('quiz/generate/', {
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
