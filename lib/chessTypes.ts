// Define types for the chess game
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

export type ChessEvent = 
  | { type: 'SELECT_PIECE', position: Position }
  | { type: 'MOVE_PIECE', position: Position }
  | { type: 'RESET_GAME' };
