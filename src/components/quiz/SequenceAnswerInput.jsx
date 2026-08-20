import { useMemo } from 'react';

import { cn } from '../../lib/format';
import MathFieldInput from './MathFieldInput';
import MathRenderer from './MathRenderer';
import QuestionTitle from './QuestionTitle';
import { resolveQuestionImageSrc } from '../../lib/quizImages';
import {
	PLAIN_IDE_TEXT_INPUT_AUTO_OFF,
	interpolateSequenceStem,
	isMathematical,
	sequenceBlanks
} from './quizHelpers';

export default function SequenceAnswerInput({
	question,
	answer,
	displayItems,
	onSequenceChange,
	onEnter,
	disabled = false,
	revealed = false,
	autoFocus = false
}) {
	const math = isMathematical(question.question_type);
	const items = displayItems || question.sequence_items || [];
	const questionImage = resolveQuestionImageSrc(question);
	const stem = interpolateSequenceStem(question.question, question.sequence_items || items);
	const byId = useMemo(() => {
		const map = new Map();
		for (const row of answer?.userSequence || []) {
			map.set(row.id, row.text ?? '');
		}
		return map;
	}, [answer?.userSequence]);

	const setBlank = (itemId, text) => {
		const blanks = sequenceBlanks(items);
		const next = blanks.map((item) => ({
			id: item.id,
			text: item.id === itemId ? text : (byId.get(item.id) ?? '')
		}));
		onSequenceChange?.(question.id, next);
	};

	const handleKeyDown = (event) => {
		if (event.nativeEvent?.isComposing) return;
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			onEnter?.();
		}
	};

	return (
		<div className="border-line bg-surface flex w-full flex-col items-center rounded-md border p-6">
			<QuestionTitle text={stem} mathematical={math} className="mb-3 text-2xl" />
			{questionImage && (
				<div className="mb-4 flex w-full justify-center">
					<img
						src={questionImage}
						alt="Question"
						className="h-auto max-h-[200px] w-full max-w-md object-contain"
					/>
				</div>
			)}
			<ol className="flex w-full flex-col gap-2">
				{items.map((item, index) => {
					const isBlank = item.role === 'blank';
					const userText = byId.get(item.id) ?? '';
					return (
						<li key={item.id ?? index} className="flex items-start gap-2">
							<span className="text-muted mt-2 w-6 shrink-0 text-right text-sm tabular-nums">
								{index + 1}.
							</span>
							<div className="min-w-0 flex-1">
								{isBlank && !revealed ? (
									math ? (
										<MathFieldInput
											value={userText}
											onChange={(latex) => setBlank(item.id, latex)}
											onEnter={() => onEnter?.()}
											placeholder={`Step ${index + 1}`}
											aria-label={`Sequence blank ${index + 1}`}
											autoFocus={
												autoFocus && index === items.findIndex((it) => it.role === 'blank')
											}
											className="w-full"
											disabled={disabled}
										/>
									) : (
										<input
											type="text"
											value={userText}
											onChange={(e) => setBlank(item.id, e.target.value)}
											onKeyDown={handleKeyDown}
											placeholder={`Item ${index + 1}`}
											aria-label={`Sequence blank ${index + 1}`}
											autoFocus={
												autoFocus && index === items.findIndex((it) => it.role === 'blank')
											}
											disabled={disabled}
											{...PLAIN_IDE_TEXT_INPUT_AUTO_OFF}
											className="border-line bg-surface-2 text-fg focus:border-primary w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
										/>
									)
								) : (
									<div
										className={cn(
											'rounded-md border px-3 py-2 text-sm',
											item.role === 'distractor'
												? 'border-line bg-surface-2 text-muted'
												: 'border-line bg-surface-2 text-fg'
										)}
									>
										{math ? (
											<MathRenderer
												expression={
													revealed && isBlank
														? item.text
														: isBlank
															? userText || item.text
															: item.text
												}
												displayMode={false}
											/>
										) : (
											<span>
												{revealed && isBlank
													? item.text
													: isBlank
														? userText || item.text
														: item.text}
											</span>
										)}
									</div>
								)}
							</div>
						</li>
					);
				})}
			</ol>
			{revealed && (
				<div className="border-line mt-4 w-full border-t pt-3">
					<p className="text-muted mb-2 text-[0.7rem] font-semibold tracking-wide uppercase">
						Correct sequence
					</p>
					<ol className="space-y-1">
						{(question.sequence_items || []).map((item, index) => (
							<li key={`correct-${item.id ?? index}`} className="flex gap-2 text-sm">
								<span className="text-muted w-6 text-right tabular-nums">{index + 1}.</span>
								{math ? (
									<MathRenderer expression={item.text} displayMode={false} />
								) : (
									<span className="text-fg">{item.text}</span>
								)}
							</li>
						))}
					</ol>
				</div>
			)}
		</div>
	);
}
