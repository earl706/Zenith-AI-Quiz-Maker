import { useEffect, useId, useRef } from 'react';
import 'mathlive';
import 'mathlive/fonts.css';
import './mathField.css';

import { cn } from '../../lib/format';

function isMathFieldFocused(mf) {
	if (!mf) return false;
	const active = document.activeElement;
	if (active === mf) return true;
	if (mf.shadowRoot?.activeElement) return true;
	if (active && typeof mf.contains === 'function' && mf.contains(active)) return true;
	return false;
}

function tryFocusMathField(mf) {
	if (!mf || mf.disabled) return false;
	try {
		mf.focus?.();
	} catch {
		return false;
	}
	return isMathFieldFocused(mf);
}

/**
 * Focus ASAP; if MathLive is not ready yet, retry on mount / frames / short delays.
 * Does not change virtual-keyboard policy — same as a user click-focus.
 */
function scheduleMathFieldAutoFocus(mf) {
	let cancelled = false;
	const timers = [];
	let rafOuter = 0;
	let rafInner = 0;

	const attempt = () => {
		if (cancelled || !mf || mf.disabled) return true;
		return tryFocusMathField(mf);
	};

	if (attempt()) {
		return () => {
			cancelled = true;
		};
	}

	const onMount = () => {
		attempt();
	};
	mf.addEventListener('mount', onMount);

	rafOuter = requestAnimationFrame(() => {
		if (attempt()) return;
		rafInner = requestAnimationFrame(() => {
			attempt();
		});
	});

	for (const ms of [0, 50, 100, 200]) {
		timers.push(setTimeout(() => attempt(), ms));
	}

	if (typeof customElements !== 'undefined') {
		customElements.whenDefined('math-field').then(() => {
			if (!cancelled) {
				requestAnimationFrame(() => attempt());
			}
		});
	}

	return () => {
		cancelled = true;
		mf.removeEventListener('mount', onMount);
		cancelAnimationFrame(rafOuter);
		cancelAnimationFrame(rafInner);
		for (const id of timers) clearTimeout(id);
	};
}

/**
 * Live WYSIWYG math editor (MathLive). Emits LaTeX strings via onChange
 * so existing MathRenderer / scoring paths stay compatible.
 * Does not rewrite stored values — authors/fixtures own the LaTeX text.
 */
export { tryFocusMathField };

export default function MathFieldInput({
	value = '',
	onChange,
	onEnter,
	placeholder = 'Enter expression',
	className,
	disabled = false,
	autoFocus = false,
	fieldRef = null,
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
		if (typeof fieldRef === 'function') {
			fieldRef(mf);
			return () => fieldRef(null);
		}
		if (fieldRef && typeof fieldRef === 'object') {
			fieldRef.current = mf;
			return () => {
				fieldRef.current = null;
			};
		}
		return undefined;
	}, [fieldRef]);

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
			onEnterRef.current(lastEmitted.current ?? mf.value ?? '');
		};

		mf.addEventListener('input', handleInput);
		mf.addEventListener('keydown', handleKeyDown);

		let cancelAutoFocus = null;
		if (autoFocus && !disabled) {
			cancelAutoFocus = scheduleMathFieldAutoFocus(mf);
		}

		return () => {
			cancelAutoFocus?.();
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
