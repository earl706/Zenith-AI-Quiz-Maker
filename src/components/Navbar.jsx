import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
	Box,
	BookOpen,
	Target,
	Settings,
	Pen,
	HelpCircle,
	LogOut,
	Trophy,
	Plus
} from 'lucide-react';
import zenithLogoLight from '/src/assets/ZENITH - LOGO DARK.png';

const navIcons = {
	Dashboard: Box,
	Quizzes: HelpCircle,
	'Create Quiz': Plus,
	Attempts: Pen
	// Accuracy: Target,
	// Achievements: Trophy,
};

export default function Navbar({ children }) {
	const [activeItemHover, setActiveItemHover] = useState('');

	const location = window.location.pathname;

	const navigationItems = [
		{ navItem: 'Dashboard', link: '/', icon: 'Dashboard' },
		{ navItem: 'Quizzes', link: '/quizzes', icon: 'Quizzes' },
		{ navItem: 'Create Quiz', link: '/create-quiz', icon: 'Create Quiz' },
		{ navItem: 'Attempts', link: '/attempts', icon: 'Attempts' }
		// { navItem: "Accuracy", link: "/accuracy", icon: "Accuracy" },
		// { navItem: "Achievements", link: "/achievements", icon: "Achievements" },
	];

	useEffect(() => {}, [location]);

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-[#6F8055] via-[#7fa07a] to-[#eaf3e2]">
			<aside
				className={`fixed top-0 left-0 z-30 h-full w-16 flex-col border-r border-gray-200 bg-white/90 px-1 py-2 shadow-xl transition-all sm:flex md:flex md:w-20 md:px-2 md:py-4 lg:flex lg:w-64 lg:px-6 lg:py-8`}
			>
				{/* Logo */}
				<div className="mb-16 flex flex-col items-center justify-center gap-2">
					<div className="xs:h-8 flex h-20 w-8 items-center justify-center sm:h-10 sm:w-10 md:h-10 md:w-10 lg:h-24 lg:w-auto">
						<img src={zenithLogoLight} alt="Zenith Logo" className="h-full w-full object-contain" />
					</div>
					<span className="hidden text-2xl font-extrabold tracking-tight text-[#6F8055] md:hidden lg:block">
						Zenith
					</span>
				</div>
				{/* Navigation */}
				<nav className="flex-1">
					<ul className="space-y-2">
						{navigationItems.map((navItem, index) => {
							const isActive = navItem.link === location;
							const isHover = activeItemHover === navItem.link;
							const LucideIcon = navIcons[navItem.icon];
							return (
								<li
									key={index}
									onMouseEnter={() => setActiveItemHover(navItem.link)}
									onMouseLeave={() => setActiveItemHover('')}
								>
									<NavLink
										to={navItem.link}
										className={({ isActive: navLinkActive }) =>
											`group xs:px-1 xs:py-1 flex items-center justify-center gap-4 rounded-lg px-2 py-2 transition-all sm:px-2 sm:py-2 md:px-2 md:py-2 lg:justify-start lg:px-8 lg:py-3 ${
												isActive || isHover || navLinkActive
													? 'bg-[#6F8055] font-semibold text-white shadow'
													: 'font-medium text-[#6F8055] hover:bg-[#eaf3e2] hover:text-[#6F8055]'
											}`
										}
									>
										<span
											className={`flex w-6 items-center justify-center transition-all sm:h-6 md:h-6 md:w-6 lg:h-6 lg:w-6 ${
												isActive || isHover
													? 'text-white'
													: 'text-[#b2c2a2] group-hover:text-[#6F8055]'
											}`}
										>
											{LucideIcon && <LucideIcon className="h-full w-full" />}
										</span>
										<span className="hidden lg:block">{navItem.navItem}</span>
									</NavLink>
								</li>
							);
						})}
					</ul>
				</nav>
				{/* Logout */}
				<div className="mt-auto pt-8">
					<NavLink
						to="/login"
						onClick={() => {
							localStorage.clear();
						}}
						className={`group xs:justify-center xs:px-1 xs:py-1 flex items-center gap-4 rounded-lg px-4 py-3 font-medium text-[#b2c2a2] transition-all hover:bg-red-50 hover:text-red-600 sm:justify-center sm:px-2 sm:py-2 md:justify-center md:px-2 md:py-2`}
						onMouseEnter={() => setActiveItemHover('settings')}
						onMouseLeave={() => setActiveItemHover('')}
					>
						<span
							className={`xs:h-5 xs:w-5 flex items-center justify-center sm:h-6 sm:w-6 md:h-6 md:w-6 lg:h-6 lg:w-6 ${
								activeItemHover === 'settings'
									? 'text-red-600'
									: 'text-[#b2c2a2] group-hover:text-red-600'
							} transition-all`}
						>
							<LogOut className="h-full w-full" />
						</span>
						<span className="hidden lg:block">Logout</span>
					</NavLink>
				</div>
			</aside>
			{/* Main Content */}
			<main
				className={`ml-16 min-h-screen flex-1 bg-white/80 shadow-lg transition-all md:ml-20 md:p-4 lg:ml-64 lg:p-8`}
			>
				<div className="transition-all">{children}</div>
			</main>
		</div>
	);
}
