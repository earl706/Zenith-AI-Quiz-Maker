import { memo } from 'react';

import ChessBoard from './ChessBoard';
import { hasChessBoard, normalizeChessSpec } from '../../lib/chessHelpers';

function QuestionChessBoard({ question, className = 'mb-4', boardWidth }) {
	if (!hasChessBoard(question)) return null;
	const spec = normalizeChessSpec(question.chess_spec || question.chessSpec);
	if (!spec) return null;
	return (
		<div className={className}>
			<ChessBoard
				id={`chess-readonly-${question.id}`}
				spec={spec}
				lazy
				boardWidth={boardWidth}
			/>
		</div>
	);
}

export default memo(QuestionChessBoard);
