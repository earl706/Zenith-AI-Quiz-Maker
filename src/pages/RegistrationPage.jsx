import React, { useContext, useEffect, useState } from 'react';
import PhoneInput from 'react-phone-number-input/input';
import { AuthContext } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function RegistrationPage() {
	const { register } = useContext(AuthContext);
	const navigate = useNavigate();
	const location = useLocation();

	const [emailConfirmationView, setEmailConfirmationView] = useState(false);
	const [loading, setLoading] = useState(false);
	const [username, setUsername] = useState('');
	const [password1, setPassword1] = useState('');
	const [password2, setPassword2] = useState('');
	const [email, setEmail] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');

	const handleRegistration = async (event) => {
		event.preventDefault();
		try {
			setLoading(true);
			const register_response = await register({
				username: username,
				email: email,
				password1: password1,
				password2: password2,
				phone_number: phoneNumber
			});
			console.log(register_response);
			if (register_response.status == 201 && register_response.statusText == 'Created') {
				navigate('/verify', {
					state: { email: email }
				});
			}
			setLoading(false);
		} catch (err) {
			setLoading(false);
			return err;
		}
	};

	useEffect(() => {}, [emailConfirmationView]);

	return (
		<div
			className={`relative flex h-screen w-full items-center justify-center sm:my-0 md:my-8 lg:my-16`}
		>
			<div className="relative z-10 my-8 w-full max-w-md">
				<div className="px-8 py-10">
					<div className="mb-8 flex flex-col items-center">
						<img
							src="/src/assets/ZENITH - LOGO LIGHT.png"
							alt="Zenith Logo"
							className="mb-2 h-16 w-16"
						/>
						<h2 className="mb-1 text-3xl font-bold tracking-tight text-gray-800">Register</h2>
						<p className="text-sm font-medium text-gray-500">Create your Zenith account</p>
					</div>
					{emailConfirmationView ? (
						<div className="flex flex-col items-center">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
								<svg
									className="h-6 w-6 text-blue-600"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M16.88 3.549a9 9 0 11-9.763 9.763M12 6v6l4 2"
									/>
								</svg>
							</div>
							<h2 className="text-center text-lg font-bold text-gray-800 sm:text-xl">
								Confirm your email to get started
							</h2>
							<p className="mt-2 text-center text-sm text-gray-600 sm:text-base">
								We've sent a verification link to your email. Please check your inbox (and spam
								folder just in case) and click the link to activate your account.
							</p>
							<div className="mt-6 text-center text-sm text-gray-500">
								Didn’t get the email?{' '}
								<button className="text-blue-600 hover:underline" type="button">
									Resend verification
								</button>
							</div>
							<button
								onClick={() => navigate('/login')}
								type="button"
								className="mt-5 w-full cursor-pointer rounded-full bg-gray-800 px-6 py-3 text-lg font-bold text-white shadow transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-300 focus:outline-none"
							>
								Proceed to Login
							</button>
						</div>
					) : (
						<form onSubmit={handleRegistration} className="space-y-6">
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
								<label htmlFor="email" className="mb-1 text-sm font-medium text-gray-700">
									Email
								</label>
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Enter your email"
									className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-800 transition focus:border-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none"
									autoComplete="email"
									required
								/>
							</div>
							<div className="mb-6 flex w-full flex-col gap-2">
								<label htmlFor="password1" className="mb-1 text-sm font-medium text-gray-700">
									Password
								</label>
								<input
									id="password1"
									type="password"
									value={password1}
									onChange={(e) => setPassword1(e.target.value)}
									placeholder="Enter your password"
									className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-800 transition focus:border-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none"
									autoComplete="new-password"
									required
								/>
							</div>
							<div className="mb-6 flex w-full flex-col gap-2">
								<label htmlFor="password2" className="mb-1 text-sm font-medium text-gray-700">
									Confirm Password
								</label>
								<input
									id="password2"
									type="password"
									value={password2}
									onChange={(e) => setPassword2(e.target.value)}
									placeholder="Confirm your password"
									className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-800 transition focus:border-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none"
									autoComplete="new-password"
									required
								/>
							</div>
							<div className="mb-6 flex w-full flex-col gap-2">
								<label htmlFor="phone" className="mb-1 text-sm font-medium text-gray-700">
									Phone Number
								</label>
								<PhoneInput
									id="phone"
									country="PH"
									value={phoneNumber}
									onChange={setPhoneNumber}
									placeholder="Enter your phone number"
									className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-800 transition focus:border-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none"
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
										<span>Registering...</span>
									</span>
								) : (
									'Register'
								)}
							</button>
						</form>
					)}
					{!emailConfirmationView && (
						<div className="mt-8 flex flex-col items-center">
							<span className="mb-2 text-sm text-gray-400">Already have an account?</span>
							<button
								className="cursor-pointer rounded-full bg-gray-100 px-6 py-2 font-semibold text-gray-800 shadow transition-all duration-200 hover:bg-gray-200"
								onClick={() => navigate('/login')}
							>
								Login here
							</button>
						</div>
					)}
				</div>
			</div>
			{loading && (
				<div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
					<span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-transparent"></span>
				</div>
			)}
		</div>
	);
}
