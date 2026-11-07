/** Quiz-specific schema, prompt, and merge helpers for ImageToDataPipeline. */

export const QUIZ_IMAGE_TYPE_MIX_OPTIONS = [
	{ value: 'all_mc', label: 'All MC' },
	{ value: 'mostly_mc', label: 'Mostly MC' },
	{ value: 'balanced', label: 'Balanced' },
	{ value: 'mostly_identification', label: 'Mostly ID' },
	{ value: 'all_id', label: 'All ID' },
	{ value: 'with_sequence', label: 'With sequence' },
	{ value: 'mostly_sequence', label: 'Mostly sequence' }
];

/** Per-image question count band; actual N is inferred from image density. */
export const QUIZ_IMAGE_QUESTION_BUDGET_OPTIONS = [
	{ value: 'minimum', label: 'Minimum' },
	{ value: 'default', label: 'Default' },
	{ value: 'maximum', label: 'Maximum' }
];

const MIX_INSTRUCTIONS = {
	all_mc:
		'Every question must be multiple-choice (identification=false, sequence=false) with exactly 4 choices.',
	mostly_mc: 'About 80% multiple-choice, 20% identification. Prefer MC when unsure.',
	balanced:
		'Roughly half multiple-choice and half identification. Sequence only if the image clearly shows ordered steps.',
	mostly_identification: 'About 80% identification (short answer), 20% multiple-choice.',
	all_id:
		'Every question must be identification (identification=true, sequence=false) with a single correct answer in choices[0].',
	with_sequence:
		'Include some sequence questions (sequence=true) when the image shows ordered steps; otherwise mix MC and identification.',
	mostly_sequence:
		'Prefer sequence questions (sequence=true with sequenceItems) when content is ordered; otherwise MC/ID.'
};

const BUDGET_INSTRUCTIONS = {
	minimum:
		'Lean: about one essential question per major distinct topic or item (roughly 0.5–1× N). Skip secondary details.',
	default: 'Solid coverage: about one clear question per major topic or item (~1× N).',
	maximum:
		'Thorough: up to ~1.5–2× N. Prefer complementary pairs (e.g. formula + concept) when both are on the image. Do not invent filler beyond the image.'
};

export const QUIZ_IMAGE_SCAN_JSON_SCHEMA = {
	type: 'object',
	properties: {
		quiz_title: { type: 'string' },
		description: { type: 'string' },
		questionBudget: {
			type: 'string',
			enum: ['minimum', 'default', 'maximum']
		},
		targetQuestionCount: { type: 'integer' },
		sections: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					order: { type: 'integer' }
				},
				required: ['title']
			}
		},
		questions: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					kind: {
						type: 'string',
						enum: ['mc', 'identification', 'sequence']
					},
					choicesText: { type: 'string' },
					correctAnswerIndex: { type: 'integer' },
					mathematical: { type: 'boolean' },
					explanation: { type: 'string' },
					sectionTitle: { type: 'string' },
					sequenceMode: {
						type: 'string',
						enum: ['full', 'gap', 'next']
					}
				},
				required: ['title', 'kind', 'choicesText', 'mathematical']
			}
		}
	},
	required: ['quiz_title', 'questionBudget', 'targetQuestionCount', 'questions']
};

export const QUIZ_IMAGE_SCAN_FIELDS = [
	{ key: 'title', label: 'Question', type: 'textarea', required: true },
	{
		key: 'kind',
		label: 'Type',
		type: 'select',
		required: true,
		options: [
			{ value: 'mc', label: 'Multiple choice' },
			{ value: 'identification', label: 'Identification' },
			{ value: 'sequence', label: 'Sequence' }
		]
	},
	{
		key: 'choicesText',
		label: 'Choices / answer (one per line)',
		type: 'textarea',
		required: true,
		placeholder: 'For MC: four options\nFor ID: the answer\nFor sequence: each blank/step'
	},
	{
		key: 'correctAnswerIndex',
		label: 'Correct choice index (MC)',
		type: 'number',
		defaultValue: 0
	},
	{
		key: 'mathematical',
		label: 'Mathematical (LaTeX)',
		type: 'select',
		options: [
			{ value: 'false', label: 'No' },
			{ value: 'true', label: 'Yes' }
		],
		defaultValue: 'false'
	},
	{ key: 'explanation', label: 'Explanation', type: 'textarea' },
	{ key: 'sectionTitle', label: 'Section title', type: 'text' },
	{
		key: 'sequenceMode',
		label: 'Sequence mode',
		type: 'select',
		options: [
			{ value: 'gap', label: 'Gap' },
			{ value: 'full', label: 'Full' },
			{ value: 'next', label: 'Next' }
		],
		defaultValue: 'gap'
	}
];

