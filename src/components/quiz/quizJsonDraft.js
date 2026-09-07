/**
 * Template-style / legacy quiz JSON for Create/Edit drafts.
 * Save still uses form state. Numeric ids are kept off Download and reattached
 * on parse so Edit updates existing questions/sections instead of recreating them.
 */

import {
	buildTemplateStyleQuizJson,
	isTemplateStyleQuizJson,
	quizExportFilename
} from '../../lib/exportQuizJson';
import { resolveQuizImageSrc } from '../../lib/quizImages';
import {
	createQuestionClientId,
	createSection,
	flagsFromQuestionType,
	parseOptionalTimerSeconds,
	questionTypeFromFlags,
	resolveAuthoringSectionIndex,
	authoringSequenceFields,
	authoringChessFields,
	authoringCodeFields
} from './quizHelpers';

export function persistableNumericId(value) {
	if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
	if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
		const n = Number(value.trim());
		if (Number.isInteger(n) && n > 0) return n;
	}
	return null;
}

function isUsableUrl(value) {
	if (value == null) return false;
	const s = String(value).trim();
	if (!s || s.startsWith('data:') || s.startsWith('blob:')) return false;
	return true;
}

function usableUrl(...candidates) {
	for (const c of candidates) {
		if (isUsableUrl(c)) return String(c).trim();
	}
	return '';
}

function indexToLineCol(text, index) {
	const slice = text.slice(0, Math.max(0, index));
	const lines = slice.split('\n');
	return { line: lines.length, column: (lines[lines.length - 1] || '').length + 1 };
}

export function parseJsonWithLocation(text) {
	try {
		return { ok: true, data: JSON.parse(text) };
	} catch (err) {
		const message = err?.message || 'Invalid JSON.';
		const lineCol = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
		const pos = message.match(/position\s+(\d+)/i);
		let line = 1;
		let column = 1;
		if (lineCol) {
			line = Number(lineCol[1]) || 1;
			column = Number(lineCol[2]) || 1;
		} else if (pos) {
			const loc = indexToLineCol(text, Number(pos[1]) || 0);
			line = loc.line;
			column = loc.column;
		}
		return {
			ok: false,
			diagnostics: [
				{
					severity: 'error',
					fatal: true,
					line,
					column,
					path: '',
					message: message.replace(/^JSON\.parse:\s*/i, '')
				}
			]
		};
	}
}

function choiceTexts(rawChoices, { identification, mathematical }) {
	const list = Array.isArray(rawChoices) ? rawChoices : [];
	let texts = list.map((c) => {
		if (typeof c === 'object' && c !== null) return c.text == null ? '' : String(c.text);
		return String(c || '');
	});
	if (mathematical) {
		texts = texts.map((t) => t.replace(/\\\\/g, '\\'));
	}
	const min = identification ? 1 : 4;
	if (identification && texts.length > 1) texts = [texts[0]];
	while (texts.length < min) texts.push('');
	return texts;
}

function choiceUrls(rawChoices, length) {
	const list = Array.isArray(rawChoices) ? rawChoices : [];
	const urls = list.map((c) =>
		typeof c === 'object' && c !== null ? usableUrl(c.image_url, c.image) : ''
	);
	while (urls.length < length) urls.push('');
	return urls.slice(0, length);
}

function padArray(list, length, fill) {
	const next = Array.isArray(list) ? [...list] : [];
	while (next.length < length) next.push(fill);
	return next.slice(0, length);
}

export function mapJsonQuestionToAuthoring(q, index, { templateStyle, sections }) {
	const flags = templateStyle
		? flagsFromQuestionType(q.question_type)
		: {
				mathematical: !!q.mathematical || String(q.question_type || '').endsWith('-COM'),
				identification: !!q.identification,
				sequence: !!q.sequence || String(q.question_type || '').startsWith('SEQ'),
				sequenceMode: q.sequenceMode || q.sequence_mode
			};
	const rawChoices = Array.isArray(q.choices) ? q.choices : [];
	const choices = choiceTexts(rawChoices, flags);
	const choiceImageUrls = choiceUrls(rawChoices, choices.length);
	const qUrl = usableUrl(q.question_image_url, q.question_image);
	const hasChoiceImages =
		!!q.has_choice_images || !!q.hasChoiceImages || choiceImageUrls.some(Boolean);
	const sectionIndex =
		typeof q.section_index === 'number'
			? q.section_index
			: Number.isFinite(Number(q.section_index))
				? Number(q.section_index)
				: typeof q.sectionIndex === 'number'
					? q.sectionIndex
					: null;
	const sectionKey =
		sectionIndex != null && sections[sectionIndex]
			? sections[sectionIndex].clientKey
			: sections[0]?.clientKey || null;

	return {
		id: createQuestionClientId(),
		title: String(q.title || q.question || '').trim(),
		choices,
		choiceImages: choices.map(() => null),
		choiceImagePreviews: choiceImageUrls.map((u) => resolveQuizImageSrc(u) || u || null),
		choiceImageUrls,
		correctAnswerIndex:
			typeof q.correct_answer_index === 'number'
				? q.correct_answer_index
				: typeof q.correctAnswerIndex === 'number'
					? q.correctAnswerIndex
					: 0,
		mathematical: flags.mathematical,
		identification: flags.identification,
		...authoringSequenceFields(q, flags),
		...authoringChessFields(q, flags),
		...authoringCodeFields(q, flags),
		randomChoices: !!(q.random_choices ?? q.randomChoices),
		hasChoiceImages,
		showChoiceImages: hasChoiceImages,
		question_image: null,
		question_image_preview: resolveQuizImageSrc(qUrl) || qUrl || null,
		question_image_url: qUrl,
		explanation: q.explanation || '',
		workedSolution: q.worked_solution || q.workedSolution || '',
		sourceCitation: q.source_citation || q.sourceCitation || '',
		sectionKey,
		perQuestionTimeSeconds: parseOptionalTimerSeconds(
			q.per_question_time_seconds ?? q.perQuestionTimeSeconds
		),
		_jsonId: persistableNumericId(q.id),
		_jsonIndex: index
	};
}

