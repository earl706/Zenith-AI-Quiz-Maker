import { LayoutDashboard, BookOpen, ListChecks, Target, Map } from 'lucide-react';

export const navGroups = [
	{
		label: 'Overview',
		items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }]
	},
	{
		label: 'Study',
		items: [{ to: '/roadmap', label: 'Roadmap', icon: Map }]
	},
	{
		label: 'Quizzes',
		items: [
			{ to: '/quizzes', label: 'Quizzes', icon: BookOpen },
			{ to: '/create-quiz', label: 'Create', icon: ListChecks },
			{ to: '/attempts', label: 'Attempts', icon: Target }
		]
	}
];
