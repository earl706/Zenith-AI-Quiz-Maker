import { Check, Plus, X, Image as ImageIcon } from 'lucide-react';

import { cn } from '../../lib/format';

export const QUIZ_TAG_COLORS = [
	{ name: 'Red', hex: '#EF4444' },
	{ name: 'Green', hex: '#10B981' },
	{ name: 'Blue', hex: '#3B82F6' },
	{ name: 'Yellow', hex: '#FACC15' },
	{ name: 'Purple', hex: '#A855F7' },
	{ name: 'Orange', hex: '#F97316' },
	{ name: 'Teal', hex: '#14B8A6' },
	{ name: 'Pink', hex: '#EC4899' },
	{ name: 'Indigo', hex: '#6366F1' },
	{ name: 'Lime', hex: '#84CC16' },
	{ name: 'Cyan', hex: '#06B6D4' },
	{ name: 'Amber', hex: '#F59E0B' },
	{ name: 'Rose', hex: '#F43F5E' },
	{ name: 'Sky', hex: '#0EA5E9' },
	{ name: 'Emerald', hex: '#50C878' }
];

export function ToggleChip({ active, onClick, children, className }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={cn(
				'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.7rem] font-medium whitespace-nowrap transition',
				'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
				active
					? 'border-primary/40 bg-primary/12 text-primary shadow-primary/10 shadow-sm'
					: 'border-line bg-surface text-muted hover:border-primary/25 hover:bg-surface-2 hover:text-fg',
				className
			)}
		>
			<span
				aria-hidden
				className={cn(
					'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition',
					active ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-transparent'
				)}
			>
				{active && <Check size={9} strokeWidth={3} />}
			</span>
			{children}
		</button>
	);
}

export function ImageDropzone({ preview, onClear, onChange, onPreview, label, compact = false }) {
	if (preview) {
		return (
			<div className="relative">
				<button
					type="button"
					onClick={() => onPreview?.(preview, label || 'Image preview')}
					className="block w-full cursor-pointer overflow-hidden rounded-md text-left"
					aria-label={`Preview ${label || 'image'}`}
				>
					<img
						src={preview}
						alt=""
						className={cn(
							'w-full object-cover transition hover:opacity-90',
							compact ? 'h-16' : 'h-24'
						)}
					/>
				</button>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onClear?.();
					}}
					aria-label="Remove image"
					className="bg-danger absolute top-1 right-1 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-white"
				>
					<X size={11} />
				</button>
			</div>
		);
	}

	return (
		<label
			className={cn(
				'border-line hover:border-primary/40 text-muted flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-xs transition',
				compact ? 'h-12 gap-0.5' : 'h-16 gap-1'
			)}
		>
			<input type="file" accept="image/*" onChange={onChange} className="hidden" />
			<Plus size={compact ? 14 : 16} />
			<span>{label}</span>
		</label>
	);
}

/** Compact choice image control: icon button empty, tiny thumb when set. */
export function ChoiceImageControl({ preview, onChange, onClear, onPreview }) {
	if (preview) {
		return (
			<div className="relative shrink-0">
				<button
					type="button"
					onClick={() => onPreview?.(preview, 'Choice image')}
					className="block cursor-pointer overflow-hidden rounded"
					aria-label="Preview choice image"
				>
					<img src={preview} alt="" className="h-7 w-7 object-cover transition hover:opacity-90" />
				</button>
				<button
					type="button"
					aria-label="Remove choice image"
					onClick={(e) => {
						e.stopPropagation();
						onClear?.();
					}}
					className="bg-danger absolute -top-1 -right-1 z-10 flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full text-white"
				>
					<X size={7} />
				</button>
			</div>
		);
	}

	return (
		<label
			className="text-muted hover:bg-surface-2 hover:text-fg flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition"
			title="Add image"
		>
			<input type="file" accept="image/*" onChange={onChange} className="hidden" />
			<ImageIcon size={14} />
		</label>
	);
}
