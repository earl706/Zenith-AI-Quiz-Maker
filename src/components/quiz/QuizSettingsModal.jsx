import { useCallback, useEffect, useState } from 'react';

import { put } from '../../lib/api';
import { cn } from '../../lib/format';
import { isExternalOrStaticImageUrl, resolveQuizImageSrc } from '../../lib/quizImages';
import { invalidateQuizQueries } from '../../lib/resources';
import { toast } from '../../stores/toastStore';
import { Button, Input, Modal } from '../ui';
import {
	QUIZ_TAG_COLORS,
	ImageDropzone,
	PerQuestionTimerSettings,
	ToggleChip
} from './quizAuthoringUi';
import { PER_QUESTION_TIMER_DEFAULT, clampPerQuestionSeconds } from './quizHelpers';

async function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
	});
}

/**
 * Shared quiz settings fields (Create / Edit / detail / list).
 * Parent owns values; this modal only renders UI + optional image preview.
 */
export default function QuizSettingsModal({
	open,
	onClose,
	title = 'Quiz settings',
	quizTitle,
	onQuizTitleChange,
	quizImagePreview,
	quizImageUrl = '',
	onQuizImageUpload,
	onQuizCoverUrlChange,
	onClearQuizImage,
	quizType,
	onQuizTypeChange,
	randomQuestionOrder,
	onRandomQuestionOrderChange,
	randomQuestionChoices,
	onRandomQuestionChoicesChange,
	perQuestionTimerEnabled,
	onPerQuestionTimerEnabledChange,
	perQuestionTimeSeconds,
	onPerQuestionTimeSecondsChange,
	answerSuggestionsEnabled,
	onAnswerSuggestionsEnabledChange,
	selectedColor,
	onSelectedColorChange,
	disabled = false,
	footer = null
}) {
	const [imagePreview, setImagePreview] = useState(null);

	const openImagePreview = (src, previewTitle = 'Image preview') => {
		if (!src) return;
		setImagePreview({ src: resolveQuizImageSrc(src) || src, title: previewTitle });
	};

	return (
		<>
			<Modal open={open} onClose={onClose} title={title} size="md" footer={footer}>
				<div className="space-y-3">
					<Input
						label="Title"
						value={quizTitle}
						onChange={(e) => onQuizTitleChange?.(e.target.value)}
						className="py-1.5"
						disabled={disabled}
					/>

					<ImageDropzone
						preview={quizImagePreview}
						compact
						label="Cover image"
						onPreview={openImagePreview}
						urlValue={quizImageUrl}
						onUrlChange={onQuizCoverUrlChange}
						onClear={onClearQuizImage}
						onChange={onQuizImageUpload}
					/>

					<div>
						<p className="text-fg mb-1.5 text-xs font-medium">Type</p>
						<div className="flex gap-1.5">
							{['list', 'flashcard'].map((t) => (
								<button
									key={t}
									type="button"
									disabled={disabled}
									className={cn(
										'flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium capitalize transition',
										quizType === t
											? 'bg-primary text-primary-fg'
											: 'bg-surface-2 text-fg hover:bg-line',
										disabled && 'cursor-not-allowed opacity-60'
									)}
									onClick={() => onQuizTypeChange?.(t)}
								>
									{t}
								</button>
							))}
						</div>
					</div>

					<div className="flex flex-col flex-nowrap gap-1.5">
						<ToggleChip
							active={randomQuestionOrder}
							onClick={() => !disabled && onRandomQuestionOrderChange?.(!randomQuestionOrder)}
							className={disabled ? 'pointer-events-none opacity-60' : undefined}
						>
							Shuffle questions
						</ToggleChip>
						<ToggleChip
							active={randomQuestionChoices}
							onClick={() => !disabled && onRandomQuestionChoicesChange?.(!randomQuestionChoices)}
							className={disabled ? 'pointer-events-none opacity-60' : undefined}
						>
							Shuffle choices
						</ToggleChip>
						<ToggleChip
							active={answerSuggestionsEnabled}
							onClick={() =>
								!disabled && onAnswerSuggestionsEnabledChange?.(!answerSuggestionsEnabled)
							}
							className={disabled ? 'pointer-events-none opacity-60' : undefined}
						>
							Answer suggestions
						</ToggleChip>
					</div>

					<PerQuestionTimerSettings
						enabled={perQuestionTimerEnabled}
						onEnabledChange={onPerQuestionTimerEnabledChange}
						seconds={perQuestionTimeSeconds}
						onSecondsChange={onPerQuestionTimeSecondsChange}
						disabled={disabled}
					/>

					<div>
						<p className="text-fg mb-1.5 text-xs font-medium">Tag</p>
						<div className="grid grid-cols-8 gap-1.5">
							{QUIZ_TAG_COLORS.map((color) => (
								<button
									key={color.hex}
									type="button"
									title={color.name}
									aria-label={color.name}
									disabled={disabled}
									onClick={() => onSelectedColorChange?.(color.hex)}
									className={cn(
										'h-5 w-5 cursor-pointer rounded-full border transition',
										selectedColor === color.hex
											? 'border-fg ring-primary/40 scale-110 ring-2'
											: 'border-line hover:scale-105',
										disabled && 'cursor-not-allowed opacity-60'
									)}
									style={{ backgroundColor: color.hex }}
								/>
							))}
						</div>
					</div>
				</div>
			</Modal>

			<Modal
				open={!!imagePreview}
				onClose={() => setImagePreview(null)}
				title={imagePreview?.title || 'Image preview'}
				size="xl"
				bodyClassName="flex h-[min(70vh,calc(100dvh-8rem))] max-h-[min(70vh,calc(100dvh-8rem))] items-center justify-center overflow-hidden p-3"
			>
				{imagePreview?.src && (
					<img
						src={imagePreview.src}
						alt={imagePreview.title || 'Preview'}
						className="max-h-full max-w-full rounded-md object-contain"
					/>
				)}
			</Modal>
		</>
	);
}