export function mapJsonDataToSections(data) {
	const sectionList = Array.isArray(data?.sections) ? data.sections : [];
	return sectionList.map((sec, i) =>
		createSection({
			id: persistableNumericId(sec.id),
			title: sec.title || `Section ${i + 1}`,
			order: sec.order ?? i
		})
	);
}

function authoringQuestionToExportShape(q, index, sections) {
	const choices = Array.isArray(q.choices) ? q.choices : [];
	return {
		id: q.id,
		question: q.title,
		title: q.title,
		question_type: questionTypeFromFlags(q),
		correct_answer_index: q.correctAnswerIndex || 0,
		random_choices: !!q.randomChoices,
		sequence_order_matters: q.sequenceOrderMatters !== false,
		sequence_items: q.sequence
			? (q.sequenceItems || []).map((item, i) => ({
					text: item.text || '',
					role: item.role || 'blank',
					order: i
				}))
			: [],
		chess_spec:
			q.chessPuzzle || q.chessSpec?.fen
				? {
						fen: q.chessSpec?.fen || '',
						orientation: q.chessSpec?.orientation || 'white',
						solution_uci: q.chessSpec?.solution_uci || [],
						arrows: q.chessSpec?.arrows || []
					}
				: undefined,
		code_spec:
			q.codeQuiz || q.codeSpec?.solution
				? {
						language: q.codeSpec?.language || 'plaintext',
						solution: q.codeSpec?.solution || ''
					}
				: undefined,
		has_choice_images: !!q.hasChoiceImages || (q.choiceImageUrls || []).some(Boolean),
		question_image_url: usableUrl(q.question_image_url),
		order: index,
		choices: choices.map((text, i) => ({
			text: text == null ? '' : String(text),
			image_url: usableUrl(q.choiceImageUrls?.[i]),
			order: i
		})),
		section_index: resolveAuthoringSectionIndex(q, sections),
		explanation: q.explanation || '',
		worked_solution: q.workedSolution || '',
		source_citation: q.sourceCitation || '',
		per_question_time_seconds: q.perQuestionTimeSeconds
	};
}

export function draftToTemplatePayload({ quizMeta, questions, sections, persistIds = false }) {
	const quiz = {
		quiz_title: quizMeta.title || 'Quiz',
		title: quizMeta.title || 'Quiz',
		tag_color: quizMeta.tagColor || '#3B82F6',
		quiz_image_url: usableUrl(quizMeta.coverImageUrl),
		flashcard_quiz: !!quizMeta.flashcardQuiz,
		random_question_order: !!quizMeta.randomQuestionOrder,
		per_question_timer_enabled: !!quizMeta.perQuestionTimerEnabled,
		per_question_time_seconds: quizMeta.perQuestionTimeSeconds ?? 30,
		answer_suggestions_enabled: quizMeta.answerSuggestionsEnabled !== false,
		sections: sections || []
	};
	const exportQuestions = (questions || []).map((q, i) =>
		authoringQuestionToExportShape(q, i, sections || [])
	);
	return buildTemplateStyleQuizJson(quiz, exportQuestions, { includeIds: !!persistIds });
}

export function stringifyQuizJson(payload) {
	return `${JSON.stringify(payload, null, 2)}\n`;
}

export function serializeQuizJsonDraft(args) {
	return stringifyQuizJson(draftToTemplatePayload(args));
}

