import { memo, useCallback, useMemo, useRef } from 'react';
import { Chessboard } from 'react-chessboard';

import {
	turnFromFen,
	boardArrowsFromSpec,
	normalizeBoardArrows,
	normalizeChessSpec
} from '../../lib/chessHelpers';
import { useChessBoardInView } from './useChessBoardInView';

const BOARD_WIDTH = 360;

function pieceColorFromType(pieceType) {
	return String(pieceType || '').startsWith('w') ? 'w' : 'b';
}

function ChessBoard({
	spec,
	position,
	orientation,
	interactive = false,
	lazy = true,
	onPieceDrop,
	onSquareClick,
	squareStyles,
	customArrows,
	boardWidth = BOARD_WIDTH,
	id = 'chess-board'
}) {
	const normalized = useMemo(() => normalizeChessSpec(spec) || {}, [spec]);
	const fen = position || normalized.fen || 'start';
	const boardOrientation = orientation || normalized.orientation || 'white';
	const arrows = useMemo(
		() => (customArrows ? normalizeBoardArrows(customArrows) : boardArrowsFromSpec(normalized)),
		[customArrows, normalized]
	);

	const { ref: viewportRef, mounted } = useChessBoardInView({
		enabled: lazy,
		keepMountedWhenHidden: interactive
	});

	const interactiveRef = useRef(interactive);
	const onPieceDropRef = useRef(onPieceDrop);
	const onSquareClickRef = useRef(onSquareClick);
	interactiveRef.current = interactive;
	onPieceDropRef.current = onPieceDrop;
	onSquareClickRef.current = onSquareClick;

	const handlePieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
		if (!targetSquare || !interactiveRef.current) return false;
		const handler = onPieceDropRef.current;
		if (!handler) return false;
		return handler(sourceSquare, targetSquare);
	}, []);

	const handleSquareClick = useCallback((args) => {
		onSquareClickRef.current?.(args);
	}, []);

	const sideToMove = useMemo(() => turnFromFen(fen), [fen]);

	const canDragPiece = useCallback(
		({ piece }) => {
			if (!interactiveRef.current || !piece?.pieceType) return false;
			return pieceColorFromType(piece.pieceType) === sideToMove;
		},
		[sideToMove]
	);

	const boardStyle = useMemo(
		() => ({
			width: boardWidth,
			maxWidth: '100%'
		}),
		[boardWidth]
	);

	const options = useMemo(
		() => ({
			id,
			position: fen,
			boardOrientation,
			allowDragging: interactive,
			allowDrawingArrows: !interactive,
			showAnimations: false,
			animationDurationInMs: 0,
			arrows,
			squareStyles: squareStyles || {},
			boardStyle,
			canDragPiece: interactive ? canDragPiece : undefined,
			onPieceDrop: onPieceDrop ? handlePieceDrop : undefined,
			onSquareClick: onSquareClick ? handleSquareClick : undefined
		}),
		[
			id,
			fen,
			boardOrientation,
			interactive,
			arrows,
			squareStyles,
			boardStyle,
			canDragPiece,
			handlePieceDrop,
			handleSquareClick,
			onPieceDrop,
			onSquareClick
		]
	);

	return (
		<div ref={viewportRef} className="flex w-full justify-center">
			{mounted ? (
				<Chessboard options={options} />
			) : (
				<div
					className="border-line bg-surface-2 rounded-md border"
					style={{ width: boardWidth, maxWidth: '100%', aspectRatio: '1 / 1' }}
					aria-hidden
				/>
			)}
		</div>
	);
}

export default memo(ChessBoard);