function draftFromQuiz(quiz) {
	const coverUrl = String(quiz?.quiz_image_url || '').trim();
	const coverDisplay = quiz?.quiz_image || coverUrl || null;
	const preview =
		resolveQuizImageSrc(coverDisplay) || resolveQuizImageSrc(coverUrl) || coverDisplay || null;
	const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
	const anyShuffleChoices =
		typeof quiz?.any_random_choices === 'boolean'
			? quiz.any_random_choices
			: questions.some((q) => !!q.random_choices);

	return {
		quizTitle: quiz?.quiz_title || '',
		quizType: quiz?.flashcard_quiz ? 'flashcard' : 'list',
		randomQuestionOrder: !!quiz?.random_question_order,
		randomQuestionChoices: anyShuffleChoices,
		perQuestionTimerEnabled: !!quiz?.per_question_timer_enabled,
		perQuestionTimeSeconds: clampPerQuestionSeconds(
			quiz?.per_question_time_seconds,
			PER_QUESTION_TIMER_DEFAULT
		),
		answerSuggestionsEnabled: quiz?.answer_suggestions_enabled !== false,
		selectedColor: quiz?.tag_color || QUIZ_TAG_COLORS[0].hex,
		quizImage: null,
		quizImageUrl: isExternalOrStaticImageUrl(coverUrl)
			? coverUrl
			: isExternalOrStaticImageUrl(coverDisplay)
				? coverDisplay
				: '',
		quizImagePreview: preview,
		originalCover: coverDisplay,
		imageCleared: false
	};
}

/**
 * Settings modal that loads from a quiz row and PUTs quiz-level settings.
 * Shuffle-choices uses write-only random_choices_all (bulk DB update) — no
 * detail hydrate and no nested questions payload.
 */
