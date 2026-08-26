/** @deprecated Import from ../stores/attemptDraftStore instead. Re-exports for compatibility. */
export {
	ATTEMPT_DRAFT_STORAGE_KEY,
	ATTEMPT_DRAFT_STALE_MS,
	attemptScopeFromLocation,
	buildAttemptDraftKey,
	buildAttemptPath,
	isAttemptDraftStale,
	purgeStaleAttemptDrafts,
	readAttemptDraft,
	removeActiveAttemptDraft,
	removeAttemptDraft,
	slimAttemptDraftPayload,
	writeAttemptDraft
} from '../stores/attemptDraftStore';
