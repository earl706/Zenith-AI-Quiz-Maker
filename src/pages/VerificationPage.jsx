import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function VerificationPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const email = location.state?.email || 'your email';

	const handleResend = () => {
		navigate('/resend-verification', { state: { email } });
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
				<div className="text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
						<svg
							className="h-6 w-6 text-blue-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<h2 className="mt-4 text-xl font-semibold text-gray-900">Check Your Email</h2>
					<p className="mt-2 text-gray-600">
						We've sent a verification email to <strong>{email}</strong>
					</p>
					<p className="mt-2 text-sm text-gray-500">
						Click the link in the email to verify your account and get started.
					</p>

					<div className="mt-6 space-y-3">
						<button
							onClick={handleResend}
							className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
						>
							Resend Verification Email
						</button>
						<button
							onClick={() => navigate('/login')}
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
