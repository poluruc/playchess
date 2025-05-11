import { Actor, createActor } from 'xstate';
import { chessMachine, defaultInitialChessContext, getGameStatus } from '../../lib/chessMachine'; // Import necessary functions and default context
import { ChessContext, Position } from '../../lib/chessTypes'; // Corrected ChessEvent to ChessEvents

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
  customCastlingRights?: ChessContext['castlingRights']
): Actor<typeof chessMachine> => {
  let actor: Actor<typeof chessMachine>;

  if (!customBoard) {
    // Use the default initial context from chessMachine if no custom board is provided
    actor = createActor(chessMachine, { input: defaultInitialChessContext });
  } else {
    const gameStatus = getGameStatus(
      customBoard,
      currentPlayer,
      customCastlingRights || { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }
    );
    const isGameOver = gameStatus.isCheckmate || gameStatus.isStalemate;

    const initialContext: ChessContext = {
      board: customBoard,
      currentPlayer,
      selectedPiece: null,
      possibleMoves: [],
      error: null,
      isCheck: gameStatus.isCheck,
      isCheckmate: gameStatus.isCheckmate,
      isStalemate: gameStatus.isStalemate,
      gameOver: isGameOver,
      winner: gameStatus.isCheckmate ? (currentPlayer === 'white' ? 'black' : 'white') : null,
      castlingRights: customCastlingRights || {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true },
      },
    };
    actor = createActor(chessMachine, { input: initialContext });
  }

  // console.log('[TestActorCreated] Effective Initial Context Board:', JSON.stringify(actor.getSnapshot().context.board.map((row: string[]) => row.map((p: string) => p || ""))));
  actor.start();
  return actor;
};

// Removed duplicated functions: findKingPosition, isValidMove, isPositionUnderAttack, 
// isKingInCheck, wouldMoveResultInCheck, isPlayerInCheckmate, isPlayerInStalemate.
// These are now imported from lib/chessMachine.ts or used via getGameStatus.
