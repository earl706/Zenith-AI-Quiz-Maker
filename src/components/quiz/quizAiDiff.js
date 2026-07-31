import { createSection, createSectionKey, applyGeneratedSections } from './quizHelpers';

let aiIdCounter = 0;

export function createAiQuestionId() {
	aiIdCounter += 1;
	return `new-${Date.now()}-${aiIdCounter}`;
}

/**
 * Map API/AI question payload into authoring question shape.
 * Prefers clientId / numeric db id for continuity.
 */
export function mapAiQuestion(question, index, randomChoices = false) {
	const identification = !!question?.identification;
	const rawChoices = Array.isArray(question?.choices) ? question.choices : [];
	let choices = rawChoices.map((choice) => String(choice));
	let correctAnswerIndex =
		typeof question?.correctAnswerIndex === 'number' ? question.correctAnswerIndex : 0;

	if (identification) {
		const answer = choices[correctAnswerIndex] ?? question?.correctAnswer ?? choices[0] ?? '';
		choices = [String(answer)];
		correctAnswerIndex = 0;
	} else {
		if (choices.length === 0) choices = ['', '', '', ''];
		while (choices.length < 4) choices.push('');
		choices = choices.slice(0, 4);
		correctAnswerIndex = Math.max(0, Math.min(correctAnswerIndex, choices.length - 1));
	}

	const clientId = question?.clientId ?? question?.client_id;
	const dbId = question?.id;
	let id;
	if (typeof dbId === 'number') {
		id = dbId;
	} else if (typeof dbId === 'string' && /^\d+$/.test(dbId)) {
		id = Number(dbId);
	} else if (clientId != null && String(clientId).trim() !== '') {
		const cid = String(clientId).trim();
		if (cid.startsWith('new-')) {
			id = cid;
		} else if (/^\d+$/.test(cid)) {
			id = Number(cid);
		} else {
			id = cid;
		}
	} else {
		id = createAiQuestionId();
	}

	return {
		id,
		title: question?.title || '',
		choices,
		choiceImages: new Array(choices.length).fill(null),
		choiceImagePreviews: new Array(choices.length).fill(null),
		correctAnswerIndex,
		mathematical: !!question?.mathematical,
		identification,
		randomChoices: question?.randomChoices ?? randomChoices,
		hasChoiceImages: false,
		showChoiceImages: false,
		question_image: null,
		question_image_preview: null,
		explanation: question?.explanation || '',
		workedSolution: question?.workedSolution ?? question?.worked_solution ?? '',
		sourceCitation: question?.sourceCitation ?? question?.source_citation ?? '',
		sectionKey: question?.sectionKey ?? null
	};
}

/** Build API snapshot for POST /quizzes/quiz/ai/revise/. */
export function buildQuizSnapshot(questions, sections, meta = {}) {
	return {
		quiz_title: meta.quizTitle || meta.quiz_title || '',
		sections: (sections || []).map((sec, index) => ({
			clientKey: sec.clientKey,
			...(sec.id != null ? { id: sec.id } : {}),
			title: sec.title || `Section ${index + 1}`,
			order: sec.order ?? index
		})),
		questions: (questions || []).map((q, index) => ({
			clientId: String(q.id),
			...(typeof q.id === 'number' ? { id: q.id } : {}),
			title: q.title || `Question ${index + 1}`,
			choices: Array.isArray(q.choices) ? q.choices.map((c) => String(c)) : [],
			correctAnswerIndex: q.correctAnswerIndex ?? 0,
			mathematical: !!q.mathematical,
			identification: !!q.identification,
			randomChoices: !!q.randomChoices,
			explanation: q.explanation || '',
			workedSolution: q.workedSolution || '',
			sourceCitation: q.sourceCitation || '',
			sectionKey: q.sectionKey || null
		}))
	};
}

function questionKey(q) {
	return String(q?.id ?? '');
}

function sectionKey(s) {
	return String(s?.clientKey ?? '');
}

function choicesEqual(a, b) {
	const left = Array.isArray(a) ? a : [];
	const right = Array.isArray(b) ? b : [];
	if (left.length !== right.length) return false;
	return left.every((c, i) => String(c) === String(right[i]));
}

