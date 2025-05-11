import { assign, setup } from 'xstate';
import {
  ChessContext,
  ChessEvents,
  Position
} from './chessTypes';

// Define or alias types that were previously incorrectly imported
export type Player = 'white' | 'black';
export type Piece = string; // e.g., 'wP', 'bP', 'wK', 'bK'
export type Board = Piece[][];

export enum PieceType {
  Pawn = 'P',
  Rook = 'R',
  Knight = 'N',
  Bishop = 'B',
  Queen = 'Q',
  King = 'K',
}

// Default initial context - ensure this is defined before chessMachine
const defaultInitialChessContext: ChessContext = {
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
  enPassantTarget: null, // Added missing property
};

// Helper function definitions (getPieceAt, getPieceColor, getPieceType, etc.)
// These were previously assumed to be imported or defined. Now we ensure they are here.

// Helper function to get the piece at a given position
function getPieceAt(board: Board, position: Position): Piece | null {
  if (!board || !position ||
      position.row < 0 || position.row >= board.length ||
      !board[position.row] || // Check if the row itself exists
      position.col < 0 || position.col >= board[position.row].length) {
    return null; // Out of bounds or invalid position
  }
  const piece = board[position.row][position.col];
  return piece === '' ? null : piece; // Return null if empty string (no piece), otherwise the piece.
}

function getPieceColor(piece: Piece): Player | null {
  if (!piece) return null;
  return piece.startsWith('w') ? 'white' : piece.startsWith('b') ? 'black' : null;
}

function getPieceType(piece: Piece): PieceType | null {
  if (!piece || piece.length < 2) return null;
  const typeChar = piece.substring(1).toUpperCase(); // Get char after 'w' or 'b'
  return typeChar as PieceType; // Assume it's a valid PieceType key
}

function createBoardWithMove(board: Board, from: Position, to: Position, piece: Piece): Board {
  const newBoard = board.map(row => [...row]);
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = '';
  return newBoard;
}

// --- Game Logic Helper Functions ---

// Determines if a position is on the board
export function isPositionOnBoard(position: Position): boolean {
  return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8;
}

