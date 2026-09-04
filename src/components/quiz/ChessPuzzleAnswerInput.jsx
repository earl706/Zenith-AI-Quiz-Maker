import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';

import { cn } from '../../lib/format';
import {
	chessPuzzleCredit,
	formatUciList,
	normalizeChessSpec,
	positionAfterUserMoves,
	tryUserMove,
	userPliesFromSolution
} from '../../lib/chessHelpers';
import ChessBoard from './ChessBoard';
import QuestionTitle from './QuestionTitle';
import { resolveQuestionImageSrc } from '../../lib/quizImages';

function ChessPuzzleAnswerInput({
	question,
	answer,
	onChessMovesChange,
	onEnter,
	disabled = false,
	revealed = false
}) {
	const spec = useMemo(
		() => normalizeChessSpec(question?.chess_spec || question?.chessSpec),
		[question?.chess_spec, question?.chessSpec]
	);
	const questionImage = resolveQuestionImageSrc(question);
	const expectedUserMoves = useMemo(
		() => (spec ? userPliesFromSolution(spec.fen, spec.solution_uci) : []),
		[spec]
	);
	const played = answer?.userChessMoves || [];
	const [position, setPosition] = useState(spec?.fen || 'start');
	const [locked, setLocked] = useState(false);
	const [feedback, setFeedback] = useState('');
	const [selectedSquare, setSelectedSquare] = useState(null);

	const userMoveCount = played.length;
	const totalUserMoves = expectedUserMoves.length;
	const canPlay =
		!disabled && !locked && !revealed && totalUserMoves > 0 && userMoveCount < totalUserMoves;

	useEffect(() => {
		if (!spec) return;
		setPosition(positionAfterUserMoves(spec.fen, spec.solution_uci, played) || spec.fen);
		setSelectedSquare(null);
	}, [spec, played]);

	const applyMove = useCallback(
		(sourceSquare, targetSquare) => {
			if (!canPlay || !spec) return false;
			const uci = `${sourceSquare}${targetSquare}`;
			const attempt = tryUserMove(position, uci);
			if (!attempt) {
				setFeedback('Illegal move.');
				return false;
			}
			const expected = expectedUserMoves[userMoveCount];
			const matchesExpected =
				attempt.uci === expected || (expected?.length === 4 && attempt.uci === `${expected}q`);
			if (!matchesExpected) {
				setLocked(true);
				setFeedback('Incorrect.');
				setSelectedSquare(null);
				const nextPlayed = [...played, attempt.uci];
				onChessMovesChange?.(question.id, nextPlayed);
				onEnter?.({ userChessMoves: nextPlayed });
				return false;
			}
			const resolvedUci = expected || attempt.uci;
			const nextPlayed = [...played, resolvedUci];
			setPosition(positionAfterUserMoves(spec.fen, spec.solution_uci, nextPlayed));
			setFeedback('');
			setSelectedSquare(null);
			onChessMovesChange?.(question.id, nextPlayed);
			if (nextPlayed.length >= expectedUserMoves.length) {
				onEnter?.({ userChessMoves: nextPlayed });
			}
			return true;
		},
		[
			canPlay,
			spec,
			position,
			expectedUserMoves,
			userMoveCount,
			played,
			onChessMovesChange,
			question.id,
			onEnter
		]
	);

	const onDrop = useCallback(
		(sourceSquare, targetSquare) => applyMove(sourceSquare, targetSquare),
		[applyMove]
	);

	const onSquareClick = useCallback(
		({ square, piece }) => {
			if (!canPlay) return;
			if (!selectedSquare) {
				if (!piece?.pieceType) return;
				try {
					const game = new Chess(position);
					const pieceColor = piece.pieceType.startsWith('w') ? 'w' : 'b';
					if (pieceColor !== game.turn()) return;
				} catch {
					return;
				}
				setSelectedSquare(square);
				setFeedback('');
				return;
			}
			if (selectedSquare === square) {
				setSelectedSquare(null);
				return;
			}
			applyMove(selectedSquare, square);
		},
		[canPlay, selectedSquare, position, applyMove]
	);

	const squareStyles = useMemo(() => {
		if (!selectedSquare) return {};
		return {
			[selectedSquare]: {
				backgroundColor: 'rgba(255, 235, 59, 0.55)'
			}
		};
	}, [selectedSquare]);

	if (!spec) {
		return (
			<div className="border-line bg-surface rounded-md border p-6 text-center text-sm">
				Chess position missing.
			</div>
		);
	}

	const credit = chessPuzzleCredit(question, answer);

	return (
		<div className="border-line bg-surface flex w-full flex-col items-center rounded-md border p-6">
			<QuestionTitle text={question.question} className="mb-3 text-2xl" />
			{totalUserMoves > 1 && (
				<p className="text-muted mb-2 text-sm">
					Move {Math.min(userMoveCount + 1, totalUserMoves)} of {totalUserMoves}
				</p>
			)}
			{totalUserMoves === 0 && (
				<p className="text-danger mb-2 text-sm">This puzzle has no configured solution moves.</p>
			)}
			{canPlay && (
				<p className="text-muted mb-2 text-xs">
					Drag a piece or click a piece, then click its destination.
				</p>
			)}
			<ChessBoard
				id={`chess-puzzle-${question.id}`}
				spec={spec}
				position={position}
				interactive={canPlay}
				lazy
				onPieceDrop={onDrop}
				onSquareClick={onSquareClick}
				squareStyles={squareStyles}
			/>
			{questionImage && (
				<div className="mt-4 flex w-full justify-center">
					<img
						src={questionImage}
						alt="Question"
						className="h-auto max-h-[200px] w-full max-w-md object-contain"
					/>
				</div>
			)}
			{played.length > 0 && (
				<p className="text-muted mt-3 text-sm">Your moves: {formatUciList(played)}</p>
			)}
			{feedback && <p className="text-danger mt-2 text-sm">{feedback}</p>}
			{revealed && (
				<div
					className={cn(
						'mt-4 w-full rounded-md border px-3 py-2 text-sm',
						credit === 1 ? 'border-success/40 bg-success/10' : 'border-warning/40 bg-warning/10'
					)}
				>
					<p>
						Solution: <span className="font-mono">{formatUciList(expectedUserMoves)}</span>
					</p>
				</div>
			)}
		</div>
	);
}

export default memo(ChessPuzzleAnswerInput);
