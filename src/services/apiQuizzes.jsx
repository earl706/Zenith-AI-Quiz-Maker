import axios from 'axios';

const inProduction = import.meta.env.VITE_IN_PRODUCTION;
const productionAPIURL = import.meta.env.VITE_PRODUCTION_API_URL;
const developmentAPIURL = import.meta.env.VITE_DEVELOPMENT_API_URL;

const APIURL = inProduction == 'true' ? productionAPIURL : developmentAPIURL;

const API_QUIZZES = axios.create({
	baseURL: `${APIURL}api/quizzes/`
});

API_QUIZZES.interceptors.request.use((config) => {
	const token = localStorage.getItem('zenithQuizMakerAccessToken');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export default API_QUIZZES;
