import { and, assign, setup } from 'xstate';
import {
  Board,
  ChessContext,
  ChessEvents,
  MoveRecord,
  Piece,
  PieceType,
  Player,
  Position
} from './chessTypes';

export const defaultInitialChessContext: ChessContext = { // Add export here
  board: [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
  ],
  currentPlayer: 'white',
  selectedPiece: null,
  possibleMoves: [],
  error: null,
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  gameOver: false,
  winner: null,
  castlingRights: {
    white: { kingSide: true, queenSide: true },
    black: { kingSide: true, queenSide: true },
  },
  enPassantTarget: null,
  awaitingPromotionChoice: null,
  moveHistory: [],
};

function getPieceAt(board: Board, position: Position): Piece | null {
  if (!board || !position ||
      position.row < 0 || position.row >= board.length ||
      !board[position.row] || 
      position.col < 0 || position.col >= board[position.row].length) {
    return null; 
  }
  const piece = board[position.row][position.col];
  return piece === '' ? null : piece; 
}

function getPieceColor(piece: Piece): Player | null {
  if (!piece) return null;
  return piece.startsWith('w') ? 'white' : piece.startsWith('b') ? 'black' : null;
}

function getPieceType(piece: Piece): PieceType | null {
  if (!piece || piece.length < 2) return null;
  const typeChar = piece.substring(1).toUpperCase();
  if (Object.values(PieceType).includes(typeChar as PieceType)) {
    return typeChar as PieceType;
  }
  return null; 
}

function createBoardWithMove(board: Board, from: Position, to: Position, piece: Piece): Board {
  const newBoard = board.map((row: Piece[]) => [...row]);
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = '';
  return newBoard;
}

export function isPositionOnBoard(position: Position): boolean {
  return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8;
}

