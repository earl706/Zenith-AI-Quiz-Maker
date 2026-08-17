import { useState } from 'react';
import { Clock, List, Play, SlidersHorizontal } from 'lucide-react';

import { formatDurationSeconds } from '../../lib/format';
import { resolveQuizImageSrc } from '../../lib/quizImages';
import { Button, Card, Modal, ProgressRing } from '../ui';

export default function AttemptStatusPanel({
	time,
	answeredCount,
	totalQuestions,
	showResults,
	hideElapsedTimer = false,
	onSubmit,
	submitting = false,
	onRetake,
	onRetakeSame,
	onBackToList,
	quizImage = null,
	submitButtonRef = null
}) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
	const unanswered = Math.max(0, totalQuestions - answeredCount);
	const imageSrc =
		resolveQuizImageSrc(quizImage) || (typeof quizImage === 'string' ? quizImage : null);

	const requestSubmit = () => {
		if (totalQuestions === 0) return;
		if (unanswered > 0) {
			setConfirmOpen(true);
			return;
		}
		onSubmit?.();
	};

	const confirmSubmit = () => {
		setConfirmOpen(false);
		onSubmit?.();
	};

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
				</Card>
			)}

			{showResults && (onRetake || onRetakeSame || onBackToList) && (
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
		</aside>
	);
}
