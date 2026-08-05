import { useEffect, useId, useMemo, useRef, useState } from 'react';

import MathFieldInput from './MathFieldInput';
import MathRenderer from './MathRenderer';
import { resolveQuestionImageSrc } from '../../lib/quizImages';
import { rankPrefixSuggestions } from './quizHelpers';

const MAX_SUGGESTIONS = 5;

export default function IdentificationAnswerInput({
	answer,
	handleIdentificationAnswerChange,
	question,
	onEnter,
	autoFocus = false,
	disabled = false,
	answerSuggestionsEnabled = false,
	suggestionCorpus = []
}) {
	const isMath = question.question_type === 'IDE-COM';
	const questionImage = resolveQuestionImageSrc(question);
	const listId = useId();
	const blurTimer = useRef(null);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);

	const value = answer?.userAnswer || '';
	const suggestionsEnabled =
		answerSuggestionsEnabled && !isMath && !disabled && Array.isArray(suggestionCorpus);

	const suggestions = useMemo(() => {
		if (!suggestionsEnabled) return [];
		return rankPrefixSuggestions(value, suggestionCorpus, MAX_SUGGESTIONS);
	}, [suggestionsEnabled, value, suggestionCorpus]);

	const showList = suggestionsEnabled && open && suggestions.length > 0;

	useEffect(() => {
		setActiveIndex(0);
	}, [value, showList]);

	useEffect(
		() => () => {
			if (blurTimer.current) clearTimeout(blurTimer.current);
		},
		[]
	);

	const applySuggestion = (text) => {
		handleIdentificationAnswerChange(answer.id, text);
		setOpen(false);
	};

	const handleKeyDown = (event) => {
		if (event.nativeEvent?.isComposing) return;

		if (showList) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
				return;
			}
			if (event.key === 'ArrowUp') {
				event.preventDefault();
				setActiveIndex((i) => Math.max(i - 1, 0));
				return;
			}
			if (event.key === 'Escape') {
				event.preventDefault();
				setOpen(false);
				return;
			}
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				const pick = suggestions[activeIndex] ?? suggestions[0];
				if (pick) applySuggestion(pick);
				return;
			}
		}

		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			onEnter?.();
		}
	};

	return (
		<div className="border-line bg-surface flex w-full flex-col items-center rounded-md border p-5">
			{isMath ? (
				<div className="text-fg mb-3 w-full text-center text-base leading-snug font-semibold">
					<MathRenderer expression={question.question} displayMode={false} />
				</div>
			) : (
				<p className="text-fg mb-3 w-full text-center text-base leading-snug font-semibold">
					{question.question}
				</p>
			)}
			{questionImage && (
				<div className="mb-3 flex w-full justify-center">
					<img
						src={questionImage}
						alt=""
						className="h-auto max-h-48 w-full max-w-md object-contain"
					/>
				</div>
			)}
			{isMath ? (
				<MathFieldInput
					value={value}
					onChange={(latex) => handleIdentificationAnswerChange(answer.id, latex)}
					onEnter={onEnter}
					autoFocus={autoFocus}
					disabled={disabled}
					placeholder="Type your answer (e.g. x^2)"
					aria-label="Mathematical answer"
					className="w-full"
				/>
			) : (
				<div className="relative w-full">
					<input
						type="text"
						value={value}
						onChange={(event) => {
							handleIdentificationAnswerChange(answer.id, event.target.value);
							setOpen(true);
						}}
						onKeyDown={handleKeyDown}
						onFocus={() => setOpen(true)}
						onBlur={() => {
							blurTimer.current = setTimeout(() => setOpen(false), 120);
						}}
						autoFocus={autoFocus}
						disabled={disabled}
						placeholder="Enter your answer"
						role="combobox"
						aria-expanded={showList}
						aria-controls={showList ? listId : undefined}
						aria-autocomplete="list"
						aria-activedescendant={showList ? `${listId}-option-${activeIndex}` : undefined}
						className="border-line bg-surface-2 text-fg focus:border-primary w-full cursor-text rounded-md border px-3 py-2 text-sm font-medium transition focus:outline-none"
					/>
					{showList && (
						<ul
							id={listId}
							role="listbox"
							className="border-line bg-surface absolute top-full right-0 left-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-md border py-1 shadow-md"
						>
							{suggestions.map((suggestion, index) => {
								const active = index === activeIndex;
								return (
									<li key={`${suggestion}-${index}`} role="presentation">
										<button
											id={`${listId}-option-${index}`}
											type="button"
											role="option"
											aria-selected={active}
											className={`text-fg w-full cursor-pointer px-3 py-2 text-left text-sm ${
												active ? 'bg-primary/10' : 'hover:bg-surface-2'
											}`}
											onMouseDown={(event) => event.preventDefault()}
											onMouseEnter={() => setActiveIndex(index)}
											onClick={() => applySuggestion(suggestion)}
										>
											{suggestion}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
