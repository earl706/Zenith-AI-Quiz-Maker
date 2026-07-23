const MATH_TYPES = new Set(['MUL-COM', 'COM', 'IDE-COM']);
const ID_TYPES = new Set(['IDE', 'IDE-COM']);

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