function questionContentEqual(a, b) {
	if (!a || !b) return false;
	return (
		String(a.title || '') === String(b.title || '') &&
		!!a.mathematical === !!b.mathematical &&
		!!a.identification === !!b.identification &&
		(a.correctAnswerIndex ?? 0) === (b.correctAnswerIndex ?? 0) &&
		String(a.explanation || '') === String(b.explanation || '') &&
		String(a.workedSolution || '') === String(b.workedSolution || '') &&
		String(a.sourceCitation || '') === String(b.sourceCitation || '') &&
		String(a.sectionKey || '') === String(b.sectionKey || '') &&
		choicesEqual(a.choices, b.choices)
	);
}

function sectionContentEqual(a, b) {
	if (!a || !b) return false;
	return String(a.title || '') === String(b.title || '') && (a.order ?? 0) === (b.order ?? 0);
}

/**
 * Diff baseline vs proposed authoring states.
 * Returns { questions: DiffItem[], sections: DiffItem[], summary }
 * DiffItem: { key, kind: 'unchanged'|'added'|'modified'|'removed', baseline?, proposed? }
 */
export function diffQuizProposal(baseline, proposed) {
	const baseQuestions = baseline?.questions || [];
	const propQuestions = proposed?.questions || [];
	const baseSections = baseline?.sections || [];
	const propSections = proposed?.sections || [];

	const baseQ = new Map(baseQuestions.map((q) => [questionKey(q), q]));
	const baseS = new Map(baseSections.map((s) => [sectionKey(s), s]));

	const questionDiffs = [];
	const seenQ = new Set();

	for (const q of propQuestions) {
		const key = questionKey(q);
		seenQ.add(key);
		const prior = baseQ.get(key);
		if (!prior) {
			questionDiffs.push({ key, kind: 'added', proposed: q });
		} else if (questionContentEqual(prior, q)) {
			questionDiffs.push({ key, kind: 'unchanged', baseline: prior, proposed: q });
		} else {
			questionDiffs.push({ key, kind: 'modified', baseline: prior, proposed: q });
		}
	}
	for (const q of baseQuestions) {
		const key = questionKey(q);
		if (seenQ.has(key)) continue;
		questionDiffs.push({ key, kind: 'removed', baseline: q });
	}

	const sectionDiffs = [];
	const seenS = new Set();
	for (const s of propSections) {
		const key = sectionKey(s);
		seenS.add(key);
		const prior = baseS.get(key);
		if (!prior) {
			sectionDiffs.push({ key, kind: 'added', proposed: s });
		} else if (sectionContentEqual(prior, s)) {
			sectionDiffs.push({ key, kind: 'unchanged', baseline: prior, proposed: s });
		} else {
			sectionDiffs.push({ key, kind: 'modified', baseline: prior, proposed: s });
		}
	}
	for (const s of baseSections) {
		const key = sectionKey(s);
		if (seenS.has(key)) continue;
		sectionDiffs.push({ key, kind: 'removed', baseline: s });
	}

	const summary = {
		questionsAdded: questionDiffs.filter((d) => d.kind === 'added').length,
		questionsModified: questionDiffs.filter((d) => d.kind === 'modified').length,
		questionsRemoved: questionDiffs.filter((d) => d.kind === 'removed').length,
		sectionsAdded: sectionDiffs.filter((d) => d.kind === 'added').length,
		sectionsModified: sectionDiffs.filter((d) => d.kind === 'modified').length,
		sectionsRemoved: sectionDiffs.filter((d) => d.kind === 'removed').length
	};

	return { questions: questionDiffs, sections: sectionDiffs, summary };
}

function preserveImages(baselineQ, proposedQ) {
	if (!baselineQ || !proposedQ) return proposedQ;
	const sameChoiceCount = (baselineQ.choices || []).length === (proposedQ.choices || []).length;
	const next = {
		...proposedQ,
		question_image: baselineQ.question_image,
		question_image_preview: baselineQ.question_image_preview
	};
	if (sameChoiceCount && choicesEqual(baselineQ.choices, proposedQ.choices)) {
		next.choiceImages = [...(baselineQ.choiceImages || [])];
		next.choiceImagePreviews = [...(baselineQ.choiceImagePreviews || [])];
		next.hasChoiceImages = !!baselineQ.hasChoiceImages;
		next.showChoiceImages = !!baselineQ.showChoiceImages;
	} else if (sameChoiceCount) {
		next.choiceImages = [...(baselineQ.choiceImages || [])];
		next.choiceImagePreviews = [...(baselineQ.choiceImagePreviews || [])];
		next.hasChoiceImages = !!baselineQ.hasChoiceImages;
		next.showChoiceImages = !!baselineQ.showChoiceImages;
	} else {
		next.choiceImages = new Array((proposedQ.choices || []).length).fill(null);
		next.choiceImagePreviews = new Array((proposedQ.choices || []).length).fill(null);
		next.hasChoiceImages = false;
		next.showChoiceImages = false;
	}
	return next;
}