export function buildQuizImageScanPrompt(typeMix = 'balanced', questionBudget = 'default') {
	const mixKey = MIX_INSTRUCTIONS[typeMix] ? typeMix : 'balanced';
	const budgetKey = BUDGET_INSTRUCTIONS[questionBudget] ? questionBudget : 'default';
	const mixRule = MIX_INSTRUCTIONS[mixKey];
	const budgetRule = BUDGET_INSTRUCTIONS[budgetKey];
	return `Convert this image into a structured quiz draft for Zenith Quiz Maker.

Read worksheets, slides, whiteboards, textbook pages, posters, or handwritten notes.
Extract or invent clear study questions grounded in what the image shows.
Prefer the visible language and facts; do not invent unrelated topics.
Judge density from THIS image alone (each image in a batch is independent).

Question count (per this image):
1. Estimate N = number of distinct teachable topics, panels, equations, or items visible.
2. Set questionBudget to "${budgetKey}" (required echo).
3. Choose targetQuestionCount for this image under that budget: ${budgetRule}
4. Return about targetQuestionCount questions (prefer matching that count; never pad with off-image filler).

Type mix rule: ${mixRule}

Math / LaTeX (match Zenith COM-style authoring):
- Set mathematical=true only when the stem or answers use real equations/formulas.
- Titles: wrap display/inline math in $...$ when helpful (e.g. Derive $E = hf$).
- Choice / answer / sequence lines: raw TeX fragments are fine (e.g. a^2+2ab+b^2, \\\\frac{h}{p}, \\\\hbar).
- Do NOT wrap plain English in \\\\text{} or decorative LaTeX.
- If mathematical=false, use plain text only (no LaTeX).

Field rules:
- quiz_title: short title for this image's content
- questionBudget / targetQuestionCount: as above
- questions: array of question objects (at least one)
- kind: "mc" | "identification" | "sequence"
- choicesText: newline-separated strings
  - mc: exactly 4 choices; correctAnswerIndex is 0–3
  - identification: one line (the answer); correctAnswerIndex 0
  - sequence: one line per ordered item/blank; sequenceMode full|gap|next
- mathematical: boolean (required)
- sectionTitle: optional; use when the image has clear chapters/topics
- explanation: brief rationale when obvious from the image; else empty string
- If the image already contains a quiz, preserve wording and answers as closely as possible
- Skip decorative logos and page numbers that are not quiz content
- Return JSON only matching the provided schema`;
}

function linesFromChoicesText(text) {
	return String(text || '')
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
}

function coerceKind(row) {
	const raw = String(row?.kind || '')
		.trim()
		.toLowerCase();
	if (raw === 'identification' || raw === 'id') return 'identification';
	if (raw === 'sequence' || raw === 'seq') return 'sequence';
	if (row?.sequence === true || String(row?.question_type || '').startsWith('SEQ')) {
		return 'sequence';
	}
	if (row?.identification === true) return 'identification';
	return 'mc';
}

