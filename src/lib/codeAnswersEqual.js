/**
 * Language-agnostic code answer normalization (mirrors backend code_answers.py).
 * Strips blanks/comments/docs, applies shared style formatting, then ordered line match.
 */

const BLOCK_COMMENT_RE = /\/\*[\s\S]*?\*\//g;
const TRIPLE_DOUBLE_RE = /"""[\s\S]*?"""/g;
const TRIPLE_SINGLE_RE = /'''[\s\S]*?'''/g;
const FULL_LINE_HASH_RE = /^\s*#/;
const FULL_LINE_SLASH_RE = /^\s*\/\//;
const TRAILING_HASH_RE = /\s+#.*$/;
const TRAILING_SLASH_RE = /\s+\/\/.*$/;

const OPERATORS = [
	'===',
	'!==',
	'<<=',
	'>>=',
	'**=',
	'&&=',
	'||=',
	'??=',
	'==',
	'!=',
	'<=',
	'>=',
	'<<',
	'>>',
	'&&',
	'||',
	'??',
	'**',
	'->',
	'=>',
	':=',
	'+=',
	'-=',
	'*=',
	'/=',
	'%=',
	'&=',
	'|=',
	'^=',
	'=',
	'+',
	'-',
	'*',
	'/',
	'%',
	'<',
	'>',
	'!',
	'&',
	'|',
	'^',
	'~'
];

function isIdentChar(ch) {
	return /[A-Za-z0-9_$]/.test(ch);
}

export function formatCodeLineStyle(line) {
	const raw = String(line ?? '');
	const leading = raw.length - raw.replace(/^[ \t]+/, '').length;
	const indent = raw.slice(0, leading).replace(/\t/g, '    ');
	const body = raw.slice(leading);
	if (!body) return '';

	const out = [];
	let i = 0;
	const n = body.length;
	let quote = null;

	const peekOp = (at) => {
		for (const op of OPERATORS) {
			if (body.startsWith(op, at)) return op;
		}
		return null;
	};

	const lastNonSpace = () => {
		for (let k = out.length - 1; k >= 0; k -= 1) {
			if (out[k] !== ' ') return out[k];
		}
		return '';
	};

	const trimTrailingSpaces = () => {
		while (out.length && out[out.length - 1] === ' ') out.pop();
	};

	while (i < n) {
		const ch = body[i];

		if (quote) {
			out.push(ch);
			if (ch === '\\' && i + 1 < n) {
				out.push(body[i + 1]);
				i += 2;
				continue;
			}
			if (ch === quote) quote = null;
			i += 1;
			continue;
		}

		if (ch === "'" || ch === '"' || ch === '`') {
			quote = ch;
			out.push(ch);
			i += 1;
			continue;
		}

		if (ch === ' ' || ch === '\t') {
			let j = i + 1;
			while (j < n && (body[j] === ' ' || body[j] === '\t')) j += 1;
			i = j;
			continue;
		}

		if (ch === ',') {
			trimTrailingSpaces();
			out.push(',');
			let j = i + 1;
			while (j < n && (body[j] === ' ' || body[j] === '\t')) j += 1;
			if (j < n && !')]},'.includes(body[j])) out.push(' ');
			i += 1;
			continue;
		}

		if (';)]}:?'.includes(ch)) {
			trimTrailingSpaces();
			out.push(ch);
			i += 1;
			continue;
		}

		if (ch === '.') {
			trimTrailingSpaces();
			out.push('.');
			i += 1;
			continue;
		}

		if ('([{'.includes(ch)) {
			out.push(ch);
			i += 1;
			continue;
		}

		const op = peekOp(i);
		if (op) {
			const prev = lastNonSpace();
			const unary =
				(op === '!' || op === '~' || op === '+' || op === '-') &&
				(!prev || '([{=<>!&|?:,+-*/%^~'.includes(prev));
			trimTrailingSpaces();
			if (!unary && out.length) out.push(' ');
			out.push(op);
			i += op.length;
			let j = i;
			while (j < n && (body[j] === ' ' || body[j] === '\t')) j += 1;
			if (!unary && j < n && !')]},;.'.includes(body[j])) out.push(' ');
			continue;
		}

		if (isIdentChar(ch) || /\d/.test(ch)) {
			const prev = lastNonSpace();
			if (prev && (isIdentChar(prev) || /\d/.test(prev) || ')]}\'"'.includes(prev))) {
				trimTrailingSpaces();
				out.push(' ');
			}
			while (i < n && (isIdentChar(body[i]) || /\d/.test(body[i]) || body[i] === '.')) {
				if (body[i] === '.' && i + 1 < n && body[i + 1] === '.') break;
				if (body[i] === '.') {
					const nxt = i + 1 < n ? body[i + 1] : '';
					if (!/\d/.test(nxt) && !isIdentChar(nxt)) break;
				}
				out.push(body[i]);
				i += 1;
			}
			continue;
		}

		out.push(ch);
		i += 1;
	}

	const styled = out.join('').trim();
	if (!styled) return '';
	return indent ? indent + styled : styled;
}

/** Format full source for the editor Format button (keeps comment/blank lines). */
export function formatCodeStyle(text) {
	const raw = String(text ?? '');
	if (!raw) return '';
	const endsWithNewline = /\r?\n$/.test(raw);
	const linesOut = [];
	for (const line of raw.split(/\r?\n/)) {
		const stripped = line.trim();
		if (!stripped) {
			linesOut.push('');
			continue;
		}
		if (FULL_LINE_HASH_RE.test(line) || FULL_LINE_SLASH_RE.test(line)) {
			const leading = line.length - line.replace(/^[ \t]+/, '').length;
			const indent = line.slice(0, leading).replace(/\t/g, '    ');
			linesOut.push(indent + stripped);
			continue;
		}
		linesOut.push(formatCodeLineStyle(line));
	}
	let result = linesOut.join('\n');
	if (endsWithNewline) result += '\n';
	return result;
}

export function normalizeCodeLines(text) {
	let raw = String(text ?? '');
	raw = raw.replace(BLOCK_COMMENT_RE, '');
	raw = raw.replace(TRIPLE_DOUBLE_RE, '');
	raw = raw.replace(TRIPLE_SINGLE_RE, '');

	const lines = [];
	for (const line of raw.split(/\r?\n/)) {
		if (FULL_LINE_HASH_RE.test(line) || FULL_LINE_SLASH_RE.test(line)) continue;
		let cleaned = line.replace(TRAILING_SLASH_RE, '');
		cleaned = cleaned.replace(TRAILING_HASH_RE, '');
		cleaned = formatCodeLineStyle(cleaned).replace(/^[ \t]+/, '');
		if (cleaned) lines.push(cleaned);
	}
	return lines;
}

export function codeAnswersEqual(expected, actual) {
	const left = normalizeCodeLines(expected);
	const right = normalizeCodeLines(actual);
	if (left.length !== right.length) return false;
	return left.every((line, i) => line === right[i]);
}
