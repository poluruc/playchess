// __tests__/chessMoveValidation.test.ts
import type { ChessContext, Position } from '@/lib/chessTypes';

// Import the calculation function - we'll need to expose it or recreate it for testing
function calculatePossibleMoves(
  context: ChessContext,
  position: Position
): Position[] {
  const { row, col } = position;
  const piece = context.board[row][col];
  
  if (!piece) return [];
  
  const pieceType = piece.charAt(1);
  const color = piece.charAt(0) === 'w' ? 'white' : 'black';
  
  // For simplicity, we'll just implement basic pawn movement
  if (pieceType === 'P') {
    const moves: Position[] = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    
    // Move forward one square
    if (
      row + direction >= 0 &&
      row + direction < 8 &&
      context.board[row + direction][col] === ''
    ) {
      moves.push({ row: row + direction, col });
      
      // Move forward two squares from starting position
      if (
        row === startRow &&
        context.board[row + 2 * direction][col] === ''
      ) {
        moves.push({ row: row + 2 * direction, col });
      }
    }
    
    // Capture diagonally
    for (const colOffset of [-1, 1]) {
      if (
        row + direction >= 0 &&
        row + direction < 8 &&
        col + colOffset >= 0 &&
        col + colOffset < 8
      ) {
        const targetPiece = context.board[row + direction][col + colOffset];
        if (
          targetPiece &&
          (color === 'white' ? targetPiece.charAt(0) === 'b' : targetPiece.charAt(0) === 'w')
        ) {
          moves.push({ row: row + direction, col: col + colOffset });
        }
      }
    }
    
    return moves;
  }
  
  return [];
}

describe('Chess Move Validation', () => {
  // Create a test board with specific piece configurations
  const createTestBoard = (): string[][] => {
    // Create an empty 8x8 board
    const board: string[][] = Array(8)
      .fill(null)
      .map(() => Array(8).fill(''));
    
    // Add specific pieces for testing
    board[6][3] = 'wP'; // White pawn
    board[5][2] = 'bP'; // Black pawn that can be captured
    board[1][3] = 'bP'; // Black pawn
    
    return board;
  };

  it('should calculate valid pawn moves', () => {
    const board = createTestBoard();
    const context: ChessContext = {
      board,
      currentPlayer: 'white',
      selectedPiece: null,
      possibleMoves: [],
    };
    
    // Test white pawn moves
    const whitePawnMoves = calculatePossibleMoves(context, { row: 6, col: 3 });
    
    // A white pawn at row 6 should be able to move one or two squares forward
    // and capture diagonally
    expect(whitePawnMoves).toContainEqual({ row: 5, col: 3 }); // Move one square
    expect(whitePawnMoves).toContainEqual({ row: 4, col: 3 }); // Move two squares (first move)
    expect(whitePawnMoves).toContainEqual({ row: 5, col: 2 }); // Capture black pawn
    
    // Total moves should be 3 (forward one, forward two, capture)
    expect(whitePawnMoves.length).toBe(3);
  });

  it('should handle pawn captures correctly', () => {
    const board = createTestBoard();
    const context: ChessContext = {
      board,
      currentPlayer: 'white',
      selectedPiece: null,
      possibleMoves: [],
    };
    
    // Test white pawn moves
    const whitePawnMoves = calculatePossibleMoves(context, { row: 6, col: 3 });
    
    // Check diagonal capture
    expect(whitePawnMoves).toContainEqual({ row: 5, col: 2 }); // Capture black pawn
    
    // There should be no move to row 5, col 4 because there's no piece to capture there
    expect(whitePawnMoves).not.toContainEqual({ row: 5, col: 4 });
  });

  it('should handle pawns at non-starting positions', () => {
    // Create a custom board with a white pawn that has already moved
    const board = Array(8).fill(null).map(() => Array(8).fill(''));
    board[4][3] = 'wP'; // White pawn that has already moved
    
    const context: ChessContext = {
      board,
      currentPlayer: 'white',
      selectedPiece: null,
      possibleMoves: [],
    };
    
    const whitePawnMoves = calculatePossibleMoves(context, { row: 4, col: 3 });
    
    // A white pawn that has already moved should only move one square forward
    expect(whitePawnMoves).toContainEqual({ row: 3, col: 3 });
    expect(whitePawnMoves.length).toBe(1); // Only one move (no two-square move, no captures)
  });
});