export function isValidMoveInternal(
  board: Board,
  from: Position,
  to: Position,
  player: Player, 
  castlingRights: ChessContext['castlingRights'],
  forAttackCheck: boolean = false, 
  enPassantTarget: Position | null = null,
  awaitingPromotionChoice: Position | null = null
): boolean {
  if (awaitingPromotionChoice) return false; 
  if (!isPositionOnBoard(from) || !isPositionOnBoard(to)) {
    return false;
  }
  const pieceOnFromSquare = getPieceAt(board, from);
  if (!pieceOnFromSquare) {
    return false;
  }
  const pieceOwnerColor = getPieceColor(pieceOnFromSquare); 
  const pieceType = getPieceType(pieceOnFromSquare);
  if (!pieceType || !pieceOwnerColor) {
    return false; 
  }
  if (!forAttackCheck && pieceOwnerColor !== player) {
    return false;
  }
  const targetPiece = getPieceAt(board, to);
  const targetPieceColor = targetPiece ? getPieceColor(targetPiece) : null;
  if (targetPieceColor === player) {
    return false;
  }
  if (pieceType === PieceType.Pawn) {
    const direction = player === 'white' ? -1 : 1; 
    const startRow = from.row;
    const startCol = from.col;
    const targetRow = to.row;
    const targetCol = to.col;
    if (Math.abs(targetCol - startCol) === 1 && targetRow === startRow + direction) {
        if (forAttackCheck) {
            return true;
        }
        if (targetPiece && targetPieceColor && targetPieceColor !== player) {
            if (targetRow === (player === 'white' ? 0 : 7)) {
                return true; 
            }
            return true; 
        }
        if (!forAttackCheck && enPassantTarget && targetRow === enPassantTarget.row && targetCol === enPassantTarget.col) {
            const fifthRank = player === 'white' ? 3 : 4;
            if (startRow === fifthRank) {
                 return true; 
            }
        }
        return false; 
    }
    if (targetCol === startCol && !forAttackCheck) { 
        if (targetRow === startRow + direction && !targetPiece) { 
            if (targetRow === (player === 'white' ? 0 : 7)) {
                return true; 
            }
            return true; 
        }
        const initialPawnRow = player === 'white' ? 6 : 1;
        if (startRow === initialPawnRow && targetRow === startRow + 2 * direction && !targetPiece) {
            if (!getPieceAt(board, { row: startRow + direction, col: startCol })) {
                return true; 
            }
        }
    }
    return false; 
  }
  if (pieceType === PieceType.Rook) {
    if (from.row !== to.row && from.col !== to.col) {
      return false;
    }
    if (from.row === to.row) {
      const step = to.col > from.col ? 1 : -1;
      for (let c = from.col + step; c !== to.col; c += step) {
        if (getPieceAt(board, {row: from.row, col: c}) !== null) return false; 
      }
    } else {
      const step = to.row > from.row ? 1 : -1;
      for (let r = from.row + step; r !== to.row; r += step) {
        if (getPieceAt(board, {row: r, col: from.col}) !== null) return false; 
      }
    }
    return true;
  }
  if (pieceType === PieceType.Knight) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }
  if (pieceType === PieceType.Bishop) {
    if (Math.abs(to.row - from.row) !== Math.abs(to.col - from.col)) {
      return false;
    }
    const rowStep = to.row > from.row ? 1 : -1;
    const colStep = to.col > from.col ? 1 : -1;
    let r = from.row + rowStep;
    let c = from.col + colStep;
    while (r !== to.row) {
      if (getPieceAt(board, {row: r, col: c}) !== null) return false; 
      r += rowStep;
      c += colStep;
    }
    return true;
  }
  if (pieceType === PieceType.Queen) {
    const isRookMove = (from.row === to.row || from.col === to.col);
    const isBishopMove = (Math.abs(to.row - from.row) === Math.abs(to.col - from.col));
    if (!isRookMove && !isBishopMove) return false;
    if (isRookMove) {
      if (from.row === to.row) {
        const step = to.col > from.col ? 1 : -1;
        for (let col = from.col + step; col !== to.col; col += step) {
          if (getPieceAt(board, {row: from.row, col: col}) !== null) return false; 
        }
      } else {
        const step = to.row > from.row ? 1 : -1;
        for (let row = from.row + step; row !== to.row; row += step) {
          if (getPieceAt(board, {row: row, col: from.col}) !== null) return false; 
        }
      }
    } else { 
      const rowStep = to.row > from.row ? 1 : -1;
      const colStep = to.col > from.col ? 1 : -1;
      let curRow = from.row + rowStep;
      let curCol = from.col + colStep;
      while (curRow !== to.row) {
        if (getPieceAt(board, {row: curRow, col: curCol}) !== null) return false; 
        curRow += rowStep;
        curCol += colStep;
      }
    }
    return true;
  }
  if (pieceType === PieceType.King) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0)) {
      return true; 
    }
    if (forAttackCheck) {
        return false; 
    }
    const kingRowForCastling = player === 'white' ? 7 : 0;
    const opponentColor = player === 'white' ? 'black' : 'white';
    const currentPlayerCastlingRights = player === 'white' ? castlingRights.white : castlingRights.black;
    // This check was preventing castling from being evaluated correctly.
    // if (from.row !== kingRowForCastling || from.col !== 4) {
    //     return false;
    // }
    if (to.row === kingRowForCastling && to.col === 6) { // King-side castling
      if (!currentPlayerCastlingRights.kingSide) {
        return false;
      }
      const pathClearKingSide = getPieceAt(board, {row: kingRowForCastling, col: 5}) === null && 
                                getPieceAt(board, {row: kingRowForCastling, col: 6}) === null;
      if (!pathClearKingSide) {
        return false;
      }
      const isSafeKingSide =
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 4 }, opponentColor, enPassantTarget, castlingRights) && 
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 5 }, opponentColor, enPassantTarget, castlingRights) && 
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 6 }, opponentColor, enPassantTarget, castlingRights);   
      return isSafeKingSide;
    }
    if (to.row === kingRowForCastling && to.col === 2) { // Queen-side castling
      if (!currentPlayerCastlingRights.queenSide) {
        return false;
      }
      const pathClearQueenSide =
        getPieceAt(board, {row: kingRowForCastling, col: 3}) === null &&
        getPieceAt(board, {row: kingRowForCastling, col: 2}) === null &&
        getPieceAt(board, {row: kingRowForCastling, col: 1}) === null;
      if (!pathClearQueenSide) {
        return false;
      }
      const isSafeQueenSide =
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 4 }, opponentColor, enPassantTarget, castlingRights) && 
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 3 }, opponentColor, enPassantTarget, castlingRights) && 
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 2 }, opponentColor, enPassantTarget, castlingRights);   
      return isSafeQueenSide;
    }
    return false; 
  }
  return false; 
}

function isPositionUnderAttack( 
  board: Board,
  targetPosition: Position,
  attackerColor: Player, 
  enPassantTarget: Position | null, 
  castlingRights: ChessContext['castlingRights']
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piecePos = { row: r, col: c };
      const piece = getPieceAt(board, piecePos);
      if (piece && getPieceColor(piece) === attackerColor) {
        // For King attacks, use simplified check, not full isValidMoveInternal to avoid recursion on castling checks
        if (getPieceType(piece) === PieceType.King) {
            const rowDiff = Math.abs(targetPosition.row - piecePos.row);
            const colDiff = Math.abs(targetPosition.col - piecePos.col);
            if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0)) {
                return true;
            }
        } else if (isValidMoveInternal(board, piecePos, targetPosition, attackerColor, castlingRights, true, enPassantTarget, null)) { 
          return true;
        }
      }
    }
  }
  return false;
}

function findKingPosition(board: Board, player: Player): Position | null {
  const kingPiece = player === 'white' ? 'wK' : 'bK';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === kingPiece) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function isKingInCheck(
  board: Board,
  playerColor: Player, 
  enPassantTarget: Position | null,
  castlingRights: ChessContext['castlingRights']
): boolean {
  const kingPosition = findKingPosition(board, playerColor);
  if (!kingPosition) {
    // This case should ideally not happen in a valid game state
    // console.error(\`King not found for player \${playerColor}\`);
    return false; 
  }
  const opponentColor = playerColor === 'white' ? 'black' : 'white';
  return isPositionUnderAttack(board, kingPosition, opponentColor, enPassantTarget, castlingRights); 
}

