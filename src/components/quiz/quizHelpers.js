const MATH_TYPES = new Set(['MUL-COM', 'COM', 'IDE-COM']);
const ID_TYPES = new Set(['IDE', 'IDE-COM']);

const QUESTION_TYPE_LABELS = {
	MUL: 'Multiple choice',
	IDE: 'Identification',
	'MUL-COM': 'Multiple choice · math',
	'IDE-COM': 'Identification · math',
	COM: 'Computational'
};

let sectionKeyCounter = 0;

export function createSectionKey() {
	sectionKeyCounter += 1;
	return `sec-${Date.now()}-${sectionKeyCounter}`;
}

export function createSection(overrides = {}) {
	return {
		clientKey: createSectionKey(),
		id: null,
		title: 'New section',
		order: 0,
		...overrides
	};
}

/**
 * Apply AI generate payload sections onto authoring state shapes.
 * Returns { sections, questions } ready for setState.
 * mapQuestion(q, index) must return a question object (may omit sectionKey).
 */
export function applyGeneratedSections(quizData, mapQuestion) {
	const questionsRaw = Array.isArray(quizData?.questions) ? quizData.questions : [];
	const sectionsRaw = Array.isArray(quizData?.sections) ? quizData.sections : [];

	if (!questionsRaw.length) {
		return { sections: [], questions: [] };
	}

	if (!sectionsRaw.length) {
		return {
			sections: [],
			questions: questionsRaw.map((q, i) => {
				const mapped = mapQuestion(q, i);
				return { ...mapped, sectionKey: null };
			})
		};
	}

	const sections = sectionsRaw.map((sec, index) =>
		createSection({
			title: sec.title || `Section ${index + 1}`,
			order: sec.order ?? index
		})
	);

	const questions = questionsRaw.map((q, i) => {
		const mapped = mapQuestion(q, i);
		let idx =
			typeof q.sectionIndex === 'number'
				? q.sectionIndex
				: typeof q.section_index === 'number'
					? q.section_index
					: -1;
		if (idx < 0 && q.section) {
			const key = String(q.section).toLowerCase();
			idx = sectionsRaw.findIndex((s) => String(s.title || '').toLowerCase() === key);
		}
		if (idx < 0 || idx >= sections.length) idx = 0;
		return { ...mapped, sectionKey: sections[idx].clientKey };
	});

	return { sections, questions };
}

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

export function questionTypeFromFlags({ mathematical, identification }) {
	if (mathematical) return identification ? 'IDE-COM' : 'MUL-COM';
	return identification ? 'IDE' : 'MUL';
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
		const sectionScores = Array.isArray(sa.section_scores) ? sa.section_scores : [];
		return { score, total, accuracy, complete: true, sectionScores };
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
		complete: Boolean(attempt?.score_accuracy || attempt?.score != null),
		sectionScores: []
	};
}

export function attemptScopeLabel(attempt) {
	if (!attempt) return 'All';
	if (attempt.full_quiz !== false) return 'All';
	const sections = Array.isArray(attempt.sections) ? attempt.sections : [];
	if (sections.length === 0) return 'All';
	return sections.map((s) => s.title || `Section ${s.id}`).join(', ');
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

/** Normalize sections from quiz API payload into authoring shape. */
export function normalizeQuizSections(quizOrSections) {
	const raw = Array.isArray(quizOrSections) ? quizOrSections : quizOrSections?.sections || [];
	if (!Array.isArray(raw) || raw.length === 0) return [];
	return raw
		.slice()
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id ?? 0) - (b.id ?? 0))
		.map((sec, index) =>
			createSection({
				id: sec.id ?? null,
				title: sec.title || `Section ${index + 1}`,
				order: sec.order ?? index
			})
		);
}

export function questionsGroupedBySection(questions, sections) {
	if (!sections?.length) {
		return [{ section: null, questions: questions || [] }];
	}
	const byKey = new Map(sections.map((s) => [s.clientKey, []]));
	const orphan = [];
	for (const q of questions || []) {
		if (q.sectionKey && byKey.has(q.sectionKey)) byKey.get(q.sectionKey).push(q);
		else orphan.push(q);
	}
	const groups = sections.map((section) => ({
		section,
		questions: byKey.get(section.clientKey) || []
	}));
	if (orphan.length) {
		groups.push({ section: null, questions: orphan });
	}
	return groups;
}

/** Group API quiz questions by section id (attempt / detail payloads). */
export function groupQuestionsByApiSection(questions, sections) {
	if (!sections?.length) {
		return [{ section: null, questions: questions || [] }];
	}
	const sorted = [...sections].sort(
		(a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id ?? 0) - (b.id ?? 0)
	);
	const byId = new Map(sorted.map((s) => [s.id, []]));
	const orphan = [];
	for (const q of questions || []) {
		const sid = q.section ?? q.section_id ?? null;
		if (sid != null && byId.has(sid)) byId.get(sid).push(q);
		else orphan.push(q);
	}
	const groups = sorted.map((section) => ({
		section,
		questions: byId.get(section.id) || []
	}));
	if (orphan.length) {
		groups.push({ section: null, questions: orphan });
	}
	return groups.filter((g) => g.questions.length > 0);
}

export function canUseSectionQuestionLayout(sections) {
	return Array.isArray(sections) && sections.length >= 2;
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

export function buildAttemptQuery({ fullQuiz, sectionIds }) {
	if (fullQuiz || !sectionIds?.length) return '?full=1';
	return `?sections=${sectionIds.join(',')}`;
}

export function parseAttemptScopeFromSearch(search) {
	const params = new URLSearchParams(search || '');
	const full = params.get('full') === '1' || params.get('full') === 'true';
	const sectionsRaw = params.get('sections') || '';
	const sectionIds = sectionsRaw
		.split(',')
		.map((p) => Number.parseInt(p.trim(), 10))
		.filter((n) => Number.isFinite(n));
	return {
		fullQuiz: full || sectionIds.length === 0,
		sectionIds
	};
}
