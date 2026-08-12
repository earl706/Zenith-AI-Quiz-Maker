/**
 * Client-side quiz JSON export in fixtures/templates-style shape.
 * Round-trips through Create Quiz import (template-style branch).
 */

function isUsableUrl(value) {
	if (value == null) return false;
	const s = String(value).trim();
	if (!s || s.startsWith('data:')) return false;
	return true;
}

function pickImageUrl(...candidates) {
	for (const c of candidates) {
		if (isUsableUrl(c)) return String(c).trim();
	}
	return '';
}

/** Kebab slug for template-style `slug` / `topic` fields. */
export function slugifyQuizTitle(title) {
	const base = String(title || 'quiz')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
	return base || 'quiz';
}

/** Safe download filename: `{quiz_title}.json`. */
export function quizExportFilename(title) {
	const raw = String(title || 'quiz').trim() || 'quiz';
	const safe = raw
		.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 120);
	return `${safe || 'quiz'}.json`;
}

function orderedSections(quiz) {
	const list = Array.isArray(quiz?.sections) ? [...quiz.sections] : [];
	list.sort((a, b) => {
		const ao = a?.order ?? 0;
		const bo = b?.order ?? 0;
		if (ao !== bo) return ao - bo;
		return (a?.id ?? 0) - (b?.id ?? 0);
	});
	return list;
}

function sectionIndexForQuestion(question, sections) {
	if (!sections.length) return null;
	const sectionId = question?.section ?? question?.section_id ?? null;
	if (sectionId == null) return null;
	const idx = sections.findIndex((s) => s?.id === sectionId || String(s?.id) === String(sectionId));
	return idx >= 0 ? idx : null;
}

function exportChoices(question) {
	const raw = Array.isArray(question?.choices) ? question.choices : [];
	return raw.map((choice, order) => {
		if (typeof choice === 'string') {
			return { text: choice, image_url: '', order };
		}
		const text = choice?.text == null ? '' : String(choice.text);
		const image_url = pickImageUrl(choice?.image_url, choice?.image_display, choice?.image);
		return {
			text,
			image_url,
			order: typeof choice?.order === 'number' ? choice.order : order
		};
	});
}

/**
 * Build template-style quiz JSON from QuizPage summary/detail payloads.
 * Omits attempts, UUIDs, and other runtime fields.
 */
export function buildTemplateStyleQuizJson(quiz, questions) {
	if (!quiz || typeof quiz !== 'object') {
		throw new Error('Quiz data is missing.');
	}

	const title = String(quiz.quiz_title || quiz.title || '').trim();
	if (!title) {
		throw new Error('Quiz title is missing.');
	}

	const questionList = Array.isArray(questions)
		? questions
		: Array.isArray(quiz.questions)
			? quiz.questions
			: [];
	if (questionList.length === 0) {
		throw new Error('This quiz has no questions to export.');
	}

	const sections = orderedSections(quiz);
	const slug = slugifyQuizTitle(title);
	const cover_image_url = pickImageUrl(quiz.quiz_image_url, quiz.quiz_image);

	const exportedQuestions = questionList.map((q, qi) => {
		const choices = exportChoices(q);
		const hasChoiceImages =
			!!q.has_choice_images || !!q.hasChoiceImages || choices.some((c) => Boolean(c.image_url));
		const section_index = sectionIndexForQuestion(q, sections);
		const question_image_url = pickImageUrl(q.question_image_url, q.question_image);
		const correct_answer_index =
			typeof q.correct_answer_index === 'number'
				? q.correct_answer_index
				: typeof q.correctAnswerIndex === 'number'
					? q.correctAnswerIndex
					: 0;

		const row = {
			title: String(q.question || q.title || '').trim(),
			question_type: q.question_type || 'MUL',
			correct_answer_index,
			random_choices: !!(q.random_choices ?? q.randomChoices),
			has_choice_images: hasChoiceImages,
			question_image_url,
			order: typeof q.order === 'number' ? q.order : qi,
			choices
		};

		if (section_index != null) {
			row.section_index = section_index;
		}

		const explanation = q.explanation || '';
		const worked_solution = q.worked_solution || q.workedSolution || '';
		const source_citation = q.source_citation || q.sourceCitation || '';
		if (explanation) row.explanation = explanation;
		if (worked_solution) row.worked_solution = worked_solution;
		if (source_citation) row.source_citation = source_citation;

		const pq = q.per_question_time_seconds ?? q.perQuestionTimeSeconds ?? null;
		if (pq != null && String(pq).trim() !== '') {
			const n = Number(pq);
			if (Number.isFinite(n)) row.per_question_time_seconds = n;
		}

		return row;
	});

	return {
		slug,
		title,
		topic: slug,
		description: '',
		tag_color: quiz.tag_color || '#3B82F6',
		cover_image_url,
		order: 0,
		flashcard_quiz: !!quiz.flashcard_quiz,
		random_question_order: !!quiz.random_question_order,
		per_question_timer_enabled: !!quiz.per_question_timer_enabled,
		per_question_time_seconds:
			quiz.per_question_time_seconds != null ? Number(quiz.per_question_time_seconds) || 30 : 30,
		answer_suggestions_enabled: quiz.answer_suggestions_enabled !== false,
		sections: sections.map((sec, i) => ({
			title: sec.title || `Section ${i + 1}`,
			order: sec.order ?? i
		})),
		questions: exportedQuestions
	};
}

/**
 * Trigger a browser download of the quiz as `.json`.
 * @returns {{ filename: string, payload: object }}
 */
export function downloadQuizAsJson(quiz, questions) {
	const payload = buildTemplateStyleQuizJson(quiz, questions);
	const filename = quizExportFilename(payload.title);
	const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
		type: 'application/json;charset=utf-8'
	});
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

/** True when payload matches fixtures/templates-style (or export) shape. */
export function isTemplateStyleQuizJson(data) {
	if (!data || typeof data !== 'object') return false;
	const questions = data.questions;
	if (!Array.isArray(questions) || questions.length === 0) return false;
	const title = data.title || data.quiz_title;
	if (!title) return false;
	return questions.some(
		(q) =>
			q?.question_type != null ||
			typeof q?.correct_answer_index === 'number' ||
			(Array.isArray(q?.choices) &&
				q.choices.some((c) => c && typeof c === 'object' && ('text' in c || 'image_url' in c)))
	);
}
