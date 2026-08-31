import {
	Check,
	ChevronDown,
	ChevronUp,
	ChevronsDown,
	ChevronsLeft,
	ChevronsRight,
	ChevronsUp,
	Image as ImageIcon,
	ListOrdered,
	Plus,
	Sigma,
	Swords,
	Type,
	X
} from 'lucide-react';

import { cn } from '../../lib/format';
import { resolveQuizImageSrc } from '../../lib/quizImages';
import { Input } from '../ui';
import {
	PER_QUESTION_TIMER_DEFAULT,
	PER_QUESTION_TIMER_MAX,
	PER_QUESTION_TIMER_MIN,
	clampPerQuestionSeconds
} from './quizHelpers';

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

const ICON_TOGGLE_CLASS =
	'inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border transition focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2';

export function IconToggleButton({ active, onClick, label, icon: Icon, disabled = false }) {
	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			aria-pressed={active}
			disabled={disabled}
			onClick={onClick}
			className={cn(
				ICON_TOGGLE_CLASS,
				active
					? 'border-primary/40 bg-primary/12 text-primary shadow-primary/10 shadow-sm'
					: 'border-line bg-surface text-muted hover:border-primary/25 hover:bg-surface-2 hover:text-fg',
				disabled && 'cursor-not-allowed opacity-40'
			)}
		>
			<Icon size={14} />
		</button>
	);
}

/** Math / Seq / ID / Images flags on a question card header. */
export function QuestionTypeFlagToggles({ question, onToggle, onToggleImages }) {
	return (
		<div className="flex items-center gap-1">
			<IconToggleButton
				active={!!question.mathematical}
				label="Math"
				icon={Sigma}
				onClick={() => onToggle('mathematical', !question.mathematical)}
			/>
			<IconToggleButton
				active={!!question.chessPuzzle}
				label="Chess puzzle"
				icon={Swords}
				onClick={() => onToggle('chessPuzzle', !question.chessPuzzle)}
			/>
			<IconToggleButton
				active={!!question.sequence}
				label="Sequence"
				icon={ListOrdered}
				onClick={() => onToggle('sequence', !question.sequence)}
			/>
			{!question.sequence && !question.chessPuzzle && (
				<IconToggleButton
					active={!!question.identification}
					label="Identification"
					icon={Type}
					onClick={() => onToggle('identification', !question.identification)}
				/>
			)}
			{!question.identification &&
				!question.mathematical &&
				!question.sequence &&
				!question.chessPuzzle && (
					<IconToggleButton
						active={!!question.showChoiceImages}
						label="Choice images"
						icon={ImageIcon}
						onClick={onToggleImages}
					/>
				)}
		</div>
	);
}

/** In-section up/down/top/bottom plus optional adjacent-section transfer. */
export function QuestionOrderControls({
	canMoveUp = false,
	canMoveDown = false,
	onMoveToStart,
	onMoveUp,
	onMoveDown,
	onMoveToEnd,
	canTransferPrev,
	canTransferNext,
	onTransferPrev,
	onTransferNext,
	showTransfer = true
}) {
	const btnClass =
		'border-line bg-surface text-muted hover:text-fg disabled:text-muted/40 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border disabled:cursor-not-allowed';
	return (
		<div className="flex flex-wrap items-center gap-1">
			<button
				type="button"
				disabled={!canMoveUp}
				onClick={onMoveToStart}
				aria-label="Move question to top of section"
				title="Move to top"
				className={btnClass}
			>
				<ChevronsUp size={14} />
			</button>
			<button
				type="button"
				disabled={!canMoveUp}
				onClick={onMoveUp}
				aria-label="Move question up"
				title="Move up"
				className={btnClass}
			>
				<ChevronUp size={14} />
			</button>
			<button
				type="button"
				disabled={!canMoveDown}
				onClick={onMoveDown}
				aria-label="Move question down"
				title="Move down"
				className={btnClass}
			>
				<ChevronDown size={14} />
			</button>
			<button
				type="button"
				disabled={!canMoveDown}
				onClick={onMoveToEnd}
				aria-label="Move question to bottom of section"
				title="Move to bottom"
				className={btnClass}
			>
				<ChevronsDown size={14} />
			</button>
			{showTransfer && (
				<>
					<button
						type="button"
						disabled={!canTransferPrev}
						onClick={onTransferPrev}
						aria-label="Move question to previous section"
						title="Previous section"
						className={btnClass}
					>
						<ChevronsLeft size={14} />
					</button>
					<button
						type="button"
						disabled={!canTransferNext}
						onClick={onTransferNext}
						aria-label="Move question to next section"
						title="Next section"
						className={btnClass}
					>
						<ChevronsRight size={14} />
					</button>
				</>
			)}
		</div>
	);
}

