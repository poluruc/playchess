import { assign, setup } from 'xstate';
import { ChessContext, ChessEvents, Position } from './chessTypes';

// Define the initial board setup
export const initialBoard: string[][] = [
  ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
  ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
];

// Helper function to check if a position is on the board
const isOnBoard = (pos: Position): boolean => {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
};

// Helper function to get piece at a position
const getPieceAt = (board: string[][], pos: Position): string | null => {
  if (!isOnBoard(pos)) return null;
  return board[pos.row][pos.col] || null;
};

// Helper function to check if a square is attacked by a player
// TODO: This function needs to be fully implemented for all pieces
const isPositionUnderAttack = (board: string[][], position: Position, byPlayer: 'white' | 'black'): boolean => {
  // console.log(`[isPositionUnderAttack ENTRY] Checking if position [${position.row},${position.col}] is attacked by ${byPlayer}`);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && (byPlayer === 'white' ? piece.startsWith('w') : piece.startsWith('b'))) {
        const pieceType = piece.substring(1);
        const currentPos = { row: r, col: c };
        // Temporarily set currentPlayer to the attacking player to reuse isValidMove logic
        // This is a simplified check and might need a more robust implementation
        if (isValidMoveInternal(board, currentPos, position, byPlayer, { white: {kingSide: false, queenSide: false}, black: {kingSide: false, queenSide: false} }, pieceType, piece.startsWith('w') ? 'white' : 'black', true)) {
          // console.log(`[isPositionUnderAttack] Position [${position.row},${position.col}] is attacked by ${piece} at [${r},${c}]`);
          return true;
        }
      }
    }
  }
  // console.log(`[isPositionUnderAttack EXIT] Position [${position.row},${position.col}] is NOT attacked by ${byPlayer}`);
  return false;
};


// Helper function to find the king's position
export const findKingPosition = (board: string[][], player: 'white' | 'black'): Position | null => {
  const kingSymbol = player === 'white' ? 'wK' : 'bK';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === kingSymbol) {
        return { row: r, col: c };
      }
    }
  }
  return null; // Should not happen in a valid game
};

// Helper function to check if the current player is in check
export const isKingInCheck = (board: string[][], player: 'white' | 'black', castlingRights: ChessContext['castlingRights']): boolean => {
  const kingPos = findKingPosition(board, player);
  if (!kingPos) return false; // Or throw error, king should always be on board
  const opponent: 'white' | 'black' = player === 'white' ? 'black' : 'white';
  return isPositionUnderAttack(board, kingPos, opponent);
};

