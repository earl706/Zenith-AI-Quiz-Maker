import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { buildAttemptQuery } from './quizHelpers';
import SectionAttemptModal from './SectionAttemptModal';

/**
 * Opens SectionAttemptModal when the quiz has sections; otherwise navigates directly.
 */
export function useAttemptLauncher() {
	const navigate = useNavigate();
	const [target, setTarget] = useState(null);

	const launchAttempt = useCallback(
		(quiz) => {
			if (!quiz) return;
			const id = quiz.uuid || quiz.quiz_id || quiz.id;
			if (!id) return;
			const sections = Array.isArray(quiz.sections) ? quiz.sections : [];
			if (sections.length === 0) {
				navigate(`/quizzes/attempt/${id}${buildAttemptQuery({ fullQuiz: true })}`);
				return;
			}
			setTarget({ id, title: quiz.quiz_title || 'Quiz', sections });
		},
		[navigate]
	);

	const closeModal = useCallback(() => setTarget(null), []);

	const confirmScope = useCallback(
		({ fullQuiz, sectionIds }) => {
			if (!target?.id) return;
			navigate(`/quizzes/attempt/${target.id}${buildAttemptQuery({ fullQuiz, sectionIds })}`);
			setTarget(null);
		},
		[navigate, target]
	);

	const modal = target ? (
		<SectionAttemptModal
			key={target.id}
			open
			onClose={closeModal}
			sections={target.sections || []}
			quizTitle={target.title || 'Quiz'}
			onConfirm={confirmScope}
		/>
	) : null;

	return { launchAttempt, attemptModal: modal };
}