export function ImageDropzone({
	preview,
	onClear,
	onChange,
	onPreview,
	label,
	compact = false,
	/** CSS aspect-ratio, e.g. "3/2" for landscape question images. */
	aspectRatio = null,
	urlValue = '',
	onUrlChange
}) {
	const src = resolveQuizImageSrc(preview) || preview;
	const isLandscape32 = aspectRatio === '3/2';
	const frameClass = isLandscape32 ? 'aspect-[3/2] w-full max-w-[30rem]' : null;

	if (src) {
		return (
			<div className="space-y-1.5">
				<div className={cn('relative', frameClass && 'mx-auto max-w-[30rem]')}>
					<button
						type="button"
						onClick={() => onPreview?.(src, label || 'Image preview')}
						className="border-line block w-full cursor-pointer overflow-hidden rounded-md border-[0.1px] text-left"
						aria-label={`Preview ${label || 'image'}`}
					>
						<img
							src={src}
							alt=""
							className={cn(
								'w-full object-cover transition hover:opacity-90',
								frameClass || (compact ? 'h-16' : 'h-24')
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
				{onUrlChange && (
					<input
						type="url"
						value={urlValue}
						onChange={(e) => onUrlChange(e.target.value)}
						placeholder="Or paste image URL"
						className="border-line bg-surface text-fg focus:border-primary w-full rounded-md border px-2 py-1 text-[0.7rem] focus:outline-none"
					/>
				)}
			</div>
		);
	}

	// Empty 3:2 dropzone: ~10% of filled height (30rem × 2/3 → 20rem → 2rem).
	const emptyFrameClass = isLandscape32
		? 'mx-auto h-8 w-full max-w-[30rem] flex-row gap-1.5'
		: cn('w-full', compact ? 'h-12' : 'h-16', compact ? 'gap-0.5' : 'gap-1');

	return (
		<div className="space-y-1.5">
			<label
				className={cn(
					'border-line hover:border-primary/40 text-muted flex cursor-pointer items-center justify-center rounded-md border border-dashed text-xs transition',
					emptyFrameClass
				)}
			>
				<input type="file" accept="image/*" onChange={onChange} className="hidden" />
				<Plus size={isLandscape32 || compact ? 14 : 16} />
				<span>{label}</span>
			</label>
			{onUrlChange && (
				<input
					type="url"
					value={urlValue}
					onChange={(e) => onUrlChange(e.target.value)}
					placeholder="Or paste image URL"
					className="border-line bg-surface text-fg focus:border-primary w-full rounded-md border px-2 py-1 text-[0.7rem] focus:outline-none"
				/>
			)}
		</div>
	);
}

/** Compact choice image control: icon button empty, tiny thumb when set. */
export function ChoiceImageControl({
	preview,
	onChange,
	onClear,
	onPreview,
	urlValue,
	onUrlChange
}) {
	const src = resolveQuizImageSrc(preview) || preview;

	if (src) {
		return (
			<div className="flex shrink-0 items-center gap-1">
				<div className="relative">
					<button
						type="button"
						onClick={() => onPreview?.(src, 'Choice image')}
						className="block cursor-pointer overflow-hidden rounded"
						aria-label="Preview choice image"
					>
						<img src={src} alt="" className="h-7 w-7 object-cover transition hover:opacity-90" />
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
				{onUrlChange && (
					<input
						type="url"
						value={urlValue || ''}
						onChange={(e) => onUrlChange(e.target.value)}
						placeholder="URL"
						className="border-line bg-surface text-fg focus:border-primary hidden w-24 rounded border px-1 py-0.5 text-[0.65rem] focus:outline-none sm:block"
						title="Paste choice image URL"
					/>
				)}
			</div>
		);
	}

	return (
		<div className="flex shrink-0 items-center gap-1">
			<label
				className="text-muted hover:bg-surface-2 hover:text-fg flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition"
				title="Add image"
			>
				<input type="file" accept="image/*" onChange={onChange} className="hidden" />
				<ImageIcon size={14} />
			</label>
			{onUrlChange && (
				<input
					type="url"
					value={urlValue || ''}
					onChange={(e) => onUrlChange(e.target.value)}
					placeholder="URL"
					className="border-line bg-surface text-fg focus:border-primary hidden w-24 rounded border px-1 py-0.5 text-[0.65rem] focus:outline-none sm:block"
					title="Paste choice image URL"
				/>
			)}
		</div>
	);
}

/** Quiz-level per-question timer toggle + seconds (Create/Edit settings). */
export function PerQuestionTimerSettings({
	enabled,
	onEnabledChange,
	seconds,
	onSecondsChange,
	disabled = false
}) {
	return (
		<div className="space-y-2">
			<button
				type="button"
				disabled={disabled}
				onClick={() => onEnabledChange(!enabled)}
				aria-pressed={enabled}
				className={cn(
					'inline-flex w-full cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[0.7rem] font-medium transition',
					'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
					enabled
						? 'border-primary/40 bg-primary/12 text-primary shadow-primary/10 shadow-sm'
						: 'border-line bg-surface text-muted hover:border-primary/25 hover:bg-surface-2 hover:text-fg',
					disabled && 'cursor-not-allowed opacity-60'
				)}
			>
				<span
					aria-hidden
					className={cn(
						'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition',
						enabled ? 'border-primary bg-primary text-primary-fg' : 'border-line bg-transparent'
					)}
				>
					{enabled && <Check size={9} strokeWidth={3} />}
				</span>
				Per-question timer
			</button>
			{enabled && (
				<div className="space-y-1">
					<Input
						label={`Seconds per question (${PER_QUESTION_TIMER_MIN}–${PER_QUESTION_TIMER_MAX})`}
						type="number"
						min={PER_QUESTION_TIMER_MIN}
						max={PER_QUESTION_TIMER_MAX}
						value={seconds}
						disabled={disabled}
						onChange={(e) => {
							const next = e.target.value;
							if (next === '') {
								onSecondsChange(PER_QUESTION_TIMER_DEFAULT);
								return;
							}
							onSecondsChange(clampPerQuestionSeconds(next, seconds));
						}}
						className="py-1.5"
					/>
					<p className="text-muted text-[0.65rem] leading-snug">
						Applies in flashcard mode: countdown, no going back, auto-advance when time runs out.
						Optional per-question overrides below each question.
					</p>
				</div>
			)}
		</div>
	);
}

/** Optional per-question seconds override when quiz timer is on. */
export function QuestionTimerOverrideField({
	value,
	onChange,
	quizDefaultSeconds,
	disabled = false
}) {
	const display = value == null || value === '' ? '' : String(value);
	return (
		<Input
			label={`Timer override (optional, default ${clampPerQuestionSeconds(quizDefaultSeconds)}s)`}
			type="number"
			min={PER_QUESTION_TIMER_MIN}
			max={PER_QUESTION_TIMER_MAX}
			placeholder="Use quiz default"
			value={display}
			disabled={disabled}
			onChange={(e) => {
				const raw = e.target.value;
				if (raw === '') {
					onChange(null);
					return;
				}
				onChange(clampPerQuestionSeconds(raw, quizDefaultSeconds));
			}}
			className="py-1.5"
		/>
	);
}
