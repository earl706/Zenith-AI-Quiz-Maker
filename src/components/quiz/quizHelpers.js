import { answersEqual } from '../../lib/mathAnswersEqual';

const MATH_TYPES = new Set([
	'MUL-COM',
	'COM',
	'IDE-COM',
	'SEQ-FUL-COM',
	'SEQ-GAP-COM',
	'SEQ-NXT-COM'
]);
const ID_TYPES = new Set(['IDE', 'IDE-COM']);
const SEQ_TYPES = new Set([
	'SEQ-FUL',
	'SEQ-GAP',
	'SEQ-NXT',
	'SEQ-FUL-COM',
	'SEQ-GAP-COM',
	'SEQ-NXT-COM'
]);

/**
 * Disable OS/browser autocorrect, spellcheck, and form autocomplete on plain
 * IDE text fields. Does not affect in-app answer_suggestions_enabled UI.
 * Spread onto <input type="text"> (not IDE-COM / MathLive).
 */
export const PLAIN_IDE_TEXT_INPUT_AUTO_OFF = {
	autoComplete: 'off',
	autoCorrect: 'off',
	autoCapitalize: 'off',
	spellCheck: false,
	inputMode: 'text',
	'data-1p-ignore': 'true',
	'data-lpignore': 'true',
	'data-form-type': 'other'
};

const QUESTION_TYPE_LABELS = {
	MUL: 'Multiple choice',
	IDE: 'Identification',
	'MUL-COM': 'Multiple choice · math',
	'IDE-COM': 'Identification · math',
	COM: 'Computational',
	'SEQ-FUL': 'Sequence · full list',
	'SEQ-GAP': 'Sequence · gap fill',
	'SEQ-NXT': 'Sequence · next step',
	'SEQ-FUL-COM': 'Sequence · full list · math',
	'SEQ-GAP-COM': 'Sequence · gap fill · math',
	'SEQ-NXT-COM': 'Sequence · next step · math'
};

export const SEQUENCE_ITEM_MIN = 3;
export const SEQUENCE_ITEM_MAX = 100;
export const SEQUENCE_PLACEHOLDER = /\{\{(\d+)\}\}/g;

let sectionKeyCounter = 0;
let questionClientIdCounter = 0;

export function createSectionKey() {
	sectionKeyCounter += 1;
	return `sec-${Date.now()}-${sectionKeyCounter}`;
}

export function createQuestionClientId() {
	questionClientIdCounter += 1;
	return `new-${Date.now()}-${questionClientIdCounter}`;
}

/** Coerce API section PK / nested object to a comparable id. */
export function canonicalSectionId(value) {
	if (value == null || value === '') return null;
	if (typeof value === 'object') return value.id ?? value.pk ?? null;
	return value;
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
		const text = choice.text == null ? '' : String(choice.text);
		const image =
			choice.image_display ||
			(typeof choice.image === 'string' ? choice.image : null) ||
			choice.image_url ||
			null;
		return {
			text,
			image: image || null,
			id: choice.id
		};
	}
	return { text: choice == null ? '' : String(choice), image: null, id: undefined };
}

/** Prefer stored correct_answer; fall back to choices[correct_answer_index]. */
export function resolveCorrectAnswer(question) {
	const stored = String(question?.correct_answer ?? '').trim();
	if (stored) return String(question.correct_answer);
	if (isSequence(question?.question_type)) {
		const blanks = sequenceBlanks(question?.sequence_items);
		return blanks
			.map((item) => String(item.text ?? '').trim())
			.filter(Boolean)
			.join(' | ');
	}
	const choices = Array.isArray(question?.choices) ? question.choices : [];
	let idx = Number(question?.correct_answer_index);
	if (!Number.isInteger(idx) || idx < 0) idx = 0;
	if (choices.length === 0) return '';
	if (idx >= choices.length) idx = 0;
	return getChoiceData(choices[idx]).text;
}

export function isMathematical(questionType) {
	return MATH_TYPES.has(questionType);
}

export function isIdentification(questionType) {
	return ID_TYPES.has(questionType);
}

export function isSequence(questionType) {
	return SEQ_TYPES.has(questionType) || String(questionType || '').startsWith('SEQ');
}

export function questionTypeLabel(questionType) {
	return QUESTION_TYPE_LABELS[questionType] || questionType || 'Question';
}

