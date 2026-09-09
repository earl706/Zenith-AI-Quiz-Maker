import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Target } from 'lucide-react';

import { api } from '../lib/api';
import {
	purgeStaleAttemptDrafts,
	readAttemptDraft,
	removeAttemptDraft,
	removeActiveAttemptDraft,
	slimAttemptDraftPayload,
	writeAttemptDraft
} from '../lib/attemptDraftStorage';
import { toast } from '../stores/toastStore';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, Button, LoadingScreen, Modal } from '../components/ui';
import QuestionCard from '../components/quiz/QuestionCard';
import FlashcardAttempt from '../components/quiz/FlashcardAttempt';
import QuizResultReview from '../components/quiz/QuizResultReview';
import AttemptStatusPanel from '../components/quiz/AttemptStatusPanel';
import { PersistedQuizSettingsModal } from '../components/quiz/QuizSettingsModal';
import QuizQuestionListLayout from '../components/quiz/QuizQuestionListLayout';
import { useAttemptLauncher } from '../components/quiz/useAttemptLauncher';
import {
	QUESTION_LAYOUT_SECTION,
	useQuestionDisplayLayout,
	useSectionPageIndex
} from '../components/quiz/useQuestionDisplayLayout';
import { tryFocusMathField } from '../components/quiz/MathFieldInput';
import {
	answersById,
	buildAnswerRecords,
	canUseSectionQuestionLayout,
	countAnswered,
	extractSubmitError,
	groupQuestionsByApiSection,
	identificationAnswerCorpus,
	isIdentification,
	isSequence,
	isSequenceBlankControl,
	parseAttemptScopeFromSearch,
	formatAttemptScopeLabel,
	pickRandomQuestions,
	scrollAttemptElementToCenter,
	serializeAnswersForSubmit,
	shuffleArray,
	sortQuestionsBySectionOrder,
	ADVANCE_DELAY_CORRECT_MS,
	ADVANCE_DELAY_WRONG_MS
} from '../components/quiz/quizHelpers';

/** After checking an answer in list mode: 0.5s if fully correct, else 5s. */

function parseQuizPayload(data) {
	const quizData = data.data || data;
	const questions = data.questions || quizData.questions || [];
	return { quizData, questions };
}

function masterySettingsFailures(roadmapProgress) {
	const deltas = roadmapProgress?.roadmap?.nodes_delta || [];
	const keys = new Set();
	for (const delta of deltas) {
		if (delta?.outcome !== 'settings_not_met') continue;
		for (const key of delta.settings_failures || []) {
			if (key) keys.add(key);
		}
	}
	return [...keys];
}

function preferSettingsFromFailures(failures) {
	if (!failures?.length) return null;
	const prefer = {};
	if (failures.includes('flashcard')) prefer.flashcard = true;
	if (failures.includes('random_question_order')) prefer.random_question_order = true;
	if (failures.includes('per_question_timer')) prefer.per_question_timer = true;
	return Object.keys(prefer).length ? prefer : null;
}

function retakeSettingsHint(roadmapProgress, failures) {
	if (!roadmapProgress?.roadmap && !roadmapProgress?.can_create) return null;
	const labels = [];
	if (failures.includes('flashcard')) labels.push('flashcard');
	if (failures.includes('random_question_order')) labels.push('shuffle questions');
	if (failures.includes('per_question_timer')) labels.push('per-question timer');
	if (labels.length) {
		return `This attempt didn’t count for mastery — enable ${labels.join(', ')}, save, then continue to retake.`;
	}
	if (roadmapProgress?.roadmap) {
		return 'Mastery only counts when quiz settings match this roadmap’s gates (flashcard, shuffle questions, and/or per-question timer). Save, then continue to retake.';
	}
	return 'Save quiz settings, then choose how to start your next attempt.';
}

