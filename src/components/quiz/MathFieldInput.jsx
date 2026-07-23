import { useEffect, useId, useRef } from 'react';
import 'mathlive';
import 'mathlive/fonts.css';
import './mathField.css';

import { cn } from '../../lib/format';

/**
 * Live WYSIWYG math editor (MathLive). Emits LaTeX strings via onChange
 * so existing MathRenderer / scoring paths stay compatible.
 */
export default function MathFieldInput({
	value = '',
	onChange,
	placeholder = 'Enter expression',
	className,
	disabled = false,
	'aria-label': ariaLabel
}) {
	const ref = useRef(null);
	const lastEmitted = useRef(null);
	const onChangeRef = useRef(onChange);
	const reactId = useId();

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		const mf = ref.current;
		if (!mf) return undefined;

		mf.mathVirtualKeyboardPolicy = 'auto';
		mf.smartMode = true;
		mf.smartFence = true;
		mf.smartSuperscript = true;
		mf.placeholder = placeholder || '';
		mf.disabled = Boolean(disabled);
		mf.setValue(value ?? '', { silenceNotifications: true });
		lastEmitted.current = value ?? '';

		const handleInput = (event) => {
			const latex = event.target?.value ?? '';
			lastEmitted.current = latex;
			onChangeRef.current?.(latex);
		};

		mf.addEventListener('input', handleInput);
		return () => mf.removeEventListener('input', handleInput);
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
