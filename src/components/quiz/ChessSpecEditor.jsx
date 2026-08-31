import { useMemo } from 'react';
import { Chess } from 'chess.js';

import {
	buildPlayedLine,
	emptyChessSpec,
	normalizeChessSpec,
	userPliesFromSolution
} from '../../lib/chessHelpers';
import ChessBoard from './ChessBoard';

export default function ChessSpecEditor({ value, onChange, recordMode = false, questionType }) {
	const spec = useMemo(() => normalizeChessSpec(value) || emptyChessSpec(), [value]);
	const previewFen = useMemo(() => {
		if (!spec.fen) return 'start';
		try {
			return new Chess(spec.fen).fen();
		} catch {
			return 'start';
		}
	}, [spec.fen]);

	const setField = (patch) => onChange?.({ ...spec, ...patch });

	const boardPosition = useMemo(() => {
		if (!spec.fen) return previewFen;
		if (!spec.solution_uci.length) return previewFen;
		return buildPlayedLine(
			spec.fen,
			spec.solution_uci,
			userPliesFromSolution(spec.fen, spec.solution_uci)
		).fen;
	}, [spec, previewFen]);

	const onDrop = (sourceSquare, targetSquare) => {
		if (!recordMode || !spec.fen) return false;
		const { fen: currentFen } = buildPlayedLine(spec.fen, spec.solution_uci, []);
		const game = new Chess(currentFen);
		const result = game.move({ from: sourceSquare, to: targetSquare });
		if (!result) return false;
		const uci = `${sourceSquare}${targetSquare}${result.promotion || ''}`.toLowerCase();
		setField({ solution_uci: [...spec.solution_uci, uci] });
		return true;
	};

	return (
		<div className="border-line bg-surface-2 flex flex-col gap-3 rounded-md border p-4">
			<div className="flex flex-wrap items-end gap-3">
				<label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-sm">
					<span className="text-muted">FEN</span>
					<input
						type="text"
						value={spec.fen}
						onChange={(e) => setField({ fen: e.target.value })}
						className="border-line bg-surface text-fg rounded-md border px-3 py-2 font-mono text-xs"
						placeholder="rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm">
					<span className="text-muted">Orientation</span>
					<select
						value={spec.orientation}
						onChange={(e) => setField({ orientation: e.target.value })}
						className="border-line bg-surface text-fg rounded-md border px-3 py-2"
					>
						<option value="white">White bottom</option>
						<option value="black">Black bottom</option>
					</select>
				</label>
			</div>
			{spec.fen && (
				<ChessBoard
					id="chess-spec-editor"
					spec={spec}
					position={boardPosition}
					interactive={recordMode}
					lazy={false}
					onPieceDrop={recordMode ? onDrop : undefined}
					boardWidth={320}
				/>
			)}
			{recordMode && (
				<p className="text-muted text-xs">
					Drag pieces to record the solution line (UCI). User moves are plies for the side to move
					in the FEN.
				</p>
			)}
			{spec.solution_uci.length > 0 && (
				<p className="text-muted font-mono text-xs">solution_uci: {spec.solution_uci.join(' ')}</p>
			)}
			{questionType === 'CHS-PUZ' && spec.fen && (
				<p className="text-muted text-xs">
					User plies: {userPliesFromSolution(spec.fen, spec.solution_uci).length}
				</p>
			)}
		</div>
	);
}