// Simplified isValidMove - internal version that doesn't check for putting own king in check
// The 'forAttackCheck' parameter bypasses the check for moving into check, used by isPositionUnderAttack
function isValidMoveInternal(
  board: string[][],
  startPos: Position,
  endPos: Position,
  currentPlayer: 'white' | 'black',
  castlingRights: ChessContext['castlingRights'],
  pieceTypeOverride?: string, // Used by isPositionUnderAttack
  playerOverride?: 'white' | 'black', // Used by isPositionUnderAttack
  forAttackCheck: boolean = false
): boolean {
  if (!startPos || !endPos) return false;
  if (!isOnBoard(startPos) || !isOnBoard(endPos)) return false;

  const piece = board[startPos.row][startPos.col];
  if (!piece) return false;

  const actualPlayer = playerOverride || (piece.startsWith('w') ? 'white' : 'black');
  if (actualPlayer !== currentPlayer && !forAttackCheck) return false; // Allow checking attacks for opponent's pieces

  const targetPiece = board[endPos.row][endPos.col];
  if (targetPiece && (actualPlayer === 'white' ? targetPiece.startsWith('w') : targetPiece.startsWith('b')) && !forAttackCheck) {
    return false; // Cannot capture own piece
  }

  const type = pieceTypeOverride || piece.substring(1);
  const dr = Math.abs(startPos.row - endPos.row);
  const dc = Math.abs(startPos.col - endPos.col);

  switch (type) {
    case 'P': // Pawn
      const direction = actualPlayer === 'white' ? -1 : 1;
      // Move forward
      if (dc === 0 && targetPiece === '') {
        if (endPos.row === startPos.row + direction) return true;
        // Initial two-square move
        if (
          ((actualPlayer === 'white' && startPos.row === 6) || (actualPlayer === 'black' && startPos.row === 1)) &&
          endPos.row === startPos.row + 2 * direction &&
          board[startPos.row + direction][startPos.col] === '' // Path is clear
        ) {
          return true;
        }
      }
      // Capture
      if (dc === 1 && dr === 1 && endPos.row === startPos.row + direction && targetPiece && !forAttackCheck) { // forAttackCheck means we are just checking path
        return true;
      }
      if (forAttackCheck && dc === 1 && dr === 1 && endPos.row === startPos.row + direction) { // for attack check, pawn attacks diagonally
        return true;
      }
      return false;
    case 'R': // Rook
      if (dr > 0 && dc > 0) return false; // Not a straight line
      // Check for pieces in the path
      if (dr === 0) { // Horizontal move
        for (let c = Math.min(startPos.col, endPos.col) + 1; c < Math.max(startPos.col, endPos.col); c++) {
          if (board[startPos.row][c] !== '') return false;
        }
      } else { // Vertical move
        for (let r = Math.min(startPos.row, endPos.row) + 1; r < Math.max(startPos.row, endPos.row); r++) {
          if (board[r][startPos.col] !== '') return false;
        }
      }
      return true;
    case 'N': // Knight
      return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
    case 'B': // Bishop
      if (dr !== dc) return false; // Not diagonal
      // Check for pieces in the path
      const rStep = (endPos.row - startPos.row) / dr;
      const cStep = (endPos.col - startPos.col) / dc;
      for (let i = 1; i < dr; i++) {
        if (board[startPos.row + i * rStep][startPos.col + i * cStep] !== '') return false;
      }
      return true;
    case 'Q': // Queen
      // Check straight lines (like Rook)
      if (dr === 0 || dc === 0) {
        if (dr > 0 && dc > 0) return false; // Should be caught by (dr === 0 || dc === 0)
         if (dr === 0) { // Horizontal move
            for (let c = Math.min(startPos.col, endPos.col) + 1; c < Math.max(startPos.col, endPos.col); c++) {
            if (board[startPos.row][c] !== '') return false;
            }
        } else { // Vertical move
            for (let r = Math.min(startPos.row, endPos.row) + 1; r < Math.max(startPos.row, endPos.row); r++) {
            if (board[r][startPos.col] !== '') return false;
            }
        }
        return true;
      }
      // Check diagonal lines (like Bishop)
      if (dr === dc) {
        const rStep = (endPos.row - startPos.row) / dr;
        const cStep = (endPos.col - startPos.col) / dc;
        for (let i = 1; i < dr; i++) {
          if (board[startPos.row + i * rStep][startPos.col + i * cStep] !== '') return false;
        }
        return true;
      }
      return false; // Not straight or diagonal
    case 'K': // King
      if (dr <= 1 && dc <= 1) return true;
      // Castling logic (only if not an attack check)
      if (!forAttackCheck) {
        const playerRights = currentPlayer === 'white' ? castlingRights.white : castlingRights.black;
        const kingRow = currentPlayer === 'white' ? 7 : 0;

        if (startPos.row === kingRow && startPos.col === 4) { // King is on its original square
          // King-side castling
          if (endPos.row === kingRow && endPos.col === 6 && playerRights.kingSide) {
            if (board[kingRow][5] === '' && board[kingRow][6] === '' &&
                !isPositionUnderAttack(board, {row: kingRow, col: 4}, currentPlayer === 'white' ? 'black' : 'white') &&
                !isPositionUnderAttack(board, {row: kingRow, col: 5}, currentPlayer === 'white' ? 'black' : 'white') &&
                !isPositionUnderAttack(board, {row: kingRow, col: 6}, currentPlayer === 'white' ? 'black' : 'white')) {
              return true;
            }
          }
          // Queen-side castling
          if (endPos.row === kingRow && endPos.col === 2 && playerRights.queenSide) {
            if (board[kingRow][1] === '' && board[kingRow][2] === '' && board[kingRow][3] === '' &&
                !isPositionUnderAttack(board, {row: kingRow, col: 4}, currentPlayer === 'white' ? 'black' : 'white') &&
                !isPositionUnderAttack(board, {row: kingRow, col: 3}, currentPlayer === 'white' ? 'black' : 'white') &&
                !isPositionUnderAttack(board, {row: kingRow, col: 2}, currentPlayer === 'white' ? 'black' : 'white')) {
              return true;
            }
          }
        }
      }
      return false;
  }
  return false;
}

