import { Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { MfaPromptModal, MfaSetupModal } from '../auth/MfaModals';
import { LoadingScreen } from '../ui';
import { post } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { StudyTimerEngine } from './StudyTimerEngine';
import { Topbar } from './Topbar';

export function AppLayout() {
	const showMfaPrompt = useAuthStore((s) => s.user?.show_mfa_prompt);
	const user = useAuthStore((s) => s.user);
	const [promptOpen, setPromptOpen] = useState(Boolean(showMfaPrompt));
	const [setupOpen, setSetupOpen] = useState(false);

	useEffect(() => {
		if (!user) return;
		post('/notifications/refresh-schedule/').catch(() => {});
	}, [user?.id, user?.uuid]);

	return (
		<div className="bg-bg flex h-dvh overflow-hidden">
			<Sidebar />
			<div className="flex min-h-0 min-w-0 flex-1 flex-col">
				<Topbar />
				<main className="relative min-h-0 flex-1 overflow-y-auto" id="main-content">
					<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
						<Suspense fallback={<LoadingScreen />}>
							<Outlet />
						</Suspense>
					</div>
				</main>
			</div>
			<StudyTimerEngine />
			<CommandPalette />
			<MfaPromptModal
				open={promptOpen && showMfaPrompt}
				onClose={() => {
					setPromptOpen(false);
					setSetupOpen(true);
				}}
			/>
			<MfaSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} />
		</div>
	);
}
