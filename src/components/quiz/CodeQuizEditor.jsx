import { useMemo } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { go } from '@codemirror/lang-go';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { AlignLeft } from 'lucide-react';

import { formatCodeStyle } from '../../lib/codeAnswersEqual';
import { useThemeStore } from '../../stores/themeStore';

function editorThemeExtension(isDark) {
	return EditorView.theme(
		{
			'&': {
				backgroundColor: 'var(--surface)',
				color: 'var(--fg)',
				fontSize: '13px',
				minHeight: '10rem'
			},
			'.cm-scroller': {
				backgroundColor: 'var(--surface)'
			},
			'.cm-content': {
				backgroundColor: 'var(--surface)',
				caretColor: 'var(--primary)',
				color: 'var(--fg)',
				fontFamily:
					'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
			},
			'.cm-gutters': {
				backgroundColor: 'var(--surface-2)',
				color: 'var(--muted)',
				borderRight: '1px solid var(--line)'
			},
			'.cm-activeLine': {
				backgroundColor: 'color-mix(in oklab, var(--primary) 8%, transparent)'
			},
			'.cm-activeLineGutter': {
				backgroundColor: 'color-mix(in oklab, var(--primary) 8%, transparent)'
			},
			'.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
				backgroundColor: 'color-mix(in oklab, var(--primary) 28%, transparent) !important'
			},
			'.cm-cursor': { borderLeftColor: 'var(--primary)' },
			'.cm-matchingBracket': { outline: '1px solid var(--primary)' }
		},
		{ dark: isDark }
	);
}

function languageExtension(language) {
	switch (String(language || '').toLowerCase()) {
		case 'python':
			return python();
		case 'javascript':
			return javascript();
		case 'typescript':
			return javascript({ typescript: true });
		case 'java':
			return java();
		case 'cpp':
			return cpp();
		case 'go':
			return go();
		case 'rust':
			return rust();
		case 'sql':
			return sql();
		default:
			return null;
	}
}

/** Shared CodeMirror surface for code quiz authoring and attempts. */
export default function CodeQuizEditor({
	value = '',
	language = 'plaintext',
	onChange,
	readOnly = false,
	minHeight = '10rem',
	placeholder = '',
	showFormatButton = true
}) {
	const theme = useThemeStore((s) => s.theme);
	const isDark = theme === 'dark';
	const extensions = useMemo(() => {
		const lang = languageExtension(language);
		const list = [editorThemeExtension(isDark), EditorView.lineWrapping];
		if (lang) list.unshift(lang);
		if (readOnly) list.push(EditorView.editable.of(false));
		return list;
	}, [language, readOnly, isDark]);

	const canFormat = showFormatButton && !readOnly;

	return (
		<div className="border-line bg-surface overflow-hidden rounded-md border" style={{ minHeight }}>
			{canFormat && (
				<div className="border-line bg-surface-2 flex items-center justify-end border-b px-2 py-1">
					<button
						type="button"
						onClick={() => onChange?.(formatCodeStyle(value))}
						className="text-muted hover:text-fg hover:bg-surface inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs font-medium"
						title="Normalize spacing (same rules used when grading)"
					>
						<AlignLeft size={12} aria-hidden />
						Format
					</button>
				</div>
			)}
			<CodeMirror
				value={value}
				height={minHeight}
				theme={isDark ? 'dark' : 'light'}
				extensions={extensions}
				editable={!readOnly}
				basicSetup={{
					lineNumbers: true,
					foldGutter: true,
					highlightActiveLine: !readOnly
				}}
				placeholder={placeholder}
				onChange={(next) => onChange?.(next)}
			/>
		</div>
	);
}
