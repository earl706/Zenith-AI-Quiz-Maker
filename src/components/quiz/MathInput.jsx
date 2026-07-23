import { Check, X } from 'lucide-react';

import { cn } from '../../lib/format';
import { Button } from '../ui';
import MathFieldInput from './MathFieldInput';

export default function MathInput({
	handleChoicesChange,
	question,
	handleInputChange,
	removeChoice
}) {
	const renderRow = (index, { showRemove }) => (
		<div className="flex items-center gap-1.5" key={index}>
			<button
				type="button"
				aria-label={
					question.identification ? 'Mark answer correct' : `Mark choice ${index + 1} correct`
				}
				className={cn(
					'flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition',
					question.correctAnswerIndex === index
						? 'border-primary bg-primary'
						: 'border-line bg-surface'
				)}
				onClick={() => handleInputChange(question.id, 'correctAnswerIndex', index)}
			>
				{question.correctAnswerIndex === index && <Check size={10} className="text-primary-fg" />}
			</button>
			<MathFieldInput
				value={question.choices[index] || ''}
				onChange={(latex) => handleChoicesChange(question.id, index, latex)}
				placeholder={question.identification ? 'e.g. x^2 + 2x + 1' : `Choice ${index + 1}`}
				aria-label={
					question.identification ? 'Mathematical answer' : `Mathematical choice ${index + 1}`
				}
				className="min-w-0 flex-1"
			/>
			{showRemove && (
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 shrink-0 cursor-pointer"
					aria-label={`Remove choice ${index + 1}`}
					onClick={() => removeChoice(question.id, index)}
				>
					<X size={13} className="text-danger" />
				</Button>
			)}
		</div>
	);

	if (question.identification) {
		return renderRow(0, { showRemove: false });
	}

	const count = Math.max(question.choices?.length || 0, 4);
	return (
		<div className="space-y-1.5">
			{Array.from({ length: count }, (_, index) => renderRow(index, { showRemove: true }))}
		</div>
	);
}