function looksLikeLatex(...parts) {
	const text = parts.map((p) => String(p || '')).join(' ');
	if (!text.trim()) return false;
	if (/\$[^$]+\$/.test(text)) return true;
	return /\\(frac|dfrac|tfrac|sqrt|sum|int|partial|infty|hbar|mathrm|mathbf|left|right|begin|end|[a-zA-Z]+)|[_^]\s*\{|[_^]\s*[A-Za-z0-9]/.test(
		text
	);
}

function coerceMathematical(row, parts = []) {
	const raw = row?.mathematical;
	if (raw === true || raw === 'true' || raw === 1 || raw === '1') return true;
	if (raw === false || raw === 'false' || raw === 0 || raw === '0') {
		return looksLikeLatex(...parts);
	}
	return looksLikeLatex(...parts);
}

/** Map a reviewed record (or raw model question) into generate-style quiz_data question. */
export function normalizeQuizImageQuestion(row, index = 0) {
	const kind = coerceKind(row);
	const fromText = linesFromChoicesText(row?.choicesText);
	const fromChoices = Array.isArray(row?.choices)
		? row.choices.map((c) => String(c).trim()).filter(Boolean)
		: [];
	const lines = fromText.length ? fromText : fromChoices;
	let correctAnswerIndex = Number(row?.correctAnswerIndex);
	if (!Number.isFinite(correctAnswerIndex)) correctAnswerIndex = 0;

	const title = String(row?.title || '').trim() || `Question ${index + 1}`;
	const mathematical = coerceMathematical(row, [title, ...lines]);

	const base = {
		title,
		explanation: String(row?.explanation || '').trim(),
		section: String(row?.sectionTitle || row?.section || '').trim(),
		mathematical,
		randomChoices: true
	};

	if (kind === 'sequence') {
		const items = (lines.length ? lines : ['Step 1', 'Step 2']).map((text, i) => ({
			text,
			role: 'blank',
			order: i
		}));
		const mode = ['full', 'gap', 'next'].includes(String(row?.sequenceMode || '').toLowerCase())
			? String(row.sequenceMode).toLowerCase()
			: 'gap';
		return {
			...base,
			identification: false,
			sequence: true,
			sequenceMode: mode,
			sequenceItems: items,
			choices: [items[0]?.text || 'Answer'],
			correctAnswerIndex: 0
		};
	}

	if (kind === 'identification') {
		const answer = lines[0] || String(row?.correctAnswer || 'Answer').trim() || 'Answer';
		return {
			...base,
			identification: true,
			sequence: false,
			choices: [answer],
			correctAnswerIndex: 0
		};
	}

	let choices = lines.slice(0, 4);
	while (choices.length < 4) choices.push(`Option ${String.fromCharCode(65 + choices.length)}`);
	choices = choices.slice(0, 4);
	correctAnswerIndex = Math.max(0, Math.min(correctAnswerIndex, choices.length - 1));
	return {
		...base,
		identification: false,
		sequence: false,
		choices,
		correctAnswerIndex
	};
}

function buildSectionsFromQuestions(questions) {
	const titles = [];
	const indexByTitle = new Map();
	for (const q of questions) {
		const title = String(q.section || '').trim();
		if (!title) continue;
		const key = title.toLowerCase();
		if (!indexByTitle.has(key)) {
			indexByTitle.set(key, titles.length);
			titles.push(title);
		}
	}
	if (!titles.length) {
		return {
			sections: [],
			questions: questions.map((q) => {
				const next = { ...q };
				delete next.section;
				return next;
			})
		};
	}
	const sections = titles.map((title, order) => ({ title, order }));
	const mapped = questions.map((q) => {
		const key = String(q.section || '')
			.trim()
			.toLowerCase();
		const sectionIndex = indexByTitle.has(key) ? indexByTitle.get(key) : 0;
		const next = { ...q, sectionIndex };
		delete next.section;
		return next;
	});
	return { sections, questions: mapped };
}

function quizDataFromDraftData(data, fallbackTitle) {
	const rawQuestions = Array.isArray(data?.questions) ? data.questions : [];
	const normalized = rawQuestions.map((row, i) => normalizeQuizImageQuestion(row, i));
	if (!normalized.length) {
		throw new Error('Each scanned image needs at least one question.');
	}

	const explicitSections = Array.isArray(data?.sections)
		? data.sections
				.map((sec, order) => ({
					title: String(sec?.title || '').trim() || `Section ${order + 1}`,
					order: typeof sec?.order === 'number' ? sec.order : order
				}))
				.filter((sec) => sec.title)
		: [];

	let sections;
	let questions;
	if (explicitSections.length) {
		sections = explicitSections;
		const byTitle = new Map(sections.map((sec, i) => [sec.title.toLowerCase(), i]));
		questions = normalized.map((q) => {
			const key = String(q.section || '')
				.trim()
				.toLowerCase();
			const sectionIndex = byTitle.has(key) ? byTitle.get(key) : 0;
			const next = { ...q, sectionIndex };
			delete next.section;
			return next;
		});
	} else {
		({ sections, questions } = buildSectionsFromQuestions(normalized));
	}

	return {
		quiz_title:
			String(data?.quiz_title || fallbackTitle || 'Scanned quiz').trim() || 'Scanned quiz',
		description: String(data?.description || '').trim(),
		sections,
		questions
	};
}

/**
 * Merge one or more ImageToDataPipeline commit payloads into generate-style quiz_data.
 * Multiple images → one section per image (preserves inner section titles when present).
 */
export function mergeQuizImageDrafts(draftPayloads) {
	const list = Array.isArray(draftPayloads) ? draftPayloads.filter(Boolean) : [];
	if (!list.length) {
		throw new Error('No scanned quiz drafts to apply.');
	}

	if (list.length === 1) {
		return quizDataFromDraftData(list[0].data, 'Scanned quiz');
	}

	const sections = [];
	const questions = [];
	let quizTitle = '';

	list.forEach((payload, imageIndex) => {
		const part = quizDataFromDraftData(payload.data, `Image ${imageIndex + 1}`);
		if (!quizTitle && part.quiz_title) quizTitle = part.quiz_title;

		if (part.sections.length) {
			const localToGlobal = new Map();
			part.sections.forEach((sec, localIndex) => {
				const globalIndex = sections.length;
				localToGlobal.set(localIndex, globalIndex);
				sections.push({
					title: `${part.quiz_title}: ${sec.title}`.slice(0, 120),
					order: globalIndex
				});
			});
			part.questions.forEach((q) => {
				const localIndex = q.sectionIndex ?? 0;
				const sectionIndex = localToGlobal.get(localIndex) ?? localToGlobal.get(0) ?? 0;
				const next = { ...q, sectionIndex };
				delete next.section;
				questions.push(next);
			});
		} else {
			const sectionIndex = sections.length;
			sections.push({
				title: part.quiz_title || `Image ${imageIndex + 1}`,
				order: sectionIndex
			});
			part.questions.forEach((q) => {
				const next = { ...q, sectionIndex };
				delete next.section;
				questions.push(next);
			});
		}
	});

	if (!questions.length) {
		throw new Error('No questions found in scanned images.');
	}

	return {
		quiz_title: quizTitle || 'Scanned quiz',
		sections: sections.map((sec, order) => ({ ...sec, order })),
		questions: questions.map((q, id) => ({ ...q, id }))
	};
}

/** Shape raw vision draft questions into pipeline review records. */
export function normalizeQuizImageRecords(data) {
	const raw = Array.isArray(data?.questions) ? data.questions : [];
	return raw.map((row, index) => {
		const kind = coerceKind(row);
		let choicesText = String(row?.choicesText || '').trim();
		if (!choicesText && Array.isArray(row?.choices)) {
			choicesText = row.choices.map((c) => String(c)).join('\n');
		}
		if (!choicesText && Array.isArray(row?.sequenceItems)) {
			choicesText = row.sequenceItems
				.map((item) => (typeof item === 'string' ? item : item?.text || ''))
				.filter(Boolean)
				.join('\n');
		}
		const title = String(row?.title || '').trim();
		const mathematical = coerceMathematical(row, [title, choicesText]) ? 'true' : 'false';
		return {
			_key: `row-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
			title,
			kind,
			choicesText,
			correctAnswerIndex: typeof row?.correctAnswerIndex === 'number' ? row.correctAnswerIndex : 0,
			mathematical,
			explanation: String(row?.explanation || '').trim(),
			sectionTitle: String(row?.sectionTitle || row?.section || '').trim(),
			sequenceMode: row?.sequenceMode || row?.sequence_mode || 'gap'
		};
	});
}

export function validateQuizImageDraft(draft) {
	const records = draft?.records || [];
	if (!records.length) return 'Add at least one question.';
	for (const row of records) {
		if (!String(row.title || '').trim()) return 'Every question needs a title.';
		const kind = coerceKind(row);
		const lines = linesFromChoicesText(row.choicesText);
		if (!lines.length && kind !== 'mc') {
			return 'Add at least one answer line in Choices / answer.';
		}
		if (kind === 'mc' && lines.length > 0 && lines.length < 2) {
			return 'Multiple-choice questions need at least two choices.';
		}
	}
	return null;
}
