import { Chess } from 'chess.js';

export const CHESS_PUZZLE_TYPE = 'CHS-PUZ';
export const CHESS_USER_MOVE_MAX = 20;
export const CHESS_SOLUTION_MAX_PLIES = 40;

export function isChessPuzzle(questionType) {
	return String(questionType || '') === CHESS_PUZZLE_TYPE;
}

/** CHS-PUZ or legacy quiz rows that have solution_uci but wrong question_type. */
export function isChessPuzzleQuestion(question) {
	if (isChessPuzzle(question?.question_type)) return true;
	const spec = normalizeChessSpec(question?.chess_spec || question?.chessSpec);
	return (spec?.solution_uci?.length ?? 0) > 0;
}

export function hasChessBoard(question) {
	const spec = question?.chess_spec || question?.chessSpec;
	return Boolean(spec?.fen);
}

export function normalizeChessSpec(raw) {
	if (!raw || typeof raw !== 'object') return null;
	const fen = String(raw.fen || '').trim();
	if (!fen) return null;
	const orientation =
		String(raw.orientation || 'white').toLowerCase() === 'black' ? 'black' : 'white';
	const solution = raw.solution_uci || raw.solutionUci || [];
	const solution_uci = Array.isArray(solution)
		? solution
				.map((m) =>
					String(m || '')
						.trim()
						.toLowerCase()
				)
				.filter(Boolean)
		: [];
	const arrows = Array.isArray(raw.arrows) ? raw.arrows : [];
	return { fen, orientation, solution_uci, arrows };
}

export function emptyChessSpec() {
	return { fen: '', orientation: 'white', solution_uci: [], arrows: [] };
}

/** Side to move from FEN without constructing chess.js (cheaper for drag checks). */
export function turnFromFen(fen) {
	const part = String(fen || '')
		.trim()
		.split(/\s+/)[1];
	return part === 'b' ? 'b' : 'w';
}

function loadChessGame(fen) {
	try {
		return new Chess(String(fen || '').trim());
	} catch {
		return null;
	}
}

function applyUciMove(game, uci) {
	const move = String(uci || '')
		.trim()
		.toLowerCase();
	if (!move) return null;
	const from = move.slice(0, 2);
	const to = move.slice(2, 4);
	const promotion = move.length > 4 ? move[4] : undefined;
	try {
		return game.move({ from, to, promotion }) || null;
	} catch {
		return null;
	}
}

function userMoveMatchesExpected(played, expected) {
	if (!played || !expected) return false;
	if (played === expected) return true;
	return expected.length === 4 && played === `${expected}q`;
}

export function userPliesFromSolution(fen, solutionUci) {
	const game = loadChessGame(fen);
	if (!game) return [];
	const userColor = game.turn();
	const userMoves = [];
	for (const uci of solutionUci || []) {
		const move = String(uci || '')
			.trim()
			.toLowerCase();
		if (!move) continue;
		if (game.turn() === userColor) userMoves.push(move);
		if (!applyUciMove(game, move)) break;
	}
	return userMoves;
}

export function uciFromSquares(from, to, promotion) {
	return `${from}${to}${promotion || ''}`.toLowerCase();
}

export function buildPlayedLine(fen, solutionUci, userMoves) {
	const game = loadChessGame(fen);
	if (!game) return { fen: String(fen || ''), line: [] };
	const userColor = game.turn();
	const expectedUser = userPliesFromSolution(fen, solutionUci);
	const line = [];
	let userIdx = 0;
	let onSolution = true;

	for (const sol of solutionUci || []) {
		const uci = String(sol || '')
			.trim()
			.toLowerCase();
		if (!uci) continue;
		let moveUci;
		if (game.turn() === userColor) {
			if (userIdx >= (userMoves || []).length) break;
			moveUci = String(userMoves[userIdx] || '')
				.trim()
				.toLowerCase();
			userIdx += 1;
			if (!userMoveMatchesExpected(moveUci, expectedUser[userIdx - 1])) {
				// Snap back: do not apply the wrong move to the board.
				onSolution = false;
				break;
			}
		} else {
			if (!onSolution) break;
			moveUci = uci;
		}
		if (!applyUciMove(game, moveUci)) break;
		line.push(moveUci);
	}

	if (!onSolution) {
		return { fen: game.fen(), line };
	}

	// Auto-play opponent replies after the latest correct user move.
	let solCursor = line.length;
	while (solCursor < (solutionUci || []).length && game.turn() !== userColor) {
		const uci = String(solutionUci[solCursor] || '')
			.trim()
			.toLowerCase();
		solCursor += 1;
		if (!uci) continue;
		if (!applyUciMove(game, uci)) break;
		line.push(uci);
	}
	return { fen: game.fen(), line };
}

