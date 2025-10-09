import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoadingComponent from './components/LoadingComponent';

// Eager load only critical components for login page
import LoginPage from './pages/LoginPage';

// Lazy load Navbar to prevent FontAwesome from loading on initial page load
const Navbar = lazy(() => import('./components/Navbar'));

// Lazy load all other pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const QuizzesPage = lazy(() => import('./pages/QuizzesPage'));
const CreateQuizPage = lazy(() => import('./pages/CreateQuizPage'));
const EditQuizPage = lazy(() => import('./pages/EditQuizPage'));
const AttemptsPage = lazy(() => import('./pages/AttemptsPage'));
const AccuracyPage = lazy(() => import('./pages/AccuracyPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const QuizAttempt = lazy(() => import('./pages/QuizAttempt'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const VerificationPage = lazy(() => import('./pages/VerificationPage'));
const ResendVerification = lazy(() => import('./pages/ResendVerification'));
const VerificationSuccessPage = lazy(() => import('./pages/VerificationSuccessPage'));

function App() {
	const [authenticated, setAuthenticated] = useState(false);

	const pathLocation = window.location.pathname;

	const routes = [
		{ component: <Dashboard />, route: '/' },
		{ component: <QuizzesPage />, route: '/quizzes' },
		{ component: <CreateQuizPage />, route: '/create-quiz' },
		{ component: <EditQuizPage />, route: '/quizzes/edit/:id' },
		{ component: <AttemptsPage />, route: '/attempts' },
		{ component: <AccuracyPage />, route: '/accuracy' },
		{ component: <AchievementsPage />, route: '/achievements' },
		{ component: <QuizPage />, route: '/quizzes/:id' },
		{ component: <QuizAttempt />, route: '/quizzes/attempt/:id' }
	];

	const performLogin = () => {
		setAuthenticated(true);
	};

	useEffect(() => {
		localStorage.setItem('lastPath', pathLocation);
	}, [pathLocation]);

	return (
		<>
			<AuthProvider>
				<Router>
					<Suspense fallback={<LoadingComponent fullscreen light />}>
						<Routes>
							<Route index path="/login" element={<LoginPage performLogin={performLogin} />} />
							<Route index path="/registration" element={<RegistrationPage />} />
							<Route index path="/verify" element={<VerificationPage />} />
							<Route index path="/resend-verification" element={<ResendVerification />} />
							<Route index path="/verification" element={<VerificationSuccessPage />} />
							{routes.map((route, index) => (
								<Route
									key={index}
									path={route.route}
									element={
										authenticated ? (
											<Suspense fallback={<LoadingComponent fullscreen light />}>
												<Navbar>{route.component}</Navbar>
											</Suspense>
										) : (
											<Navigate to="/login" />
										)
									}
								/>
							))}
						</Routes>
					</Suspense>
				</Router>
			</AuthProvider>
		</>
	);
}

export default App;