export function downloadQuizJsonDraft(args) {
	const payload = draftToTemplatePayload({ ...args, persistIds: false });
	const filename = quizExportFilename(payload.title);
	const blob = new Blob([stringifyQuizJson(payload)], { type: 'application/json;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	try {
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.rel = 'noopener';
		document.body.appendChild(a);
		a.click();
		a.remove();
	} finally {
		URL.revokeObjectURL(url);
	}
	return { filename, payload };
}

function validateParsedQuiz(data) {
	const diagnostics = [];
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		diagnostics.push({
			severity: 'error',
			fatal: true,
			path: '',
			message: 'JSON must be an object with a questions array.'
		});
		return { diagnostics };
	}
	const questions = data.questions;
	if (!Array.isArray(questions) || questions.length === 0) {
		diagnostics.push({
			severity: 'error',
			fatal: true,
			path: 'questions',
			message: 'questions must be a non-empty array.'
		});
		return { diagnostics };
	}
	const sections = Array.isArray(data.sections) ? data.sections : [];
	const seenQuestionIds = new Map();
	const seenSectionIds = new Map();
	sections.forEach((sec, i) => {
		const id = persistableNumericId(sec?.id);
		if (id == null) return;
		if (seenSectionIds.has(id)) {
			diagnostics.push({
				severity: 'error',
				fatal: true,
				path: `sections[${i}].id`,
				message: `Duplicate section id ${id}.`
			});
		} else {
			seenSectionIds.set(id, i);
		}
	});
	questions.forEach((q, i) => {
		const path = `questions[${i}]`;
		if (!q || typeof q !== 'object') {
			diagnostics.push({
				severity: 'error',
				fatal: true,
				path,
				message: 'Each question must be an object.'
			});
			return;
		}
		if (!String(q.title || q.question || '').trim()) {
			diagnostics.push({
				severity: 'warning',
				path: `${path}.title`,
				message: 'Question title is empty.'
			});
		}
		const type = q.question_type;
		if (
			type != null &&
			type !== '' &&
			![
				'MUL',
				'IDE',
				'MUL-COM',
				'IDE-COM',
				'COM',
				'SEQ-FUL',
				'SEQ-GAP',
				'SEQ-NXT',
				'SEQ-FUL-COM',
				'SEQ-GAP-COM',
				'SEQ-NXT-COM',
				'CHS-PUZ',
				'COD'
			].includes(type)
		) {
			diagnostics.push({
				severity: 'error',
				fatal: true,
				path: `${path}.question_type`,
				message: `Unknown question_type "${type}".`
			});
		}
		const id = persistableNumericId(q.id);
		if (id != null) {
			if (seenQuestionIds.has(id)) {
				diagnostics.push({
					severity: 'error',
					fatal: true,
					path: `${path}.id`,
					message: `Duplicate question id ${id}.`
				});
			} else {
				seenQuestionIds.set(id, i);
			}
		}
		const sectionIndex =
			typeof q.section_index === 'number'
				? q.section_index
				: Number.isFinite(Number(q.section_index))
					? Number(q.section_index)
					: null;
		if (
			sectionIndex != null &&
			sections.length > 0 &&
			(sectionIndex < 0 || sectionIndex >= sections.length)
		) {
			diagnostics.push({
				severity: 'error',
				fatal: true,
				path: `${path}.section_index`,
				message: `section_index ${sectionIndex} is out of range (0–${sections.length - 1}).`
			});
		}
	});
	return { diagnostics };
}

export function parseQuizJsonText(text) {
	const parsed = parseJsonWithLocation(text);
	if (!parsed.ok) return parsed;
	const { diagnostics } = validateParsedQuiz(parsed.data);
	const fatal = diagnostics.some((d) => d.fatal);
	return {
		ok: !fatal,
		data: parsed.data,
		diagnostics
	};
}

function mergeSidecar(mapped, prev) {
	if (!prev) return mapped;
	const n = mapped.choices.length;
	const urlsChanged = (mapped.choiceImageUrls || []).some(
		(url, i) => usableUrl(url) !== usableUrl(prev.choiceImageUrls?.[i])
	);
	const qUrlChanged = usableUrl(mapped.question_image_url) !== usableUrl(prev.question_image_url);
	return {
		...mapped,
		id: prev.id,
		choiceImages: urlsChanged
			? padArray(
					(mapped.choiceImageUrls || []).map((url, i) =>
						usableUrl(url) ? null : prev.choiceImages?.[i] || null
					),
					n,
					null
				)
			: padArray(prev.choiceImages, n, null),
		choiceImagePreviews: padArray(
			(mapped.choiceImageUrls || []).map((url, i) => {
				if (usableUrl(url)) return resolveQuizImageSrc(url) || url;
				return prev.choiceImagePreviews?.[i] ?? null;
			}),
			n,
			null
		),
		question_image: qUrlChanged
			? usableUrl(mapped.question_image_url)
				? null
				: prev.question_image
			: prev.question_image,
		question_image_preview: usableUrl(mapped.question_image_url)
			? resolveQuizImageSrc(mapped.question_image_url) || mapped.question_image_url
			: prev.question_image_preview,
		question_image_url:
			usableUrl(mapped.question_image_url) || (qUrlChanged ? '' : prev.question_image_url || '')
	};
}

