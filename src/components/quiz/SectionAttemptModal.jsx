import { useMemo, useState } from 'react';

import { Button, Modal } from '../ui';

/**
 * Pre-attempt section picker. Call onConfirm({ fullQuiz, sectionIds }).
 * Remount via key when opening for a different quiz so selection resets.
 */
export default function SectionAttemptModal({
	open,
	onClose,
	sections = [],
	quizTitle = 'Quiz',
	onConfirm
}) {
	const sorted = useMemo(
		() =>
			[...(sections || [])].sort(
				(a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id ?? 0) - (b.id ?? 0)
			),
		[sections]
	);

	const allIds = useMemo(() => sorted.map((s) => s.id).filter(Boolean), [sorted]);
	const [selected, setSelected] = useState(allIds);
	const [allSelected, setAllSelected] = useState(true);

	const toggleAll = () => {
		if (allSelected) {
			setAllSelected(false);
			setSelected([]);
		} else {
			setAllSelected(true);
			setSelected(allIds);
		}
	};

	const toggleSection = (id) => {
		setAllSelected(false);
		setSelected((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};

	const canConfirm = allSelected || selected.length > 0;

	const handleConfirm = () => {
		if (!canConfirm) return;
		if (allSelected || selected.length === allIds.length) {
			onConfirm?.({ fullQuiz: true, sectionIds: [] });
		} else {
			onConfirm?.({ fullQuiz: false, sectionIds: selected });
		}
		onClose?.();
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Choose sections"
			size="md"
			footer={
				<>
					<Button variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button disabled={!canConfirm} onClick={handleConfirm}>
						Start attempt
					</Button>
				</>
			}
		>
			<p className="text-muted mb-4 text-sm">
				Select which parts of <span className="text-fg font-medium">{quizTitle}</span> to take.
			</p>

			<label className="border-line bg-surface-2 mb-3 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5">
				<input
					type="checkbox"
					checked={allSelected}
					onChange={toggleAll}
					className="accent-[var(--primary)] h-4 w-4"
				/>
				<span className="text-fg text-sm font-medium">All sections</span>
			</label>

			<ul className="max-h-64 space-y-2 overflow-y-auto">
				{sorted.map((section) => {
					const checked = allSelected || selected.includes(section.id);
					return (
						<li key={section.id}>
							<label className="border-line hover:bg-surface-2 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition">
								<input
									type="checkbox"
									checked={checked}
									disabled={allSelected}
									onChange={() => toggleSection(section.id)}
									className="accent-[var(--primary)] h-4 w-4"
								/>
								<span className="text-fg min-w-0 flex-1 truncate text-sm">{section.title}</span>
								{section.question_count != null && (
									<span className="text-muted shrink-0 text-xs">{section.question_count} Q</span>
								)}
							</label>
						</li>
					);
				})}
			</ul>
		</Modal>
	);
}