function mergeQuizAfterSettingsSave(quiz, payload, id) {
	const next = {
		...quiz,
		uuid: quiz?.uuid || id,
		quiz_title: payload.quiz_title ?? quiz?.quiz_title,
		tag_color: payload.tag_color ?? quiz?.tag_color,
		flashcard_quiz: !!payload.flashcard_quiz,
		random_question_order: !!payload.random_question_order,
		per_question_timer_enabled: !!payload.per_question_timer_enabled,
		per_question_time_seconds: payload.per_question_time_seconds ?? quiz?.per_question_time_seconds,
		answer_suggestions_enabled:
			payload.answer_suggestions_enabled ?? quiz?.answer_suggestions_enabled
	};
	if ('quiz_image' in payload || 'quiz_image_url' in payload) {
		if (payload.quiz_image) {
			next.quiz_image = payload.quiz_image;
			next.quiz_image_url = '';
		} else if (payload.quiz_image_url) {
			next.quiz_image = payload.quiz_image_url;
			next.quiz_image_url = payload.quiz_image_url;
		} else {
			next.quiz_image = null;
			next.quiz_image_url = '';
		}
	}
	return next;
}

function focusAttemptControl(el) {
	if (!el) return;
	const tag = el.tagName?.toLowerCase?.();
	if (tag === 'math-field') {
		tryFocusMathField(el, { preventScroll: true });
	} else {
		el.focus?.({ preventScroll: true });
	}
}

function orderQuestionsByIds(questions, questionIds) {
	const byId = new Map((questions || []).map((q) => [q.id, q]));
	const ordered = [];
	for (const id of questionIds || []) {
		const q = byId.get(id);
		if (q) ordered.push(q);
	}
	return ordered;
}

function mergeAnswersFromDraft(questions, draftAnswers) {
	const base = buildAnswerRecords(questions);
	const byId = new Map((draftAnswers || []).map((a) => [a.id, a]));
	return base.map((row) => {
		const saved = byId.get(row.id);
		return saved ? { ...row, ...saved, id: row.id } : row;
	});
}

