import { createResourceHooks } from '../hooks/useResource';
import { queryClient } from './queryClient';

export const quizzesApi = createResourceHooks('quizzes', '/quizzes/quiz/');

/** Normalize GET /quizzes/quiz/ payloads into a quiz array. */
export function normalizeQuizList(payload) {
	if (!payload) return [];
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload.data)) return payload.data;
	if (Array.isArray(payload.results)) return payload.results;
	return [];
}

/** Prefer annotated question_count from list API; fall back to nested questions. */
export function quizQuestionCount(quiz) {
	if (typeof quiz?.question_count === 'number') return quiz.question_count;
	if (Array.isArray(quiz?.questions)) return quiz.questions.length;
	return 0;
}

/** Prefer annotated section_count from list API; fall back to nested sections. */
export function quizSectionCount(quiz) {
	if (typeof quiz?.section_count === 'number') return quiz.section_count;
	if (Array.isArray(quiz?.sections)) return quiz.sections.length;
	return 0;
}

export function invalidateQuizQueries() {
	return Promise.all([
		queryClient.invalidateQueries({ queryKey: ['quizzes'] }),
		queryClient.invalidateQueries({ queryKey: ['dashboard', 'quizzes'] })
	]);
}

export function invalidateTemplateQueries() {
	return queryClient.invalidateQueries({ queryKey: ['quiz-templates'] });
}
