import { LayoutDashboard, BookOpen, ListChecks, Target, Settings } from 'lucide-react';

export const navGroups = [
	{
		label: 'Overview',
		items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }]
	},
	{
		label: 'Quizzes',
		items: [
			{ to: '/quizzes', label: 'My Quizzes', icon: BookOpen },
			{ to: '/create-quiz', label: 'Create Quiz', icon: ListChecks },
			{ to: '/attempts', label: 'Attempts', icon: Target }
		]
	}
];
