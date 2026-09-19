import { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

const HAS_INLINE_MATH = /\$/;

/**
 * Prose plus author-embedded $...$ / $$...$$ as KaTeX.
 * Does not wrap undelimited LaTeX; that stays visible as source.
 */
export default function InlineLatexText({ text, className = '', as: Tag = 'p' }) {
	const value = text == null ? '' : String(text);
	const useInlineMath = useMemo(() => HAS_INLINE_MATH.test(value), [value]);

	if (!value.trim()) return null;

	if (!useInlineMath) {
		return <Tag className={className}>{value}</Tag>;
	}

	try {
		return (
			<Tag className={className}>
				<Latex>{value}</Latex>
			</Tag>
		);
	} catch {
		return <Tag className={className}>{value}</Tag>;
	}
}
