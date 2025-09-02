import { Actor, createActor } from 'xstate';
import { chessMachine, defaultInitialChessContext, getGameStatus } from '../../lib/chessMachine';
import { ChessContext, Position } from '../../lib/chessTypes';

/**
 * Creates a custom board with pieces placed at specified positions
 */
export const createCustomBoard = (pieces: { pos: Position, piece: string }[]): string[][] => {
  // Create an empty 8x8 board
  const board = Array(8).fill(null).map(() => Array(8).fill('')) as string[][];
  
  // Place the pieces on the board
  pieces.forEach((setup) => {
    if (setup && setup.pos && typeof setup.pos.row === 'number' && typeof setup.pos.col === 'number') {
      // Ensure row and col are within bounds, though this should ideally be guaranteed by Position type
      if (setup.pos.row >= 0 && setup.pos.row < 8 && setup.pos.col >= 0 && setup.pos.col < 8) {
        board[setup.pos.row][setup.pos.col] = setup.piece;
      } else {
        console.error('Invalid piece position (out of bounds) in createCustomBoard:', setup);
      }
    } else {
      // Log an error or throw if the setup is malformed, to help debug
      // This is the most likely cause of "cannot read property 'row' of undefined"
      console.error('Invalid piece setup (missing or malformed pos) in createCustomBoard:', setup);
      // Optionally, throw an error to make it more explicit during testing:
      // throw new Error(`Invalid piece setup: ${JSON.stringify(setup)}`);
    }
  });
  
  return board;
};

/**
 * Creates a chess machine actor for testing and immediately initializes the given position.
 */
export const createTestActor = (
  initialBoardSetup?: Array<{ pos: { row: number; col: number }; piece: string }>,
  currentPlayer: 'white' | 'black' = 'white',
  customCastlingRights?: ChessContext['castlingRights'],
  initialSelectedPiece: ChessContext['selectedPiece'] | null = null,
  initialError: string | null = null,
  initialMoveHistory: ChessContext['moveHistory'] = [],
  initialIsCheck: boolean = false, // This will be overridden if board state implies check
  initialIsCheckmate: boolean = false,
  initialIsStalemate: boolean = false,
  initialGameOver: boolean = false,
  initialWinner: 'white' | 'black' | null = null,
  initialAwaitingPromotionChoice: { row: number; col: number } | null = null
): Actor<typeof chessMachine> => {
  let boardToUse: string[][]; // Renamed to avoid conflict
  if (initialBoardSetup) {
    boardToUse = createCustomBoard(initialBoardSetup); // Use modified createCustomBoard
  } else {
    boardToUse = defaultInitialChessContext.board;
  }

  const effectiveCastlingRights = customCastlingRights || defaultInitialChessContext.castlingRights;

  // Call getGameStatus with all required parameters, including enPassantTarget
  const gameStatus = getGameStatus(
    boardToUse,
    currentPlayer,
    effectiveCastlingRights,
    null, // Pass null for enPassantTarget
    null // Pass null for awaitingPromotionChoice
  );
  const isGameOver = gameStatus.isCheckmate || gameStatus.isStalemate;

  const initialContext: ChessContext = {
    ...defaultInitialChessContext,
    board: boardToUse, // Use the board initialized above
    currentPlayer,
    selectedPiece: initialSelectedPiece,
    error: initialError,
    castlingRights: customCastlingRights ? JSON.parse(JSON.stringify(customCastlingRights)) : { ...defaultInitialChessContext.castlingRights }, // Deep copy
    moveHistory: initialMoveHistory,
    possibleMoves: [], // Initialize as empty, will be calculated by machine
    isCheck: initialIsCheck, 
    isCheckmate: initialIsCheckmate,
    isStalemate: initialIsStalemate,
    gameOver: initialGameOver,
    winner: initialWinner,
    awaitingPromotionChoice: initialAwaitingPromotionChoice,
    enPassantTarget: defaultInitialChessContext.enPassantTarget, // Ensure enPassantTarget is initialized
  };
  
  // Recalculate isCheck based on the actual board state and current player.
  initialContext.isCheck = gameStatus.isCheck;

  // Ensure consistency for game over states
  if (initialContext.isCheckmate) {
    initialContext.isCheck = true; // Checkmate implies check
    initialContext.gameOver = true;
  }
  if (initialContext.isStalemate) {
    initialContext.gameOver = true;
  }
  if (initialContext.gameOver && initialContext.isCheckmate && !initialContext.winner) {
    // If checkmate, there should be a winner (the other player)
    initialContext.winner = initialContext.currentPlayer === 'white' ? 'black' : 'white';
  }
  if (initialContext.gameOver && initialContext.isStalemate) {
    initialContext.winner = null; // Stalemate is a draw
  }
  
  return createActor(chessMachine, { input: initialContext });
};

// Removed duplicated functions: findKingPosition, isValidMove, isPositionUnderAttack, 
// isKingInCheck, wouldMoveResultInCheck, isPlayerInCheckmate, isPlayerInStalemate.
// These are now imported from lib/chessMachine.ts or used via getGameStatus.
