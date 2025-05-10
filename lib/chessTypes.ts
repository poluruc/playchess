// Define types for the chess game using XState v5 conventions
export interface Position {
  row: number;
  col: number;
}

export interface CastlingRights {
  kingSide: boolean;
  queenSide: boolean;
}

export interface ChessContext {
  board: string[][];
  currentPlayer: 'white' | 'black';
  selectedPiece: Position | null;
  possibleMoves: Position[];
  error: string | null;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  gameOver: boolean;
  winner: 'white' | 'black' | null;
  castlingRights: { // Added for castling
    white: CastlingRights;
    black: CastlingRights;
  };
}

// Events in XState v5 format
export type ChessEvents = 
  | { type: 'SELECT_PIECE'; position: Position }
  | { type: 'MOVE_PIECE'; position: Position }
  | { type: 'RESET_GAME' }
  | { type: 'CHECK_BOARD' }
  | { type: 'CHECK_DETECTION'; isCheck: boolean; message: string };

// Backward compatibility for transition to v5
export type ChessEvent = ChessEvents;