// Validates a move internally, considering board state, piece type, and rules.
// player is the color of the piece being moved.
// forAttackCheck is true if we are only checking if the 'to' square is attacked, not if a full move is valid.
export function isValidMoveInternal(
  board: Board,
  from: Position,
  to: Position,
  player: Player, 
  castlingRights: ChessContext['castlingRights'],
  forAttackCheck: boolean = false, 
  enPassantTarget: Position | null = null
): boolean {
  if (!isPositionOnBoard(from) || !isPositionOnBoard(to)) {
    return false;
  }
  const pieceOnFromSquare = getPieceAt(board, from);
  if (!pieceOnFromSquare) {
    return false;
  }

  const pieceOwnerColor = getPieceColor(pieceOnFromSquare); // Actual color of the piece at 'from'
  const pieceType = getPieceType(pieceOnFromSquare);

  if (!pieceType || !pieceOwnerColor) {
    return false; // Should not happen with a valid board
  }

  // If not an attack check, the piece being moved must belong to the current player.
  if (!forAttackCheck && pieceOwnerColor !== player) {
    return false;
  }

  const targetPiece = getPieceAt(board, to);
  const targetPieceColor = targetPiece ? getPieceColor(targetPiece) : null;

  // Cannot capture own piece
  if (targetPieceColor === player) {
    return false;
  }

  if (pieceType === PieceType.Pawn) {
    const direction = player === 'white' ? -1 : 1; // 'player' is the color of the pawn
    const startRow = from.row;
    const startCol = from.col;
    const targetRow = to.row;
    const targetCol = to.col;

    // Pawn Attack & Diagonal Movement Logic
    if (Math.abs(targetCol - startCol) === 1 && targetRow === startRow + direction) {
        if (forAttackCheck) {
            // For attack checks, a pawn simply attacks the two squares diagonally in front of it.
            return true;
        }
        // This is a diagonal move, so for a regular move, it must be a capture or en-passant.
        // Standard Capture
        if (targetPiece && targetPieceColor && targetPieceColor !== player) {
            // Check for promotion on capture
            if (targetRow === (player === 'white' ? 0 : 7)) {
                return true; // Promotion on capture
            }
            return true; // Standard capture
        }
        // En Passant Capture (not an attack check, must be a specific move)
        if (!forAttackCheck && enPassantTarget && targetRow === enPassantTarget.row && targetCol === enPassantTarget.col) {
            // The capturing pawn must be on its 5th rank.
            // For white (moves from row 6 to 0): 5th rank is row 3 (0-indexed).
            // For black (moves from row 1 to 7): 5th rank is row 4 (0-indexed).
            const fifthRank = player === 'white' ? 3 : 4;
            if (startRow === fifthRank) {
                 return true; // En passant capture. Promotion is not possible with en passant.
            }
        }
        return false; // Diagonal move but not a valid capture or en-passant for a regular move.
    }

    // Pawn Forward Movement Logic (only for regular moves, not forAttackCheck)
    if (targetCol === startCol && !forAttackCheck) { // Pawns only move straight forward, they don't "attack" straight forward.
        // Standard one-step forward
        if (targetRow === startRow + direction && !targetPiece) { // Target square must be empty
            // Check for promotion on forward move
            if (targetRow === (player === 'white' ? 0 : 7)) {
                return true; // Promotion on forward move
            }
            return true; // Standard one-step forward
        }
        // Initial two-step forward
        const initialPawnRow = player === 'white' ? 6 : 1;
        if (startRow === initialPawnRow && targetRow === startRow + 2 * direction && !targetPiece) {
            // Both target square and intermediate square must be empty
            if (!getPieceAt(board, { row: startRow + direction, col: startCol })) {
                return true; // Initial two-step forward. Promotion is not possible here.
            }
        }
    }
    return false; // Not a valid pawn move if none of the above conditions were met.
  }
  if (pieceType === PieceType.Rook) {
    if (from.row !== to.row && from.col !== to.col) {
      return false;
    }
    if (from.row === to.row) {
      const step = to.col > from.col ? 1 : -1;
      for (let c = from.col + step; c !== to.col; c += step) {
        if (getPieceAt(board, {row: from.row, col: c}) !== null) return false; // Obstruction if not null
      }
    } else {
      const step = to.row > from.row ? 1 : -1;
      for (let r = from.row + step; r !== to.row; r += step) {
        if (getPieceAt(board, {row: r, col: from.col}) !== null) return false; // Obstruction if not null
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
      if (getPieceAt(board, {row: r, col: c}) !== null) return false; // Obstruction if not null
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
          if (getPieceAt(board, {row: from.row, col: col}) !== null) return false; // Obstruction if not null
        }
      } else {
        const step = to.row > from.row ? 1 : -1;
        for (let row = from.row + step; row !== to.row; row += step) {
          if (getPieceAt(board, {row: row, col: from.col}) !== null) return false; // Obstruction if not null
        }
      }
    } else { // Bishop-like move for Queen
      const rowStep = to.row > from.row ? 1 : -1;
      const colStep = to.col > from.col ? 1 : -1;
      let curRow = from.row + rowStep;
      let curCol = from.col + colStep;
      while (curRow !== to.row) {
        if (getPieceAt(board, {row: curRow, col: curCol}) !== null) return false; // Obstruction if not null
        curRow += rowStep;
        curCol += colStep;
      }
    }
    return true;
  }
  if (pieceType === PieceType.King) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);

    // Standard 1-square king move
    if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0)) {
      return true; 
    }

    // Castling is not an attack
    if (forAttackCheck) {
        return false; 
    }

    // --- Castling move validation (forAttackCheck is false here) ---
    const kingRowForCastling = player === 'white' ? 7 : 0;
    const opponentColor = player === 'white' ? 'black' : 'white';
    const currentPlayerCastlingRights = player === 'white' ? castlingRights.white : castlingRights.black;

    // 1. King must be on its original square to castle
    if (from.row !== kingRowForCastling || from.col !== 4) {
        return false;
    }

    // 2. King-side castling (e.g., e1g1 or e8g8)
    if (to.row === kingRowForCastling && to.col === 6) {
      // 2a. Check castling rights for king-side
      if (!currentPlayerCastlingRights.kingSide) {
        return false;
      }
      // 2b. Path must be clear (f1/f8 and g1/g8 empty)
      const pathClearKingSide = getPieceAt(board, {row: kingRowForCastling, col: 5}) === null && 
                                getPieceAt(board, {row: kingRowForCastling, col: 6}) === null;
      if (!pathClearKingSide) {
        return false;
      }
      // 2c. Squares king passes through or lands on must not be under attack
      const isSafeKingSide =
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 4 }, opponentColor, enPassantTarget, castlingRights) && // e1/e8 (current)
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 5 }, opponentColor, enPassantTarget, castlingRights) && // f1/f8
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 6 }, opponentColor, enPassantTarget, castlingRights);   // g1/g8
      return isSafeKingSide;
    }

    // 3. Queen-side castling (e.g., e1c1 or e8c8)
    if (to.row === kingRowForCastling && to.col === 2) {
      // 3a. Check castling rights for queen-side
      if (!currentPlayerCastlingRights.queenSide) {
        return false;
      }
      // 3b. Path must be clear (d1/d8, c1/c8, b1/b8 empty)
      const pathClearQueenSide =
        getPieceAt(board, {row: kingRowForCastling, col: 3}) === null &&
        getPieceAt(board, {row: kingRowForCastling, col: 2}) === null &&
        getPieceAt(board, {row: kingRowForCastling, col: 1}) === null;
      if (!pathClearQueenSide) {
        return false;
      }
      // 3c. Squares king passes through or lands on must not be under attack
      const isSafeQueenSide =
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 4 }, opponentColor, enPassantTarget, castlingRights) && // e1/e8 (current)
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 3 }, opponentColor, enPassantTarget, castlingRights) && // d1/d8
        !isPositionUnderAttack(board, { row: kingRowForCastling, col: 2 }, opponentColor, enPassantTarget, castlingRights);   // c1/c8
      return isSafeQueenSide;
    }
    
    return false; // Not a standard king move and not a valid castling move if it reached here
  }
  return false; // Default for other pieces if no valid move found by their logic
}

