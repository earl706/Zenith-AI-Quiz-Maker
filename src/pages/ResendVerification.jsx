import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResendVerification() {
	const [email, setEmail] = useState('');
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setStatus('');

		try {
			const response = await fetch('/api/users/email/resend/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			});

			const data = await response.json();

			if (response.ok) {
				setStatus('success');
				setEmail('');
			} else {
				setStatus('error');
				console.error('Error:', data.error);
			}
		} catch (error) {
			setStatus('error');
			console.error('Network error:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
				<div className="text-center">
					<h2 className="mb-6 text-2xl font-bold text-gray-900">Resend Verification Email</h2>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
								Email Address
							</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								placeholder="Enter your email address"
							/>
						</div>

						{status === 'success' && (
							<div className="rounded border border-green-400 bg-green-100 p-3 text-green-700">
								Verification email sent successfully! Please check your inbox.
							</div>
						)}

						{status === 'error' && (
							<div className="rounded border border-red-400 bg-red-100 p-3 text-red-700">
								Failed to send verification email. Please try again.
							</div>
						)}

						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
						>
							{loading ? 'Sending...' : 'Send Verification Email'}
						</button>
					</form>

					<div className="mt-6">
						<button
							onClick={() => navigate('/login')}
							className="text-blue-600 transition-colors hover:text-blue-800"
						>
							Back to Login
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
