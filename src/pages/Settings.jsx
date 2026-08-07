import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cloud, Cpu, LogOut, Settings as SettingsIcon, Shield } from 'lucide-react';

import { get, patch, post } from '../lib/api';
import { cn } from '../lib/format';
import { toast } from '../stores/toastStore';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { MfaDisableSection, MfaSetupModal } from '../components/auth/MfaModals';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Input } from '../components/ui';

export default function SettingsPage() {
	const user = useAuthStore((s) => s.user);
	const logout = useAuthStore((s) => s.logout);
	const updateUser = useAuthStore((s) => s.updateUser);
	const { theme, setTheme } = useThemeStore();
	const [mfaSetupOpen, setMfaSetupOpen] = useState(false);
	const [newEmail, setNewEmail] = useState('');
	const [ollamaMode, setOllamaMode] = useState(user?.ollama_mode || 'local');
	const [ollamaApiKey, setOllamaApiKey] = useState('');

	const saveName = useMutation({
		mutationFn: (body) => patch('/auth/me/', body),
		onSuccess: (data) => {
			updateUser(data);
			toast.success('Profile updated.');
		},
		onError: () => toast.error('Could not update profile.')
	});

	const saveOllama = useMutation({
		mutationFn: (body) => patch('/auth/me/', body),
		onSuccess: (data) => {
			updateUser(data);
			setOllamaMode(data.ollama_mode || 'local');
			setOllamaApiKey('');
			toast.success('Ollama settings saved.');
		},
		onError: (err) => {
			const data = err.response?.data;
			const message =
				data?.ollama_api_key?.[0] ||
				data?.ollama_mode?.[0] ||
				data?.detail ||
				'Could not save Ollama settings.';
			toast.error(message);
		}
	});

	const changeEmail = useMutation({
		mutationFn: (email) => useAuthStore.getState().changeEmail(email),
		onSuccess: (data) => {
			toast.success(data.detail || 'Confirmation sent to your new email.');
			setNewEmail('');
		},
		onError: (err) => {
			toast.error(err.response?.data?.detail || 'Could not change email.');
		}
	});

	useEffect(() => {
		if (user?.ollama_mode) {
			setOllamaMode(user.ollama_mode);
		}
	}, [user?.ollama_mode]);

	if (!user) return null;

	return (
		<div>
			<PageHeader
				title="Settings"
				icon={SettingsIcon}
				description="Manage your account and preferences."
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader title="Account" />
					<CardBody className="space-y-4">
						<div className="flex items-center gap-3">
							<Avatar name={user?.full_name || user?.email} src={user?.avatar_url} size={48} />
							<div>
								<p className="text-fg font-medium">{user?.full_name || 'Unnamed'}</p>
								<p className="text-muted text-sm">{user?.email}</p>
							</div>
						</div>
						<Input
							label="Full name"
							defaultValue={user?.full_name}
							onBlur={(e) =>
								e.target.value !== user?.full_name && saveName.mutate({ full_name: e.target.value })
							}
						/>
						<div className="space-y-2">
							<Input
								label="Email"
								type="email"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								placeholder={user?.email}
							/>
							<Button
								type="button"
								variant="secondary"
								className="w-full"
								loading={changeEmail.isPending}
								disabled={!newEmail || newEmail.toLowerCase() === user?.email?.toLowerCase()}
								onClick={() => changeEmail.mutate(newEmail)}
							>
								Change email
							</Button>
							<p className="text-muted text-xs">
								We will send a confirmation link to the new address before it becomes active.
							</p>
						</div>
						<div>
							<span className="text-fg mb-1.5 block text-sm font-medium">Theme</span>
							<div className="flex gap-2">
								{['light', 'dark'].map((t) => (
									<button
										key={t}
										onClick={() => setTheme(t)}
										className={`flex-1 cursor-pointer rounded-md border px-4 py-2 text-sm capitalize ${
											theme === t ? 'border-primary text-primary' : 'border-line text-muted'
										}`}
									>
										{t}
									</button>
								))}
							</div>
						</div>
						<Button variant="danger" onClick={logout} className="w-full">
							<LogOut size={16} /> Sign out
						</Button>
					</CardBody>
				</Card>

				<Card>
					<CardHeader
						title="Two-factor authentication"
						subtitle="Protect your account with an authenticator app"
					/>
					<CardBody className="space-y-4">
						{user?.mfa_enabled ? (
							<MfaDisableSection />
						) : (
							<Button onClick={() => setMfaSetupOpen(true)}>
								<Shield size={16} /> Enable MFA
							</Button>
						)}
					</CardBody>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader
						title="AI generation (Ollama)"
						subtitle="Choose local Ollama or Ollama Cloud for Create Quiz AI"
						action={
							<Badge tone={ollamaMode === 'cloud' ? 'primary' : 'default'}>
								{ollamaMode === 'cloud' ? 'Cloud' : 'Local'}
							</Badge>
						}
					/>
					<CardBody className="space-y-4">
						<div>
							<span className="text-fg mb-1.5 block text-sm font-medium">Provider</span>
							<div className="flex gap-2">
								{[
									{ id: 'local', label: 'Local', icon: Cpu },
									{ id: 'cloud', label: 'Cloud API', icon: Cloud }
								].map(({ id, label, icon: Icon }) => (
									<button
										key={id}
										type="button"
										onClick={() => setOllamaMode(id)}
										className={cn(
											'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm transition',
											ollamaMode === id
												? 'border-primary text-primary bg-primary/5'
												: 'border-line text-muted hover:border-primary/40'
										)}
									>
										<Icon size={14} />
										{label}
									</button>
								))}
							</div>
						</div>

						{ollamaMode === 'cloud' && (
							<div className="space-y-2">
								<Input
									label="Ollama Cloud API key"
									type="password"
									value={ollamaApiKey}
									onChange={(e) => setOllamaApiKey(e.target.value)}
									placeholder={
										user?.ollama_api_key_set
											? 'Leave blank to keep current key'
											: 'Paste key from ollama.com/settings/keys'
									}
									autoComplete="off"
								/>
								{user?.ollama_api_key_set && (
									<p className="text-muted text-xs">A key is saved on your account.</p>
								)}
								<p className="text-muted text-xs">
									Create a key at{' '}
									<a
										href="https://ollama.com/settings/keys"
										target="_blank"
										rel="noreferrer"
										className="text-primary hover:underline"
									>
										ollama.com/settings/keys
									</a>
									. The key is encrypted and never shown again after saving.
								</p>
							</div>
						)}

						{ollamaMode === 'local' && (
							<p className="text-muted text-xs">
								Uses the server&apos;s local Ollama instance (
								<code className="text-fg">OLLAMA_BASE_URL</code>). Run Ollama on the machine hosting
								the API and pull models with <code className="text-fg">ollama pull</code>.
							</p>
						)}

						<Button
							type="button"
							variant="secondary"
							className="w-full sm:w-auto"
							loading={saveOllama.isPending}
							onClick={() => {
								const body = { ollama_mode: ollamaMode };
								if (ollamaMode === 'cloud' && ollamaApiKey.trim()) {
									body.ollama_api_key = ollamaApiKey.trim();
								}
								saveOllama.mutate(body);
							}}
						>
							Save Ollama settings
						</Button>
					</CardBody>
				</Card>

				<NotificationPrefsCard />
			</div>
			<MfaSetupModal open={mfaSetupOpen} onClose={() => setMfaSetupOpen(false)} />
		</div>
	);
}

