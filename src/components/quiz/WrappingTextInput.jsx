import { useLayoutEffect, useRef } from 'react';

import { cn } from '../../lib/format';

/**
 * Auto-growing textarea that soft-wraps like a ChatGPT prompt box.
 * Enter submits when onEnter is set (Shift+Enter inserts a newline).
 */
export default function WrappingTextInput({
	value = '',
	onChange,
	onKeyDown,
	onEnter,
	className,
	minRows = 1,
	plainIde = false,
	inputRef = null,
	...props
}) {
	const innerRef = useRef(null);

	const setRef = (el) => {
		innerRef.current = el;
		if (typeof inputRef === 'function') inputRef(el);
	};

	useLayoutEffect(() => {
		const el = innerRef.current;
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = `${el.scrollHeight}px`;
	}, [value]);

	const handleKeyDown = (event) => {
		if (event.nativeEvent?.isComposing) {
			onKeyDown?.(event);
			return;
		}
		if (onEnter && event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
			event.preventDefault();
			onEnter(value);
			return;
		}
		onKeyDown?.(event);
	};

	return (
		<textarea
			ref={setRef}
			rows={minRows}
			wrap="soft"
			value={value}
			onChange={onChange}
			onKeyDown={handleKeyDown}
			className={cn(
				'max-w-full min-w-0 resize-none overflow-hidden break-words wrap-anywhere whitespace-pre-wrap',
				className
			)}
			{...(plainIde
				? {
						autoComplete: 'off',
						autoCorrect: 'off',
						autoCapitalize: 'off',
						spellCheck: false,
						inputMode: 'text',
						'data-1p-ignore': 'true',
						'data-lpignore': 'true',
						'data-form-type': 'other'
					}
				: {})}
			{...props}
		/>
	);
}
