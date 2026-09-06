import { useMemo } from 'react';

import { normalizeCodeSpec } from '../../lib/codeHelpers';
import CodeQuizEditor from './CodeQuizEditor';

export default function CodeAnswerInput({
	question,
	value = '',
	onChange,
	disabled = false,
	readOnly = false
}) {
	const spec = useMemo(
		() => normalizeCodeSpec(question?.code_spec || question?.codeSpec),
		[question?.code_spec, question?.codeSpec]
	);
	const language = spec?.language || 'plaintext';

	return (
		<div className="flex flex-col gap-2">
			<CodeQuizEditor
				value={value}
				language={language}
				readOnly={readOnly || disabled}
				onChange={(next) => {
					if (readOnly || disabled) return;
					onChange?.(next);
				}}
				placeholder="Write your code answer…"
				minHeight="12rem"
			/>
		</div>
	);
}
