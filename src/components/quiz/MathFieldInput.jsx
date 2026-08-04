import { useEffect, useId, useRef } from 'react';
import 'mathlive';
import 'mathlive/fonts.css';
import './mathField.css';

import { cn } from '../../lib/format';

/**
 * Live WYSIWYG math editor (MathLive). Emits LaTeX strings via onChange
 * so existing MathRenderer / scoring paths stay compatible.
 * Does not rewrite stored values — authors/fixtures own the LaTeX text.
 */
export default function MathFieldInput({
	value = '',
	onChange,
	onEnter,
	placeholder = 'Enter expression',
	className,
	disabled = false,
	autoFocus = false,
	'aria-label': ariaLabel
}) {
	const ref = useRef(null);
	const lastEmitted = useRef(null);
	const onChangeRef = useRef(onChange);
	const onEnterRef = useRef(onEnter);
	const reactId = useId();

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		onEnterRef.current = onEnter;
	}, [onEnter]);

	useEffect(() => {
		const mf = ref.current;
		if (!mf) return undefined;

		mf.mathVirtualKeyboardPolicy = 'auto';
		mf.smartMode = true;
		mf.smartFence = true;
		mf.smartSuperscript = true;
		mf.placeholder = placeholder || '';
		mf.disabled = Boolean(disabled);
		const initial = value ?? '';
		mf.setValue(initial, { silenceNotifications: true });
		lastEmitted.current = initial;

		const handleInput = (event) => {
			const latex = event.target?.value ?? '';
			lastEmitted.current = latex;
			onChangeRef.current?.(latex);
		};

		const handleKeyDown = (event) => {
			if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
			if (!onEnterRef.current) return;
			event.preventDefault();
			onEnterRef.current();
		};

		mf.addEventListener('input', handleInput);
		mf.addEventListener('keydown', handleKeyDown);
		if (autoFocus) {
			queueMicrotask(() => {
				try {
					mf.focus?.();
				} catch {
					/* math-field may not be ready yet */
				}
			});
		}
		return () => {
			mf.removeEventListener('input', handleInput);
			mf.removeEventListener('keydown', handleKeyDown);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only field setup
	}, []);

	useEffect(() => {
		const mf = ref.current;
		if (!mf) return;
		mf.placeholder = placeholder || '';
	}, [placeholder]);

	useEffect(() => {
		const mf = ref.current;
		if (!mf) return;
		const next = value ?? '';
		if (lastEmitted.current === next) return;
		if (mf.value === next) {
			lastEmitted.current = next;
			return;
		}
		mf.setValue(next, { silenceNotifications: true });
		lastEmitted.current = next;
	}, [value]);

	useEffect(() => {
		const mf = ref.current;
		if (!mf) return;
		mf.disabled = Boolean(disabled);
	}, [disabled]);

	return (
		<math-field
			ref={ref}
			id={reactId}
			className={cn('math-field-input', className)}
			aria-label={ariaLabel || placeholder}
		/>
	);
}
