import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

import {
	ATTEMPT_DRAFT_STORAGE_KEY,
	buildAttemptPath,
	useAttemptDraftStore
} from '../../stores/attemptDraftStore';

function countDraftAnswers(answers) {
	return (answers || []).filter((a) => {
		if (String(a?.userAnswer ?? '').trim() !== '') return true;
		if (
			Array.isArray(a?.userSequence) &&
			a.userSequence.some((x) => String(x ?? '').trim() !== '')
		) {
			return true;
		}
		if (
			Array.isArray(a?.userChessMoves) &&
			a.userChessMoves.some((x) => String(x ?? '').trim() !== '')
		) {
			return true;
		}
		return false;
	}).length;
}

export function AttemptDraftButton() {
	const navigate = useNavigate();
	const location = useLocation();
	const draft = useAttemptDraftStore((s) => s.draft);
	const purgeStale = useAttemptDraftStore((s) => s.purgeStale);

	useEffect(() => {
		purgeStale();
		const onStorage = (event) => {
			if (event.key !== ATTEMPT_DRAFT_STORAGE_KEY) return;
			useAttemptDraftStore.persist.rehydrate();
			purgeStale();
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, [purgeStale]);

	if (!draft?.quizId || !draft.scope) return null;

	const path = buildAttemptPath(draft.quizId, draft.scope);
	const currentPath = `${location.pathname}${location.search}`;
	if (currentPath === path) return null;

	const title = draft.quizTitle || draft.quizData?.quiz_title || 'Quiz attempt';
	const questionCount = Array.isArray(draft.questionIds)
		? draft.questionIds.length
		: (draft.questions || []).length;
	const answered = countDraftAnswers(draft.answers);
	const ariaLabel = `Resume paused attempt: ${title}, ${answered} of ${questionCount} answered`;

	return (
		<button
			type="button"
			onClick={() => navigate(path)}
			className="hover:bg-surface-2 relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md"
			aria-label={ariaLabel}
			title={ariaLabel}
		>
			<BookOpen size={18} className="text-accent" />
			<span className="bg-accent absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full" aria-hidden />
		</button>
	);
}