export function getPossibleMoves(
  board: Board,
  piecePosition: Position,
  player: Player, 
  castlingRights: ChessContext['castlingRights'],
  enPassantTarget: Position | null,
  awaitingPromotionChoice: Position | null 
): Position[] {
  if (awaitingPromotionChoice) return []; 
  const piece = getPieceAt(board, piecePosition);
  if (!piece || getPieceColor(piece) !== player) {
    return [];
  }
  const possibleMoves: Position[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const targetPosition = { row: r, col: c };
      if (isValidMoveInternal(board, piecePosition, targetPosition, player, castlingRights, false, enPassantTarget, awaitingPromotionChoice)) {
        // After finding a valid move, ensure it doesn't leave the king in check
        const tempBoard = createBoardWithMove(board, piecePosition, targetPosition, piece);
        // Create a temporary castling rights object that reflects the state *after* the potential move
        let tempCastlingRights = JSON.parse(JSON.stringify(castlingRights)) as ChessContext['castlingRights'];
        const movedPieceType = getPieceType(piece);

        if (movedPieceType === PieceType.King) {
            if (player === 'white') {
                tempCastlingRights.white.kingSide = false;
                tempCastlingRights.white.queenSide = false;
            } else {
                tempCastlingRights.black.kingSide = false;
                tempCastlingRights.black.queenSide = false;
            }
        } else if (movedPieceType === PieceType.Rook) {
            const initialRookRow = player === 'white' ? 7 : 0;
            if (piecePosition.row === initialRookRow) {
                if (piecePosition.col === 0) { // Queen-side rook
                    if (player === 'white') tempCastlingRights.white.queenSide = false;
                    else tempCastlingRights.black.queenSide = false;
                } else if (piecePosition.col === 7) { // King-side rook
                    if (player === 'white') tempCastlingRights.white.kingSide = false;
                    else tempCastlingRights.black.kingSide = false;
                }
            }
        }
        
        // For en-passant, the target pawn is removed, this needs to be reflected in tempBoard for check validation
        let tempEnPassantTarget = enPassantTarget;
        if (movedPieceType === PieceType.Pawn) {
            const movedRows = Math.abs(targetPosition.row - piecePosition.row);
            if (movedRows === 2) {
                // This move sets up a potential en passant for the opponent next turn
                // For *this* turn's check validation, this new enPassantTarget isn't relevant yet.
            } else if (enPassantTarget && 
                       targetPosition.row === enPassantTarget.row &&
                       targetPosition.col === enPassantTarget.col &&
                       movedRows === 1 && 
                       Math.abs(targetPosition.col - piecePosition.col) === 1) {
                // This is an en-passant capture, remove the captured pawn from tempBoard
                const capturedPawnRow = player === 'white' ? targetPosition.row + 1 : targetPosition.row - 1;
                tempBoard[capturedPawnRow][targetPosition.col] = ''; 
            }
             tempEnPassantTarget = null; // En passant target is only valid for one move
        } else {
            tempEnPassantTarget = null; // Non-pawn moves clear en-passant target for next turn's check calc
        }


        if (!isKingInCheck(tempBoard, player, tempEnPassantTarget, tempCastlingRights)) {
          possibleMoves.push(targetPosition);
        }
      }
    }
  }
  return possibleMoves;
}

export function getGameStatus(
  board: Board,
  currentPlayer: Player,
  castlingRights: ChessContext['castlingRights'],
  enPassantTarget: Position | null,
  awaitingPromotionChoice: Position | null
): {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
} {
  const check = isKingInCheck(board, currentPlayer, enPassantTarget, castlingRights);
  let checkmate = false;
  let stalemate = false;
  let hasLegalMoves = false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piecePosition = { row: r, col: c };
      const piece = getPieceAt(board, piecePosition);
      if (piece && getPieceColor(piece) === currentPlayer) {
        const possibleMovesForPiece = getPossibleMoves(board, piecePosition, currentPlayer, castlingRights, enPassantTarget, awaitingPromotionChoice);
        if (possibleMovesForPiece.length > 0) {
          hasLegalMoves = true;
          break; 
        }
      }
    }
    if (hasLegalMoves) break;
  }

  if (!hasLegalMoves) {
    if (check) {
      checkmate = true;
    } else {
      stalemate = true;
    }
  }
  return { isCheck: check, isCheckmate: checkmate, isStalemate: stalemate };
}

