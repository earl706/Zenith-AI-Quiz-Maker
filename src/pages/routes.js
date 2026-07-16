import { lazy } from 'react';

export const publicRoutes = [
	{
		path: '/login',
		Component: lazy(() => import('./Auth').then((m) => ({ default: m.LoginPage })))
	},
	{
		path: '/register',
		Component: lazy(() => import('./Auth').then((m) => ({ default: m.RegisterPage })))
	},
	{
		path: '/oauth/callback',
		Component: lazy(() => import('./OAuthCallback'))
	},
	{
		path: '/check-email',
		Component: lazy(() =>
			import('./EmailVerification').then((m) => ({ default: m.CheckEmailPage }))
		)
	},
	{
		path: '/verify-email',
		Component: lazy(() =>
			import('./EmailVerification').then((m) => ({ default: m.VerifyEmailPage }))
		)
	}
];

export const appRoutes = [
	{ path: '/', Component: lazy(() => import('./Dashboard')) },
	{ path: 'quizzes', Component: lazy(() => import('./QuizzesPage')) },
	{ path: 'create-quiz', Component: lazy(() => import('./CreateQuizPage')) },
	{ path: 'quizzes/edit/:id', Component: lazy(() => import('./EditQuizPage')) },
	{ path: 'quizzes/:id', Component: lazy(() => import('./QuizPage')) },
	{ path: 'quizzes/attempt/:id', Component: lazy(() => import('./QuizAttempt')) },
	{ path: 'attempts', Component: lazy(() => import('./AttemptsPage')) },
	{ path: 'settings', Component: lazy(() => import('./Settings')) }
];