export function PersistedQuizSettingsModal({ quiz, open, onClose, onSaved }) {
	const [draft, setDraft] = useState(() => draftFromQuiz(quiz));
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open && quiz) setDraft(draftFromQuiz(quiz));
	}, [open, quiz]);

	const handleQuizImageUpload = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			setDraft((d) => ({
				...d,
				quizImage: file,
				quizImageUrl: '',
				quizImagePreview: e.target.result,
				imageCleared: false
			}));
		};
		reader.readAsDataURL(file);
	};

	const setQuizCoverUrl = (url) => {
		const trimmed = String(url || '').trim();
		setDraft((d) => ({
			...d,
			quizImage: null,
			quizImageUrl: trimmed,
			quizImagePreview: resolveQuizImageSrc(trimmed) || trimmed || null,
			originalCover: null,
			imageCleared: !trimmed
		}));
	};

	const clearQuizImage = () => {
		setDraft((d) => ({
			...d,
			quizImage: null,
			quizImageUrl: '',
			quizImagePreview: null,
			originalCover: null,
			imageCleared: true
		}));
	};

	const handleSave = useCallback(async () => {
		const uuid = quiz?.uuid || quiz?.quiz_id;
		if (!uuid) return;
		try {
			setSaving(true);
			const payload = {
				quiz_title: draft.quizTitle.trim() || 'Untitled quiz',
				tag_color: draft.selectedColor,
				flashcard_quiz: draft.quizType === 'flashcard',
				random_question_order: draft.randomQuestionOrder,
				per_question_timer_enabled: draft.perQuestionTimerEnabled,
				per_question_time_seconds: clampPerQuestionSeconds(
					draft.perQuestionTimeSeconds,
					PER_QUESTION_TIMER_DEFAULT
				),
				answer_suggestions_enabled: draft.answerSuggestionsEnabled,
				random_choices_all: draft.randomQuestionChoices
			};

			if (draft.quizImage) {
				payload.quiz_image = await fileToBase64(draft.quizImage);
				payload.quiz_image_url = '';
			} else if (draft.quizImageUrl) {
				payload.quiz_image = null;
				payload.quiz_image_url = draft.quizImageUrl;
			} else if (draft.imageCleared) {
				payload.quiz_image = null;
				payload.quiz_image_url = '';
			} else if (draft.originalCover && isExternalOrStaticImageUrl(draft.originalCover)) {
				payload.quiz_image = null;
				payload.quiz_image_url = draft.originalCover;
			}

			await put(`/quizzes/quiz/${uuid}/`, payload);
			await invalidateQuizQueries();
			toast.success('Quiz settings saved.');
			onSaved?.(payload);
			onClose?.();
		} catch {
			toast.error('Could not save quiz settings.');
		} finally {
			setSaving(false);
		}
	}, [draft, quiz, onClose, onSaved]);

	if (!quiz) return null;

	return (
		<QuizSettingsModal
			open={open}
			onClose={onClose}
			quizTitle={draft.quizTitle}
			onQuizTitleChange={(v) => setDraft((d) => ({ ...d, quizTitle: v }))}
			quizImagePreview={draft.quizImagePreview}
			quizImageUrl={draft.quizImageUrl}
			onQuizImageUpload={handleQuizImageUpload}
			onQuizCoverUrlChange={setQuizCoverUrl}
			onClearQuizImage={clearQuizImage}
			quizType={draft.quizType}
			onQuizTypeChange={(v) => setDraft((d) => ({ ...d, quizType: v }))}
			randomQuestionOrder={draft.randomQuestionOrder}
			onRandomQuestionOrderChange={(v) => setDraft((d) => ({ ...d, randomQuestionOrder: v }))}
			randomQuestionChoices={draft.randomQuestionChoices}
			onRandomQuestionChoicesChange={(v) => setDraft((d) => ({ ...d, randomQuestionChoices: v }))}
			perQuestionTimerEnabled={draft.perQuestionTimerEnabled}
			onPerQuestionTimerEnabledChange={(v) =>
				setDraft((d) => ({ ...d, perQuestionTimerEnabled: v }))
			}
			perQuestionTimeSeconds={draft.perQuestionTimeSeconds}
			onPerQuestionTimeSecondsChange={(v) => setDraft((d) => ({ ...d, perQuestionTimeSeconds: v }))}
			answerSuggestionsEnabled={draft.answerSuggestionsEnabled}
			onAnswerSuggestionsEnabledChange={(v) =>
				setDraft((d) => ({ ...d, answerSuggestionsEnabled: v }))
			}
			selectedColor={draft.selectedColor}
			onSelectedColorChange={(v) => setDraft((d) => ({ ...d, selectedColor: v }))}
			footer={
				<Button className="w-full cursor-pointer sm:w-auto" loading={saving} onClick={handleSave}>
					Save changes
				</Button>
			}
		/>
	);
}
