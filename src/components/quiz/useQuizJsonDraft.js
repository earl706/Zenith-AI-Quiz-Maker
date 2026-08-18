import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	downloadQuizJsonDraft,
	mergeParsedIntoDraft,
	parseQuizJsonText,
	persistableNumericId,
	serializeQuizJsonDraft
} from './quizJsonDraft';

function collectPersistableIds(items) {
	const set = new Set();
	for (const item of items || []) {
		const id = persistableNumericId(item?.id);
		if (id != null) set.add(id);
	}
	return set;
}

function sameDiagnostics(a, b) {
	if (a.length !== b.length) return false;
	return a.every(
		(d, i) => d.message === b[i].message && d.path === b[i].path && d.severity === b[i].severity
	);
}

/**
 * Live two-way JSON ↔ form draft. Does not persist; Save/Create still uses form state.
 */
export function useQuizJsonDraft({
	questions,
	sections,
	setQuestions,
	setSections,
	quizMeta,
	persistIds = false,
	disabled = false
}) {
	const questionsRef = useRef(questions);
	const sectionsRef = useRef(sections);
	questionsRef.current = questions;
	sectionsRef.current = sections;

	const allowedQuestionIdsRef = useRef(new Set());
	const allowedSectionIdsRef = useRef(new Set());
	const graveyardQuestionsRef = useRef(new Map());
	const graveyardSectionsRef = useRef(new Map());
	const jsonFocusedRef = useRef(false);
	const applyingJsonRef = useRef(false);

	const [jsonText, setJsonText] = useState('');
	const [diagnostics, setDiagnostics] = useState([]);
	const [jsonFocused, setJsonFocused] = useState(false);

	useEffect(() => {
		for (const id of collectPersistableIds(questions)) {
			allowedQuestionIdsRef.current.add(id);
		}
		for (const id of collectPersistableIds(sections)) {
			allowedSectionIdsRef.current.add(id);
		}
	}, [questions, sections]);

	const serializeArgs = useMemo(
		() => ({
			quizMeta,
			questions,
			sections,
			persistIds
		}),
		[quizMeta, questions, sections, persistIds]
	);

	useEffect(() => {
		if (jsonFocusedRef.current || applyingJsonRef.current) {
			applyingJsonRef.current = false;
			return;
		}
		try {
			const next = serializeQuizJsonDraft(serializeArgs);
			setJsonText((prev) => (prev === next ? prev : next));
			setDiagnostics((prev) => (prev.length ? [] : prev));
		} catch {
			/* keep last JSON if serialize fails (e.g. empty draft) */
		}
	}, [serializeArgs]);

	const applyJsonText = useCallback(
		(value) => {
			setJsonText(value);
			if (disabled) return;
			const parsed = parseQuizJsonText(value);
			if (!parsed.ok) {
				setDiagnostics((prev) =>
					sameDiagnostics(prev, parsed.diagnostics) ? prev : parsed.diagnostics
				);
				return;
			}
			applyingJsonRef.current = true;
			const merged = mergeParsedIntoDraft({
				data: parsed.data,
				prevQuestions: questionsRef.current,
				prevSections: sectionsRef.current,
				persistIds,
				allowedQuestionIds: allowedQuestionIdsRef.current,
				allowedSectionIds: allowedSectionIdsRef.current,
				graveyardQuestions: graveyardQuestionsRef.current,
				graveyardSections: graveyardSectionsRef.current
			});
			const nextDiagnostics = [...(parsed.diagnostics || []), ...(merged.diagnostics || [])];
			setDiagnostics((prev) => (sameDiagnostics(prev, nextDiagnostics) ? prev : nextDiagnostics));
			setQuestions(merged.questions);
			setSections(merged.sections);
			queueMicrotask(() => {
				applyingJsonRef.current = false;
			});
		},
		[disabled, persistIds, setQuestions, setSections]
	);

	const formatFromForm = useCallback(() => {
		try {
			const next = serializeQuizJsonDraft({
				quizMeta,
				questions: questionsRef.current,
				sections: sectionsRef.current,
				persistIds
			});
			setJsonText(next);
			setDiagnostics([]);
		} catch (err) {
			setDiagnostics([
				{
					severity: 'error',
					fatal: true,
					path: '',
					message: err?.message || 'Could not format JSON from the form.'
				}
			]);
		}
	}, [persistIds, quizMeta]);

	const copyJson = useCallback(async () => {
		await navigator.clipboard.writeText(jsonText);
	}, [jsonText]);

	const downloadJson = useCallback(() => {
		downloadQuizJsonDraft({
			quizMeta,
			questions: questionsRef.current,
			sections: sectionsRef.current,
			persistIds: false
		});
	}, [quizMeta]);

	const onJsonFocus = useCallback(() => {
		jsonFocusedRef.current = true;
		setJsonFocused(true);
	}, []);

	const onJsonBlur = useCallback(() => {
		jsonFocusedRef.current = false;
		setJsonFocused(false);
		if (disabled) return;
		const parsed = parseQuizJsonText(jsonText);
		if (!parsed.ok) {
			formatFromForm();
		}
	}, [disabled, formatFromForm, jsonText]);

	const hasBlockingError = diagnostics.some((d) => d.severity === 'error');

	return {
		jsonText,
		diagnostics,
		jsonFocused,
		hasBlockingError,
		applyJsonText,
		formatFromForm,
		copyJson,
		downloadJson,
		onJsonFocus,
		onJsonBlur
	};
}
