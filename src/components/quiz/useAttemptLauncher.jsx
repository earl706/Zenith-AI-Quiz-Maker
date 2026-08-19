import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { buildAttemptQuery } from './quizHelpers';
import SectionAttemptModal from './SectionAttemptModal';

function attemptLaunchState() {
	return { attemptLaunchAt: Date.now() };
}

/** Attach question_count from nested questions when API omitted section counts. */
function sectionsWithQuestionCounts(quiz) {
	const sections = Array.isArray(quiz?.sections) ? quiz.sections : [];
	if (!sections.length) return sections;
	if (!sections.some((s) => s?.question_count == null && s?.questions_count == null)) {
		return sections;
	}
	const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
	if (!questions.length) return sections;
	const counts = new Map();
	for (const q of questions) {
		const sid = q?.section_id ?? q?.section ?? q?.sectionId;
		if (sid == null) continue;
		counts.set(sid, (counts.get(sid) || 0) + 1);
	}
	if (!counts.size) return sections;
	return sections.map((section) => {
		if (section?.question_count != null || section?.questions_count != null) return section;
		const count = counts.get(section.id);
		return count == null ? section : { ...section, question_count: count };
	});
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
 *   skipCountHydration?: boolean  // skip summary fetch (roadmap stub sections)
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
			const sections = sectionsWithQuestionCounts(quiz);
			const initialSectionIds = Array.isArray(options.initialSectionIds)
				? options.initialSectionIds.filter((id) => id != null && id !== '')
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
				presetHint: options.presetHint ?? null,
				skipCountHydration: Boolean(options.skipCountHydration)
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
			quizId={target.id}
			quizTitle={target.title || 'Quiz'}
			onConfirm={confirmScope}
			initialSectionIds={target.initialSectionIds}
			highlightedSectionId={target.highlightedSectionId}
			presetHint={target.presetHint}
			skipCountHydration={target.skipCountHydration}
		/>
	) : null;

	return { launchAttempt, attemptModal: modal };
}
