import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'app.quizQuestionLayout';
export const QUESTION_LAYOUT_SCROLL = 'scroll';
export const QUESTION_LAYOUT_SECTION = 'section';

function readStoredLayout() {
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		if (value === QUESTION_LAYOUT_SECTION || value === QUESTION_LAYOUT_SCROLL) {
			return value;
		}
	} catch {
		// ignore
	}
	return QUESTION_LAYOUT_SCROLL;
}

export function useQuestionDisplayLayout() {
	const [layout, setLayoutState] = useState(readStoredLayout);

	const setLayout = useCallback((next) => {
		setLayoutState(next);
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// ignore
		}
	}, []);

	return [layout, setLayout];
}

function sectionKeyOf(group, index) {
	return String(group?.section?.clientKey ?? group?.section?.id ?? `ungrouped-${index}`);
}

/**
 * Section pager index tracked by section key rather than position, so editing a
 * question (which rebuilds the group array) keeps the viewed section, and
 * reordering follows the section it was showing.
 */
export function useSectionPageIndex(groups) {
	const keys = useMemo(() => (groups || []).map(sectionKeyOf), [groups]);
	const keySignature = keys.join('|');
	const [activeKey, setActiveKey] = useState(() => keys[0] ?? null);

	const sectionPage = useMemo(() => {
		const index = keys.indexOf(activeKey);
		return index >= 0 ? index : 0;
	}, [keys, activeKey]);

	const setSectionPage = useCallback(
		(next) => {
			const requested = typeof next === 'function' ? next(sectionPage) : next;
			const clamped = Math.min(Math.max(0, Number(requested) || 0), Math.max(0, keys.length - 1));
			setActiveKey(keys[clamped] ?? null);
		},
		[keys, sectionPage]
	);

	useEffect(() => {
		// Active section vanished (quiz switched, section removed) — fall back to the first.
		const available = keySignature ? keySignature.split('|') : [];
		if (available.length > 0 && !available.includes(activeKey)) {
			setActiveKey(available[0]);
		}
	}, [keySignature, activeKey]);

	return [sectionPage, setSectionPage, setActiveKey];
}
