import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { buildAttemptQuery } from './quizHelpers';
import SectionAttemptModal from './SectionAttemptModal';

function attemptLaunchState() {
	return { attemptLaunchAt: Date.now() };
}

/**
 * Always opens a pre-attempt modal (sections when present),
 * unless options.skipModal is set with a non-empty initialSectionIds list.
 *
 * launchAttempt(quiz, {
 *   initialSectionIds?: number[],
 *   highlightedSectionId?: number,
 *   skipModal?: boolean,
 *   presetHint?: string  // override SectionAttemptModal preset helper text
 * })
 */
export function useAttemptLauncher() {
	const navigate = useNavigate();
	const [target, setTarget] = useState(null);

	const launchAttempt = useCallback(
		(quiz, options = {}) => {
			if (!quiz) return;
			const id = quiz.uuid || quiz.quiz_id || quiz.id;
			if (!id) return;
			const sections = Array.isArray(quiz.sections) ? quiz.sections : [];
			const initialSectionIds = Array.isArray(options.initialSectionIds)
				? options.initialSectionIds.filter(Boolean)
				: [];
			const highlightedSectionId = options.highlightedSectionId ?? initialSectionIds[0] ?? null;

			if (options.skipModal && initialSectionIds.length > 0) {
				navigate(
					`/quizzes/attempt/${id}${buildAttemptQuery({
						fullQuiz: false,
						sectionIds: initialSectionIds
					})}`,
					{ state: attemptLaunchState() }
				);
				return;
			}

			setTarget({
				id,
				title: quiz.quiz_title || 'Quiz',
				sections,
				initialSectionIds: initialSectionIds.length ? initialSectionIds : null,
				highlightedSectionId,
				presetHint: options.presetHint ?? null
			});
		},
		[navigate]
	);

	const closeModal = useCallback(() => setTarget(null), []);

	const confirmScope = useCallback(
		({ fullQuiz, sectionIds, shuffle, sample }) => {
			if (!target?.id) return;
			navigate(
				`/quizzes/attempt/${target.id}${buildAttemptQuery({
					fullQuiz,
					sectionIds,
					shuffle,
					sample
				})}`,
				{ state: attemptLaunchState() }
			);
			setTarget(null);
		},
		[navigate, target]
	);

	const modal = target ? (
		<SectionAttemptModal
			key={`${target.id}-${(target.initialSectionIds || []).join(',')}`}
			open
			onClose={closeModal}
			sections={target.sections || []}
			quizTitle={target.title || 'Quiz'}
			onConfirm={confirmScope}
			initialSectionIds={target.initialSectionIds}
			highlightedSectionId={target.highlightedSectionId}
			presetHint={target.presetHint}
		/>
	) : null;

	return { launchAttempt, attemptModal: modal };
}