function generateAlgebraicNotation(
  board: Board, 
  from: Position,
  to: Position,
  piece: Piece, 
  isCapture: boolean,
  isCheck: boolean,
  isCheckmate: boolean,
  promotedTo: PieceType | null,
  wasCastling: { kingSide: boolean, queenSide: boolean } = { kingSide: false, queenSide: false }
): string {
  const pieceType = getPieceType(piece);
  const toFile = String.fromCharCode('a'.charCodeAt(0) + to.col);
  const toRank = (8 - to.row).toString();
  const fromFile = String.fromCharCode('a'.charCodeAt(0) + from.col); 
  // const fromRank = (8 - from.row).toString(); // Not always needed

  if (wasCastling.kingSide) {
    return isCheckmate ? 'O-O#' : isCheck ? 'O-O+' : 'O-O';
  }
  if (wasCastling.queenSide) {
    return isCheckmate ? 'O-O-O#' : isCheck ? 'O-O-O+' : 'O-O-O';
  }

  let notation = '';
  if (pieceType === PieceType.Pawn) {
    if (isCapture) {
      notation += fromFile + 'x'; 
    }
  } else {
    notation += pieceType; 
    // Add disambiguation if needed (not fully implemented here)
    // For example, if two knights can move to the same square.
    // This would involve checking other pieces of the same type that can move to 'to'.
    // For simplicity, this is omitted. A full implementation would check:
    // 1. Other pieces of same type and color.
    // 2. If they can also move to 'to'.
    // 3. If ambiguity exists, add fromFile, or fromRank, or both.
    if (isCapture) {
      notation += 'x';
    }
  }
  notation += toFile + toRank; 
  if (promotedTo) {
    notation += '=' + promotedTo; 
  }
  if (isCheckmate) {
    notation += '#';
  } else if (isCheck) {
    notation += '+';
  }
  return notation;
}

const machineConfig = {
  initial: 'playing',
  context: ({ input }: { input: unknown }) => {
    // Deep clone default context to ensure no shared references
    const baseContext = JSON.parse(JSON.stringify(defaultInitialChessContext));
    let mergedContext: ChessContext;

    // Type guard to check if input is a valid ChessContext or Partial<ChessContext>
    if (typeof input === 'object' && input !== null) {
      const partialInput = input as Partial<ChessContext>; // Cast to Partial<ChessContext>
      // Merge input into a copy of the base context.
      mergedContext = {
        ...baseContext,
        ...partialInput,
        board: partialInput.board ? JSON.parse(JSON.stringify(partialInput.board)) : baseContext.board,
        castlingRights: partialInput.castlingRights ? JSON.parse(JSON.stringify(partialInput.castlingRights)) : baseContext.castlingRights,
        moveHistory: partialInput.moveHistory ? JSON.parse(JSON.stringify(partialInput.moveHistory)) : baseContext.moveHistory,
        selectedPiece: partialInput.selectedPiece !== undefined ? partialInput.selectedPiece : baseContext.selectedPiece,
        possibleMoves: partialInput.possibleMoves ? JSON.parse(JSON.stringify(partialInput.possibleMoves)) : baseContext.possibleMoves,
        error: partialInput.error !== undefined ? partialInput.error : baseContext.error,
        awaitingPromotionChoice: partialInput.awaitingPromotionChoice !== undefined ? partialInput.awaitingPromotionChoice : baseContext.awaitingPromotionChoice,
        currentPlayer: partialInput.currentPlayer || baseContext.currentPlayer,
        enPassantTarget: partialInput.enPassantTarget !== undefined ? partialInput.enPassantTarget : baseContext.enPassantTarget,
      };
    } else {
      // No valid input, use the deep-copied default context
      mergedContext = baseContext;
    }

    const gameStatus = getGameStatus(
      mergedContext.board,
      mergedContext.currentPlayer,
      mergedContext.castlingRights,
      mergedContext.enPassantTarget,
      mergedContext.awaitingPromotionChoice
    );

    return {
      ...mergedContext,
      isCheck: gameStatus.isCheck,
      isCheckmate: gameStatus.isCheckmate,
      isStalemate: gameStatus.isStalemate,
      gameOver: gameStatus.isCheckmate || gameStatus.isStalemate,
      winner: gameStatus.isCheckmate ? (mergedContext.currentPlayer === 'white' ? 'black' : 'white') : null,
    } as ChessContext; // Ensure the return type matches ChessContext
  },
  states: {
    playing: {
      on: {
        SELECT_PIECE: {
          actions: 'selectPieceAction',
          guard: 'isValidSelectionGuard',
        },
        MOVE_PIECE: [
          {
            target: 'awaitingPromotion',
            actions: 'movePieceAction',
            guard: and(['isValidMoveTargetGuard', 'isPromotingPawnMoveGuard']),
          },
          {
            actions: 'movePieceAction',
            guard: 'isValidMoveTargetGuard',
          }
        ],
        CHOOSE_PROMOTION_PIECE: {
          target: 'playing', 
          actions: 'promotePawnAction',
          guard: 'isAwaitingPromotionChoiceGuard', 
        },
        RESET_GAME: {
          actions: 'resetGameToInitialAction',
          target: 'playing' 
        }
      },
      always: [
        { target: 'checkmate', guard: ({context}: {context: ChessContext}) => context.isCheckmate && context.gameOver },
        { target: 'stalemate', guard: ({context}: {context: ChessContext}) => context.isStalemate && context.gameOver },
      ]
    },
    awaitingPromotion: { 
      on: {
        CHOOSE_PROMOTION_PIECE: {
          target: 'playing',
          actions: 'promotePawnAction',
        },
        SELECT_PIECE: { 
            actions: 'setPromotionErrorAction'
        },
        MOVE_PIECE: { 
            actions: 'setPromotionErrorAction'
        }
      },
      always: [ 
        { target: 'checkmate', guard: ({context}: {context: ChessContext}) => context.isCheckmate && context.gameOver },
        { target: 'stalemate', guard: ({context}: {context: ChessContext}) => context.isStalemate && context.gameOver },
      ]
    },
    checkmate: {
      type: 'final' as const,
    },
    stalemate: {
      type: 'final' as const,
    }
  }
} as const; // Add 'as const' here

