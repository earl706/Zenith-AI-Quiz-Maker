/**
 * Display-only LaTeX wrapping. Does not rewrite stored author/fixture text.
 * Split points are top-level operators and juxtaposed commands so KaTeX
 * chunks can wrap like a ChatGPT prompt (new line only when the box overflows).
 */

const OP_CMDS = [
	'Longrightarrow',
	'Leftrightarrow',
	'rightarrow',
	'leftarrow',
	'implies',
	'iff',
	'geqslant',
	'leqslant',
	'geq',
	'leq',
	'neq',
	'ne',
	'approx',
	'equiv',
	'cong',
	'sim',
	'times',
	'cdot',
	'div',
	'pm',
	'mp',
	'to',
	'mapsto',
	'quad',
	'qquad',
	'propto',
	'oplus',
	'otimes',
	'circ',
	'wedge',
	'vee',
	'land',
	'lor'
];

const LATEX_CMD = /\\[a-zA-Z]+/;
const LATEX_SCRIPT = /[_^](\{|\w)/;
const HAS_INLINE_MATH = /\$/;
const DISPLAY_ENV =
	/\\begin\{(?:(?:p|b|B|v|V)?matrix\*?|array|smallmatrix|aligned|gathered|cases)\}/;

function isOpCommand(name) {
	return OP_CMDS.includes(name);
}

function consumeLeftRight(source, start, cmd) {
	let i = start + cmd.length;
	let taken = source.slice(start, i);
	while (source[i] === ' ' || source[i] === '\t') {
		taken += source[i];
		i += 1;
	}
	if (source[i]) {
		taken += source[i];
		i += 1;
	}
	return { taken, next: i };
}

/**
 * Split authored LaTeX at top-level binary/relational operators and at
 * juxtaposition of `\command` after `}` / `)`. Grouping `{...}`, `(...)`,
 * `[...]`, `\left...\right`, and `\begin...\end` (matrix/array bodies) stay intact.
 */
export function splitLatexAtOperators(latex) {
	const source = String(latex ?? '');
	if (!source.trim()) return [];
	if (DISPLAY_ENV.test(source)) return [source.trim()];

	const chunks = [];
	let current = '';
	let braces = 0;
	let parens = 0;
	let brackets = 0;
	let fences = 0;
	let environments = 0;
	let i = 0;

	const depth = () => braces + parens + brackets + fences + environments;
	const flush = () => {
		if (current.trim()) chunks.push(current.trim());
		current = '';
	};
	const isUnaryMinus = () => {
		const prev = current.trim();
		if (!prev) return true;
		return /(?:[[=+*,;:({]|\\(?:left|right|[a-zA-Z]+))$/.test(prev);
	};

	while (i < source.length) {
		if (source[i] === '\\') {
			if (source.startsWith('\\left', i) && !/^[a-zA-Z]/.test(source[i + 5] || '')) {
				fences += 1;
				const step = consumeLeftRight(source, i, '\\left');
				current += step.taken;
				i = step.next;
				continue;
			}
			if (source.startsWith('\\right', i) && !/^[a-zA-Z]/.test(source[i + 6] || '')) {
				fences = Math.max(0, fences - 1);
				const step = consumeLeftRight(source, i, '\\right');
				current += step.taken;
				i = step.next;
				continue;
			}

			const command = source.slice(i).match(/^\\([a-zA-Z]+|.)/);
			if (command) {
				if (command[1] === 'begin') {
					environments += 1;
					current += command[0];
					i += command[0].length;
					continue;
				}
				if (command[1] === 'end') {
					environments = Math.max(0, environments - 1);
					current += command[0];
					i += command[0].length;
					continue;
				}
				if (depth() === 0 && isOpCommand(command[1])) {
					flush();
					current = command[0];
					i += command[0].length;
					continue;
				}
				current += command[0];
				i += command[0].length;
				continue;
			}
		}

		const ch = source[i];
		if (ch === '{') {
			braces += 1;
			current += ch;
			i += 1;
			continue;
		}
		if (ch === '}') {
			braces = Math.max(0, braces - 1);
			current += ch;
			i += 1;
			if (depth() === 0 && source[i] === '\\') {
				const peek = source.slice(i).match(/^\\([a-zA-Z]+)/);
				if (peek && !isOpCommand(peek[1])) flush();
			}
			continue;
		}
		if (ch === '(') {
			parens += 1;
			current += ch;
			i += 1;
			continue;
		}
		if (ch === ')') {
			parens = Math.max(0, parens - 1);
			current += ch;
			i += 1;
			if (depth() === 0 && source[i] === '\\') {
				const peek = source.slice(i).match(/^\\([a-zA-Z]+)/);
				if (peek && !isOpCommand(peek[1])) flush();
			}
			continue;
		}
		if (ch === '[') {
			brackets += 1;
			current += ch;
			i += 1;
			continue;
		}
		if (ch === ']') {
			brackets = Math.max(0, brackets - 1);
			current += ch;
			i += 1;
			continue;
		}

		if (depth() === 0) {
			if (ch === '+' || ch === '=' || ch === '<' || ch === '>') {
				flush();
				current = ch;
				i += 1;
				continue;
			}
			if (ch === '-' && !isUnaryMinus()) {
				flush();
				current = '-';
				i += 1;
				continue;
			}
		}

		current += ch;
		i += 1;
	}

	flush();
	return chunks.length ? chunks : [source.trim()];
}

/** True when KaTeX should use display math (matrices, arrays, aligned). */
export function needsDisplayMath(latex) {
	return DISPLAY_ENV.test(String(latex ?? ''));
}

/** Strip outer $ / $$ so callers do not double-wrap authored LaTeX. */
export function stripMathDelimiters(value) {
	const text = String(value ?? '').trim();
	if (text.startsWith('$$') && text.endsWith('$$') && text.length >= 4) {
		return text.slice(2, -2).trim();
	}
	if (text.startsWith('$') && text.endsWith('$') && text.length >= 2) {
		return text.slice(1, -1).trim();
	}
	return text;
}

export function hasInlineMathDelimiters(text) {
	return HAS_INLINE_MATH.test(String(text ?? ''));
}

/**
 * True when a block is undelimited LaTeX (not prose with a stray command).
 * Used to render computational study notes that omit $...$.
 */
export function isBareLatexBlock(text) {
	const value = String(text ?? '').trim();
	if (!value || hasInlineMathDelimiters(value)) return false;
	if (!LATEX_CMD.test(value) && !LATEX_SCRIPT.test(value)) return false;

	const withoutCommands = value.replace(/\\[a-zA-Z]+/g, ' ');
	const words = withoutCommands.match(/\b[A-Za-z]{3,}\b/g) || [];
	return words.length <= 2;
}

/**
 * Split prose and author-embedded $...$ / $$...$$. `\$` stays as a dollar sign.
 */
export function splitProseAndMath(text) {
	const source = String(text ?? '');
	const parts = [];
	let buffer = '';
	let i = 0;

	const pushText = () => {
		if (buffer) parts.push({ type: 'text', value: buffer });
		buffer = '';
	};

	while (i < source.length) {
		if (source[i] === '\\' && source[i + 1] === '$') {
			buffer += '$';
			i += 2;
			continue;
		}
		if (source.startsWith('$$', i)) {
			const end = source.indexOf('$$', i + 2);
			if (end === -1) {
				buffer += source.slice(i);
				break;
			}
			pushText();
			parts.push({ type: 'math', value: source.slice(i + 2, end), display: true });
			i = end + 2;
			continue;
		}
		if (source[i] === '$') {
			const end = source.indexOf('$', i + 1);
			if (end === -1) {
				buffer += source.slice(i);
				break;
			}
			pushText();
			parts.push({ type: 'math', value: source.slice(i + 1, end), display: false });
			i = end + 1;
			continue;
		}
		buffer += source[i];
		i += 1;
	}
	pushText();
	return parts;
}