export function sequenceModeFromType(questionType) {
	const t = String(questionType || '');
	if (t.startsWith('SEQ-FUL')) return 'full';
	if (t.startsWith('SEQ-NXT')) return 'next';
	if (t.startsWith('SEQ')) return 'gap';
	return 'gap';
}

export function questionTypeFromFlags({ mathematical, identification, sequence, sequenceMode }) {
	if (sequence) {
		const mode =
			sequenceMode === 'full' ? 'SEQ-FUL' : sequenceMode === 'next' ? 'SEQ-NXT' : 'SEQ-GAP';
		return mathematical ? `${mode}-COM` : mode;
	}
	if (mathematical) return identification ? 'IDE-COM' : 'MUL-COM';
	return identification ? 'IDE' : 'MUL';
}

export function flagsFromQuestionType(questionType) {
	const t = String(questionType || 'MUL');
	const sequence = t.startsWith('SEQ');
	return {
		mathematical: MATH_TYPES.has(t) || t.endsWith('-COM'),
		identification: t === 'IDE' || t === 'IDE-COM',
		sequence,
		sequenceMode: sequenceModeFromType(t)
	};
}

export function formatScore(value) {
	const n = Number(value);
	if (!Number.isFinite(n)) return '0';
	return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

let sequenceItemKeyCounter = 0;
export function createSequenceItemClientKey() {
	sequenceItemKeyCounter += 1;
	return `seq-item-${Date.now()}-${sequenceItemKeyCounter}`;
}

export function defaultSequenceItems(mode = 'gap') {
	if (mode === 'full') {
		return [
			{ clientKey: createSequenceItemClientKey(), text: '', role: 'blank', order: 0 },
			{ clientKey: createSequenceItemClientKey(), text: '', role: 'blank', order: 1 },
			{ clientKey: createSequenceItemClientKey(), text: '', role: 'blank', order: 2 }
		];
	}
	if (mode === 'next') {
		return [
			{ clientKey: createSequenceItemClientKey(), text: '', role: 'given', order: 0 },
			{ clientKey: createSequenceItemClientKey(), text: '', role: 'given', order: 1 },
			{ clientKey: createSequenceItemClientKey(), text: '', role: 'blank', order: 2 }
		];
	}
	return [
		{ clientKey: createSequenceItemClientKey(), text: '', role: 'given', order: 0 },
		{ clientKey: createSequenceItemClientKey(), text: '', role: 'blank', order: 1 },
		{ clientKey: createSequenceItemClientKey(), text: '', role: 'given', order: 2 }
	];
}

export function normalizeSequenceItems(raw) {
	const list = Array.isArray(raw) ? raw : [];
	return list.map((item, i) => ({
		id: item.id,
		clientKey: item.clientKey || createSequenceItemClientKey(),
		text: item.text == null ? '' : String(item.text),
		role: item.role === 'given' || item.role === 'distractor' ? item.role : 'blank',
		order: typeof item.order === 'number' ? item.order : i
	}));
}

/** Clone an authoring question as a new unsaved row (insert after the original). */
export function duplicateAuthoringQuestion(question) {
	const sequenceItems = (question.sequenceItems || []).map((item, i) => ({
		text: item.text,
		role: item.role,
		order: i,
		clientKey: createSequenceItemClientKey()
	}));
	return {
		...question,
		id: createQuestionClientId(),
		choices: [...(question.choices || [])],
		choiceImages: [...(question.choiceImages || [])],
		choiceImagePreviews: [...(question.choiceImagePreviews || [])],
		choiceImageUrls: [...(question.choiceImageUrls || [])],
		sequenceItems,
		_jsonId: undefined,
		_jsonIndex: undefined,
		_reviewKind: undefined,
		_priorTitle: undefined
	};
}

export function sequenceBlanks(items) {
	return (items || []).filter((item) => item.role === 'blank');
}

export function shuffleSequenceItems(items) {
	const next = [...(items || [])];
	for (let i = next.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[next[i], next[j]] = [next[j], next[i]];
	}
	return next;
}

export function interpolateSequenceStem(stem, items) {
	const list = items || [];
	return String(stem || '').replace(/\{\{(\d+)\}\}/g, (_, raw) => {
		const n = Number(raw);
		const item = list[n - 1];
		if (!item) return `{{${raw}}}`;
		if (item.role === 'blank') return '____';
		return String(item.text || '').trim() || `{{${raw}}}`;
	});
}

export function authoringSequenceFields(raw, flags = {}) {
	const sequence = !!(flags.sequence || raw?.sequence);
	const sequenceMode =
		flags.sequenceMode || raw?.sequenceMode || sequenceModeFromType(raw?.question_type);
	const source = raw?.sequence_items || raw?.sequenceItems;
	return {
		sequence,
		sequenceMode,
		sequenceOrderMatters: raw?.sequence_order_matters ?? raw?.sequenceOrderMatters ?? true,
		sequenceItems: sequence
			? normalizeSequenceItems(source?.length ? source : defaultSequenceItems(sequenceMode))
			: []
	};
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

/**
 * Map an API question onto an authoring section clientKey.
 * Tries section PK (number/string/nested object) then section_index.
 */
export function lookupAuthoringSectionKey(question, sections) {
	if (!sections?.length) return null;
	const byId = new Map();
	for (const section of sections) {
		if (section?.id == null) continue;
		byId.set(section.id, section.clientKey);
		byId.set(String(section.id), section.clientKey);
		const asNum = Number(section.id);
		if (Number.isFinite(asNum)) byId.set(asNum, section.clientKey);
	}
	const rawId = canonicalSectionId(question?.section ?? question?.section_id);
	if (rawId != null) {
		if (byId.has(rawId)) return byId.get(rawId);
		if (byId.has(String(rawId))) return byId.get(String(rawId));
		const asNum = Number(rawId);
		if (Number.isFinite(asNum) && byId.has(asNum)) return byId.get(asNum);
	}
	const idx =
		typeof question?.section_index === 'number'
			? question.section_index
			: typeof question?.sectionIndex === 'number'
				? question.sectionIndex
				: null;
	if (idx != null && idx >= 0 && idx < sections.length) return sections[idx].clientKey;
	return null;
}

/** Persistable section index; quizzes with sections never omit membership. */
export function resolveAuthoringSectionIndex(question, sections) {
	if (!sections?.length) return null;
	if (question?.sectionKey) {
		const idx = sections.findIndex((s) => s.clientKey === question.sectionKey);
		if (idx >= 0) return idx;
	}
	return 0;
}

/**
 * Re-attach questions whose sectionKey is missing or stale.
 * Prevents the unlabeled trailing "Questions" orphan group.
 */
export function stampAuthoringSectionKeys(questions, sections) {
	if (!sections?.length) {
		return (questions || []).map((q) => ({ ...q, sectionKey: null }));
	}
	const keys = new Set(sections.map((s) => s.clientKey));
	const fallback = sections[0].clientKey;
	return (questions || []).map((q) => ({
		...q,
		sectionKey: q.sectionKey && keys.has(q.sectionKey) ? q.sectionKey : fallback
	}));
}

export function questionsGroupedBySection(questions, sections) {
	if (!sections?.length) {
		return [{ section: null, questions: questions || [] }];
	}
	const byKey = new Map(sections.map((s) => [s.clientKey, []]));
	const fallbackKey = sections[0].clientKey;
	for (const q of questions || []) {
		const key = q.sectionKey && byKey.has(q.sectionKey) ? q.sectionKey : fallbackKey;
		byKey.get(key).push(q);
	}
	return sections.map((section) => ({
		section,
		questions: byKey.get(section.clientKey) || []
	}));
}

/** Stable quiz display/attempt order: section.order, then question.order, then id. */
export function sortQuestionsBySectionOrder(questions = [], sections = []) {
	const sectionOrder = new Map([...(sections || [])].map((s) => [String(s.id), s.order ?? 0]));
	return [...(questions || [])].sort((a, b) => {
		const aSid = canonicalSectionId(a.section ?? a.section_id);
		const bSid = canonicalSectionId(b.section ?? b.section_id);
		const aSecOrder =
			aSid == null
				? Number.POSITIVE_INFINITY
				: (sectionOrder.get(String(aSid)) ?? Number.POSITIVE_INFINITY);
		const bSecOrder =
			bSid == null
				? Number.POSITIVE_INFINITY
				: (sectionOrder.get(String(bSid)) ?? Number.POSITIVE_INFINITY);
		if (aSecOrder !== bSecOrder) return aSecOrder - bSecOrder;
		const aOrder = a.order ?? 0;
		const bOrder = b.order ?? 0;
		if (aOrder !== bOrder) return aOrder - bOrder;
		return (Number(a.id) || 0) - (Number(b.id) || 0);
	});
}

/** Group API quiz questions by section id (attempt / detail payloads). */
export function groupQuestionsByApiSection(questions, sections) {
	if (!sections?.length) {
		return [
			{
				section: null,
				questions: sortQuestionsBySectionOrder(questions || [], sections)
			}
		];
	}
	const sorted = [...sections].sort(
		(a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id ?? 0) - (b.id ?? 0)
	);
	const byId = new Map(sorted.map((s) => [String(s.id), []]));
	const orphan = [];
	for (const q of questions || []) {
		const sid = canonicalSectionId(q.section ?? q.section_id);
		if (sid != null && byId.has(String(sid))) byId.get(String(sid)).push(q);
		else orphan.push(q);
	}
	const sortWithin = (list) =>
		[...list].sort(
			(a, b) => (a.order ?? 0) - (b.order ?? 0) || (Number(a.id) || 0) - (Number(b.id) || 0)
		);
	const groups = sorted.map((section) => ({
		section,
		questions: sortWithin(byId.get(String(section.id)) || [])
	}));
	if (orphan.length) {
		groups.push({ section: null, questions: sortWithin(orphan) });
	}
	return groups.filter((g) => g.questions.length > 0);
}

export function canUseSectionQuestionLayout(sections) {
	return Array.isArray(sections) && sections.length >= 2;
}

/** Flat question list from section groups (preserves within-group order). */
export function flattenGroupedQuestions(groups) {
	return (groups || []).flatMap((g) => g.questions || []);
}

/**
 * Swap a question with its neighbor inside the same section (or the single
 * ungrouped list when there are no sections). direction: -1 up, +1 down.
 */
export function moveQuestionWithinSection(questions, sections, questionId, direction) {
	const groups = questionsGroupedBySection(questions, sections);
	for (const group of groups) {
		const idx = group.questions.findIndex((q) => q.id === questionId);
		if (idx < 0) continue;
		const swapWith = idx + direction;
		if (swapWith < 0 || swapWith >= group.questions.length) return questions;
		const next = [...group.questions];
		[next[idx], next[swapWith]] = [next[swapWith], next[idx]];
		const sectionKey = group.section?.clientKey ?? null;
		group.questions = sectionKey ? next.map((q) => ({ ...q, sectionKey })) : next;
		return flattenGroupedQuestions(groups);
	}
	return questions;
}

/**
 * Move a question to the first (`start`) or last (`end`) slot in its section.
 */
export function moveQuestionToSectionEdge(questions, sections, questionId, edge) {
	const groups = questionsGroupedBySection(questions, sections);
	for (const group of groups) {
		const idx = group.questions.findIndex((q) => q.id === questionId);
		if (idx < 0) continue;
		const last = group.questions.length - 1;
		const target = edge === 'end' ? last : 0;
		if (idx === target || last < 0) return questions;
		const next = [...group.questions];
		const [moved] = next.splice(idx, 1);
		next.splice(target, 0, moved);
		const sectionKey = group.section?.clientKey ?? null;
		group.questions = sectionKey ? next.map((q) => ({ ...q, sectionKey })) : next;
		return flattenGroupedQuestions(groups);
	}
	return questions;
}

export function questionAuthoringCardId(questionId) {
	return `authoring-q-${questionId}`;
}

/** Center a question card in #main-content after in-section reorder. */
export function scrollAuthoringQuestionIntoView(questionId) {
	if (questionId == null || typeof document === 'undefined') return;
	const run = () => {
		const el = document.getElementById(questionAuthoringCardId(questionId));
		if (!el) return;
		const scroller = document.getElementById('main-content');
		if (!scroller) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
			return;
		}
		const scrollerRect = scroller.getBoundingClientRect();
		const elRect = el.getBoundingClientRect();
		const delta = elRect.top + elRect.height / 2 - (scrollerRect.top + scrollerRect.height / 2);
		if (Math.abs(delta) < 1) return;
		scroller.scrollBy({ top: delta, behavior: 'smooth' });
	};
	requestAnimationFrame(() => requestAnimationFrame(run));
}

/**
 * Move a question to the previous/next section (appends to destination).
 * Empty source sections are allowed. Returns { questions, targetKey }.
 */
export function transferQuestionToAdjacentSection(questions, sections, questionId, direction) {
	if (!sections?.length) return { questions, targetKey: null };

	const groups = questionsGroupedBySection(questions, sections);
	let fromGi = -1;
	let fromQi = -1;
	for (let gi = 0; gi < groups.length; gi += 1) {
		const qi = groups[gi].questions.findIndex((q) => q.id === questionId);
		if (qi >= 0) {
			fromGi = gi;
			fromQi = qi;
			break;
		}
	}
	if (fromGi < 0) return { questions, targetKey: null };

	const sectionKeys = sections.map((s) => s.clientKey);
	const fromKey =
		groups[fromGi].section?.clientKey ?? groups[fromGi].questions[fromQi]?.sectionKey ?? null;
	const fromSecIdx = fromKey != null ? sectionKeys.indexOf(fromKey) : -1;
	const toSecIdx =
		fromSecIdx >= 0 ? fromSecIdx + direction : direction > 0 ? 0 : sectionKeys.length - 1;
	if (toSecIdx < 0 || toSecIdx >= sectionKeys.length) {
		return { questions, targetKey: null };
	}

	const targetKey = sectionKeys[toSecIdx];
	const [moved] = groups[fromGi].questions.splice(fromQi, 1);
	const updated = { ...moved, sectionKey: targetKey };
	const toGi = groups.findIndex((g) => g.section?.clientKey === targetKey);
	if (toGi >= 0) groups[toGi].questions.push(updated);
	else return { questions, targetKey: null };

	return { questions: flattenGroupedQuestions(groups), targetKey };
}

/** Button enablement for in-section up/down and adjacent-section transfer. */
export function questionAuthoringMoveState(questions, sections, questionId) {
	const groups = questionsGroupedBySection(questions, sections);
	let group = null;
	let idx = -1;
	for (const g of groups) {
		idx = g.questions.findIndex((q) => q.id === questionId);
		if (idx >= 0) {
			group = g;
			break;
		}
	}
	if (!group) {
		return {
			canMoveUp: false,
			canMoveDown: false,
			canTransferPrev: false,
			canTransferNext: false
		};
	}

	const sectionKeys = (sections || []).map((s) => s.clientKey);
	const fromKey = group.section?.clientKey ?? null;
	const fromSecIdx = fromKey != null ? sectionKeys.indexOf(fromKey) : -1;
	const hasSections = sectionKeys.length >= 2;

	return {
		canMoveUp: idx > 0,
		canMoveDown: idx >= 0 && idx < group.questions.length - 1,
		canTransferPrev: hasSections && (fromSecIdx > 0 || fromSecIdx < 0),
		canTransferNext: hasSections && (fromSecIdx >= 0 ? fromSecIdx < sectionKeys.length - 1 : true)
	};
}

export function buildAnswerRecords(questions) {
	return questions.map((q) => ({
		id: q.id,
		question: q.question,
		correctAnswer: resolveCorrectAnswer(q),
		questionType: q.question_type,
		userAnswer: '',
		userSequence: []
	}));
}

export function sequenceQuestionAnswered(question, answer) {
	const blanks = sequenceBlanks(question?.sequence_items);
	if (!blanks.length) return false;
	const byId = new Map(
		(answer?.userSequence || []).map((row) => [row.id, String(row.text ?? '').trim()])
	);
	return blanks.every((item) => byId.get(item.id));
}

export function sequenceSlotCredit(question, answer) {
	const blanks = sequenceBlanks(question?.sequence_items);
	if (!blanks.length) return 0;
	const qtype = question?.question_type;
	const userSeq = answer?.userSequence || [];
	const byId = new Map(userSeq.map((row) => [row.id, row.text ?? '']));
	const orderMatters = question?.sequence_order_matters !== false;
	let hits = 0;
	if (orderMatters) {
		for (const item of blanks) {
			if (answersEqual(item.text, byId.get(item.id) ?? '', { questionType: qtype })) hits += 1;
		}
	} else {
		const remaining = userSeq.map((row) => row.text ?? '');
		for (const item of blanks) {
			const idx = remaining.findIndex((text) =>
				answersEqual(item.text, text, { questionType: qtype })
			);
			if (idx >= 0) {
				hits += 1;
				remaining.splice(idx, 1);
			}
		}
	}
	return Math.round((hits / blanks.length) * 100) / 100;
}

export function countAnswered(answers, questions = []) {
	const byId = new Map((questions || []).map((q) => [q.id, q]));
	return answers.filter((a) => {
		const q = byId.get(a.id);
		if (q && isSequence(q.question_type)) return sequenceQuestionAnswered(q, a);
		return String(a.userAnswer ?? '').trim() !== '';
	}).length;
}

export function answersById(answers) {
	const map = new Map();
	for (const answer of answers) {
		map.set(answer.id, answer);
	}
	return map;
}

export function buildAttemptQuery({ fullQuiz, sectionIds, shuffle = false, sample = null }) {
	const params = new URLSearchParams();
	if (fullQuiz || !sectionIds?.length) {
		params.set('full', '1');
	} else {
		params.set('sections', sectionIds.join(','));
	}
	if (shuffle) params.set('shuffle', '1');
	const sampleN = Number(sample);
	if (Number.isFinite(sampleN) && sampleN > 0) {
		params.set('sample', String(Math.floor(sampleN)));
	}
	const qs = params.toString();
	return qs ? `?${qs}` : '';
}

export function parseAttemptScopeFromSearch(search) {
	const params = new URLSearchParams(search || '');
	const full = params.get('full') === '1' || params.get('full') === 'true';
	const sectionsRaw = params.get('sections') || '';
	const sectionIds = sectionsRaw
		.split(',')
		.map((p) => Number.parseInt(p.trim(), 10))
		.filter((n) => Number.isFinite(n));
	const sampleRaw = Number.parseInt(params.get('sample') || '', 10);
	return {
		fullQuiz: full || sectionIds.length === 0,
		sectionIds,
		shuffle: params.get('shuffle') === '1' || params.get('shuffle') === 'true',
		sample: Number.isFinite(sampleRaw) && sampleRaw > 0 ? sampleRaw : null
	};
}

/** Unique plain-text identification answers (excludes IDE-COM) for autocomplete. */
export function identificationAnswerCorpus(questions) {
	const seen = new Set();
	const corpus = [];
	for (const question of questions || []) {
		if (question?.question_type !== 'IDE') continue;
		const answer = String(resolveCorrectAnswer(question) ?? '').trim();
		if (!answer) continue;
		const key = answer.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		corpus.push(answer);
	}
	return corpus;
}

/** Prefix matches ranked by length (closer), then alphabetically. Max 5. */
export function rankPrefixSuggestions(typed, corpus, max = 5) {
	const query = String(typed ?? '')
		.trim()
		.toLowerCase();
	if (!query || !corpus?.length) return [];
	const limit = Math.max(1, Math.min(5, Math.floor(Number(max) || 5)));
	return [...corpus]
		.filter((entry) => String(entry).toLowerCase().startsWith(query))
		.sort((a, b) => {
			const lengthDelta = a.length - b.length;
			if (lengthDelta !== 0) return lengthDelta;
			return a.localeCompare(b, undefined, { sensitivity: 'base' });
		})
		.slice(0, limit);
}

/** Fisher–Yates shuffle (mutates copy). */
export function shuffleArray(items) {
	const next = [...(items || [])];
	for (let i = next.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[next[i], next[j]] = [next[j], next[i]];
	}
	return next;
}

/** Random sample of up to `count` items without replacement. */
export function sampleArray(items, count) {
	const n = Math.max(0, Math.floor(Number(count) || 0));
	if (!items?.length || n <= 0) return [];
	if (n >= items.length) return shuffleArray(items);
	return shuffleArray(items).slice(0, n);
}

export const PER_QUESTION_TIMER_MIN = 10;
export const PER_QUESTION_TIMER_MAX = 600;
export const PER_QUESTION_TIMER_DEFAULT = 30;

/** Clamp to 10–600 seconds; invalid → fallback. */
export function clampPerQuestionSeconds(value, fallback = PER_QUESTION_TIMER_DEFAULT) {
	const n = Number(value);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(PER_QUESTION_TIMER_MAX, Math.max(PER_QUESTION_TIMER_MIN, Math.round(n)));
}

/**
 * Resolve seconds for a question: per-question override, else quiz default.
 * Accepts API snake_case or authoring camelCase on the question.
 */
export function resolveQuestionTimerSeconds(question, quizDefaultSeconds) {
	const raw = question?.per_question_time_seconds ?? question?.perQuestionTimeSeconds ?? null;
	if (raw == null || raw === '') {
		return clampPerQuestionSeconds(quizDefaultSeconds);
	}
	return clampPerQuestionSeconds(raw);
}

/** Parse optional override from import/API (empty → null). */
export function parseOptionalTimerSeconds(raw) {
	if (raw == null || raw === '') return null;
	const n = Number(raw);
	if (!Number.isFinite(n)) return null;
	return clampPerQuestionSeconds(n);
}