function NotificationPrefsCard() {
	const { data: prefs, isLoading } = useQuery({
		queryKey: ['notifications', 'preferences'],
		queryFn: () => get('/notifications/preferences/')
	});
	const qc = useQueryClient();
	const save = useMutation({
		mutationFn: (body) => patch('/notifications/preferences/', body),
		onSuccess: (data) => {
			qc.setQueryData(['notifications', 'preferences'], data);
			post('/notifications/refresh-schedule/').catch(() => {});
			toast.success('Notification preferences saved.');
		},
		onError: () => toast.error('Could not save notification preferences.')
	});

	if (isLoading || !prefs) {
		return (
			<Card className="lg:col-span-2">
				<CardHeader title="Study notifications" />
				<CardBody>
					<p className="text-muted text-sm">Loading…</p>
				</CardBody>
			</Card>
		);
	}

	const toggle = (key) => save.mutate({ [key]: !prefs[key] });

	return (
		<Card className="lg:col-span-2">
			<CardHeader
				title="Study notifications"
				subtitle="Daily streak reminders and roadmap deadline alerts (on by default)"
			/>
			<CardBody className="space-y-3">
				{[
					['email_streak_daily', 'Email: daily streak reminder'],
					['email_deadline', 'Email: roadmap deadline alerts'],
					['desktop_streak_daily', 'Desktop: daily streak reminder'],
					['desktop_deadline', 'Desktop: roadmap deadline alerts']
				].map(([key, label]) => (
					<label key={key} className="flex cursor-pointer items-center gap-3 text-sm">
						<input
							type="checkbox"
							className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
							checked={Boolean(prefs[key])}
							onChange={() => toggle(key)}
						/>
						<span className="text-fg">{label}</span>
					</label>
				))}
				<Input
					label="Local digest hour (0–23)"
					type="number"
					min={0}
					max={23}
					defaultValue={prefs.digest_hour_local}
					onBlur={(e) => {
						const hour = Math.max(0, Math.min(23, Number(e.target.value) || 8));
						if (hour !== prefs.digest_hour_local) {
							save.mutate({ digest_hour_local: hour });
						}
					}}
				/>
			</CardBody>
		</Card>
	);
}