// --- Functions to check game status ---

// Checks if a position is under attack by the opponent
function isPositionUnderAttack( 
  board: Board,
  targetPosition: Position,
  attackerColor: Player, // Changed PlayerColor to Player
  enPassantTarget: Position | null, 
  castlingRights: ChessContext['castlingRights'] // Changed CastlingRights to ChessContext['castlingRights']
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piecePos = { row: r, col: c };
      const piece = getPieceAt(board, piecePos);
      if (piece && getPieceColor(piece) === attackerColor) {
        // For pawns, the attack check is different from a move.
        // isValidMoveInternal with forAttackCheck=true handles this.
        // For other pieces, their standard move generation also defines their attack squares.
        // However, for kings, we must prevent infinite recursion if the other king is checking.
        // A king cannot directly attack another king in a way that puts itself in check.
        // The forAttackCheck=true flag in isValidMoveInternal for kings already handles
        // that a king's "attack" is just its 1-square move capability, not castling.
        if (getPieceType(piece) === PieceType.King) {
            // Check if the king at piecePos can move to targetPosition (1-square move)
            // This is a simplified check, not using full isValidMoveInternal to avoid recursion issues
            // with opponent's king.
            const rowDiff = Math.abs(targetPosition.row - piecePos.row);
            const colDiff = Math.abs(targetPosition.col - piecePos.col);
            if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0)) {
                return true;
            }
        } else if (isValidMoveInternal(board, piecePos, targetPosition, attackerColor, castlingRights, true, enPassantTarget)) {
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

// Checks if the current player's king is in check
export function isKingInCheck(
  board: Board,
  playerColor: Player, // Changed PlayerColor to Player for consistency
  enPassantTarget: Position | null,
  castlingRights: ChessContext['castlingRights'] // Changed CastlingRights to ChessContext['castlingRights']
): boolean {
  const kingPosition = findKingPosition(board, playerColor);
  if (!kingPosition) {
    return false; // Should not happen in a valid game state
  }
  const opponentColor = playerColor === 'white' ? 'black' : 'white';
  return isPositionUnderAttack(board, kingPosition, opponentColor, enPassantTarget, castlingRights); // Added enPassantTarget
}

// Gets all possible moves for a piece at a given position
export function getPossibleMoves(
  board: Board,
  piecePosition: Position,
  player: Player, // The current player
  castlingRights: ChessContext['castlingRights'],
  enPassantTarget: Position | null
): Position[] {
  const piece = getPieceAt(board, piecePosition);
  if (!piece || getPieceColor(piece) !== player) {
    return [];
  }

  const possibleMoves: Position[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const targetPosition = { row: r, col: c };
      // Corrected call: relying on default for forAttackCheck (false)
      if (isValidMoveInternal(board, piecePosition, targetPosition, player, castlingRights, false, enPassantTarget)) {
        possibleMoves.push(targetPosition);
      }
    }
  }
  return possibleMoves;
}

