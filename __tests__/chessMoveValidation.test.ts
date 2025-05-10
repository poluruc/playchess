import { createActor } from 'xstate';
import { chessMachine } from '../lib/chessMachine';

describe('Chess Move Validation', () => {
  test('should set error when attempting invalid move', () => {
    const actor = createActor(chessMachine);
    actor.start();
    
    // Select a white rook
    actor.send({ 
      type: 'SELECT_PIECE' as const, 
      position: { row: 7, col: 0 } 
    });
    
    // Try to move rook diagonally (invalid for rook)
    actor.send({ 
      type: 'MOVE_PIECE' as const, 
      position: { row: 6, col: 1 } 
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.error).toBe("That move is not allowed!");
  });
  
  test('should not allow invalid moves', () => {
    const actor = createActor(chessMachine);
    actor.start();
    
    // Select a white rook
    actor.send({ 
      type: 'SELECT_PIECE' as const, 
      position: { row: 7, col: 0 } 
    });
    
    // Try to move rook diagonally (invalid for rook)
    actor.send({ 
      type: 'MOVE_PIECE' as const, 
      position: { row: 6, col: 1 } 
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][0]).toBe('wR'); // Rook should remain in original position
    expect(snapshot.context.board[6][1]).toBe('wP'); // Pawn should remain in its position
  });
});