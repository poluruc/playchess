// filepath: /Users/poluruc/chandra/work/cline/mychess/lib/chessTypes.ts
export type Player = 'white' | 'black';
export type Piece = string; // Represents piece notation like 'wP', 'bK', or '' for empty
export type Board = Piece[][];

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

export interface MoveRecord {
  from: Position;
  to: Position;
  piece: string; // e.g., 'wP', 'bK'
  notation: string; // e.g., 'e4', 'Nf3', 'O-O'
  boardBefore: string[][];
  boardAfter: string[][];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  castlingRightsBefore: ChessContext['castlingRights'];
  enPassantTargetBefore: Position | null;
  // Add other relevant state if needed, like player, etc.
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
  moveHistory: MoveRecord[]; // Added for game history
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
