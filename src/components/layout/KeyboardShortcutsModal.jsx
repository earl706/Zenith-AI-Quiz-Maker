import { useEffect } from 'react';

import { useUIStore } from '../../stores/uiStore';
import { Modal } from '../ui';

const IS_MAC =
	typeof navigator !== 'undefined' &&
	/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function modKey() {
	return IS_MAC ? '⌘' : 'Ctrl';
}

function ShortcutKeys({ keys }) {
	return (
		<span className="flex flex-wrap items-center justify-end gap-1">
			{keys.map((key) => (
				<kbd
					key={key}
					className="border-line bg-surface-2 text-fg rounded-sm border px-1.5 py-0.5 font-mono text-[11px] leading-none"
				>
					{key}
				</kbd>
			))}
		</span>
	);
}

const GROUPS = [
	{
		id: 'global',
		title: 'Global',
		items: [
			{ keys: [modKey(), 'K'], description: 'Search quizzes' },
			{ keys: [modKey(), '⇧', 'K'], description: 'Show keyboard shortcuts' },
			{ keys: ['Esc'], description: 'Close dialogs and overlays' }
		]
	},
	{
		id: 'attempt',
		title: 'Attempt',
		items: [
			{ keys: [modKey(), 'Enter'], description: 'Submit the attempt' },
			{ keys: ['Esc'], description: 'Exit the attempt (confirms if you have answers)' },
			{ keys: ['Enter'], description: 'Confirm submit when unanswered questions remain' },
			{ keys: ['Enter'], description: 'Retake with the same settings on results' }
		]
	},
	{
		id: 'flashcard',
		title: 'Flashcard',
		items: [
			{ keys: [modKey(), '['], description: 'Previous card' },
			{ keys: [modKey(), ']'], description: 'Next card' },
			{ keys: [modKey(), 'P'], description: 'Show or hide the answer in study mode' },
			{ keys: ['Enter'], description: 'Reveal the current identification or sequence answer' }
		]
	},
	{
		id: 'study',
		title: 'Study',
		items: [
			{ keys: [modKey(), 'P'], description: 'Peek or hide the answer on the focused question' }
		]
	}
];

export function KeyboardShortcutsModal() {
	const { shortcutsOpen, closeShortcuts, toggleShortcuts } = useUIStore();

	useEffect(() => {
		const onKey = (e) => {
			if (e.isComposing) return;
			if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.altKey) return;
			if (e.key.toLowerCase() !== 'k' && e.code !== 'KeyK') return;
			e.preventDefault();
			e.stopPropagation();
			toggleShortcuts();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [toggleShortcuts]);

	return (
		<Modal open={shortcutsOpen} onClose={closeShortcuts} title="Keyboard shortcuts" size="md">
			<div className="space-y-5">
				{GROUPS.map((group) => (
					<section key={group.id}>
						<h3 className="text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">
							{group.title}
						</h3>
						<ul className="divide-line divide-y">
							{group.items.map((item) => (
								<li
									key={`${group.id}-${item.description}`}
									className="flex items-start justify-between gap-4 py-2"
								>
									<p className="text-fg min-w-0 text-sm">{item.description}</p>
									<ShortcutKeys keys={item.keys} />
								</li>
							))}
						</ul>
					</section>
				))}
			</div>
		</Modal>
	);
}
