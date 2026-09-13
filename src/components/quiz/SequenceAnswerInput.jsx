import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '../../lib/format';
import MathFieldInput, { tryFocusMathField } from './MathFieldInput';
import MathRenderer from './MathRenderer';
import QuestionTitle from './QuestionTitle';
import { resolveQuestionImageSrc } from '../../lib/quizImages';
import {
	PLAIN_IDE_TEXT_INPUT_AUTO_OFF,
	interpolateSequenceStem,
	isMathematical,
	isSequenceBlankControl,
	scrollAttemptElementToCenter,
	sequenceBlankVerdicts,
	sequenceBlanks
} from './quizHelpers';

function focusSequenceBlankControl(el) {
	if (!el) return;
	const tag = el.tagName?.toLowerCase?.();
	if (tag === 'math-field') {
		tryFocusMathField(el, { preventScroll: true });
	} else {
		el.focus?.({ preventScroll: true });
	}
}

function blankCueClass(checked, correct) {
	if (!checked) return 'border-line focus:border-primary';
	return correct ? 'border-success/50 seq-blank-ok' : 'border-danger/50 seq-blank-bad';
}

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
	const blankRefs = useRef(new Map());
	const [checkedIds, setCheckedIds] = useState([]);

	const byId = useMemo(() => {
		const map = new Map();
		for (const row of answer?.userSequence || []) {
			map.set(row.id, row.text ?? '');
		}
		return map;
	}, [answer?.userSequence]);

	const blankIds = useMemo(() => sequenceBlanks(items).map((item) => item.id), [items]);

	const firstBlankItemIndex = useMemo(() => items.findIndex((it) => it.role === 'blank'), [items]);

	const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds]);

	const verdicts = useMemo(
		() =>
			sequenceBlankVerdicts(question, answer, {
				itemIds: checkedIds,
				items
			}),
		[question, answer, checkedIds, items]
	);

	useEffect(() => {
		setCheckedIds([]);
	}, [question.id]);

	useEffect(() => {
		if (!revealed) return;
		setCheckedIds((prev) => {
			const next = blankIds.filter((id) => id != null);
			if (prev.length === next.length && next.every((id, i) => id === prev[i])) return prev;
			return next;
		});
	}, [revealed, blankIds]);

	const markChecked = (itemId) => {
		setCheckedIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
	};

	const setBlank = (itemId, text) => {
		if (checkedSet.has(itemId)) return;
		const blanks = sequenceBlanks(items);
		const next = blanks.map((item) => ({
			id: item.id,
			text: item.id === itemId ? text : (byId.get(item.id) ?? '')
		}));
		onSequenceChange?.(question.id, next);
	};

	const setBlankRef = (itemId, el) => {
		if (el) blankRefs.current.set(itemId, el);
		else blankRefs.current.delete(itemId);
	};

	const focusBlankById = (itemId) => {
		const el = blankRefs.current.get(itemId);
		if (!el || el.disabled) return;
		focusSequenceBlankControl(el);
		requestAnimationFrame(() => scrollAttemptElementToCenter(el));
	};

	/** Enter: lock+cue this blank, then next blank (center) or parent onEnter. */
	const commitBlankAndAdvance = (fromItemId) => {
		markChecked(fromItemId);
		const idx = blankIds.indexOf(fromItemId);
		if (idx >= 0 && idx < blankIds.length - 1) {
			focusBlankById(blankIds[idx + 1]);
			return;
		}
		onEnter?.();
	};

	const handleBlankFocusCapture = (event) => {
		const target = event.target;
		if (!isSequenceBlankControl(target)) return;
		const related = event.relatedTarget;
		const root = event.currentTarget;
		if (!related || !root.contains(related) || !isSequenceBlankControl(related)) return;
		scrollAttemptElementToCenter(target);
	};

	const handleKeyDown = (event, itemId) => {
		if (event.nativeEvent?.isComposing) return;
		if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
			event.preventDefault();
			commitBlankAndAdvance(itemId);
		}
	};

	return (
		<div
			className="border-line bg-surface flex w-full flex-col items-center rounded-md border p-6"
			data-sequence-answer=""
			onFocusCapture={handleBlankFocusCapture}
		>
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
					const blankChecked = isBlank && checkedSet.has(item.id);
					const blankCorrect = blankChecked ? verdicts.get(item.id) === true : null;
					const blankDisabled = disabled || blankChecked;
					return (
						<li key={item.id ?? index} className="flex items-start gap-2">
							<span className="text-muted mt-2 w-6 shrink-0 text-right text-sm tabular-nums">
								{index + 1}.
							</span>
							<div className="min-w-0 flex-1">
								{isBlank ? (
									math ? (
										<MathFieldInput
											value={userText}
											onChange={(latex) => setBlank(item.id, latex)}
											onEnter={() => commitBlankAndAdvance(item.id)}
											placeholder={`Step ${index + 1}`}
											aria-label={`Sequence blank ${index + 1}`}
											autoFocus={autoFocus && index === firstBlankItemIndex && !blankChecked}
											fieldRef={(el) => setBlankRef(item.id, el)}
											className={cn('w-full', blankCueClass(blankChecked, blankCorrect))}
											disabled={blankDisabled}
										/>
									) : (
										<input
											type="text"
											ref={(el) => setBlankRef(item.id, el)}
											value={userText}
											onChange={(e) => setBlank(item.id, e.target.value)}
											onKeyDown={(e) => handleKeyDown(e, item.id)}
											placeholder={`Item ${index + 1}`}
											aria-label={`Sequence blank ${index + 1}`}
											autoFocus={autoFocus && index === firstBlankItemIndex && !blankChecked}
											disabled={blankDisabled}
											{...PLAIN_IDE_TEXT_INPUT_AUTO_OFF}
											className={cn(
												'bg-surface-2 text-fg w-full rounded-md border px-3 py-2 text-xl focus:outline-none disabled:cursor-not-allowed',
												blankCueClass(blankChecked, blankCorrect),
												blankChecked && 'disabled:opacity-100'
											)}
										/>
									)
								) : (
									<div
										className={cn(
											'rounded-md border px-3 py-2 text-xl',
											item.role === 'distractor'
												? 'border-line bg-surface-2 text-muted'
												: 'border-line bg-surface-2 text-fg'
										)}
									>
										{math ? (
											<MathRenderer expression={item.text} displayMode={false} />
										) : (
											<span>{item.text}</span>
										)}
									</div>
								)}
							</div>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