/**
 * Reattach persisted ids / clientKeys / unsaved File uploads from the previous draft.
 */
export function mergeParsedIntoDraft({
	data,
	prevQuestions = [],
	prevSections = [],
	persistIds = false,
	allowedQuestionIds = new Set(),
	allowedSectionIds = new Set(),
	graveyardQuestions,
	graveyardSections
}) {
	const diagnostics = [];
	const templateStyle = isTemplateStyleQuizJson(data);
	const jsonSections = mapJsonDataToSections(data);
	const jsonHasQuestionIds = (data.questions || []).some((q) => persistableNumericId(q.id) != null);
	const jsonHasSectionIds = jsonSections.some((s) => persistableNumericId(s.id) != null);

	if (persistIds && (data.questions || []).length > 0 && !jsonHasQuestionIds) {
		diagnostics.push({
			severity: 'warning',
			path: 'questions',
			message:
				'No question ids in JSON. Existing questions are matched by order so Save can update them. Reorder or insert without ids may attach the wrong question.'
		});
	}

	const prevSById = new Map();
	for (const s of prevSections) {
		const id = persistableNumericId(s.id);
		if (id != null) prevSById.set(id, s);
	}
	const sections = jsonSections.map((sec, i) => {
		let prev = null;
		const jsonId = persistableNumericId(sec.id);
		if (persistIds && jsonId != null && allowedSectionIds.has(jsonId)) {
			prev = prevSById.get(jsonId) || graveyardSections?.get(jsonId) || null;
			if (!prev) {
				diagnostics.push({
					severity: 'warning',
					path: `sections[${i}].id`,
					message: `Section id ${jsonId} is not on this quiz and will be created as new.`
				});
			}
		} else if (persistIds && jsonId != null && !allowedSectionIds.has(jsonId)) {
			diagnostics.push({
				severity: 'warning',
				path: `sections[${i}].id`,
				message: `Section id ${jsonId} is not on this quiz and will be created as new.`
			});
		} else if (!jsonHasSectionIds && prevSections[i]) {
			prev = prevSections[i];
		}
		if (jsonId != null) graveyardSections?.delete(jsonId);
		return createSection({
			...(prev?.clientKey ? { clientKey: prev.clientKey } : {}),
			id: prev && persistIds ? prev.id : null,
			title: sec.title,
			order: sec.order ?? i
		});
	});

	for (const s of prevSections) {
		const id = persistableNumericId(s.id);
		if (id != null && persistIds && !sections.some((x) => persistableNumericId(x.id) === id)) {
			graveyardSections?.set(id, s);
		}
	}

	const prevQById = new Map();
	for (const q of prevQuestions) {
		const id = persistableNumericId(q.id);
		if (id != null) prevQById.set(id, q);
	}
	const usedPrev = new Set();
	const questions = (data.questions || []).map((raw, i) => {
		const mapped = mapJsonQuestionToAuthoring(raw, i, { templateStyle, sections });
		let prev = null;
		const jsonId = mapped._jsonId;
		if (persistIds && jsonId != null && allowedQuestionIds.has(jsonId)) {
			prev = prevQById.get(jsonId) || graveyardQuestions?.get(jsonId) || null;
			if (!prev) {
				diagnostics.push({
					severity: 'warning',
					path: `questions[${i}].id`,
					message: `Question id ${jsonId} is not on this quiz and will be created as new.`
				});
			}
		} else if (persistIds && jsonId != null && !allowedQuestionIds.has(jsonId)) {
			diagnostics.push({
				severity: 'warning',
				path: `questions[${i}].id`,
				message: `Question id ${jsonId} is not on this quiz and will be created as new.`
			});
		} else if (!jsonHasQuestionIds && prevQuestions[i]) {
			prev = prevQuestions[i];
		}
		if (prev) usedPrev.add(prev);
		if (jsonId != null) graveyardQuestions?.delete(jsonId);
		const merged = mergeSidecar(mapped, prev);
		delete merged._jsonId;
		delete merged._jsonIndex;
		return merged;
	});

	for (const q of prevQuestions) {
		const id = persistableNumericId(q.id);
		if (id != null && persistIds && !usedPrev.has(q)) {
			graveyardQuestions?.set(id, q);
		}
	}

	return { questions, sections, diagnostics, templateStyle };
}

export function formatDiagnostic(d) {
	const loc = d.line ? `L${d.line}:${d.column || 1}` : d.path || '';
	return loc ? `${loc} — ${d.message}` : d.message;
}
