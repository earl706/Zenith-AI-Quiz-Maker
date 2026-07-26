import { useCallback, useMemo, useState } from 'react';

import { api } from '../../lib/api';
import { toast } from '../../stores/toastStore';
import {
	applyAcceptedChanges,
	buildQuizSnapshot,
	buildReviewView,
	diffQuizProposal,
	mapProposedQuizData,
	summarizeDiff
} from './quizAiDiff';

/**
 * Proposal/review state for AI generate + revise accept/reject.
 *
 * @param {{ getDraft: () => { questions, sections, quizTitle?, randomChoices? }, onCommit: (draft) => void, onQuizTitle?: (title: string) => void }} options
 */
export function useQuizAiProposal({ getDraft, onCommit, onQuizTitle }) {
	const [status, setStatus] = useState('idle'); // idle | loading | review | error
	const [error, setError] = useState('');
	const [instruction, setInstruction] = useState('');
	const [baseline, setBaseline] = useState(null);
	const [proposed, setProposed] = useState(null);
	const [decisions, setDecisions] = useState({});
	const [proposedTitle, setProposedTitle] = useState('');

	const isReviewing = status === 'review';
	const isLoading = status === 'loading';

	const view = useMemo(() => {
		if (!baseline || !proposed) {
			return null;
		}
		return buildReviewView(baseline, proposed, decisions);
	}, [baseline, proposed, decisions]);

	const pendingCount = view?.pendingKeys?.length ?? 0;
	const summaryLabel = summarizeDiff(view?.summary);

	const startProposal = useCallback(
		(quizData, { instructionText = '', replaceTitle = false } = {}) => {
			const draft = getDraft();
			const randomChoices = !!draft.randomChoices;
			const mapped = mapProposedQuizData(quizData, randomChoices);
			const nextBaseline = {
				questions: draft.questions || [],
				sections: draft.sections || []
			};
			const nextProposed = {
				questions: mapped.questions,
				sections: mapped.sections
			};

			const diff = diffQuizProposal(nextBaseline, nextProposed);
			const hasChanges =
				diff.summary.questionsAdded +
					diff.summary.questionsModified +
					diff.summary.questionsRemoved +
					diff.summary.sectionsAdded +
					diff.summary.sectionsModified +
					diff.summary.sectionsRemoved >
				0;

			if (!hasChanges) {
				toast.info('AI returned no changes.');
				setStatus('idle');
				return false;
			}

			setBaseline(nextBaseline);
			setProposed(nextProposed);
			setDecisions({});
			setInstruction(instructionText);
			setProposedTitle(mapped.quizTitle || '');
			setError('');
			setStatus('review');
			if (replaceTitle && mapped.quizTitle && onQuizTitle) {
				// Title applied only on accept-all / finalize — stash for commit
			}
			return true;
		},
		[getDraft, onQuizTitle]
	);

	const commitWithDecisions = useCallback(
		(nextDecisions, { acceptRemaining = false, rejectRemaining = false } = {}) => {
			if (!baseline || !proposed) return;
			const diff = diffQuizProposal(baseline, proposed);
			const finalized = { ...nextDecisions };
			for (const d of [...diff.questions, ...diff.sections]) {
				if (d.kind === 'unchanged') continue;
				if (finalized[d.key] != null) continue;
				if (acceptRemaining) finalized[d.key] = 'accept';
				else if (rejectRemaining) finalized[d.key] = 'reject';
				else finalized[d.key] = 'reject';
			}
			const result = applyAcceptedChanges(baseline, proposed, finalized);
			onCommit(result);
			if (proposedTitle && onQuizTitle) {
				const titleChanged = acceptRemaining || Object.values(finalized).includes('accept');
				if (titleChanged && proposedTitle.trim()) {
					// Only apply title when at least one accept happened and title provided
					const anyAccept = Object.values(finalized).some((v) => v === 'accept');
					if (anyAccept) onQuizTitle(proposedTitle);
				}
			}
			setBaseline(null);
			setProposed(null);
			setDecisions({});
			setInstruction('');
			setProposedTitle('');
			setStatus('idle');
			setError('');
		},
		[baseline, proposed, onCommit, onQuizTitle, proposedTitle]
	);

	const accept = useCallback((key) => {
		setDecisions((prev) => ({ ...prev, [key]: 'accept' }));
	}, []);

	const reject = useCallback((key) => {
		setDecisions((prev) => ({ ...prev, [key]: 'reject' }));
	}, []);

	const acceptAll = useCallback(() => {
		commitWithDecisions(decisions, { acceptRemaining: true });
		toast.success('Accepted AI changes.');
	}, [commitWithDecisions, decisions]);

	const rejectAll = useCallback(() => {
		commitWithDecisions({}, { rejectRemaining: true });
		toast.info('Rejected AI changes.');
	}, [commitWithDecisions]);

	const done = useCallback(() => {
		// Accept remaining pending, keep prior decisions
		commitWithDecisions(decisions, { acceptRemaining: true });
		toast.success('Applied AI review.');
	}, [commitWithDecisions, decisions]);

	const dismiss = useCallback(() => {
		commitWithDecisions(decisions, { rejectRemaining: true });
	}, [commitWithDecisions, decisions]);

	const runRevise = useCallback(
		async (instructionText, model) => {
			const text = String(instructionText || '').trim();
			if (!text) {
				toast.error('Enter an instruction for the AI.');
				return false;
			}
			const draft = getDraft();
			if (!draft.questions?.length) {
				toast.error('Add at least one question before revising with AI.');
				return false;
			}

			setStatus('loading');
			setError('');
			try {
				const body = {
					instruction: text,
					quiz: buildQuizSnapshot(draft.questions, draft.sections, {
						quizTitle: draft.quizTitle
					})
				};
				if (model) body.model = model;
				const { data } = await api.post('/quizzes/quiz/ai/revise/', body, {
					timeout: 600_000
				});
				const quizData = data?.quiz_data;
				if (!quizData?.questions?.length) {
					setStatus('idle');
					toast.error('AI returned an empty quiz.');
					return false;
				}
				const started = startProposal(quizData, { instructionText: text });
				if (!started) setStatus('idle');
				return started;
			} catch (err) {
				const message =
					err?.response?.data?.error || err?.response?.data?.detail || 'Failed to revise quiz.';
				setError(message);
				setStatus('error');
				toast.error(message);
				return false;
			}
		},
		[getDraft, startProposal]
	);

	const runGenerateAsProposal = useCallback(
		(quizData, { instructionText = 'AI generate' } = {}) => {
			return startProposal(quizData, { instructionText });
		},
		[startProposal]
	);

	const metaFor = useCallback(
		(key) => {
			if (!view?.metaByKey) return null;
			return view.metaByKey[String(key)] || null;
		},
		[view]
	);

	return {
		status,
		error,
		isReviewing,
		isLoading,
		instruction,
		view,
		pendingCount,
		summaryLabel,
		accept,
		reject,
		acceptAll,
		rejectAll,
		done,
		dismiss,
		runRevise,
		runGenerateAsProposal,
		metaFor,
		displayQuestions: view?.questions,
		displaySections: view?.sections
	};
}
