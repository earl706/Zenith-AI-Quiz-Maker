import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
	const { user, isAuthenticated, logout, getAccessToken, isTokenExpired } = useContext(AuthContext);
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		// Redirect to login page or home page
		navigate('/login');
	};

	const checkTokenStatus = () => {
		const token = getAccessToken();
		if (token) {
			const expired = isTokenExpired(token);
			console.log('Token expired:', expired);
		}
	};

	return (
		<header className="header">
			<div className="header-content flex items-center justify-between py-4">
				<h1 className="text-2xl font-bold">Zenith Quiz Maker</h1>
				{isAuthenticated && user ? (
					<div className="user-section">
						<span>Welcome, {user.username}!</span>
					</div>
				) : (
					<div className="auth-section flex items-center gap-4">
						<NavLink to={'/login'}>Login</NavLink>
						<NavLink to={'/registration'}>Register</NavLink>
					</div>
				)}
			</div>
		</header>
	);
};

export default Header;
