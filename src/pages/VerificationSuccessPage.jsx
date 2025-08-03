import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function VerificationSuccessPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [status, setStatus] = useState('loading');

	useEffect(() => {
		console.log('searchParams', searchParams);
		const statusParam = searchParams.get('status');
		const message = searchParams.get('message');
		const alreadyVerified = searchParams.get('already_verified');

		if (statusParam === 'success') {
			setStatus('success');
			// You can store the verification status in localStorage or state management
			localStorage.setItem('emailVerified', 'true');
		} else {
			setStatus('error');
		}
	}, [searchParams]);

	const handleLogin = () => {
		navigate('/login');
	};

	const handleResend = () => {
		navigate('/resend-verification');
	};

	if (status === 'loading') {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<p className="mt-4 text-gray-600">Verifying your email...</p>
				</div>
			</div>
		);
	}

	if (status === 'success') {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
					<div className="text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
							<svg
								className="h-6 w-6 text-green-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h2 className="mt-4 text-xl font-semibold text-gray-900">Email Verified!</h2>
						<p className="mt-2 text-gray-600">
							{searchParams.get('message') || 'Your email has been successfully verified.'}
						</p>
						{searchParams.get('already_verified') === 'true' && (
							<p className="mt-2 text-sm text-yellow-600">Your email was already verified.</p>
						)}
						<div className="mt-6">
							<button
								onClick={handleLogin}
								className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
							>
								Continue to Login
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
				<div className="text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
						<svg
							className="h-6 w-6 text-red-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
					<h2 className="mt-4 text-xl font-semibold text-gray-900">Verification Failed</h2>
					<p className="mt-2 text-gray-600">
						{searchParams.get('error') || 'There was an error verifying your email.'}
					</p>
					<div className="mt-6 space-y-3">
						<button
							onClick={handleResend}
							className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
						>
							Resend Verification Email
						</button>
						<button
							onClick={handleLogin}
							className="w-full rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400"
						>
							Back to Login
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
