import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { buildAttemptQuery, parseAttemptScopeFromSearch } from '../components/quiz/quizHelpers';

export const ATTEMPT_DRAFT_STORAGE_KEY = 'zenith-quiz-attempt-draft';
export const ATTEMPT_DRAFT_LEGACY_STORAGE_KEY = 'zenith-quiz-attempt-drafts';
export const ATTEMPT_DRAFT_STALE_MS = 60 * 60 * 1000;
/** Soft cap — WebKit localStorage is ~5MB; keep drafts tiny (ids + answers only). */
export const ATTEMPT_DRAFT_MAX_CHARS = 400_000;

/**
 * Stable localStorage key for an in-progress attempt (quiz UUID + URL scope).
 */
export function buildAttemptDraftKey(quizId, scope) {
	const sections = scope?.fullQuiz
		? 'full'
		: [...(scope?.sectionIds || [])].sort((a, b) => a - b).join('-') || 'none';
	const shuffle = scope?.shuffle ? '1' : '0';
	const sample = scope?.sample != null ? String(scope.sample) : '';
	return `${quizId}|${sections}|${shuffle}|${sample}`;
}

export function buildAttemptPath(quizId, scope) {
	return `/quizzes/attempt/${quizId}${buildAttemptQuery({
		fullQuiz: scope?.fullQuiz ?? true,
		sectionIds: scope?.sectionIds ?? [],
		shuffle: !!scope?.shuffle,
		sample: scope?.sample ?? null
	})}`;
}

export function isAttemptDraftStale(savedAt) {
	if (!savedAt) return true;
	return Date.now() - savedAt > ATTEMPT_DRAFT_STALE_MS;
}

function normalizeScope(scope) {
	return {
		fullQuiz: !!scope?.fullQuiz,
		sectionIds: [...(scope?.sectionIds || [])],
		shuffle: !!scope?.shuffle,
		sample: scope?.sample ?? null
	};
}

/**
 * Persist only ids + answers + UI flags. Never store full question bodies
 * (desktop WebKit OOMs / QuotaExceeded on multi‑MB section banks).
 */
export function slimAttemptDraftPayload({
	quizData,
	questions,
	answers,
	time,
	paused,
	questionLayout,
	sectionPage,
	flashcardDraft,
	questionPoolSize = null
}) {
	return {
		version: 2,
		quizTitle: quizData?.quiz_title || '',
		flashcardQuiz: !!quizData?.flashcard_quiz,
		questionIds: (questions || []).map((q) => q.id).filter((id) => id != null),
		answers: answers || [],
		time: Math.max(0, Math.floor(Number(time) || 0)),
		paused: !!paused,
		questionLayout: questionLayout || null,
		sectionPage: typeof sectionPage === 'number' ? sectionPage : 0,
		questionPoolSize:
			typeof questionPoolSize === 'number' && questionPoolSize > 0 ? questionPoolSize : null,
		flashcard: flashcardDraft
			? {
					index: flashcardDraft.index ?? 0,
					revealedIds: flashcardDraft.revealedIds || [],
					lockedIds: flashcardDraft.lockedIds || [],
					secondsLeft: flashcardDraft.secondsLeft ?? null
				}
			: null
	};
}

function draftStorageSizeOk(value) {
	try {
		return JSON.stringify(value).length <= ATTEMPT_DRAFT_MAX_CHARS;
	} catch {
		return false;
	}
}

function createSafeStorage() {
	return {
		getItem: (name) => {
			try {
				return localStorage.getItem(name);
			} catch {
				return null;
			}
		},
		setItem: (name, value) => {
			try {
				if (typeof value === 'string' && value.length > ATTEMPT_DRAFT_MAX_CHARS) {
					localStorage.removeItem(name);
					return;
				}
				localStorage.setItem(name, value);
			} catch {
				try {
					localStorage.removeItem(name);
				} catch {
					// ignore
				}
			}
		},
		removeItem: (name) => {
			try {
				localStorage.removeItem(name);
			} catch {
				// ignore
			}
		}
	};
}

