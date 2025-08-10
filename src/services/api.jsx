import axios from 'axios';

const inProduction = import.meta.env.VITE_IN_PRODUCTION;
const productionAPIURL = import.meta.env.VITE_PRODUCTION_API_URL;
const developmentAPIURL = import.meta.env.VITE_DEVELOPMENT_API_URL;

const APIURL = inProduction == 'true' ? productionAPIURL : developmentAPIURL;

const API = axios.create({
	baseURL: APIURL
});

// Token expiration check
const isTokenExpired = (token) => {
	if (!token) return true;
	try {
		const payload = JSON.parse(atob(token.split('.')[1]));
		return payload.exp * 1000 < Date.now();
	} catch (error) {
		return true;
	}
};

// Refresh token function
const refreshAccessToken = async () => {
	const refreshToken = localStorage.getItem('zenithQuizMakerRefreshToken');
	if (!refreshToken) {
		throw new Error('No refresh token available');
	}

	try {
		const response = await axios.post(`${APIURL}api/users/token/refresh/`, {
			refresh: refreshToken
		});

		if (response.data.access) {
			localStorage.setItem('zenithQuizMakerAccessToken', response.data.access);
			if (response.data.refresh) {
				localStorage.setItem('zenithQuizMakerRefreshToken', response.data.refresh);
			}
			return response.data.access;
		}
	} catch (error) {
		// Clear tokens if refresh fails
		localStorage.removeItem('zenithQuizMakerAccessToken');
		localStorage.removeItem('zenithQuizMakerRefreshToken');
		localStorage.removeItem('userData');
		throw error;
	}
};

API.interceptors.request.use(async (config) => {
	let token = localStorage.getItem('zenithQuizMakerAccessToken');

	if (token && isTokenExpired(token)) {
		try {
			token = await refreshAccessToken();
		} catch (error) {
			// Redirect to login or handle token refresh failure
			window.location.href = '/login';
			return Promise.reject(error);
		}
	}

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Response interceptor to handle 401 errors
API.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				const newToken = await refreshAccessToken();
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				return API(originalRequest);
			} catch (refreshError) {
				// Redirect to login if refresh fails
				window.location.href = '/login';
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export default API;
