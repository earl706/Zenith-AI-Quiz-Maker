/**
 * Compare math (IDE-COM / MUL-COM) answers despite LaTeX serialization differences.
 *
 * MathLive emits braced scripts and \left/\right fences; fixture answers often use
 * compact authored LaTeX (x^2+(a+b)x+ab). Both render identically in KaTeX, so
 * scoring/review must normalize before equality — not raw string compare.
 *
 * Keep in sync with backend/apps/quizzes/math_answers.py.
 */

const MATH_QUESTION_TYPES = new Set(['MUL-COM', 'COM', 'IDE-COM']);

const FENCE_CMD =
	/\\(left|right|big|Big|bigg|Bigg|bigl|bigr|Bigl|Bigr|biggl|biggr|Biggl|Biggr)\b\s*/g;
const MATH_SPACE = /\\(,|;|:|!|quad|qquad|hspace\{[^}]*\}|vspace\{[^}]*\})/g;
const SINGLE_SCRIPT = /([_^])\{([A-Za-z0-9])\}/g;
const WHITESPACE = /\s+/g;

export function isMathematicalQuestionType(questionType) {
	return MATH_QUESTION_TYPES.has(String(questionType || '').trim());
}

/** Canonicalize LaTeX for equality (not for display/storage). */
export function normalizeLatexForCompare(value) {
	let text = String(value ?? '').trim();
	if (!text) return '';

	text = text
		.replace(/\u2212/g, '-')
		.replace(/\u00d7/g, '\\times')
		.replace(/\u00b7/g, '\\cdot')
		.replace(/\u2026/g, '\\ldots');

	if (text.startsWith('$$') && text.endsWith('$$') && text.length >= 4) {
		text = text.slice(2, -2).trim();
	} else if (text.startsWith('$') && text.endsWith('$') && text.length >= 2) {
		text = text.slice(1, -1).trim();
	}

	text = text.replace(FENCE_CMD, '');
	text = text.replace(SINGLE_SCRIPT, '$1$2');
	text = text.replace(MATH_SPACE, '');
	text = text.replace(WHITESPACE, '');
	return text;
}

/**
 * Return true when answers match.
 * Non-math: exact string equality.
 * Math: compare after LaTeX normalization so MathLive vs fixture forms match.
 */
export function answersEqual(correct, user, { mathematical = false, questionType } = {}) {
	const isMath =
		questionType != null ? isMathematicalQuestionType(questionType) : Boolean(mathematical);

	const a = correct == null ? '' : String(correct);
	const b = user == null ? '' : String(user);
	if (a === b) return true;
	if (!isMath) return false;
	return normalizeLatexForCompare(a) === normalizeLatexForCompare(b);
}