function migrateLegacyAttemptDraft() {
	try {
		const raw = localStorage.getItem(ATTEMPT_DRAFT_LEGACY_STORAGE_KEY);
		if (!raw) return;
		localStorage.removeItem(ATTEMPT_DRAFT_LEGACY_STORAGE_KEY);
		// Legacy multi-draft blobs often embedded full quizzes — drop them.
	} catch {
		try {
			localStorage.removeItem(ATTEMPT_DRAFT_LEGACY_STORAGE_KEY);
		} catch {
			// ignore
		}
	}
}

function sanitizeDraft(draft) {
	if (!draft || typeof draft !== 'object') return null;
	if (isAttemptDraftStale(draft.savedAt)) return null;
	// Drop v1 drafts that embedded full question payloads (blanked desktop).
	if (Array.isArray(draft.questions) && draft.questions.length > 0) return null;
	if (!draftStorageSizeOk(draft)) return null;
	if (!draft.quizId || !draft.scope) return null;
	return draft;
}

export const useAttemptDraftStore = create(
	persist(
		(set, get) => ({
			draft: null,

			setDraft: (quizId, scope, payload) => {
				const normalizedScope = normalizeScope(scope);
				const next = {
					...payload,
					quizId,
					scope: normalizedScope,
					scopeKey: buildAttemptDraftKey(quizId, normalizedScope),
					savedAt: Date.now()
				};
				if (!draftStorageSizeOk(next)) {
					set({ draft: null });
					return;
				}
				set({ draft: next });
			},

			clearDraft: () => set({ draft: null }),

			readDraftForScope: (quizId, scope) => {
				get().purgeStale();
				const draft = get().draft;
				if (!draft) return null;
				if (draft.scopeKey !== buildAttemptDraftKey(quizId, scope)) return null;
				return draft;
			},

			getActiveDraft: () => {
				get().purgeStale();
				return get().draft;
			},

			purgeStale: () => {
				const draft = get().draft;
				const clean = sanitizeDraft(draft);
				if (draft && !clean) {
					set({ draft: null });
				}
			}
		}),
		{
			name: ATTEMPT_DRAFT_STORAGE_KEY,
			storage: createJSONStorage(() => createSafeStorage()),
			partialize: (state) => ({ draft: state.draft }),
			merge: (persisted, current) => {
				const draft = sanitizeDraft(persisted?.draft);
				return { ...current, draft };
			},
			onRehydrateStorage: () => (_state, error) => {
				if (error) return;
				migrateLegacyAttemptDraft();
				useAttemptDraftStore.getState().purgeStale();
			}
		}
	)
);

/** One-time legacy migration after store module load. */
if (typeof window !== 'undefined') {
	queueMicrotask(() => {
		migrateLegacyAttemptDraft();
		useAttemptDraftStore.getState().purgeStale();
	});
}

export function purgeStaleAttemptDrafts() {
	useAttemptDraftStore.getState().purgeStale();
}

export function readAttemptDraft(quizId, scope) {
	return useAttemptDraftStore.getState().readDraftForScope(quizId, scope);
}

export function writeAttemptDraft(quizId, scope, payload) {
	useAttemptDraftStore.getState().setDraft(quizId, scope, payload);
}

export function removeAttemptDraft(quizId, scope) {
	const state = useAttemptDraftStore.getState();
	const draft = state.draft;
	if (draft && draft.scopeKey === buildAttemptDraftKey(quizId, scope)) {
		state.clearDraft();
	}
}

export function removeActiveAttemptDraft() {
	useAttemptDraftStore.getState().clearDraft();
}

/** Scope object from the current attempt URL (for callers that only have search). */
export function attemptScopeFromLocation(search) {
	return parseAttemptScopeFromSearch(search);
}
