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
			className={
				loading
					? 'flex h-screen w-full items-center justify-center bg-[#6F8055] blur-3xl transition-all'
					: 'flex h-screen w-full items-center justify-center bg-[#6F8055] transition-all'
			}
		>
			{emailConfirmationView ? (
				<div class="mx-auto mt-10 max-w-xl rounded-2xl border border-blue-100 bg-white p-6 shadow-lg sm:p-8">
					<div class="flex items-start gap-4 sm:items-center">
						<div class="flex-shrink-0">
							<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
								<svg
									class="h-6 w-6 text-blue-600"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M16.88 3.549a9 9 0 11-9.763 9.763M12 6v6l4 2"
									/>
								</svg>
							</div>
						</div>
						<div>
							<h2 class="text-lg font-bold text-gray-800 sm:text-xl">
								Confirm your email to get started
							</h2>
							<p class="mt-1 text-sm text-gray-600 sm:text-base">
								We've sent a verification link to your email. Please check your inbox (and spam
								folder just in case) and click the link to activate your account.
							</p>
						</div>
					</div>
					<div class="mt-6 text-sm text-gray-500">
						Didn’t get the email?{' '}
						<button href="#" class="text-blue-600 hover:underline">
							Resend verification
						</button>
					</div>
					<button
						onClick={() => {
							navigate('/login');
						}}
						type="submit"
						className="mt-5 w-full cursor-pointer rounded-[5px] bg-[#3C6B9F] px-4 py-2 font-bold text-white transition hover:bg-[#1C4B7F]"
					>
						Proceed to Login
					</button>
				</div>
			) : (
				<div className="w-full max-w-md space-y-4 rounded-[20px] bg-[#EFF7FF] p-8 drop-shadow-lg">
					<h2 className="text-center text-2xl font-bold">Registration</h2>
					<form onSubmit={handleRegistration}>
						<div className="mb-[20px]">
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
									email != ''
										? 'mb-1 block text-sm font-bold text-gray-700 transition'
										: 'mb-1 block text-sm font-bold text-transparent transition'
								}
							>
								Email
							</label>
							<input
								type="email"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
								}}
								placeholder="Email"
								className="w-full border-b border-gray-300 p-2 text-[14px] transition outline-none focus:border-black"
								required
							/>
						</div>

						<div className="mb-[20px]">
							<label
								className={
									password1 != ''
										? 'mt-5 mb-2 block text-sm font-bold text-gray-700 transition'
										: 'mt-5 mb-2 block text-sm font-bold text-transparent transition'
								}
							>
								Password
							</label>
							<input
								type="password"
								value={password1}
								onChange={(e) => {
									setPassword1(e.target.value);
								}}
								placeholder="Password"
								className="w-full border-b border-gray-300 p-2 text-[14px] transition outline-none focus:border-black"
								required
							/>
						</div>
						<div className="mb-[20px]">
							<label
								className={
									password2 != ''
										? 'mt-5 mb-2 block text-sm font-bold text-gray-700 transition'
										: 'mt-5 mb-2 block text-sm font-bold text-transparent transition'
								}
							>
								Password Confirmation
							</label>
							<input
								type="password"
								value={password2}
								onChange={(e) => {
									setPassword2(e.target.value);
								}}
								placeholder="Password Confirmation"
								className="w-full border-b border-gray-300 p-2 text-[14px] transition outline-none focus:border-black"
								required
							/>
						</div>
						<div className="mb-[20px]">
							<label
								className={
									password2 != ''
										? 'mt-5 mb-2 block text-sm font-bold text-gray-700 transition'
										: 'mt-5 mb-2 block text-sm font-bold text-transparent transition'
								}
							>
								Phone Number
							</label>
							<PhoneInput
								country="PH"
								value={phoneNumber}
								onChange={(event) => {
									setPhoneNumber(event);
								}}
								placeholder="Phone Number"
								className="w-full border-b border-gray-300 p-2 text-[14px] transition outline-none focus:border-black"
							/>
						</div>
						<button
							type="submit"
							className="mt-5 w-full cursor-pointer rounded-full bg-[#3C6B9F] px-4 py-2 font-bold text-white transition hover:bg-[#1C4B7F]"
						>
							Register
						</button>
					</form>
					<div className="flex justify-center">
						<button
							className="cursor-pointer text-sm text-gray-500 transition-all duration-500 hover:underline"
							onClick={() => {
								navigate('/login');
							}}
						>
							Already have an account? Login here
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