export function positionAfterUserMoves(fen, solutionUci, userMoves) {
	return buildPlayedLine(fen, solutionUci, userMoves).fen;
}

export function tryUserMove(fen, uci) {
	const game = loadChessGame(fen);
	if (!game) return null;
	const move = String(uci || '')
		.trim()
		.toLowerCase();
	if (!move) return null;
	const from = move.slice(0, 2);
	const to = move.slice(2, 4);
	let promotion = move.length > 4 ? move[4] : undefined;
	let result = applyUciMove(game, move);
	if (!result && !promotion) {
		const piece = game.get(from);
		if (piece?.type === 'p') {
			result = applyUciMove(game, `${from}${to}q`);
			if (result) promotion = 'q';
		}
	}
	if (!result) return null;
	const resolvedUci = `${from}${to}${promotion || ''}`.toLowerCase();
	return { fen: game.fen(), san: result.san, uci: resolvedUci };
}

export function chessPuzzleAnswered(question, answer) {
	if (!isChessPuzzleQuestion(question)) return false;
	const spec = normalizeChessSpec(question?.chess_spec || question?.chessSpec);
	if (!spec) return false;
	const expected = userPliesFromSolution(spec.fen, spec.solution_uci);
	if (!expected.length) return false;
	const played = (answer?.userChessMoves || [])
		.map((m) =>
			String(m || '')
				.trim()
				.toLowerCase()
		)
		.filter(Boolean);
	if (!played.length) return false;
	for (let i = 0; i < played.length; i += 1) {
		if (i >= expected.length) return true;
		if (!userMoveMatchesExpected(played[i], expected[i])) return true;
	}
	return played.length >= expected.length;
}

/** Binary credit: 1 only when every user ply matches; first error or incomplete = 0. */
export function chessPuzzleCredit(question, answer) {
	if (!isChessPuzzleQuestion(question)) return 0;
	const spec = normalizeChessSpec(question?.chess_spec || question?.chessSpec);
	if (!spec) return 0;
	const expected = userPliesFromSolution(spec.fen, spec.solution_uci);
	if (!expected.length) return 0;
	const played = (answer?.userChessMoves || [])
		.map((m) =>
			String(m || '')
				.trim()
				.toLowerCase()
		)
		.filter(Boolean);
	if (played.length !== expected.length) return 0;
	for (let i = 0; i < expected.length; i += 1) {
		if (!userMoveMatchesExpected(played[i], expected[i])) return 0;
	}
	return 1;
}

export function formatUciList(moves) {
	return (moves || []).join(' ');
}

export function boardArrowsFromSpec(spec) {
	const arrows = spec?.arrows || [];
	return arrows
		.filter((a) => (a?.from || a?.start) && (a?.to || a?.end))
		.map((a) => ({
			startSquare: String(a.from || a.start || '')
				.trim()
				.toLowerCase(),
			endSquare: String(a.to || a.end || '')
				.trim()
				.toLowerCase(),
			color: a.color || 'green'
		}));
}

export function normalizeBoardArrows(raw) {
	if (!raw?.length) return [];
	if (raw[0]?.startSquare && raw[0]?.endSquare) return raw;
	if (Array.isArray(raw[0])) {
		return raw.map(([from, to, color]) => ({
			startSquare: String(from || '')
				.trim()
				.toLowerCase(),
			endSquare: String(to || '')
				.trim()
				.toLowerCase(),
			color: color || 'green'
		}));
	}
	return boardArrowsFromSpec({ arrows: raw });
}