export default function QuizAttempt() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();
	const scope = useMemo(() => parseAttemptScopeFromSearch(location.search), [location.search]);
	const launchKey = location.state?.attemptLaunchAt;
	const { launchAttempt, attemptModal } = useAttemptLauncher();

	const [time, setTime] = useState(0);
	const [isRunning, setIsRunning] = useState(true);
	const [paused, setPaused] = useState(false);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [submittedAnswers, setSubmittedAnswers] = useState([]);
	const [questions, setQuestions] = useState([]);
	const [score, setScore] = useState(0);
	const [accuracy, setAccuracy] = useState(0);
	const [sectionScores, setSectionScores] = useState([]);
	const [roadmapProgress, setRoadmapProgress] = useState(null);
	const [quizResults, setQuizResults] = useState(false);
	const [retakeSettingsOpen, setRetakeSettingsOpen] = useState(false);
	const [resumePromptOpen, setResumePromptOpen] = useState(false);
	const [pendingDraft, setPendingDraft] = useState(null);
	const [flashcardDraft, setFlashcardDraft] = useState(null);
	const [answers, setAnswers] = useState([]);
	const answersRef = useRef([]);
	const commitAnswers = useCallback((updater) => {
		setAnswers((prev) => {
			const next = typeof updater === 'function' ? updater(prev) : updater;
			answersRef.current = next;
			return next;
		});
	}, []);
	const [quizData, setQuizData] = useState({
		quiz_title: '',
		flashcard_quiz: false,
		quiz_image: null,
		per_question_timer_enabled: false,
		per_question_time_seconds: 30,
		answer_suggestions_enabled: true
	});
	const [questionPoolSize, setQuestionPoolSize] = useState(null);

	const answersMap = useMemo(() => answersById(answers), [answers]);
	const answeredCount = useMemo(() => countAnswered(answers, questions), [answers, questions]);
	const suggestionCorpus = useMemo(() => identificationAnswerCorpus(questions), [questions]);
	const firstIdentificationId = useMemo(() => {
		const match = questions.find(
			(q) => isIdentification(q.question_type) || isSequence(q.question_type)
		);
		return match?.id ?? null;
	}, [questions]);
	const [questionLayout, setQuestionLayout] = useQuestionDisplayLayout();

	const sections = quizData.sections || [];
	const sectionGroups = useMemo(
		() => groupQuestionsByApiSection(questions, sections),
		[questions, sections]
	);
	const sectionLayoutAvailable = canUseSectionQuestionLayout(sections) && sectionGroups.length >= 2;
	const [sectionPage, setSectionPage] = useSectionPageIndex(sectionGroups);
	const visibleQuestions = useMemo(() => {
		if (questionLayout === QUESTION_LAYOUT_SECTION && sectionLayoutAvailable) {
			return sectionGroups[sectionPage]?.questions ?? [];
		}
		return questions;
	}, [questionLayout, sectionLayoutAvailable, sectionGroups, sectionPage, questions]);

	const inputRefs = useRef(new Map());
	const cardRefs = useRef(new Map());
	const submitButtonRef = useRef(null);
	const focusAdvanceTimer = useRef(null);
	const visibleQuestionsRef = useRef(visibleQuestions);
	const attemptSnapshotRef = useRef(null);
	const abandonDraftPersistRef = useRef(false);
	visibleQuestionsRef.current = visibleQuestions;

	const handleFlashcardDraftChange = useCallback((next) => {
		setFlashcardDraft(next);
	}, []);

	const registerInputRef = useCallback((questionId, el) => {
		if (el) inputRefs.current.set(questionId, el);
		else inputRefs.current.delete(questionId);
	}, []);

	const registerCardRef = useCallback((questionId, el) => {
		if (el) cardRefs.current.set(questionId, el);
		else cardRefs.current.delete(questionId);
	}, []);

	const focusQuestionCard = useCallback((questionId) => {
		const card = cardRefs.current.get(questionId);
		if (!card) return;

		const ideInput = inputRefs.current.get(questionId);
		if (ideInput && !ideInput.disabled) {
			focusAttemptControl(ideInput);
		} else {
			const nextControl = card.querySelector(
				'input:not([disabled]), textarea:not([disabled]), math-field:not([disabled]), button:not([disabled])'
			);
			focusAttemptControl(nextControl);
		}
		// Layout may still be settling (feedback block); center after paint.
		requestAnimationFrame(() => scrollAttemptElementToCenter(card));
	}, []);

	const handleListFocusCapture = useCallback((event) => {
		const card = event.target?.closest?.('[data-attempt-question-id]');
		if (!card || !event.currentTarget.contains(card)) return;
		// Sequence blank→blank (Tab/Enter): SequenceAnswerInput centers the input.
		const target = event.target;
		const related = event.relatedTarget;
		const seqRoot = target?.closest?.('[data-sequence-answer]');
		if (
			seqRoot &&
			card.contains(seqRoot) &&
			isSequenceBlankControl(target) &&
			related &&
			seqRoot.contains(related) &&
			isSequenceBlankControl(related)
		) {
			return;
		}
		scrollAttemptElementToCenter(card);
	}, []);

	const handleQuestionAnswered = useCallback(
		(questionId, fullyCorrect = false) => {
			if (focusAdvanceTimer.current) {
				clearTimeout(focusAdvanceTimer.current);
				focusAdvanceTimer.current = null;
			}
			const delay = fullyCorrect ? ADVANCE_DELAY_CORRECT_MS : ADVANCE_DELAY_WRONG_MS;
			focusAdvanceTimer.current = setTimeout(() => {
				focusAdvanceTimer.current = null;
				const visible = visibleQuestionsRef.current;
				const index = visible.findIndex((q) => q.id === questionId);
				const next = index >= 0 ? visible[index + 1] : undefined;
				if (next?.id != null) {
					focusQuestionCard(next.id);
				}
			}, delay);
		},
		[focusQuestionCard]
	);

	useEffect(
		() => () => {
			if (focusAdvanceTimer.current) clearTimeout(focusAdvanceTimer.current);
		},
		[]
	);

	const handleAnswerChange = useCallback(
		(qid, field, value) => {
			commitAnswers((prev) => prev.map((a) => (a.id === qid ? { ...a, [field]: value } : a)));
		},
		[commitAnswers]
	);

	const handleIdentificationAnswerChange = useCallback(
		(qid, value) => {
			commitAnswers((prev) => prev.map((a) => (a.id === qid ? { ...a, userAnswer: value } : a)));
		},
		[commitAnswers]
	);

	const handleSequenceChange = useCallback(
		(qid, userSequence) => {
			commitAnswers((prev) => prev.map((a) => (a.id === qid ? { ...a, userSequence } : a)));
		},
		[commitAnswers]
	);

	const handleChessMovesChange = useCallback(
		(qid, userChessMoves) => {
			commitAnswers((prev) => prev.map((a) => (a.id === qid ? { ...a, userChessMoves } : a)));
		},
		[commitAnswers]
	);

	const startAttempt = useCallback(async () => {
		try {
			await api.post(`/quizzes/quiz/attempt/${id}/`, {
				full_quiz: scope.fullQuiz,
				section_ids: scope.fullQuiz ? [] : scope.sectionIds,
				...(scope.sample ? { question_sample_size: scope.sample } : {})
			});
		} catch (err) {
			const message = err?.response?.data?.error;
			if (message) {
				toast.error(message);
			}
			// Attempt start is best-effort; scoring still uses submit payload.
		}
	}, [id, scope.fullQuiz, scope.sectionIds, scope.sample]);

	const applyDraftUi = useCallback(
		(draft, { quizData: nextQuiz, questions: nextQuestions }) => {
			setQuizData(nextQuiz);
			setQuestions(nextQuestions);
			const mergedAnswers = mergeAnswersFromDraft(nextQuestions, draft.answers);
			answersRef.current = mergedAnswers;
			setAnswers(mergedAnswers);
			setSubmittedAnswers([]);
			setScore(0);
			setAccuracy(0);
			setSectionScores([]);
			setRoadmapProgress(null);
			setQuizResults(false);
			setQuestionPoolSize(null);
			setTime(draft.time ?? 0);
			setPaused(true);
			setIsRunning(false);
			if (draft.questionLayout) {
				setQuestionLayout(draft.questionLayout);
			}
			if (typeof draft.sectionPage === 'number') {
				setSectionPage(draft.sectionPage);
			}
			const nextFlashcard = draft.flashcard
				? { ...draft.flashcard, restoreToken: Date.now() }
				: null;
			setFlashcardDraft(nextFlashcard);
		},
		[setQuestionLayout, setSectionPage]
	);

	const abandonAttemptDraft = useCallback(() => {
		abandonDraftPersistRef.current = true;
		removeAttemptDraft(id, scope);
	}, [id, scope]);

	const fetchQuizQuestions = useCallback(
		async (signal) => {
			const sectionQuery =
				!scope.fullQuiz && scope.sectionIds.length ? `&sections=${scope.sectionIds.join(',')}` : '';
			const response = await api
				.get(`/quizzes/quiz/${id}/?randomize=true${sectionQuery}`)
				.catch(() =>
					api.get(
						`/quizzes/quiz/${id}/${sectionQuery ? `?sections=${scope.sectionIds.join(',')}` : ''}`
					)
				);
			if (signal?.aborted) return null;
			return parseQuizPayload(response.data);
		},
		[id, scope.fullQuiz, scope.sectionIds]
	);

	const loadQuizFresh = useCallback(
		async (signal) => {
			abandonDraftPersistRef.current = false;
			removeActiveAttemptDraft();
			setLoading(true);
			try {
				const parsed = await fetchQuizQuestions(signal);
				if (!parsed || signal?.aborted) return;

				const { quizData: nextQuiz, questions: nextQuestions } = parsed;

				if (!scope.fullQuiz && scope.sectionIds.length && nextQuestions.length === 0) {
					toast.error('That section is not on this quiz.');
					navigate(`/quizzes/${id}`);
					return;
				}

				let scopedQuestions = nextQuestions;
				if (scope.sample) {
					const poolSize = nextQuestions.length;
					scopedQuestions = pickRandomQuestions(nextQuestions, scope.sample);
					if (nextQuiz.random_question_order || scope.shuffle) {
						scopedQuestions = shuffleArray(scopedQuestions);
					} else {
						scopedQuestions = sortQuestionsBySectionOrder(scopedQuestions, nextQuiz.sections || []);
					}
					setQuestionPoolSize(poolSize);
				} else if (scope.shuffle) {
					scopedQuestions = shuffleArray(nextQuestions);
					setQuestionPoolSize(null);
				} else if (!nextQuiz.random_question_order) {
					scopedQuestions = sortQuestionsBySectionOrder(nextQuestions, nextQuiz.sections || []);
					setQuestionPoolSize(null);
				} else {
					setQuestionPoolSize(null);
				}

				setQuizData(nextQuiz);
				setQuestions(scopedQuestions);
				const answerRecords = buildAnswerRecords(scopedQuestions);
				answersRef.current = answerRecords;
				setAnswers(answerRecords);
				setSubmittedAnswers([]);
				setScore(0);
				setAccuracy(0);
				setSectionScores([]);
				setRoadmapProgress(null);
				setQuizResults(false);
				setTime(0);
				setPaused(false);
				setIsRunning(true);
				setFlashcardDraft(null);
				if (!signal?.aborted) {
					await startAttempt();
				}
			} catch {
				if (signal?.aborted) return;
				toast.error('Could not load quiz.');
				navigate('/quizzes');
			} finally {
				if (!signal?.aborted) setLoading(false);
			}
		},
		[
			fetchQuizQuestions,
			id,
			navigate,
			scope.fullQuiz,
			scope.sectionIds,
			scope.shuffle,
			scope.sample,
			startAttempt
		]
	);

	const persistAttemptDraft = useCallback(
		(overrides = {}) => {
			if (abandonDraftPersistRef.current) return;
			const snap = attemptSnapshotRef.current;
			if (!snap?.active || snap.quizResults || !snap.questions?.length) return;
			try {
				writeAttemptDraft(
					id,
					scope,
					slimAttemptDraftPayload({
						quizData: snap.quizData,
						questions: snap.questions,
						answers: snap.answers,
						time: overrides.time ?? snap.time,
						paused: overrides.paused ?? snap.paused,
						questionLayout: snap.questionLayout,
						sectionPage: snap.sectionPage,
						flashcardDraft: overrides.flashcardDraft ?? snap.flashcardDraft,
						questionPoolSize: snap.questionPoolSize
					})
				);
			} catch {
				// Never crash the attempt UI over draft persistence.
			}
		},
		[id, scope]
	);

	useEffect(() => {
		attemptSnapshotRef.current = {
			active: !loading && !resumePromptOpen && !quizResults,
			quizData,
			questions,
			answers,
			time,
			paused,
			quizResults,
			questionLayout,
			sectionPage,
			flashcardDraft,
			questionPoolSize
		};
	}, [
		loading,
		resumePromptOpen,
		quizResults,
		quizData,
		questions,
		answers,
		time,
		paused,
		questionLayout,
		sectionPage,
		flashcardDraft,
		questionPoolSize
	]);

	useEffect(() => {
		if (loading || resumePromptOpen || quizResults || !questions.length) return;
		persistAttemptDraft();
	}, [
		loading,
		resumePromptOpen,
		quizResults,
		questions.length,
		answers,
		paused,
		questionLayout,
		sectionPage,
		flashcardDraft,
		persistAttemptDraft
	]);

	useEffect(
		() => () => {
			persistAttemptDraft({ paused: true, time: attemptSnapshotRef.current?.time });
		},
		[persistAttemptDraft]
	);

	useEffect(() => {
		purgeStaleAttemptDrafts();
		if (launchKey) {
			abandonAttemptDraft();
			setResumePromptOpen(false);
			setPendingDraft(null);
			const controller = new AbortController();
			loadQuizFresh(controller.signal);
			return () => controller.abort();
		}
		const draft = readAttemptDraft(id, scope);
		if (draft?.questionIds?.length) {
			setPendingDraft(draft);
			setResumePromptOpen(true);
			setLoading(false);
			return undefined;
		}
		if (draft) {
			// Unusable / legacy oversized draft — drop and start fresh.
			removeAttemptDraft(id, scope);
		}
		const controller = new AbortController();
		loadQuizFresh(controller.signal);
		return () => controller.abort();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- boot once per URL/scope/retake
	}, [id, scope.fullQuiz, scope.sectionIds.join(','), scope.shuffle, scope.sample, launchKey]);

	const handleResumeDraft = useCallback(async () => {
		if (!pendingDraft?.questionIds?.length) {
			setResumePromptOpen(false);
			setPendingDraft(null);
			loadQuizFresh(undefined);
			return;
		}
		setResumePromptOpen(false);
		setLoading(true);
		try {
			const parsed = await fetchQuizQuestions(undefined);
			if (!parsed) {
				toast.error('Could not resume attempt.');
				abandonAttemptDraft();
				await loadQuizFresh(undefined);
				return;
			}
			const ordered = orderQuestionsByIds(parsed.questions, pendingDraft.questionIds);
			if (ordered.length === 0) {
				toast.error('Saved attempt no longer matches this quiz.');
				abandonAttemptDraft();
				await loadQuizFresh(undefined);
				return;
			}
			abandonDraftPersistRef.current = false;
			applyDraftUi(pendingDraft, { quizData: parsed.quizData, questions: ordered });
			setQuestionPoolSize(
				typeof pendingDraft.questionPoolSize === 'number' ? pendingDraft.questionPoolSize : null
			);
			setPendingDraft(null);
		} catch {
			toast.error('Could not resume attempt.');
			abandonAttemptDraft();
			await loadQuizFresh(undefined);
		} finally {
			setLoading(false);
		}
	}, [
		pendingDraft,
		fetchQuizQuestions,
		applyDraftUi,
		abandonAttemptDraft,
		loadQuizFresh,
		id,
		scope
	]);

	const handleDiscardDraft = useCallback(() => {
		abandonAttemptDraft();
		setResumePromptOpen(false);
		setPendingDraft(null);
		setLoading(true);
		loadQuizFresh(undefined);
	}, [abandonAttemptDraft, loadQuizFresh]);

	useEffect(() => {
		if (!isRunning) return undefined;
		const interval = setInterval(() => setTime((t) => t + 1), 1000);
		return () => clearInterval(interval);
	}, [isRunning]);

	const submitAnswers = async () => {
		if (focusAdvanceTimer.current) {
			clearTimeout(focusAdvanceTimer.current);
			focusAdvanceTimer.current = null;
		}
		if (questions.length === 0) {
			toast.error('This quiz has no questions.');
			return;
		}
		try {
			setSubmitting(true);
			const currentAnswers = answersRef.current.length ? answersRef.current : answers;
			const payload = serializeAnswersForSubmit(currentAnswers);
			if (payload.length === 0) {
				toast.error('No answers to submit.');
				return;
			}
			const response = await api.post(`/quizzes/quiz/submit/${id}/`, {
				answers: payload,
				time
			});
			setSubmittedAnswers(
				currentAnswers.map((row) => ({
					...row,
					userAnswer: row.userAnswer ?? '',
					userSequence: row.userSequence ?? [],
					userChessMoves: row.userChessMoves ?? []
				}))
			);
			setScore(response.data?.score ?? 0);
			setAccuracy(response.data?.accuracy ?? 0);
			setSectionScores(response.data?.section_scores || []);
			setRoadmapProgress(response.data?.roadmap_progress || null);
			setQuizResults(true);
			setPaused(false);
			setIsRunning(false);
			abandonAttemptDraft();
			queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
		} catch (err) {
			toast.error(extractSubmitError(err));
		} finally {
			setSubmitting(false);
		}
	};

	const handlePause = () => {
		setPaused(true);
		setIsRunning(false);
		persistAttemptDraft({ paused: true, time });
	};

	const handleContinue = () => {
		setPaused(false);
		setIsRunning(true);
	};

	const handleRetake = () => {
		setRetakeSettingsOpen(true);
	};

	const handleRetakeSame = () => {
		abandonAttemptDraft();
		navigate(`${location.pathname}${location.search}`, {
			replace: true,
			state: { attemptLaunchAt: Date.now() }
		});
	};

	const handleRetakeSettingsSaved = (payload) => {
		abandonAttemptDraft();
		const nextQuiz = mergeQuizAfterSettingsSave(quizData, payload, id);
		setQuizData(nextQuiz);
		const launchQuiz = {
			...nextQuiz,
			uuid: nextQuiz.uuid || id,
			questions: nextQuiz.questions?.length ? nextQuiz.questions : questions
		};
		const initialSectionIds = scope.fullQuiz ? [] : scope.sectionIds;
		launchAttempt(launchQuiz, {
			initialSectionIds,
			highlightedSectionId:
				!scope.fullQuiz && scope.sectionIds.length === 1 ? scope.sectionIds[0] : undefined,
			presetHint: 'Pre-selected from your last attempt — you can change the selection below.'
		});
	};

	const settingsFailures = useMemo(
		() => masterySettingsFailures(roadmapProgress),
		[roadmapProgress]
	);
	const retakePreferSettings = useMemo(
		() => preferSettingsFromFailures(settingsFailures),
		[settingsFailures]
	);
	const retakeHint = useMemo(
		() => retakeSettingsHint(roadmapProgress, settingsFailures),
		[roadmapProgress, settingsFailures]
	);
	const settingsQuiz = useMemo(
		() => ({
			...quizData,
			uuid: quizData.uuid || id,
			questions:
				Array.isArray(quizData.questions) && quizData.questions.length
					? quizData.questions
					: questions
		}),
		[quizData, questions, id]
	);

	if (loading && !resumePromptOpen) {
		return (
			<>
				{attemptModal}
				<LoadingScreen />
			</>
		);
	}

	if (resumePromptOpen) {
		return (
			<>
				{attemptModal}
				<Modal
					open
					onClose={handleDiscardDraft}
					title="Resume paused attempt?"
					size="sm"
					footer={
						<>
							<Button variant="secondary" className="cursor-pointer" onClick={handleDiscardDraft}>
								Discard & restart
							</Button>
							<Button className="cursor-pointer" onClick={handleResumeDraft}>
								Resume
							</Button>
						</>
					}
				>
					<p className="text-muted text-sm">
						You have a saved attempt for this quiz. Resume where you left off, or discard it and
						start fresh.
					</p>
				</Modal>
			</>
		);
	}

	const modeLabel = quizData.flashcard_quiz ? 'Flashcard' : 'List';
	const scopeLabel = formatAttemptScopeLabel({
		scope,
		sections: quizData.sections,
		questionCount: questions.length,
		questionPoolSize
	});

	return (
		<div>
			{attemptModal}
			<PersistedQuizSettingsModal
				quiz={settingsQuiz}
				open={retakeSettingsOpen}
				onClose={() => setRetakeSettingsOpen(false)}
				onSaved={handleRetakeSettingsSaved}
				title="Adjust settings to retake"
				hint={retakeHint}
				submitLabel="Save & continue"
				preferSettings={retakePreferSettings}
			/>
			<Modal
				open={paused}
				onClose={handleContinue}
				title="Quiz paused"
				size="sm"
				footer={
					<Button className="cursor-pointer" onClick={handleContinue}>
						Continue
					</Button>
				}
			>
				<p className="text-muted text-sm">
					Questions are hidden. Click Continue when you are ready to resume.
				</p>
			</Modal>
			<PageHeader
				title={quizData.quiz_title || 'Quiz attempt'}
				icon={Target}
				description={quizResults ? 'Review your answers' : 'Answer each question, then submit'}
				actions={
					<div className="flex flex-wrap gap-1.5">
						<Badge tone="primary">{modeLabel}</Badge>
						{(quizData.sections?.length > 0 || !scope.fullQuiz || scope.sample) && (
							<Badge tone="accent">{scopeLabel}</Badge>
						)}
					</div>
				}
			/>

			<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
				<div className="min-w-0 flex-1">
					{quizResults ? (
						<QuizResultReview
							questions={questions}
							sections={quizData.sections || []}
							submittedAnswers={submittedAnswers}
							score={score}
							accuracy={accuracy}
							time={time}
							sectionScores={sectionScores}
							roadmapProgress={roadmapProgress}
							quiz={quizData.uuid || id ? { ...quizData, uuid: quizData.uuid || id } : null}
							onRoadmapCreated={setRoadmapProgress}
						/>
					) : quizData.flashcard_quiz ? (
						<FlashcardAttempt
							questions={questions}
							answersByIdMap={answersMap}
							onAnswerChange={handleAnswerChange}
							onIdentificationChange={handleIdentificationAnswerChange}
							onSequenceChange={handleSequenceChange}
							onChessMovesChange={handleChessMovesChange}
							onSubmit={submitAnswers}
							submitting={submitting}
							answerSuggestionsEnabled={quizData.answer_suggestions_enabled !== false}
							suggestionCorpus={suggestionCorpus}
							perQuestionTimerEnabled={!!quizData.per_question_timer_enabled}
							perQuestionTimeSeconds={quizData.per_question_time_seconds ?? 30}
							paused={paused}
							draftState={flashcardDraft}
							onDraftStateChange={handleFlashcardDraftChange}
						/>
					) : (
						<div onFocusCapture={handleListFocusCapture}>
							<QuizQuestionListLayout
								questions={questions}
								sections={quizData.sections || []}
								layout={questionLayout}
								onLayoutChange={setQuestionLayout}
								sectionPage={sectionPage}
								onSectionPageChange={setSectionPage}
								renderQuestion={(question) => (
									<div
										key={question.id}
										data-attempt-question-id={question.id}
										ref={(el) => registerCardRef(question.id, el)}
									>
										<QuestionCard
											question={question}
											answers={answers}
											handleAnswerChange={handleAnswerChange}
											handleIdentificationAnswerChange={handleIdentificationAnswerChange}
											handleSequenceChange={handleSequenceChange}
											handleChessMovesChange={handleChessMovesChange}
											answerSuggestionsEnabled={quizData.answer_suggestions_enabled !== false}
											suggestionCorpus={suggestionCorpus}
											autoFocus={
												firstIdentificationId != null && question.id === firstIdentificationId
											}
											onAnswered={handleQuestionAnswered}
											inputRef={
												isIdentification(question.question_type)
													? (el) => registerInputRef(question.id, el)
													: null
											}
										/>
									</div>
								)}
							/>
						</div>
					)}
				</div>

				<AttemptStatusPanel
					answeredCount={answeredCount}
					totalQuestions={questions.length}
					showResults={quizResults}
					onSubmit={submitAnswers}
					submitting={submitting}
					onPause={quizResults ? undefined : handlePause}
					onRetake={handleRetake}
					onRetakeSame={handleRetakeSame}
					onBackToList={() => {
						abandonAttemptDraft();
						navigate('/quizzes');
					}}
					onExit={() => {
						abandonAttemptDraft();
						navigate(`/quizzes/${id}`);
					}}
					exitDiscardsDraft
					quizImage={quizData.quiz_image || quizData.quiz_image_url || null}
					submitButtonRef={submitButtonRef}
					shortcutsEnabled={!paused && !retakeSettingsOpen && !resumePromptOpen}
				/>
			</div>
		</div>
	);
}
