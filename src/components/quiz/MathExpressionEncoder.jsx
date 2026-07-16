import Latex from 'react-latex-next';

export default function MathExpressionEncoder({ choice }) {
	return (
		<div className="text-fg mb-2 w-full rounded p-2 text-sm">
			<Latex>{`$$${choice}$$`}</Latex>
		</div>
	);
}
