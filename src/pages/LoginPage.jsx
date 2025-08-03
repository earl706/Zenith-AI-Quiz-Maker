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
		<div
			className={
				loading
					? 'flex h-screen w-full items-center justify-center bg-[#6F8055] blur-3xl transition-all'
					: 'flex h-screen w-full items-center justify-center bg-[#6F8055] transition-all'
			}
		>
			<div className="w-full max-w-md space-y-4 rounded-[20px] bg-[#EFF7FF] p-8 drop-shadow-lg">
				<h2 className="text-center text-2xl font-bold">Login</h2>
				<form onSubmit={handleLogin}>
					<div>
						<label
							className={
								username != ''
									? 'mb-1 block text-sm font-bold text-gray-700 transition'
									: 'mb-1 block text-sm font-bold text-transparent transition'
							}
						>
							Username
						</label>
						<input
							type="text"
							value={username}
							onChange={(e) => {
								setUsername(e.target.value);
							}}
							placeholder="Username"
							className="w-full border-b border-gray-300 p-2 text-[14px] transition outline-none focus:border-black"
							required
						/>
					</div>

					<div className="mb-[20px]">
						<label
							className={
								password != ''
									? 'mt-5 mb-2 block text-sm font-bold text-gray-700 transition'
									: 'mt-5 mb-2 block text-sm font-bold text-transparent transition'
							}
						>
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
							}}
							placeholder="Password"
							className="w-full border-b border-gray-300 p-2 text-[14px] transition outline-none focus:border-black"
							required
						/>
					</div>
					<button
						type="submit"
						className="mt-5 w-full cursor-pointer rounded-full bg-[#3C6B9F] px-4 py-2 font-bold text-white transition hover:bg-[#1C4B7F]"
					>
						Login
					</button>
				</form>
				<div className="flex justify-center">
					<button
						className="cursor-pointer text-sm text-gray-500 transition-all duration-500 hover:underline"
						onClick={() => {
							navigate('/registration');
						}}
					>
						Don't have an account? Register here
					</button>
				</div>
			</div>
		</div>
	);
}
