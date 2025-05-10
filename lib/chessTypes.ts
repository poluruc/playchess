// Define types for the chess game using XState v5 conventions
export interface Position {
  row: number;
  col: number;
}

export interface ChessContext {
  board: string[][];
  currentPlayer: 'white' | 'black';
  selectedPiece: Position | null;
  possibleMoves: Position[];
}

// Events in XState v5 format
export type ChessEvents = 
  | { type: 'SELECT_PIECE'; position: Position }
  | { type: 'MOVE_PIECE'; position: Position }
  | { type: 'RESET_GAME' };

// Backward compatibility for transition to v5
export type ChessEvent = ChessEvents;
