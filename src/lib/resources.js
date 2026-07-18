import { createResourceHooks } from '../hooks/useResource'
import { queryClient } from './queryClient'

export const quizzesApi = createResourceHooks('quizzes', '/quizzes/quiz/')

/** Normalize GET /quizzes/quiz/ payloads into a quiz array. */
export function normalizeQuizList(payload) {
	if (!payload) return []
	if (Array.isArray(payload)) return payload
	if (Array.isArray(payload.data)) return payload.data
	if (Array.isArray(payload.results)) return payload.results
	return []
}

export function invalidateQuizQueries() {
	return Promise.all([
		queryClient.invalidateQueries({ queryKey: ['quizzes'] }),
		queryClient.invalidateQueries({ queryKey: ['dashboard', 'quizzes'] }),
	])
}
