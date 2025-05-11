import { Actor, createActor } from 'xstate';
import { chessMachine, defaultInitialChessContext, getGameStatus } from '../../lib/chessMachine';
import { ChessContext, Position } from '../../lib/chessTypes';

/**
 * Creates a custom board with pieces placed at specified positions
 */
export const createCustomBoard = (pieces: { pos: Position, piece: string }[]): string[][] => {
  // Create an empty 8x8 board
  const board = Array(8).fill(null).map(() => Array(8).fill(''));
  
  // Place the pieces on the board
  pieces.forEach(({ pos, piece }) => {
    board[pos.row][pos.col] = piece;
  });
  
  return board;
};

/**
 * Creates a chess machine actor for testing and immediately initializes the given position.
 */
export const createTestActor = (
  customBoard?: string[][],
  currentPlayer: 'white' | 'black' = 'white',
  customCastlingRights?: ChessContext['castlingRights'],
  enPassantTarget: Position | null = null // Added enPassantTarget parameter
): Actor<typeof chessMachine> => {
  let actor: Actor<typeof chessMachine>;

  const boardToUse = customBoard || defaultInitialChessContext.board;
  const effectiveCastlingRights = customCastlingRights || defaultInitialChessContext.castlingRights;

  // Call getGameStatus with all required parameters, including enPassantTarget
  const gameStatus = getGameStatus(
    boardToUse,
    currentPlayer,
    effectiveCastlingRights,
    enPassantTarget,
    null // Pass null for awaitingPromotionChoice
  );
  const isGameOver = gameStatus.isCheckmate || gameStatus.isStalemate;

  const initialContext: ChessContext = {
    ...defaultInitialChessContext, // Start with all defaults
    board: boardToUse,
    currentPlayer,
    castlingRights: effectiveCastlingRights,
    enPassantTarget, // Ensure enPassantTarget from params is in the context
    awaitingPromotionChoice: null, // Explicitly set from default or as null

    // Override with gameStatus results
    isCheck: gameStatus.isCheck,
    isCheckmate: gameStatus.isCheckmate,
    isStalemate: gameStatus.isStalemate,
    gameOver: isGameOver,
    winner: gameStatus.isCheckmate ? (currentPlayer === 'white' ? 'black' : 'white') : null,
    
    // Reset fields that should be fresh for a test scenario based on the board
    selectedPiece: null,
    possibleMoves: [], // The machine will calculate these if needed on its first step
    error: null,
  };

  actor = createActor(chessMachine, { input: initialContext });
  actor.start();
  return actor;
};

// Removed duplicated functions: findKingPosition, isValidMove, isPositionUnderAttack, 
// isKingInCheck, wouldMoveResultInCheck, isPlayerInCheckmate, isPlayerInStalemate.
// These are now imported from lib/chessMachine.ts or used via getGameStatus.