function mergeProposedQuestion(baselineQ, proposedQ) {
	if (!baselineQ) return proposedQ;
	const merged = preserveImages(baselineQ, proposedQ);
	// Preserve numeric DB id when the AI kept the same client continuity.
	if (typeof baselineQ.id === 'number') {
		merged.id = baselineQ.id;
	}
	return merged;
}

function mergeProposedSection(baselineS, proposedS) {
	if (!baselineS) {
		return {
			...proposedS,
			clientKey: proposedS.clientKey || createSectionKey(),
			id: null
		};
	}
	return {
		...baselineS,
		title: proposedS.title,
		order: proposedS.order ?? baselineS.order,
		clientKey: baselineS.clientKey,
		id: baselineS.id
	};
}

/**
 * Build the review view of questions/sections given per-key decisions.
 * decisions: Record<key, 'accept' | 'reject'> — missing means pending.
 * Pending modified/added show proposed; pending removed show strikethrough baseline.
 */
export function buildReviewView(baseline, proposed, decisions = {}) {
	const diff = diffQuizProposal(baseline, proposed);
	const questions = [];
	const metaByKey = {};

	for (const item of diff.questions) {
		const decision = decisions[item.key];
		const status = item.kind === 'unchanged' ? 'unchanged' : decision || 'pending';
		metaByKey[item.key] = { kind: item.kind, status, priorTitle: item.baseline?.title };

		if (item.kind === 'unchanged') {
			questions.push(item.baseline);
			continue;
		}
		if (item.kind === 'added') {
			if (decision === 'reject') continue;
			questions.push({ ...item.proposed, _reviewKind: 'added', _reviewStatus: status });
			continue;
		}
		if (item.kind === 'modified') {
			if (decision === 'reject') {
				questions.push(item.baseline);
			} else {
				questions.push({
					...mergeProposedQuestion(item.baseline, item.proposed),
					_reviewKind: 'modified',
					_reviewStatus: status,
					_priorTitle: item.baseline?.title
				});
			}
			continue;
		}
		if (item.kind === 'removed') {
			if (decision === 'accept') continue;
			questions.push({
				...item.baseline,
				_reviewKind: 'removed',
				_reviewStatus: status
			});
		}
	}

	const sections = [];
	for (const item of diff.sections) {
		const decision = decisions[item.key];
		const status = item.kind === 'unchanged' ? 'unchanged' : decision || 'pending';
		metaByKey[item.key] = {
			...(metaByKey[item.key] || {}),
			kind: item.kind,
			status,
			isSection: true
		};

		if (item.kind === 'unchanged') {
			sections.push(item.baseline);
			continue;
		}
		if (item.kind === 'added') {
			if (decision === 'reject') continue;
			sections.push({ ...item.proposed, _reviewKind: 'added', _reviewStatus: status });
			continue;
		}
		if (item.kind === 'modified') {
			if (decision === 'reject') {
				sections.push(item.baseline);
			} else {
				sections.push({
					...mergeProposedSection(item.baseline, item.proposed),
					_reviewKind: 'modified',
					_reviewStatus: status
				});
			}
			continue;
		}
		if (item.kind === 'removed') {
			if (decision === 'accept') continue;
			sections.push({
				...item.baseline,
				_reviewKind: 'removed',
				_reviewStatus: status
			});
		}
	}

	const pendingKeys = [
		...diff.questions.filter((d) => d.kind !== 'unchanged' && !decisions[d.key]).map((d) => d.key),
		...diff.sections.filter((d) => d.kind !== 'unchanged' && !decisions[d.key]).map((d) => d.key)
	];

	return {
		questions,
		sections,
		metaByKey,
		diff,
		pendingKeys,
		summary: diff.summary
	};
}

