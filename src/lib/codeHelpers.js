import { codeAnswersEqual, formatCodeStyle, normalizeCodeLines } from './codeAnswersEqual';

export const CODE_QUESTION_TYPE = 'COD';

export const CODE_LANGUAGES = [
	{ value: 'plaintext', label: 'Plain text' },
	{ value: 'python', label: 'Python' },
	{ value: 'javascript', label: 'JavaScript' },
	{ value: 'typescript', label: 'TypeScript' },
	{ value: 'java', label: 'Java' },
	{ value: 'cpp', label: 'C/C++' },
	{ value: 'go', label: 'Go' },
	{ value: 'rust', label: 'Rust' },
	{ value: 'sql', label: 'SQL' }
];

const LANGUAGE_SET = new Set(CODE_LANGUAGES.map((row) => row.value));

export function isCodeType(questionType) {
	return String(questionType || '') === CODE_QUESTION_TYPE;
}

export function isCodeQuestion(question) {
	if (isCodeType(question?.question_type)) return true;
	const spec = normalizeCodeSpec(question?.code_spec || question?.codeSpec);
	return Boolean(spec?.solution?.trim());
}

export function emptyCodeSpec() {
	return { language: 'plaintext', solution: '' };
}

export function normalizeCodeSpec(raw) {
	if (!raw || typeof raw !== 'object') return null;
	const solution = raw.solution == null ? '' : String(raw.solution);
	if (!solution.trim() && !raw.language) return null;
	let language =
		String(raw.language || 'plaintext')
			.trim()
			.toLowerCase() || 'plaintext';
	if (!LANGUAGE_SET.has(language)) language = 'plaintext';
	return { language, solution };
}

export function codeQuestionAnswered(_question, answer) {
	return String(answer?.userAnswer ?? '').trim() !== '';
}

export function codeQuestionCredit(question, answer) {
	const spec = normalizeCodeSpec(question?.code_spec || question?.codeSpec);
	if (!spec) return 0;
	const expected = spec.solution;
	if (!normalizeCodeLines(expected).length) return 0;
	return codeAnswersEqual(expected, answer?.userAnswer) ? 1 : 0;
}

export { codeAnswersEqual, formatCodeStyle, normalizeCodeLines };