// Main move validation function - checks for putting own king in check
function isValidMove(
  board: string[][],
  startPos: Position,
  endPos: Position,
  currentPlayer: 'white' | 'black',
  castlingRights: ChessContext['castlingRights']
): boolean {
  if (!isValidMoveInternal(board, startPos, endPos, currentPlayer, castlingRights)) {
    return false;
  }

  // Simulate the move
  const tempBoard = board.map(r => [...r]); // Deep copy
  const piece = tempBoard[startPos.row][startPos.col];
  tempBoard[endPos.row][endPos.col] = piece;
  tempBoard[startPos.row][startPos.col] = '';

  // Check if this move puts the current player's king in check
  if (isKingInCheck(tempBoard, currentPlayer, castlingRights)) {
    return false;
  }

  return true;
}


// Function to calculate all valid moves for a selected piece
const calculateValidMoves = (
  board: string[][],
  selectedPiecePos: Position,
  currentPlayer: 'white' | 'black',
  castlingRights: ChessContext['castlingRights']
): Position[] => {
  const validMoves: Position[] = [];
  if (!selectedPiecePos) return validMoves;

  const piece = getPieceAt(board, selectedPiecePos);
  if (!piece || (currentPlayer === 'white' && !piece.startsWith('w')) || (currentPlayer === 'black' && !piece.startsWith('b'))) {
    return validMoves;
  }

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const endPos = { row: r, col: c };
      if (isValidMove(board, selectedPiecePos, endPos, currentPlayer, castlingRights)) {
        validMoves.push(endPos);
      }
    }
  }
  return validMoves;
};

// Function to check for checkmate or stalemate
const getGameStatus = (
  board: string[][],
  currentPlayer: 'white' | 'black',
  castlingRights: ChessContext['castlingRights']
): { isCheckmate: boolean; isStalemate: boolean; isCheck: boolean } => {
  const inCheck = isKingInCheck(board, currentPlayer, castlingRights);
  let hasValidMoves = false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && (currentPlayer === 'white' ? piece.startsWith('w') : piece.startsWith('b'))) {
        const startPos = { row: r, col: c };
        const moves = calculateValidMoves(board, startPos, currentPlayer, castlingRights);
        if (moves.length > 0) {
          hasValidMoves = true;
          break;
        }
      }
    }
    if (hasValidMoves) break;
  }

  const isCheckmate = inCheck && !hasValidMoves;
  const isStalemate = !inCheck && !hasValidMoves;

  return { isCheckmate, isStalemate, isCheck: inCheck };
};


// Define the initial context for the state machine
const initialContext: ChessContext = {
  board: initialBoard.map((r: string[]) => [...r]), // Ensure deep copy for initial state
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
};

