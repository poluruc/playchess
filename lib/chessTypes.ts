// Define types for the chess game using XState v5 conventions
export interface Position {
  row: number;
  col: number;
}

export enum PieceType {
  Pawn = 'P',
  Rook = 'R',
  Knight = 'N',
  Bishop = 'B',
  Queen = 'Q',
  King = 'K',
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
  enPassantTarget: Position | null; // Added for en passant
  awaitingPromotionChoice: Position | null; // Added for pawn promotion UI
}

// Events in XState v5 format
export type ChessEvents = 
  | { type: 'SELECT_PIECE'; position: Position }
  | { type: 'MOVE_PIECE'; position: Position }
  | { type: 'RESET_GAME' }
  | { type: 'CHECK_BOARD' }
  | { type: 'CHECK_DETECTION'; isCheck: boolean; message: string }
  | { type: 'CHOOSE_PROMOTION_PIECE'; piece: PieceType }; // Added for pawn promotion choice

// Backward compatibility for transition to v5
export type ChessEvent = ChessEvents;
