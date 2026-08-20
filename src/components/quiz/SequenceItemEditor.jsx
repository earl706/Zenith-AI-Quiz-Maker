import { Ban, ChevronDown, ChevronUp, Eye, Pencil, Plus, X } from 'lucide-react';

import { cn } from '../../lib/format';
import { Button } from '../ui';
import MathFieldInput from './MathFieldInput';
import {
	PLAIN_IDE_TEXT_INPUT_AUTO_OFF,
	SEQUENCE_ITEM_MAX,
	SEQUENCE_ITEM_MIN,
	createSequenceItemClientKey
} from './quizHelpers';

const ROLES = [
	{ id: 'given', label: 'Shown to student', icon: Eye },
	{ id: 'blank', label: 'Must answer', icon: Pencil },
	{ id: 'distractor', label: 'Distractor', icon: Ban }
];

export default function SequenceItemEditor({ question, onItemsChange, disabled = false }) {
	const items = Array.isArray(question.sequenceItems) ? question.sequenceItems : [];
	const math = !!question.mathematical;
	const mode = question.sequenceMode || 'gap';

	const updateItems = (next) => {
		onItemsChange(
			next.map((item, i) => ({
				...item,
				order: i,
				role:
					mode === 'full' && item.role === 'given'
						? 'blank'
						: item.role === 'distractor'
							? 'distractor'
							: item.role === 'given'
								? 'given'
								: 'blank'
			}))
		);
	};

	const setRole = (index, role) => {
		if (mode === 'full' && role === 'given') return;
		updateItems(items.map((item, i) => (i === index ? { ...item, role } : item)));
	};

	const setText = (index, text) => {
		updateItems(items.map((item, i) => (i === index ? { ...item, text } : item)));
	};

	const move = (index, delta) => {
		const next = [...items];
		const dest = index + delta;
		if (dest < 0 || dest >= next.length) return;
		[next[index], next[dest]] = [next[dest], next[index]];
		updateItems(next);
	};

	const remove = (index) => {
		if (items.length <= SEQUENCE_ITEM_MIN) return;
		updateItems(items.filter((_, i) => i !== index));
	};

	const add = () => {
		if (items.length >= SEQUENCE_ITEM_MAX) return;
		updateItems([
			...items,
			{
				clientKey: createSequenceItemClientKey(),
				text: '',
				role: mode === 'full' ? 'blank' : 'blank',
				order: items.length
			}
		]);
	};

	return (
		<div className="space-y-1.5">
			{items.map((item, index) => (
				<div className="flex items-center gap-1.5" key={item.clientKey || item.id || index}>
					<span className="text-muted w-5 shrink-0 text-center text-xs tabular-nums">
						{index + 1}
					</span>
					<div className="flex shrink-0 gap-0.5">
						{ROLES.map(({ id, label, icon: Icon }) => {
							const blocked = mode === 'full' && id === 'given';
							const active = item.role === id;
							return (
								<button
									key={id}
									type="button"
									title={label}
									aria-label={label}
									disabled={disabled || blocked}
									onClick={() => setRole(index, id)}
									className={cn(
										'flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border transition',
										active
											? 'border-primary bg-primary text-primary-fg'
											: 'border-line bg-surface text-muted hover:bg-surface-2',
										(disabled || blocked) && 'cursor-not-allowed opacity-40'
									)}
								>
									<Icon size={13} />
								</button>
							);
						})}
					</div>
					{math ? (
						<MathFieldInput
							value={item.text || ''}
							onChange={(latex) => setText(index, latex)}
							placeholder={`Step ${index + 1}`}
							aria-label={`Sequence item ${index + 1}`}
							className="min-w-0 flex-1"
						/>
					) : (
						<input
							type="text"
							value={item.text || ''}
							onChange={(e) => setText(index, e.target.value)}
							placeholder={`Item ${index + 1}`}
							{...PLAIN_IDE_TEXT_INPUT_AUTO_OFF}
							className="border-line bg-surface text-fg focus:border-primary min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-sm focus:outline-none"
							required
							disabled={disabled}
						/>
					)}
					{!disabled && (
						<>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 shrink-0 cursor-pointer"
								aria-label={`Move item ${index + 1} up`}
								onClick={() => move(index, -1)}
								disabled={index === 0}
							>
								<ChevronUp size={13} />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 shrink-0 cursor-pointer"
								aria-label={`Move item ${index + 1} down`}
								onClick={() => move(index, 1)}
								disabled={index === items.length - 1}
							>
								<ChevronDown size={13} />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 shrink-0 cursor-pointer"
								aria-label={`Remove item ${index + 1}`}
								onClick={() => remove(index)}
								disabled={items.length <= SEQUENCE_ITEM_MIN}
							>
								<X size={13} className="text-danger" />
							</Button>
						</>
					)}
				</div>
			))}
			{!disabled && items.length < SEQUENCE_ITEM_MAX && (
				<Button variant="ghost" size="sm" className="w-full" onClick={add}>
					<Plus size={13} /> Add item
				</Button>
			)}
			<p className="text-muted text-[0.65rem]">
				Use {'{{n}}'} in the question text to reference item n. {SEQUENCE_ITEM_MIN}–
				{SEQUENCE_ITEM_MAX} unique items.
			</p>
		</div>
	);
}
