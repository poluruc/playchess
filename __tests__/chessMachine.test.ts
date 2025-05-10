// __tests__/chessMachine.test.ts
import { chessMachine } from '@/lib/chessMachine';
import { createActor } from 'xstate';

// Use the state machine directly
const testMachine = chessMachine;

describe('Chess State Machine', () => {
  it('should initialize with the correct context', () => {
    // Create an actor instead of interpreting the machine
    const actor = createActor(testMachine).start();
    const snapshot = actor.getSnapshot();
    const { context } = snapshot;
    
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
    
    actor.stop();
  });

  it('should have correct piece selection behavior', () => {
    // Create an actor
    const actor = createActor(testMachine).start();
    
    // Get the initial state
    const initialState = actor.getSnapshot();
    expect(initialState.value).toBe('idle');
    
    // Send a select piece event for a white piece in initial state (white's turn)
    actor.send({
      type: 'SELECT_PIECE',
      position: { row: 6, col: 0 } // White pawn
    });
    
    // Check if piece is selected
    let state = actor.getSnapshot();
    expect(state.value).toBe('pieceSelected');
    expect(state.context.selectedPiece).toEqual({ row: 6, col: 0 });
    
    // Try selecting a black piece (should not change selection in white's turn)
    actor.send({
      type: 'SELECT_PIECE',
      position: { row: 1, col: 0 } // Black pawn
    });
    
    // Selection should still be the same white piece
    state = actor.getSnapshot();
    expect(state.value).toBe('pieceSelected');
    expect(state.context.selectedPiece).toEqual({ row: 6, col: 0 });
    
    // Now selecting the same piece should deselect it
    actor.send({
      type: 'SELECT_PIECE',
      position: { row: 6, col: 0 } // Same white pawn
    });
    
    // Check that piece is deselected
    state = actor.getSnapshot();
    expect(state.value).toBe('idle');
    expect(state.context.selectedPiece).toBeNull();
    
    actor.stop();
  });

  it('should handle the reset game action', () => {
    // Create an actor
    const actor = createActor(testMachine).start();
    
    // Select a piece
    actor.send({
      type: 'SELECT_PIECE',
      position: { row: 6, col: 0 } // White pawn
    });
    
    // Verify piece is selected
    let state = actor.getSnapshot();
    expect(state.value).toBe('pieceSelected');
    
    // Reset the game
    actor.send({ type: 'RESET_GAME' });
    
    // Verify reset worked
    state = actor.getSnapshot();
    expect(state.value).toBe('idle');
    expect(state.context.selectedPiece).toBeNull();
    expect(state.context.currentPlayer).toBe('white');
    
    actor.stop();
  });
});
