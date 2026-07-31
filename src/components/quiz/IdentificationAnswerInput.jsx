import MathFieldInput from './MathFieldInput';
import { resolveQuizImageSrc } from '../../lib/quizImages';

export default function IdentificationAnswerInput({
	answer,
	handleIdentificationAnswerChange,
	question,
	onEnter,
	autoFocus = false,
	disabled = false
}) {
	const isMath = question.question_type === 'IDE-COM';
	const questionImage = resolveQuizImageSrc(question.question_image) || question.question_image;

	const handleKeyDown = (event) => {
		if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent?.isComposing) return;
		event.preventDefault();
		onEnter?.();
	};

	return (
		<div className="border-line bg-surface flex w-full flex-col items-center rounded-md border p-5">
			<p className="text-fg mb-3 w-full text-center text-base leading-snug font-semibold">
				{question.question}
			</p>
			{questionImage && (
				<div className="mb-3 flex justify-center">
					<img src={questionImage} alt="" className="max-h-48 rounded-md object-cover" />
				</div>
			)}
			{isMath ? (
				<MathFieldInput
					value={answer?.userAnswer || ''}
					onChange={(latex) => handleIdentificationAnswerChange(answer.id, latex)}
					onEnter={onEnter}
					autoFocus={autoFocus}
					disabled={disabled}
					placeholder="Type your answer (e.g. x^2)"
					aria-label="Mathematical answer"
					className="w-full"
				/>
			) : (
				<input
					type="text"
					value={answer?.userAnswer || ''}
					onChange={(event) => handleIdentificationAnswerChange(answer.id, event.target.value)}
					onKeyDown={handleKeyDown}
					autoFocus={autoFocus}
					disabled={disabled}
					placeholder="Enter your answer"
					className="border-line bg-surface-2 text-fg focus:border-primary w-full cursor-text rounded-md border px-3 py-2 text-sm font-medium transition focus:outline-none"
				/>
			)}
		</div>
	);
}
