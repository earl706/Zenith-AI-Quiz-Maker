import { CODE_LANGUAGES, emptyCodeSpec, normalizeCodeSpec } from '../../lib/codeHelpers';
import CodeQuizEditor from './CodeQuizEditor';

export default function CodeSpecEditor({ value, onChange }) {
	const spec = normalizeCodeSpec(value) || emptyCodeSpec();

	const setField = (patch) => onChange?.({ ...spec, ...patch });

	return (
		<div className="border-line bg-surface-2 flex flex-col gap-3 rounded-md border p-4">
			<label className="flex max-w-xs flex-col gap-1 text-sm">
				<span className="text-muted">Language (highlight only)</span>
				<select
					value={spec.language}
					onChange={(e) => setField({ language: e.target.value })}
					className="border-line bg-surface text-fg rounded-md border px-3 py-2"
				>
					{CODE_LANGUAGES.map((row) => (
						<option key={row.value} value={row.value}>
							{row.label}
						</option>
					))}
				</select>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				<span className="text-muted">Expected solution</span>
				<CodeQuizEditor
					value={spec.solution}
					language={spec.language}
					onChange={(solution) => setField({ solution })}
					placeholder="Paste or type the expected code…"
					minHeight="12rem"
				/>
			</label>
			<p className="text-muted text-xs">
				Grading strips blank lines, comments, and docstrings, then compares remaining lines after
				shared spacing normalization (so <code>a+b</code> matches <code>a + b</code>). Use Format in
				the editor to apply the same style. No compile or run.
			</p>
		</div>
	);
}
