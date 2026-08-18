import { useCallback, useMemo } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { Braces, Check, Copy, Download, WrapText } from 'lucide-react';

import { cn } from '../../lib/format';
import { useThemeStore } from '../../stores/themeStore';
import { toast } from '../../stores/toastStore';
import { Button, Card } from '../ui';
import { formatDiagnostic } from './quizJsonDraft';

function editorThemeExtension() {
	return EditorView.theme(
		{
			'&': {
				backgroundColor: 'var(--surface)',
				color: 'var(--fg)',
				fontSize: '13px'
			},
			'.cm-content': {
				caretColor: 'var(--primary)',
				fontFamily:
					'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
			},
			'.cm-gutters': {
				backgroundColor: 'var(--surface-2)',
				color: 'var(--muted)',
				borderRight: '1px solid var(--line)'
			},
			'.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--primary) 8%, transparent)' },
			'.cm-activeLineGutter': {
				backgroundColor: 'color-mix(in oklab, var(--primary) 8%, transparent)'
			},
			'.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
				backgroundColor: 'color-mix(in oklab, var(--primary) 28%, transparent) !important'
			},
			'.cm-cursor': { borderLeftColor: 'var(--primary)' },
			'.cm-matchingBracket': { outline: '1px solid var(--primary)' }
		},
		{ dark: document.documentElement.classList.contains('dark') }
	);
}

export default function QuizJsonEditor({
	jsonText,
	diagnostics = [],
	disabled = false,
	persistIds = false,
	onChange,
	onFocus,
	onBlur,
	onFormat,
	onCopy,
	onDownload
}) {
	const theme = useThemeStore((s) => s.theme);
	const extensions = useMemo(
		() => [json(), editorThemeExtension(), EditorView.lineWrapping],
		[theme]
	);

	const handleCopy = useCallback(async () => {
		try {
			await onCopy?.();
			toast.success('JSON copied.');
		} catch {
			toast.error('Could not copy JSON.');
		}
	}, [onCopy]);

	const handleDownload = useCallback(() => {
		try {
			onDownload?.();
		} catch (err) {
			toast.error(err?.message || 'Could not download JSON.');
		}
	}, [onDownload]);

	const errors = diagnostics.filter((d) => d.severity === 'error');
	const warnings = diagnostics.filter((d) => d.severity === 'warning');

	return (
		<Card className="overflow-hidden">
			<div className="border-line flex flex-wrap items-center gap-2 border-b px-3 py-2">
				<p className="text-fg inline-flex items-center gap-1.5 text-sm font-medium">
					<Braces size={14} /> JSON
				</p>
				<p className="text-muted text-xs">
					Questions and sections sync with the form. Title and settings stay in the form. Images are
					URLs only.
					{persistIds ? ' Question and section ids are kept so Save updates in place.' : ''}
				</p>
				<div className="ml-auto flex flex-wrap items-center gap-1.5">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={disabled}
						onClick={onFormat}
						title="Format from form"
					>
						<WrapText size={14} /> Format
					</Button>
					<Button type="button" variant="ghost" size="sm" onClick={handleCopy} title="Copy JSON">
						<Copy size={14} /> Copy
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleDownload}
						title="Download without ids (export shape)"
					>
						<Download size={14} /> Download
					</Button>
				</div>
			</div>
			<div
				className={cn('relative min-h-112', disabled && 'opacity-70')}
				onFocusCapture={onFocus}
				onBlurCapture={(e) => {
					if (e.currentTarget.contains(e.relatedTarget)) return;
					onBlur?.();
				}}
			>
				<CodeMirror
					value={jsonText}
					height="28rem"
					theme="none"
					editable={!disabled}
					readOnly={disabled}
					basicSetup={{
						lineNumbers: true,
						foldGutter: true,
						highlightActiveLine: true,
						autocompletion: false
					}}
					extensions={extensions}
					onChange={(value) => onChange?.(value)}
				/>
				{disabled && (
					<div className="bg-surface/40 absolute inset-0 flex items-center justify-center">
						<p className="text-muted border-line bg-surface rounded-md border px-3 py-2 text-xs">
							JSON editing is paused while you review AI changes.
						</p>
					</div>
				)}
			</div>
			{(errors.length > 0 || warnings.length > 0) && (
				<ul className="border-line max-h-40 space-y-1 overflow-y-auto border-t px-3 py-2 text-xs">
					{errors.map((d, i) => (
						<li key={`e-${i}`} className="text-danger">
							{formatDiagnostic(d)}
						</li>
					))}
					{warnings.map((d, i) => (
						<li key={`w-${i}`} className="text-warning">
							{formatDiagnostic(d)}
						</li>
					))}
				</ul>
			)}
			{errors.length === 0 && warnings.length === 0 && jsonText && (
				<p className="text-success border-line flex items-center gap-1 border-t px-3 py-2 text-xs">
					<Check size={12} /> Valid JSON
				</p>
			)}
		</Card>
	);
}
