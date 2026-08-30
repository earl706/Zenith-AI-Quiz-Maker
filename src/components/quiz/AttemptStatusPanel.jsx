import { useCallback, useEffect, useState } from 'react';
import { List, LogOut, Pause, Play, SlidersHorizontal } from 'lucide-react';

import { resolveQuizImageSrc } from '../../lib/quizImages';
import { Button, Card, Modal, ProgressRing } from '../ui';

export default function AttemptStatusPanel({
	answeredCount,
	totalQuestions,
	showResults,
	onSubmit,
	submitting = false,
	onPause,
	onRetake,
	onRetakeSame,
	onBackToList,
	onExit,
	quizImage = null,
	submitButtonRef = null,
	shortcutsEnabled = true,
	exitDiscardsDraft = false
}) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
	const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
	const unanswered = Math.max(0, totalQuestions - answeredCount);
	const imageSrc =
		resolveQuizImageSrc(quizImage) || (typeof quizImage === 'string' ? quizImage : null);

	const requestSubmit = useCallback(() => {
		if (totalQuestions === 0) return;
		if (unanswered > 0) {
			setConfirmOpen(true);
			return;
		}
		onSubmit?.();
	}, [onSubmit, totalQuestions, unanswered]);

	const confirmSubmit = useCallback(() => {
		setConfirmOpen(false);
		onSubmit?.();
	}, [onSubmit]);

	const requestExit = useCallback(() => {
		if (!onExit) return;
		if (answeredCount > 0 && !showResults) {
			setExitConfirmOpen(true);
			return;
		}
		onExit();
	}, [answeredCount, onExit, showResults]);

	const confirmExit = useCallback(() => {
		setExitConfirmOpen(false);
		onExit?.();
	}, [onExit]);

	useEffect(() => {
		const onKey = (event) => {
			if (event.nativeEvent?.isComposing) return;

			if (confirmOpen) {
				if (event.key === 'Enter' && !event.shiftKey) {
					event.preventDefault();
					event.stopPropagation();
					confirmSubmit();
				}
				return;
			}

			if (exitConfirmOpen) return;

			if (!shortcutsEnabled) return;

			if (showResults) {
				if (
					event.key === 'Enter' &&
					!event.shiftKey &&
					!event.metaKey &&
					!event.ctrlKey &&
					onRetakeSame
				) {
					event.preventDefault();
					event.stopPropagation();
					onRetakeSame();
				}
				return;
			}

			if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
				event.preventDefault();
				event.stopPropagation();
				requestSubmit();
			}
		};

		document.addEventListener('keydown', onKey, true);
		const onEscape = (event) => {
			if (event.key !== 'Escape' || event.nativeEvent?.isComposing) return;
			if (confirmOpen || exitConfirmOpen) return;
			if (event.defaultPrevented) return;
			if (!shortcutsEnabled || !onExit) return;
			event.preventDefault();
			requestExit();
		};
		document.addEventListener('keydown', onEscape);
		return () => {
			document.removeEventListener('keydown', onKey, true);
			document.removeEventListener('keydown', onEscape);
		};
	}, [
		confirmOpen,
		confirmSubmit,
		exitConfirmOpen,
		onExit,
		onRetakeSame,
		requestExit,
		requestSubmit,
		shortcutsEnabled,
		showResults
	]);

	return (
		<aside className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-6 lg:w-64 lg:self-start">
			{imageSrc && <img src={imageSrc} alt="" className="h-auto w-full object-contain" />}

			{!showResults && (
				<Card className="flex flex-col items-center gap-3 p-5">
					<p className="text-muted text-xs font-medium tracking-wide uppercase">Progress</p>
					<ProgressRing value={progressPct} size={72} stroke={6} tone="primary" />
					<p className="text-fg text-sm font-medium">
						{answeredCount} of {totalQuestions} answered
					</p>
					{onPause && (
						<Button
							variant="secondary"
							className="w-full cursor-pointer"
							onClick={onPause}
							disabled={submitting}
						>
							<Pause size={14} /> Pause
						</Button>
					)}
					{onSubmit && (
						<Button
							ref={submitButtonRef}
							className="w-full cursor-pointer"
							loading={submitting}
							disabled={totalQuestions === 0}
							onClick={requestSubmit}
						>
							Submit quiz
						</Button>
					)}
					{onExit && (
						<Button
							variant="ghost"
							className="w-full cursor-pointer"
							onClick={requestExit}
							disabled={submitting}
						>
							<LogOut size={14} /> Exit quiz
						</Button>
					)}
				</Card>
			)}

			{showResults && (onRetake || onRetakeSame || onBackToList || onExit) && (
				<Card className="flex flex-col gap-2 p-5">
					{onRetakeSame && (
						<Button className="w-full cursor-pointer" onClick={onRetakeSame}>
							<Play size={14} /> Retake
						</Button>
					)}
					{onRetake && (
						<Button className="w-full cursor-pointer" variant="secondary" onClick={onRetake}>
							<SlidersHorizontal size={14} /> Adjust & retake
						</Button>
					)}
					{onBackToList && (
						<Button className="w-full cursor-pointer" variant="secondary" onClick={onBackToList}>
							<List size={14} /> Quiz list
						</Button>
					)}
					{onExit && (
						<Button className="w-full cursor-pointer" variant="ghost" onClick={onExit}>
							<LogOut size={14} /> Exit quiz
						</Button>
					)}
				</Card>
			)}

			<Modal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				title="Submit incomplete quiz?"
				size="sm"
				footer={
					<>
						<Button variant="secondary" onClick={() => setConfirmOpen(false)}>
							Keep answering
						</Button>
						<Button loading={submitting} onClick={confirmSubmit}>
							Submit anyway
						</Button>
					</>
				}
			>
				<p className="text-muted text-sm">
					You have answered {answeredCount} of {totalQuestions}.{' '}
					{unanswered === 1
						? '1 question is still unanswered.'
						: `${unanswered} questions are still unanswered.`}{' '}
					Submit now?
				</p>
			</Modal>

			<Modal
				open={exitConfirmOpen}
				onClose={() => setExitConfirmOpen(false)}
				title="Leave this attempt?"
				size="sm"
				footer={
					<>
						<Button variant="secondary" onClick={() => setExitConfirmOpen(false)}>
							Keep answering
						</Button>
						<Button variant="danger" onClick={confirmExit}>
							Exit quiz
						</Button>
					</>
				}
			>
				<p className="text-muted text-sm">
					{exitDiscardsDraft
						? 'Your answers will not be submitted and your saved progress for this attempt will be discarded.'
						: 'Your answers will not be submitted. You can start a new attempt from the quiz page.'}
				</p>
			</Modal>
		</aside>
	);
}
