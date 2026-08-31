import { useEffect, useRef, useState } from 'react';

function getScrollRoot() {
	if (typeof document === 'undefined') return null;
	return document.getElementById('main-content');
}

/**
 * Defer mounting heavy react-chessboard instances until near the viewport.
 * Read-only boards unmount when scrolled away; interactive boards stay mounted once seen.
 */
export function useChessBoardInView({
	enabled = true,
	keepMountedWhenHidden = false,
	rootMargin = '240px 0px'
} = {}) {
	const ref = useRef(null);
	const [mounted, setMounted] = useState(!enabled);

	useEffect(() => {
		if (!enabled) {
			setMounted(true);
			return undefined;
		}
		const el = ref.current;
		if (!el) return undefined;

		const root = getScrollRoot();
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setMounted(true);
					return;
				}
				if (!keepMountedWhenHidden) {
					setMounted(false);
				}
			},
			{ root, rootMargin, threshold: 0.01 }
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [enabled, keepMountedWhenHidden, rootMargin]);

	return { ref, mounted };
}