export const chessMachine = setup({
  types: {
    context: {} as ChessContext,
    events: {} as ChessEvents,
    // It's often better to define input type for the machine if it expects specific input
    // However, for this case, we'll ensure the context function handles undefined input.
  },
  actions: {
    selectPieceAction: assign(({ context, event }: { context: ChessContext; event: ChessEvents }) => {
      if (event.type !== 'SELECT_PIECE') return {};
      const { position } = event;
      const piece = getPieceAt(context.board, position); 

      // if (context.awaitingPromotionChoice) { // This check is better handled by states
      //   return { error: "Choose a promotion piece first." };
      // }

      if (context.selectedPiece && context.selectedPiece.row === position.row && context.selectedPiece.col === position.col) {
        return { selectedPiece: null, possibleMoves: [], error: null }; // Deselect
      }
      if (!piece || getPieceColor(piece) !== context.currentPlayer) {
        return { 
          selectedPiece: null, 
          possibleMoves: [], 
          error: "Cannot select opponent\\'s piece or empty square." 
        };
      }
      const possibleMoves = getPossibleMoves(context.board, position, context.currentPlayer, context.castlingRights, context.enPassantTarget, context.awaitingPromotionChoice);
      return { selectedPiece: position, possibleMoves, error: null };
    }),
    movePieceAction: assign(({ context, event }:{ context: ChessContext; event: ChessEvents }) => {
      if (event.type !== 'MOVE_PIECE' || !context.selectedPiece) {
        // This should ideally be caught by guards, but as a fallback:
        return { error: "Invalid move event or no piece selected." };
      }
      const fromPos = context.selectedPiece;
      const toPos = event.position;
      const player = context.currentPlayer;
      const pieceBeingMoved = getPieceAt(context.board, fromPos);

      if (!pieceBeingMoved) {
        return { error: "No piece at selected position." }; 
      }

      const boardBeforeMove = context.board.map((row: Piece[]) => [...row]);
      const castlingRightsBeforeMove = JSON.parse(JSON.stringify(context.castlingRights));
      const enPassantTargetBeforeMove = context.enPassantTarget ? { ...context.enPassantTarget } : null;
      
      let newBoard = createBoardWithMove(context.board, fromPos, toPos, pieceBeingMoved);
      const pieceTypeMoved = getPieceType(pieceBeingMoved);
      let newAwaitingPromotionChoice: Position | null = null;
      const newCastlingRights = JSON.parse(JSON.stringify(context.castlingRights)) as ChessContext['castlingRights'];
      let newEnPassantTarget: Position | null = null; 
      let wasEnPassantCapture = false;

      if (pieceTypeMoved === PieceType.Pawn) {
        const movedRows = Math.abs(toPos.row - fromPos.row);
        if (movedRows === 2) {
          newEnPassantTarget = { row: (fromPos.row + toPos.row) / 2, col: fromPos.col };
        }
        // En-passant capture
        if (context.enPassantTarget && 
            toPos.row === context.enPassantTarget.row &&
            toPos.col === context.enPassantTarget.col &&
            movedRows === 1 && 
            Math.abs(toPos.col - fromPos.col) === 1) { 
          const capturedPawnRow = player === 'white' ? toPos.row + 1 : toPos.row - 1;
          newBoard[capturedPawnRow][toPos.col] = ''; 
          wasEnPassantCapture = true;
        }
        const promotionRank = player === 'white' ? 0 : 7;
        if (toPos.row === promotionRank) {
          newAwaitingPromotionChoice = { ...toPos }; // Signal that promotion is pending
        }
      } else {
        newEnPassantTarget = null; // Any other move clears en passant target
      }

      // Update castling rights
      if (pieceTypeMoved === PieceType.King) {
        if (player === 'white') {
          newCastlingRights.white.kingSide = false;
          newCastlingRights.white.queenSide = false;
        } else {
          newCastlingRights.black.kingSide = false;
          newCastlingRights.black.queenSide = false;
        }
      } else if (pieceTypeMoved === PieceType.Rook) {
        const initialRookRow = player === 'white' ? 7 : 0;
        if (fromPos.row === initialRookRow) {
          if (fromPos.col === 0) { // Queen-side rook moved
            if (player === 'white') newCastlingRights.white.queenSide = false;
            else newCastlingRights.black.queenSide = false;
          } else if (fromPos.col === 7) { // King-side rook moved
            if (player === 'white') newCastlingRights.white.kingSide = false;
            else newCastlingRights.black.kingSide = false;
          }
        }
      }
      // If a rook is captured, update castling rights for the opponent
      const pieceOnToSquareOriginalBoard = getPieceAt(boardBeforeMove, toPos); 
      if (pieceOnToSquareOriginalBoard) {
          const capturedPieceType = getPieceType(pieceOnToSquareOriginalBoard);
          const capturedPieceColor = getPieceColor(pieceOnToSquareOriginalBoard);
          if (capturedPieceType === PieceType.Rook) {
              const opponentInitialRookRow = capturedPieceColor === 'white' ? 7 : 0;
              if (toPos.row === opponentInitialRookRow) {
                  if (toPos.col === 0) { // Opponent's queen-side rook captured
                      if (capturedPieceColor === 'white') newCastlingRights.white.queenSide = false;
                      else newCastlingRights.black.queenSide = false;
                  } else if (toPos.col === 7) { // Opponent's king-side rook captured
                      if (capturedPieceColor === 'white') newCastlingRights.white.kingSide = false;
                      else newCastlingRights.black.kingSide = false;
                  }
              }
          }
      }
      
      let actualWasCastling = { kingSide: false, queenSide: false };
      if (pieceTypeMoved === PieceType.King && Math.abs(toPos.col - fromPos.col) === 2) {
        const kingRow = fromPos.row;
        let rookOriginalPos: Position, rookNewPos: Position;
        if (toPos.col === 6) { // King-side castling
          actualWasCastling.kingSide = true;
          rookOriginalPos = { row: kingRow, col: 7 };
          rookNewPos = { row: kingRow, col: 5 };
        } else { // Queen-side castling (toPos.col === 2)
          actualWasCastling.queenSide = true;
          rookOriginalPos = { row: kingRow, col: 0 };
          rookNewPos = { row: kingRow, col: 3 };
        }
        const rookPiece = getPieceAt(boardBeforeMove, rookOriginalPos); // Rook should be on original board
        if (rookPiece) {
          newBoard[rookNewPos.row][rookNewPos.col] = rookPiece;
          newBoard[rookOriginalPos.row][rookOriginalPos.col] = '';
        }
      }

      const opponentPlayer = player === 'white' ? 'black' : 'white';
      // If awaiting promotion, the current player doesn't change yet.
      // Game status should be checked for the *next* player if not promoting.
      const playerForStatusCheck = newAwaitingPromotionChoice ? player : opponentPlayer;
      const gameStatusAfterMove = getGameStatus(
        newBoard,
        playerForStatusCheck, // Check status for the player whose turn it would be
        newCastlingRights,
        newEnPassantTarget, // This is the target for the *next* player
        null // Promotion choice is handled by the newAwaitingPromotionChoice flag
      );
      
      let actualIsCapture = (pieceOnToSquareOriginalBoard !== null && getPieceColor(pieceOnToSquareOriginalBoard) !== player) || wasEnPassantCapture;

      const moveNotationString = generateAlgebraicNotation(
        boardBeforeMove, 
        fromPos,
        toPos,
        pieceBeingMoved,
        actualIsCapture,
        // Check/checkmate status is for the opponent *after* this move
        // If current player is white, and white moves, check status is for black.
        getGameStatus(newBoard, opponentPlayer, newCastlingRights, newEnPassantTarget, null).isCheck, 
        getGameStatus(newBoard, opponentPlayer, newCastlingRights, newEnPassantTarget, null).isCheckmate,
        null, // Promotion piece type is added later by promotePawnAction
        actualWasCastling
      );

      const newMoveRecord: MoveRecord = {
        from: fromPos,
        to: toPos,
        piece: pieceBeingMoved,
        notation: moveNotationString,
        boardBefore: boardBeforeMove, 
        boardAfter: newBoard.map((row: Piece[]) => [...row]), // Store state before potential promotion
        isCheck: gameStatusAfterMove.isCheck, // This is check status for playerForStatusCheck
        isCheckmate: gameStatusAfterMove.isCheckmate, // This is for playerForStatusCheck
        isStalemate: gameStatusAfterMove.isStalemate, // This is for playerForStatusCheck
        castlingRightsBefore: castlingRightsBeforeMove,
        enPassantTargetBefore: enPassantTargetBeforeMove,
      };
      const updatedMoveHistory = [...context.moveHistory, newMoveRecord];

      return {
        board: newBoard,
        currentPlayer: newAwaitingPromotionChoice ? player : opponentPlayer,
        selectedPiece: null,
        possibleMoves: [],
        error: null,
        castlingRights: newCastlingRights,
        enPassantTarget: newAwaitingPromotionChoice ? context.enPassantTarget : newEnPassantTarget, // Preserve EPT if promoting, else update
        awaitingPromotionChoice: newAwaitingPromotionChoice, // Set if pawn reached promotion rank
        // Game status (isCheck, isCheckmate, etc.) should reflect the state for the *new* current player.
        // If awaiting promotion, these are based on the current player's move.
        // If not awaiting promotion, these are based on the opponent's potential situation.
        isCheck: getGameStatus(newBoard, newAwaitingPromotionChoice ? player : opponentPlayer, newCastlingRights, newEnPassantTarget, null).isCheck,
        isCheckmate: getGameStatus(newBoard, newAwaitingPromotionChoice ? player : opponentPlayer, newCastlingRights, newEnPassantTarget, null).isCheckmate,
        isStalemate: getGameStatus(newBoard, newAwaitingPromotionChoice ? player : opponentPlayer, newCastlingRights, newEnPassantTarget, null).isStalemate,
        gameOver: getGameStatus(newBoard, newAwaitingPromotionChoice ? player : opponentPlayer, newCastlingRights, newEnPassantTarget, null).isCheckmate || 
                  getGameStatus(newBoard, newAwaitingPromotionChoice ? player : opponentPlayer, newCastlingRights, newEnPassantTarget, null).isStalemate,
        winner: getGameStatus(newBoard, newAwaitingPromotionChoice ? player : opponentPlayer, newCastlingRights, newEnPassantTarget, null).isCheckmate ? player : null, 
        moveHistory: updatedMoveHistory,
      };
    }),
    resetGameToInitialAction: assign(() => {
      const newContext = JSON.parse(JSON.stringify(defaultInitialChessContext));
      newContext.moveHistory = []; 
      return newContext;
    }),
    promotePawnAction: assign(({ context, event }: { context: ChessContext; event: ChessEvents }) => {
      if (event.type !== 'CHOOSE_PROMOTION_PIECE' || !context.awaitingPromotionChoice) {
        return { error: "Cannot promote pawn at this time." }; // Ensure this returns Partial<ChessContext>
      }
      const { piece: chosenPieceType } = event; 
      const promotionPos = context.awaitingPromotionChoice;
      const player = context.currentPlayer; // Player who is promoting
      
      let newBoard = context.board.map((row: Piece[]) => [...row]); // Take board from before promotion choice
      const promotedPiece: Piece = (player === 'white' ? 'w' : 'b') + chosenPieceType;
      newBoard[promotionPos.row][promotionPos.col] = promotedPiece;

      const opponent: Player = player === 'white' ? 'black' : 'white';
      // Status after promotion, for the opponent
      const gameStatus = getGameStatus(newBoard, opponent, context.castlingRights, null, null); 
      
      const updatedMoveHistory = [...context.moveHistory];
      const lastMoveIndex = updatedMoveHistory.length - 1;
      if (lastMoveIndex >= 0) {
        const lastMove = { ...updatedMoveHistory[lastMoveIndex] };
        // Update notation of the pawn move that led to promotion
        lastMove.notation = lastMove.notation.split(/[+#]/)[0]; // Remove previous check/mate indicators if any
        lastMove.notation += `=${chosenPieceType}`; // Corrected template literal
        if (gameStatus.isCheckmate) { // Checkmate for opponent
          lastMove.notation += '#';
        } else if (gameStatus.isCheck) { // Check for opponent
          lastMove.notation += '+';
        }
        // Update the boardAfter in the last move record to reflect the promoted piece
        lastMove.boardAfter = newBoard.map((row: Piece[]) => [...row]); 
        lastMove.isCheck = gameStatus.isCheck; // Opponent is in check
        lastMove.isCheckmate = gameStatus.isCheckmate; // Opponent is in checkmate
        lastMove.isStalemate = gameStatus.isStalemate; // Opponent is in stalemate
        updatedMoveHistory[lastMoveIndex] = lastMove;
      }

      return {
        board: newBoard,
        awaitingPromotionChoice: null, // Promotion complete
        currentPlayer: opponent, // Turn switches to opponent
        isCheck: gameStatus.isCheck, // Status for the new current player (opponent)
        isCheckmate: gameStatus.isCheckmate,
        isStalemate: gameStatus.isStalemate,
        gameOver: gameStatus.isCheckmate || gameStatus.isStalemate,
        winner: gameStatus.isCheckmate ? player : null, // Winner is the player who promoted if it's checkmate
        error: null, 
        moveHistory: updatedMoveHistory,
        selectedPiece: null, 
        possibleMoves: [], 
        enPassantTarget: null, 
      };
    }),
    setPromotionErrorAction: assign({
      error: "Must choose a promotion piece.",
      selectedPiece: null,
      possibleMoves: []
    }),
  },
  guards: {
    isValidSelectionGuard: ({ context, event }: { context: ChessContext; event: ChessEvents }): boolean => {
      if (event.type !== 'SELECT_PIECE') return false;
      // if (context.awaitingPromotionChoice) return false; // Handled by state based logic now
      const piece = getPieceAt(context.board, event.position);
      if (!piece || getPieceColor(piece) !== context.currentPlayer) {
        return false;
      }
      return true;
    },
    isValidMoveTargetGuard: ({ context, event }: { context: ChessContext; event: ChessEvents }): boolean => {
      if (event.type !== 'MOVE_PIECE' || !context.selectedPiece) {
        return false;
      }
      // if (context.awaitingPromotionChoice) return false; // Handled by state based logic

      const { board, selectedPiece, currentPlayer, castlingRights, enPassantTarget, awaitingPromotionChoice } = context;
      const toPosition = event.position;

      if (!isValidMoveInternal(board, selectedPiece, toPosition, currentPlayer, castlingRights, false, enPassantTarget, awaitingPromotionChoice)) {
        return false;
      }
      
      // Check if the move would leave the king in check
      const pieceBeingMoved = getPieceAt(board, selectedPiece);
      if (!pieceBeingMoved) return false; // Should not happen if selectedPiece is valid

      let tempBoard = createBoardWithMove(board, selectedPiece, toPosition, pieceBeingMoved);
      let tempCastlingRights = JSON.parse(JSON.stringify(castlingRights)) as ChessContext['castlingRights'];
      const movedPieceType = getPieceType(pieceBeingMoved);

      if (movedPieceType === PieceType.King) {
          if (currentPlayer === 'white') {
              tempCastlingRights.white.kingSide = false;
              tempCastlingRights.white.queenSide = false;
          } else {
              tempCastlingRights.black.kingSide = false;
              tempCastlingRights.black.queenSide = false;
          }
          // If castling, move the rook on tempBoard for check validation
          if (Math.abs(toPosition.col - selectedPiece.col) === 2) {
            const kingRow = selectedPiece.row;
            let rookOriginalCol: number, rookNewCol: number;
            if (toPosition.col === 6) { // King-side
                rookOriginalCol = 7; rookNewCol = 5;
            } else { // Queen-side
                rookOriginalCol = 0; rookNewCol = 3;
            }
            const rook = getPieceAt(board, {row: kingRow, col: rookOriginalCol});
            if (rook) {
                tempBoard[kingRow][rookNewCol] = rook;
                tempBoard[kingRow][rookOriginalCol] = '';
            }
          }
      } else if (movedPieceType === PieceType.Rook) {
          const initialRookRow = currentPlayer === 'white' ? 7 : 0;
          if (selectedPiece.row === initialRookRow) {
              if (selectedPiece.col === 0) { 
                  if (currentPlayer === 'white') tempCastlingRights.white.queenSide = false;
                  else tempCastlingRights.black.queenSide = false;
              } else if (selectedPiece.col === 7) { 
                  if (currentPlayer === 'white') tempCastlingRights.white.kingSide = false;
                  else tempCastlingRights.black.kingSide = false;
              }
          }
      }
      
      let tempEnPassantTarget = enPassantTarget;
      // If the move is an en-passant capture, remove the captured pawn from tempBoard
      if (movedPieceType === PieceType.Pawn && enPassantTarget &&
          toPosition.row === enPassantTarget.row && toPosition.col === enPassantTarget.col &&
          Math.abs(toPosition.col - selectedPiece.col) === 1) {
          const capturedPawnRow = currentPlayer === 'white' ? toPosition.row + 1 : toPosition.row - 1;
          tempBoard[capturedPawnRow][toPosition.col] = '';
          tempEnPassantTarget = null; // En passant capture consumes the target
      } else if (movedPieceType === PieceType.Pawn && Math.abs(toPosition.row - selectedPiece.row) !== 2) {
          tempEnPassantTarget = null; // Single pawn push or capture that is not en-passant
      } else if (movedPieceType !== PieceType.Pawn) {
          tempEnPassantTarget = null; // Non-pawn move
      }
      // If a pawn moves two squares, enPassantTarget is set for the *next* turn,
      // so for *this* turn's check validation, the *current* enPassantTarget is used.


      if (isKingInCheck(tempBoard, currentPlayer, tempEnPassantTarget, tempCastlingRights)) {
        return false;
      }
      return true;
    },
    isPromotingPawnMoveGuard: ({ context, event }: { context: ChessContext; event: ChessEvents }): boolean => {
      if (event.type !== 'MOVE_PIECE') return false;
      if (!context.selectedPiece) return false; 
      
      const toPosition = event.position;
      const pieceOnBoard = getPieceAt(context.board, context.selectedPiece);
      if (!pieceOnBoard) return false; 
      
      const pieceType = getPieceType(pieceOnBoard);
      const player = context.currentPlayer;
      const promotionRank = player === 'white' ? 0 : 7;
      
      if (pieceType === PieceType.Pawn && toPosition.row === promotionRank) {
          const fromPosition = context.selectedPiece;
          const dRow = toPosition.row - fromPosition.row;
          const dCol = toPosition.col - fromPosition.col;
          const direction = player === 'white' ? -1 : 1;

          if (dRow !== direction) return false;

          if (dCol === 0) { // Forward move
              return getPieceAt(context.board, toPosition) === null;
          } else if (Math.abs(dCol) === 1) { // Capture or en-passant to promotion
              const targetPiece = getPieceAt(context.board, toPosition);
              const targetPieceColor = targetPiece ? getPieceColor(targetPiece) : null;
              const isCaptureOfOpponentPiece = targetPieceColor !== null && targetPieceColor !== player;
              const isEnPassantTarget = !!(context.enPassantTarget && // Coerce to boolean
                                       toPosition.row === context.enPassantTarget.row &&
                                       toPosition.col === context.enPassantTarget.col);
              return isCaptureOfOpponentPiece || isEnPassantTarget;
          }
          return false; 
      }
      return false;
    },
    isAwaitingPromotionChoiceGuard: ({ context }: { context: ChessContext }): boolean => {
        // This guard is used for the CHOOSE_PROMOTION_PIECE event transition.
        // It ensures that the machine is indeed waiting for a promotion choice.
        return !!context.awaitingPromotionChoice;
    }
  }
}).createMachine(machineConfig);