export const chessMachine = setup({
  types: {
    context: {} as ChessContext,
    events: {} as ChessEvents,
  },
  actions: {
    selectPiece: assign(({ context, event }) => {
      if (event.type !== 'SELECT_PIECE') return {}; // Return empty object if event type doesn't match
      const { position } = event;

      // If clicking the currently selected piece, deselect it
      if (context.selectedPiece && context.selectedPiece.row === position.row && context.selectedPiece.col === position.col) {
        return { selectedPiece: null, possibleMoves: [], error: null };
      }

      const piece = getPieceAt(context.board, position);

      if (!piece || (context.currentPlayer === 'white' && !piece.startsWith('w')) || (context.currentPlayer === 'black' && !piece.startsWith('b'))) {
        return { selectedPiece: null, possibleMoves: [], error: "Cannot select opponent's piece or empty square" };
      }
      
      const possibleMoves = calculateValidMoves(context.board, position, context.currentPlayer, context.castlingRights);
      return { selectedPiece: position, possibleMoves, error: null };
    }),
    movePiece: assign(({ context, event }) => {
      if (event.type !== 'MOVE_PIECE' || !context.selectedPiece) return {};
      
      const { position: endPos } = event;
      const startPos = context.selectedPiece!; // Non-null assertion as selectedPiece is checked

      if (!context.possibleMoves.some((p: Position) => p.row === endPos.row && p.col === endPos.col)) {
        return { error: "Invalid move" };
      }

      const newBoard = context.board.map((r: string[]) => [...r]);
      const piece = newBoard[startPos.row][startPos.col];
      newBoard[endPos.row][endPos.col] = piece;
      newBoard[startPos.row][startPos.col] = '';

      let newCastlingRights = JSON.parse(JSON.stringify(context.castlingRights)) as ChessContext['castlingRights'];

      const kingRow = context.currentPlayer === 'white' ? 7 : 0;
      if (piece === (context.currentPlayer === 'white' ? 'wK' : 'bK') && startPos.col === 4) {
        if (endPos.col === 6) { 
          newBoard[kingRow][5] = newBoard[kingRow][7]; 
          newBoard[kingRow][7] = '';
        } else if (endPos.col === 2) { 
          newBoard[kingRow][3] = newBoard[kingRow][0]; 
          newBoard[kingRow][0] = '';
        }
      }
      
      if (piece === 'wK') {
        newCastlingRights.white = { kingSide: false, queenSide: false };
      } else if (piece === 'bK') {
        newCastlingRights.black = { kingSide: false, queenSide: false };
      } else if (piece === 'wR') {
        if (startPos.row === 7 && startPos.col === 0) newCastlingRights.white.queenSide = false;
        if (startPos.row === 7 && startPos.col === 7) newCastlingRights.white.kingSide = false;
      } else if (piece === 'bR') {
        if (startPos.row === 0 && startPos.col === 0) newCastlingRights.black.queenSide = false;
        if (startPos.row === 0 && startPos.col === 7) newCastlingRights.black.kingSide = false;
      }

      const capturedPieceOriginalBoard = context.board[endPos.row][endPos.col]; 
      if (capturedPieceOriginalBoard === 'wR') {
          if (endPos.row === 7 && endPos.col === 0) newCastlingRights.white.queenSide = false;
          if (endPos.row === 7 && endPos.col === 7) newCastlingRights.white.kingSide = false;
      } else if (capturedPieceOriginalBoard === 'bR') {
          if (endPos.row === 0 && endPos.col === 0) newCastlingRights.black.queenSide = false;
          if (endPos.row === 0 && endPos.col === 7) newCastlingRights.black.kingSide = false;
      }

      const opponent = context.currentPlayer === 'white' ? 'black' : 'white';
      const { isCheckmate, isStalemate, isCheck } = getGameStatus(newBoard, opponent, newCastlingRights);
      
      const gameOver = isCheckmate || isStalemate;
      const winner = isCheckmate ? context.currentPlayer : null;

      return {
        board: newBoard,
        currentPlayer: gameOver ? context.currentPlayer : opponent,
        selectedPiece: null,
        possibleMoves: [],
        error: null,
        isCheck: isCheck, 
        isCheckmate: isCheckmate,
        isStalemate: isStalemate,
        gameOver: gameOver,
        winner: winner,
        castlingRights: newCastlingRights,
      };
    }),
    resetGame: assign(({ event }) => { // context is not used here, but event might be if RESET_GAME carries payload
      // If RESET_GAME event could have a payload, check event.type
      return {
        ...initialContext, // Spread the full initial context
        board: initialBoard.map((r: string[]) => [...r]), 
        castlingRights: { 
          white: { kingSide: true, queenSide: true },
          black: { kingSide: true, queenSide: true },
        },
      };
    }),
    setCheckStatus: assign(({ context, event }) => {
      if (event.type !== 'CHECK_DETECTION') return {};
      return {
        isCheck: event.isCheck,
        error: event.isCheck ? event.message : null,
      };
    })
  },
  guards: {
    isValidMoveTarget: ({ context, event }) => {
      if (event.type !== 'MOVE_PIECE' || !context.selectedPiece) return false;
      // Make sure event.position is accessed only after type check
      const { position } = event; 
      return context.possibleMoves.some((p: Position) => p.row === position.row && p.col === position.col);
    },
  },
}).createMachine({
  id: 'chess',
  initial: 'playing',
  context: initialContext, // Reference the initial context object
  states: {
    playing: {
      initial: 'selectPiece',
      states: {
        selectPiece: {
          on: {
            SELECT_PIECE: {
              target: 'pieceSelected',
              actions: 'selectPiece',
            },
          },
        },
        pieceSelected: {
          on: {
            SELECT_PIECE: { 
              target: 'pieceSelected',
              actions: 'selectPiece',
            },
            MOVE_PIECE: {
              target: 'pieceMoving',
              guard: 'isValidMoveTarget',
            },
          },
        },
        pieceMoving: { 
          always: [
            {
              target: '#chess.gameOver', // Corrected target
              guard: ({ context }) => context.isCheckmate || context.isStalemate,
              actions: 'movePiece', 
            },
            {
              target: 'selectPiece',
              actions: 'movePiece', 
            },
          ],
        },
      },
      on: {
        RESET_GAME: {
          target: '.selectPiece', 
          actions: 'resetGame',
        },
        CHECK_DETECTION: { 
            actions: 'setCheckStatus'
        }
      },
    },
    gameOver: {
      on: {
        RESET_GAME: {
          target: 'playing.selectPiece',
          actions: 'resetGame',
        },
      },
    },
  },
});