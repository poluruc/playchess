// __tests__/chessMachine.test.ts
import { chessMachine } from '@/lib/chessMachine';
import { interpret } from 'xstate';

// Create a modified version of the state machine for testing
const testMachine = chessMachine;

describe('Chess State Machine', () => {
  it('should initialize with the correct context', () => {
    const service = interpret(testMachine).start();
    const { context } = service.getSnapshot();
    
    expect(context.currentPlayer).toBe('white');
    expect(context.selectedPiece).toBeNull();
    expect(context.possibleMoves).toEqual([]);
    expect(context.board.length).toBe(8);
    expect(context.board[0].length).toBe(8);
    
    // Check if initial pieces are in the right positions
    expect(context.board[1][0]).toBe('bP'); // Black pawn
    expect(context.board[0][0]).toBe('bR'); // Black rook
    expect(context.board[0][4]).toBe('bK'); // Black king
    expect(context.board[6][0]).toBe('wP'); // White pawn
    expect(context.board[7][0]).toBe('wR'); // White rook
    expect(context.board[7][4]).toBe('wK'); // White king
    
    service.stop();
  });

  it('should have correct piece selection behavior', () => {
    // Create a service
    const service = interpret(testMachine).start();
    
    // Get the initial state
    const initialState = service.getSnapshot();
    expect(initialState.value).toBe('waitingForSelection');
    
    // Try to select a white pawn (should work for white's turn)
    service.send({ type: 'SELECT_PIECE', position: { row: 6, col: 0 } });
    
    // Log the state for debugging
    console.log('After selecting white pawn:', service.getSnapshot().value);
    console.log('Selected piece:', service.getSnapshot().context.selectedPiece);
    
    // Try to select a black pawn (shouldn't work for white's turn)
    const beforeBlackSelection = service.getSnapshot();
    service.send({ type: 'SELECT_PIECE', position: { row: 1, col: 0 } });
    const afterBlackSelection = service.getSnapshot();
    
    // The state and selected piece should remain unchanged
    // because selecting opponent's pieces is invalid
    expect(afterBlackSelection.context.selectedPiece).toEqual(beforeBlackSelection.context.selectedPiece);
    
    service.stop();
  });

  it('should verify initial board setup', () => {
    const service = interpret(testMachine).start();
    const initialBoard = service.getSnapshot().context.board;
    
    // Check all pawns are in the right positions
    for (let i = 0; i < 8; i++) {
      expect(initialBoard[1][i]).toBe('bP'); // Black pawns on row 1
      expect(initialBoard[6][i]).toBe('wP'); // White pawns on row 6
    }
    
    // Check the back rows
    const blackBackRow = ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'];
    const whiteBackRow = ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'];
    
    for (let i = 0; i < 8; i++) {
      expect(initialBoard[0][i]).toBe(blackBackRow[i]); // Black back row
      expect(initialBoard[7][i]).toBe(whiteBackRow[i]); // White back row
    }
    
    service.stop();
  });
  
  it('should correctly update the board after reset', () => {
    const service = interpret(testMachine).start();
    
    // Send a RESET_GAME event
    service.send({ type: 'RESET_GAME' });
    
    // Get the final state
    const finalState = service.getSnapshot();
    
    // Ensure we're in waitingForSelection state
    expect(finalState.value).toBe('waitingForSelection');
    
    // Ensure the board is reset to initial state
    const initialBoard = [
      ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
      ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
      ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ];
    
    // Check specific positions to verify reset
    expect(finalState.context.board[0][0]).toBe(initialBoard[0][0]);
    expect(finalState.context.board[1][0]).toBe(initialBoard[1][0]);
    expect(finalState.context.board[6][0]).toBe(initialBoard[6][0]);
    expect(finalState.context.board[7][0]).toBe(initialBoard[7][0]);
    
    service.stop();
  });
});