function getGameStatus(
  board: Board,
  currentPlayer: Player,
  castlingRights: ChessContext['castlingRights'],
  enPassantTarget: Position | null // Added enPassantTarget
): {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
} {
  const check = isKingInCheck(board, currentPlayer, enPassantTarget, castlingRights); // Pass enPassantTarget
  let checkmate = false;
  let stalemate = false;

  // Check for checkmate or stalemate only if it's the current player's turn to move
  let hasLegalMoves = false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piecePosition = { row: r, col: c };
      const piece = getPieceAt(board, piecePosition);
      if (piece && getPieceColor(piece) === currentPlayer) {
        // Pass enPassantTarget when checking for general legal moves
        const possibleMoves = getPossibleMoves(board, piecePosition, currentPlayer, castlingRights, enPassantTarget); // Pass enPassantTarget
        for (const move of possibleMoves) {
            // Simulate the move
            const tempBoard = createBoardWithMove(board, piecePosition, move, piece);
            // Check if this move leaves the king in check
            if (!isKingInCheck(tempBoard, currentPlayer, enPassantTarget, castlingRights)) {
                hasLegalMoves = true;
                break;
            }
        }
      }
      if (hasLegalMoves) break;
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


export const chessMachine = setup({
  types: {} as {
    context: ChessContext,
    events: ChessEvents
  },
  actions: {
    selectPiece: assign(({ context, event }) => {
      if (event.type !== 'SELECT_PIECE') return {};
      const { position } = event;
      const piece = getPieceAt(context.board, position); // Get piece to check its color

      // Deselect if clicking the same piece
      if (context.selectedPiece && context.selectedPiece.row === position.row && context.selectedPiece.col === position.col) {
        return { selectedPiece: null, possibleMoves: [], error: null };
      }

      // Check if the piece belongs to the current player
      if (!piece || getPieceColor(piece) !== context.currentPlayer) {
        return { 
          selectedPiece: null, // Clear selection
          possibleMoves: [], 
          error: "Cannot select opponent's piece or empty square." // Set error
        };
      }
      
      const possibleMoves = getPossibleMoves(context.board, position, context.currentPlayer, context.castlingRights, context.enPassantTarget);
      return { selectedPiece: position, possibleMoves, error: null };
    }),
    movePiece: assign(({ context, event }) => {
      if (event.type !== 'MOVE_PIECE' || !context.selectedPiece) {
        return { error: "Internal error: Invalid movePiece call." };
      }
      const targetPosition = event.position;
      const pieceToMove = getPieceAt(context.board, context.selectedPiece);
      if (!pieceToMove) {
        return { error: "Internal error: No piece to move." };
      }
      
      let newBoard = context.board.map(row => [...row]); // Deep copy for modification
      const startPos = context.selectedPiece;
      const player = context.currentPlayer;
      const pieceTypeMoved = getPieceType(pieceToMove);

      // Standard piece move (will be overwritten for castling below if applicable)
      newBoard[targetPosition.row][targetPosition.col] = pieceToMove;
      newBoard[startPos.row][startPos.col] = '';

      const newCastlingRights = JSON.parse(JSON.stringify(context.castlingRights)) as ChessContext['castlingRights'];
      let newEnPassantTarget: Position | null = null; // Default to null, will be set if applicable

      if (pieceTypeMoved === PieceType.Pawn) {
        const movedRows = Math.abs(targetPosition.row - startPos.row);
        // Set new enPassantTarget if pawn moved two squares
        if (movedRows === 2) {
          newEnPassantTarget = { row: (startPos.row + targetPosition.row) / 2, col: startPos.col };
        } else {
          // If it's not a two-square pawn move, clear any existing enPassantTarget from previous turn.
          // This is implicitly handled by newEnPassantTarget being null by default unless set by a 2-square move.
        }

        // Handle en passant capture: remove the captured pawn
        if (context.enPassantTarget &&
            targetPosition.row === context.enPassantTarget.row &&
            targetPosition.col === context.enPassantTarget.col &&
            movedRows === 1 && // Must be a single diagonal step to the en passant target square
            Math.abs(targetPosition.col - startPos.col) === 1) { // Must be a diagonal move
            const capturedPawnRow = player === 'white' ? targetPosition.row + 1 : targetPosition.row - 1;
            newBoard[capturedPawnRow][targetPosition.col] = ''; // Remove en passanted pawn
            // newEnPassantTarget remains null as an en passant capture does not create a new en passant opportunity
        }

        // Pawn Promotion Logic
        const promotionRank = player === 'white' ? 0 : 7;
        if (targetPosition.row === promotionRank) {
          newBoard[targetPosition.row][targetPosition.col] = player === 'white' ? 'wQ' : 'bQ'; // Promote to Queen
        }
      } else {
        // If any other piece moved, or if it was a pawn move that wasn\'t a 2-square advance,
        // the en passant target from the previous turn is no longer valid.
        // This is handled by newEnPassantTarget being initialized to null and only set for 2-square pawn moves.
      }

      if (pieceTypeMoved === PieceType.King) {
        // Update castling rights whenever the king moves
        if (player === 'white') {
          newCastlingRights.white.kingSide = false;
          newCastlingRights.white.queenSide = false;
        } else {
          newCastlingRights.black.kingSide = false;
          newCastlingRights.black.queenSide = false;
        }

        // Handle castling: move king and rook to their final positions
        const kingMoveDistance = Math.abs(targetPosition.col - startPos.col);
        if (kingMoveDistance === 2) { // This signifies a castling move
          const kingRow = startPos.row;
          let rookOriginalPos: Position, rookNewPos: Position, rookPiece: Piece | null;

          if (targetPosition.col === 6) { // King-side castle (e.g., e1g1 or e8g8)
            // King is already placed at targetPosition (g1/g8) by the standard move above
            // Rook moves from h1/h8 to f1/f8
            rookOriginalPos = { row: kingRow, col: 7 };
            rookNewPos = { row: kingRow, col: 5 };
            rookPiece = getPieceAt(context.board, rookOriginalPos); // Get rook from original board state
            if (rookPiece) {
              newBoard[rookNewPos.row][rookNewPos.col] = rookPiece;
              newBoard[rookOriginalPos.row][rookOriginalPos.col] = '';
            }
          } else if (targetPosition.col === 2) { // Queen-side castle (e.g., e1c1 or e8c8)
            // King is already placed at targetPosition (c1/c8) by the standard move above
            // Rook moves from a1/a8 to d1/d8
            rookOriginalPos = { row: kingRow, col: 0 };
            rookNewPos = { row: kingRow, col: 3 };
            rookPiece = getPieceAt(context.board, rookOriginalPos); // Get rook from original board state
            if (rookPiece) {
              newBoard[rookNewPos.row][rookNewPos.col] = rookPiece;
              newBoard[rookOriginalPos.row][rookOriginalPos.col] = '';
            }
          }
        }
      } else if (pieceTypeMoved === PieceType.Rook) {
        // Update castling rights if a rook moves from its starting square
        const initialPlayerRookRow = player === 'white' ? 7 : 0;
        if (startPos.row === initialPlayerRookRow) {
          if (startPos.col === 0) { // Queen's rook a1/a8
            if (player === 'white') newCastlingRights.white.queenSide = false;
            else newCastlingRights.black.queenSide = false;
          } else if (startPos.col === 7) { // King's rook h1/h8
            if (player === 'white') newCastlingRights.white.kingSide = false;
            else newCastlingRights.black.kingSide = false;
          }
        }
      }
      
      // Revoke castling rights if a rook is captured on its starting square
      const pieceOnTargetSquareOriginalBoard = getPieceAt(context.board, targetPosition);
      if (pieceOnTargetSquareOriginalBoard) {
          const capturedPieceType = getPieceType(pieceOnTargetSquareOriginalBoard);
          const capturedPieceColor = getPieceColor(pieceOnTargetSquareOriginalBoard);
          if (capturedPieceType === PieceType.Rook) {
              if (capturedPieceColor === 'white') {
                  if (targetPosition.row === 7 && targetPosition.col === 0) newCastlingRights.white.queenSide = false;
                  else if (targetPosition.row === 7 && targetPosition.col === 7) newCastlingRights.white.kingSide = false;
              } else if (capturedPieceColor === 'black') {
                  if (targetPosition.row === 0 && targetPosition.col === 0) newCastlingRights.black.queenSide = false;
                  else if (targetPosition.row === 0 && targetPosition.col === 7) newCastlingRights.black.kingSide = false;
              }
          }
      }

      const opponent: Player = player === 'white' ? 'black' : 'white';
      const gameStatus = getGameStatus(newBoard, opponent, newCastlingRights, newEnPassantTarget);

      return {
        board: newBoard,
        currentPlayer: opponent,
        selectedPiece: null,
        possibleMoves: [],
        error: null,
        castlingRights: newCastlingRights,
        enPassantTarget: newEnPassantTarget, 
        isCheck: gameStatus.isCheck, 
        isCheckmate: gameStatus.isCheckmate,
        isStalemate: gameStatus.isStalemate,
        gameOver: gameStatus.isCheckmate || gameStatus.isStalemate,
        winner: gameStatus.isCheckmate ? player : null,
      };
    }),
    resetGameToInitial: assign(() => {
      // Deep clone the defaultInitialChessContext when the action is executed
      return JSON.parse(JSON.stringify(defaultInitialChessContext));
    })
  },
  guards: {
    isValidSelection: ({ context, event }) => {
      if (event.type !== 'SELECT_PIECE') return false;
      const piece = getPieceAt(context.board, event.position);
      return !!piece && getPieceColor(piece) === context.currentPlayer;
    },
    isValidMoveTarget: ({ context, event }) => {
      if (event.type !== 'MOVE_PIECE' || !context.selectedPiece) return false;
      // const piece = getPieceAt(context.board, context.selectedPiece); // Not needed for the call
      // if (!piece) return false; // Not needed

      // Corrected arguments for isValidMoveInternal:
      // board, from, to, player, castlingRights, forAttackCheck (false for a move), enPassantTarget
      return isValidMoveInternal(
        context.board,
        context.selectedPiece,    // from
        event.position,           // to
        context.currentPlayer,    // player (whose turn it is)
        context.castlingRights,   // castlingRights
        false,                    // forAttackCheck (it's a move, not just an attack check)
        context.enPassantTarget   // enPassantTarget from current context (before this move)
      );
    },
    isValidMoveGuard: ({ context, event }) => {
      if (event.type !== 'MOVE_PIECE') return false;
      // This guard expects event.from and event.to, which is not standard for MOVE_PIECE
      // Assuming this guard is intended for a different event structure or should be removed/reconciled
      // with isValidMoveTarget. For now, let's assume MOVE_PIECE uses isValidMoveTarget.
      // If this guard IS used for MOVE_PIECE, it needs context.selectedPiece for 'from'
      // and event.position for 'to'.
      // const { from, to } = event; // This structure is problematic for standard MOVE_PIECE
      // For safety, returning false if this guard is somehow hit by a standard MOVE_PIECE event
      // without the expected 'from' and 'to' properties on the event itself.
      if (!('from' in event && 'to' in event && event.from && event.to)) {
          // This indicates a mismatch in event structure if used for the primary MOVE_PIECE
          // without the expected 'from' and 'to' properties on the event itself.
          // console.warn("isValidMoveGuard called with unexpected event structure for MOVE_PIECE");
          return false; 
      }
      // Assuming event.from and event.to are correctly populated if this guard is used by a specific event
      return isValidMoveInternal(context.board, (event as any).from, (event as any).to, context.currentPlayer, context.castlingRights, false, context.enPassantTarget);
    },
    canSelectPieceGuard: ({ context, event }) => {
      if (event.type !== 'SELECT_PIECE') return false;
      const piece = getPieceAt(context.board, event.position);
      if (!piece) return false;
      return getPieceColor(piece) === context.currentPlayer;
    },
    isGameOverGuard: ({context}) => {
      return context.gameOver;
    }
  }
}).createMachine({
  id: 'chess',
  context: ({ input }) => { // input type will be inferred from createMachine.types.input
    // Deep copy default initial context first
    const initialContext = JSON.parse(JSON.stringify(defaultInitialChessContext));
    // Check if input is provided and has properties
    if (input && Object.keys(input).length > 0) {
      // If input is provided, deep copy it and merge with the deep-copied default context
      return { ...initialContext, ...JSON.parse(JSON.stringify(input)) };
    }
    return initialContext; // Return deep-copied default context if no input or empty input
  },
  initial: 'playing',
  states: {
    playing: {
      initial: 'awaitingSelection',
      states: {
        awaitingSelection: {
          on: {
            SELECT_PIECE: [
              {
                target: 'pieceActuallySelected',
                actions: 'selectPiece', // This action now handles the error assignment internally if selection is invalid
                guard: 'isValidSelection', // This guard ensures the piece belongs to the current player
              },
              { // Fallback if isValidSelection is false (e.g. clicked empty or opponent)
                target: 'awaitingSelection', 
                actions: assign({ // Explicitly assign error here if guard fails
                  selectedPiece: null,
                  possibleMoves: [],
                  error: "Cannot select opponent's piece or empty square."
                }),
              }
            ],
            RESET_GAME: {
              target: 'awaitingSelection', // Corrected: Target sibling/self state
              actions: 'resetGameToInitial',
            },
          },
        },
        pieceActuallySelected: {
          on: {
            SELECT_PIECE: [
              {
                target: 'pieceActuallySelected', // Target self for re-selection
                actions: 'selectPiece',
                guard: 'isValidSelection',
              },
              {
                target: 'awaitingSelection', // Transition back if selection is invalid or piece is deselected
                actions: 'selectPiece', // selectPiece handles deselection by returning selectedPiece: null
              }
            ],
            MOVE_PIECE: [
              {
                target: 'awaitingSelection', // Corrected: Target sibling state
                actions: ['movePiece'],
                guard: 'isValidMoveTarget',
              },
              {
                target: 'awaitingSelection', // Corrected: Target sibling state on invalid move
                actions: assign({ error: "That move is not allowed!" }),
              }
            ],
            RESET_GAME: {
              target: 'awaitingSelection', // Corrected: Target sibling state
              actions: 'resetGameToInitial',
            },
          },
        },
      },
    },
  },
  types: { // These types are for createMachine
    context: {} as ChessContext,
    events: {} as ChessEvents,
    input: {} as Partial<ChessContext> | undefined // Changed: Allow TInput to be undefined
  }
});

export const initialBoard = defaultInitialChessContext.board;

// Export locally defined helper functions and constants 
// that are not individually exported earlier in the file.
export {
  createBoardWithMove, defaultInitialChessContext // This was not individually exported
  , // This was not individually exported
  findKingPosition,
  getGameStatus, getPieceAt,
  getPieceColor,
  getPieceType, isPositionUnderAttack
};

// Re-export types from chessTypes.ts if this module is intended to act as a barrel file.
// This uses the 'export type' syntax which is correct for types, especially with isolatedModules.
  export type { ChessContext, ChessEvents, Position } from './chessTypes';

