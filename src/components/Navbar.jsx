import React, { useContext, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faAdd,
	faBookOpenReader,
	faBox,
	faBullseye,
	faGear,
	faPen,
	faQuestion,
	faRightFromBracket,
	faTrophy
} from '@fortawesome/free-solid-svg-icons';
import zenithLogoLight from '/src/assets/ZENITH - LOGO LIGHT.png';

export default function Navbar({ children }) {
	const [activeItemHover, setActiveItemHover] = useState('');

	const location = window.location.pathname;

	const navigationItems = [
		{ navItem: 'Dashboard', link: '/', icon: faBox },
		{ navItem: 'Quizzes', link: '/quizzes', icon: faQuestion },
		{ navItem: 'Create Quiz', link: '/create-quiz', icon: faAdd },
		{ navItem: 'Attempts', link: '/attempts', icon: faPen }
		// { navItem: "Accuracy", link: "/accuracy", icon: faBullseye },
		// { navItem: "Achievements", link: "/achievements", icon: faTrophy },
	];

	useEffect(() => {}, [location]);

	return (
		<div className="flex min-h-screen bg-[#6F8055]">
			<aside className="fixed flex h-[calc(100vh-2rem)] w-[23%] flex-col pr-[40px] text-blue-900">
				<div className="mt-[35px] mb-[75px] ml-[33px] flex items-center justify-start text-white">
					<div className="mr-[30px] flex h-[60px] w-[60px] items-center justify-center">
						<img src={zenithLogoLight} alt="" />
					</div>
					<span className="text-left text-[30px] font-bold">Zenith</span>
				</div>
				<nav className="flex-grow text-white">
					<ul className="">
						{navigationItems.map((navItem, index) => (
							<li
								key={index}
								onMouseEnter={() => setActiveItemHover(navItem.link)}
								onMouseLeave={() => setActiveItemHover('')}
							>
								<NavLink
									to={navItem.link}
									className={({ isActive }) =>
										isActive
											? 'mb-[35px] flex items-center text-[14px] font-bold transition-all'
											: 'mb-[35px] flex items-center text-[14px] font-thin transition-all hover:font-bold'
									}
								>
									<div
										className={`${
											navItem.link == location || activeItemHover == navItem.link
												? 'bg-white'
												: 'bg-transparent'
										} mr-[33px] h-[40px] w-[10px] rounded-tr-[10px] rounded-br-[10px] transition-all`}
									></div>
									<div
										className={`mr-[27px] flex items-center justify-center ${
											navItem.link == location || activeItemHover == navItem.link
												? 'h-[40px] w-[40px] text-white'
												: 'h-[30px] w-[30px] text-gray-300'
										} transition-all`}
									>
										<FontAwesomeIcon icon={navItem.icon} className="h-full w-full" />
									</div>
									{navItem.navItem}
								</NavLink>
							</li>
						))}
					</ul>
				</nav>
				<div className="flex w-full">
					<NavLink
						to="/login"
						onClick={() => {
							localStorage.clear();
						}}
						className="flex items-center justify-center font-thin text-white transition-all hover:font-bold"
						onMouseEnter={() => setActiveItemHover('settings')}
						onMouseLeave={() => setActiveItemHover('')}
					>
						<div
							className={`${
								activeItemHover == 'settings' ? 'bg-white' : 'bg-transparent'
							} mr-[33px] h-[40px] w-[10px] rounded-tr-[10px] rounded-br-[10px] transition-all`}
						></div>
						<div
							className={`mr-[27px] flex h-[30px] w-[30px] items-center justify-center ${
								activeItemHover == 'settings' ? 'text-white' : 'text-gray-300'
							} `}
						>
							<FontAwesomeIcon icon={faRightFromBracket} className="h-full w-full" />
						</div>
						<span>Logout</span>
					</NavLink>
				</div>
			</aside>
			<main className="mt-[15px] mr-[15px] ml-[300px] w-[77%] flex-grow rounded-t-[20px] bg-white transition-all">
				<div className="transition-all">{children}</div>
			</main>
		</div>
	);
}
