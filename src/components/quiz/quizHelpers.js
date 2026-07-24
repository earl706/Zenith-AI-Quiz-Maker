const MATH_TYPES = new Set(['MUL-COM', 'COM', 'IDE-COM']);
const ID_TYPES = new Set(['IDE', 'IDE-COM']);

const QUESTION_TYPE_LABELS = {
	MUL: 'Multiple choice',
	IDE: 'Identification',
	'MUL-COM': 'Multiple choice · math',
	'IDE-COM': 'Identification · math',
	COM: 'Computational'
};

export function getChoiceData(choice) {
	if (typeof choice === 'object' && choice !== null) {
		return { text: choice.text || choice, image: choice.image ?? null, id: choice.id };
	}
	return { text: choice, image: null, id: undefined };
}

export function isMathematical(questionType) {
	return MATH_TYPES.has(questionType);
}

export function isIdentification(questionType) {
	return ID_TYPES.has(questionType);
}

export function questionTypeLabel(questionType) {
	return QUESTION_TYPE_LABELS[questionType] || questionType || 'Question';
}

export function accuracyTone(accuracy) {
	const value = Number.parseFloat(accuracy);
	if (Number.isNaN(value)) return 'primary';
	if (value >= 80) return 'success';
	if (value >= 50) return 'warning';
	return 'danger';
}

/** Normalize attempt list payloads from GET /quizzes/quiz/attempts/. */
export function normalizeAttemptList(payload) {
	if (!payload) return [];
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload.data)) return payload.data;
	if (Array.isArray(payload.results)) return payload.results;
	return [];
}

/**
 * Derive score / total / accuracy from an attempt API object.
 * Prefers score_accuracy_data; falls back to legacy flat fields.
 */
export function getAttemptStats(attempt) {
	const sa = attempt?.score_accuracy_data;
	if (sa && typeof sa === 'object') {
		const score = Number(sa.score) || 0;
		const total = Number(sa.total_score) || 0;
		const accuracy =
			sa.accuracy != null
				? Number(sa.accuracy)
				: total > 0
					? Math.round((score / total) * 10000) / 100
					: 0;
		return { score, total, accuracy, complete: true };
	}

	const score = Number(attempt?.score) || 0;
	const total =
		Number(attempt?.total_score) || Number(attempt?.total) || Number(attempt?.total_questions) || 0;
	const accuracyRaw = attempt?.accuracy ?? attempt?.percentage;
	const accuracy =
		accuracyRaw != null
			? Number.parseFloat(accuracyRaw) || 0
			: total > 0
				? Math.round((score / total) * 10000) / 100
				: 0;

	return {
		score,
		total,
		accuracy,
		complete: Boolean(attempt?.score_accuracy || attempt?.score != null)
	};
}

export function attemptQuizMeta(attempt) {
	const quiz = attempt?.quiz_data || attempt?.quiz || {};
	const title =
		attempt?.quiz_title || (typeof quiz === 'object' ? quiz.quiz_title : null) || 'Quiz';
	const id =
		(typeof quiz === 'object' ? quiz.uuid || quiz.quiz_id : null) ||
		(typeof attempt?.quiz === 'string' || typeof attempt?.quiz === 'number' ? attempt.quiz : null);
	return { title, id };
}

export function buildAnswerRecords(questions) {
	return questions.map((q) => ({
		id: q.id,
		question: q.question,
		correctAnswer: q.correct_answer,
		questionType: q.question_type,
		userAnswer: ''
	}));
}

export function countAnswered(answers) {
	return answers.filter((a) => String(a.userAnswer ?? '').trim() !== '').length;
}

export function answersById(answers) {
	const map = new Map();
	for (const answer of answers) {
		map.set(answer.id, answer);
	}
	return map;
}