/** Finalize accepted/rejected decisions into a clean authoring draft (no _review* fields). */
/** Finalize decisions into a clean authoring draft (no _review* fields). Missing decisions default to reject. */
export function applyAcceptedChanges(baseline, proposed, decisions = {}) {
	const diff = diffQuizProposal(baseline, proposed);
	const finalized = { ...decisions };
	for (const d of [...diff.questions, ...diff.sections]) {
		if (d.kind !== 'unchanged' && finalized[d.key] == null) {
			finalized[d.key] = 'reject';
		}
	}

	const view = buildReviewView(baseline, proposed, finalized);

	const strip = (item) => {
		const next = { ...item };
		delete next._reviewKind;
		delete next._reviewStatus;
		delete next._priorTitle;
		return next;
	};

	return {
		questions: view.questions.map(strip),
		sections: view.sections.map(strip).map((s, order) => ({ ...s, order }))
	};
}

/** Map generate/revise quiz_data into authoring shape, preserving section clientKeys when present. */
export function mapProposedQuizData(quizData, randomChoices = false) {
	const questionsRaw = Array.isArray(quizData?.questions) ? quizData.questions : [];
	const sectionsRaw = Array.isArray(quizData?.sections) ? quizData.sections : [];

	if (!questionsRaw.length) {
		return { sections: [], questions: [], quizTitle: quizData?.quiz_title || '' };
	}

	const hasClientKeys = sectionsRaw.some((s) => s?.clientKey || s?.client_key);
	if (!hasClientKeys) {
		const mapped = applyGeneratedSections(quizData, (q, i) => mapAiQuestion(q, i, randomChoices));
		return { ...mapped, quizTitle: quizData?.quiz_title || '' };
	}

	const sections = sectionsRaw.map((sec, index) =>
		createSection({
			clientKey: sec.clientKey || sec.client_key || createSectionKey(),
			id: sec.id ?? null,
			title: sec.title || `Section ${index + 1}`,
			order: sec.order ?? index
		})
	);
	const keySet = new Set(sections.map((s) => s.clientKey));

	const questions = questionsRaw.map((q, i) => {
		const mapped = mapAiQuestion(q, i, randomChoices);
		let sectionKey = q.sectionKey || q.section_key || null;
		if (sectionKey && !keySet.has(sectionKey)) {
			const idx =
				typeof q.sectionIndex === 'number'
					? q.sectionIndex
					: sections.findIndex(
							(s) => s.title.toLowerCase() === String(q.section || '').toLowerCase()
						);
			sectionKey =
				idx >= 0 && idx < sections.length
					? sections[idx].clientKey
					: sections[0]?.clientKey || null;
		}
		if (!sections.length) sectionKey = null;
		return { ...mapped, sectionKey };
	});

	return { sections, questions, quizTitle: quizData?.quiz_title || '' };
}

export function summarizeDiff(summary) {
	if (!summary) return '';
	const parts = [];
	const qAdd = summary.questionsAdded || 0;
	const qMod = summary.questionsModified || 0;
	const qRem = summary.questionsRemoved || 0;
	const sAdd = summary.sectionsAdded || 0;
	const sMod = summary.sectionsModified || 0;
	const sRem = summary.sectionsRemoved || 0;
	if (qAdd) parts.push(`+${qAdd}`);
	if (qMod) parts.push(`~${qMod}`);
	if (qRem) parts.push(`−${qRem}`);
	const qPart = parts.length ? `Questions ${parts.join(' ')}` : null;
	const sParts = [];
	if (sAdd) sParts.push(`+${sAdd}`);
	if (sMod) sParts.push(`~${sMod}`);
	if (sRem) sParts.push(`−${sRem}`);
	const sPart = sParts.length ? `Sections ${sParts.join(' ')}` : null;
	return [qPart, sPart].filter(Boolean).join(' · ') || 'No changes';
}

export function reviewCardClassName(meta) {
	if (!meta || meta.kind === 'unchanged') return '';
	if (meta.kind === 'added') return 'ring-success/40 ring-2';
	if (meta.kind === 'modified') return 'ring-warning/40 ring-2';
	if (meta.kind === 'removed') return 'ring-danger/30 ring-2 opacity-70';
	return '';
}
