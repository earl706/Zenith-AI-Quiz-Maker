import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LoginPage({ performLogin }) {
	const { login, refreshToken } = useContext(AuthContext);
	const navigate = useNavigate();
	const location = useLocation();

	const [loading, setLoading] = useState(false);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const handleLogin = async (event) => {
		event.preventDefault();
		try {
			setLoading(true);
			const login_response = await login(username, password);
			if (login_response.status == 200 || login_response.statusText == 'OK') {
				performLogin();
				navigate('/');
			}
			setLoading(false);
			return login_response;
		} catch (err) {
			setLoading(false);
			return err;
		}
	};

	const handleSavedLogin = async (refresh_token) => {
		try {
			setLoading(true);
			const login_response = await refreshToken(refresh_token);
			const lastPath = localStorage.getItem('lastPath');
			if (login_response.status == 200 || login_response.statusText == 'OK') {
				localStorage.setItem('zenithQuizMakerAccessToken', login_response.data.access);
				performLogin();
				const lastPathArray = lastPath.split('/');
				console.log(lastPathArray);
				if (lastPathArray[2] == 'attempt') {
					navigate(`/quizzes/${lastPathArray[3]}`);
				} else {
					navigate(`${lastPath}`);
				}
			}
			setLoading(false);
			return login_response;
		} catch (err) {
			setLoading(false);
			return err;
		}
	};

	useEffect(() => {
		console.log('zenithQuizMakerAccessToken', localStorage.getItem('zenithQuizMakerAccessToken'));
		if (localStorage.getItem('zenithQuizMakerAccessToken')) {
			handleSavedLogin(localStorage.getItem('zenithQuizMakerRefreshToken'));
		}
	}, []);
	return (
		<div className="relative flex h-screen w-full items-center justify-center bg-white">
			<div className="relative z-10 w-full max-w-md">
				<div className="px-8 py-10">
					<div className="mb-8 flex flex-col items-center">
						<img
							src="/src/assets/ZENITH - LOGO LIGHT.png"
							alt="Zenith Logo"
							className="mb-2 h-16 w-16"
						/>
						<h2 className="mb-1 text-3xl font-bold tracking-tight text-gray-800">Welcome</h2>
						<p className="text-sm font-medium text-gray-500">Sign in to your Zenith account</p>
					</div>
					<form onSubmit={handleLogin} className="space-y-6">
						<div className="mb-6 flex w-full flex-col gap-2">
							<label htmlFor="username" className="mb-1 text-sm font-medium text-gray-700">
								Username
							</label>
							<input
								id="username"
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Enter your username"
								className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-800 transition focus:border-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none"
								autoComplete="username"
								required
							/>
						</div>
						<div className="mb-6 flex w-full flex-col gap-2">
							<label htmlFor="password" className="mb-1 text-sm font-medium text-gray-700">
								Password
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-800 transition focus:border-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none"
								autoComplete="current-password"
								required
							/>
						</div>
						<button
							type="submit"
							className="w-full cursor-pointer rounded-full bg-gray-800 px-6 py-3 text-lg font-bold text-white shadow transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-300 focus:outline-none"
							disabled={loading}
						>
							{loading ? (
								<span className="flex items-center justify-center gap-2">
									<span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
									<span>Logging in...</span>
								</span>
							) : (
								'Login'
							)}
						</button>
					</form>
					<div className="mt-8 flex flex-col items-center">
						<span className="mb-2 text-sm text-gray-400">Don't have an account?</span>
						<button
							className="cursor-pointer rounded-full bg-gray-100 px-6 py-2 font-semibold text-gray-800 shadow transition-all duration-200 hover:bg-gray-200"
							onClick={() => navigate('/registration')}
						>
							Register here
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
