import { createActor } from 'xstate';
import { chessMachine } from '../lib/chessMachine';

describe('Chess Machine', () => {
  test('should start in idle state', () => {
    const actor = createActor(chessMachine);
    actor.start();
    const snapshot = actor.getSnapshot();
    
    expect(snapshot.value).toEqual({ playing: 'awaitingSelection' }); // Changed from selectPiece
    expect(snapshot.context.currentPlayer).toBe('white');
    expect(snapshot.context.selectedPiece).toBeNull();
  });

  test('should transition to pieceSelected state when selecting a valid piece', () => {
    const actor = createActor(chessMachine);
    actor.start();
    
    // Select a white piece (pawn) at position 6,0
    actor.send({ 
      type: 'SELECT_PIECE' as const, 
      position: { row: 6, col: 0 } 
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toEqual({ playing: 'pieceActuallySelected' }); // Changed from pieceSelected
    expect(snapshot.context.selectedPiece).toEqual({ row: 6, col: 0 });
  });

  test('should not select opponent pieces when it is your turn', () => {
    const actor = createActor(chessMachine);
    actor.start();
    
    // Try to select a black piece when it\\'s white\\'s turn
    actor.send({ 
      type: 'SELECT_PIECE' as const, 
      position: { row: 1, col: 0 } 
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toEqual({ playing: 'awaitingSelection' }); // Changed from selectPiece
    expect(snapshot.context.selectedPiece).toBeNull(); // No piece should be selected
    expect(snapshot.context.error).toBe("Cannot select opponent's piece or empty square."); // Error message updated based on machine logic
  });

  test('should reset the game state when RESET_GAME is triggered', () => {
    const actor = createActor(chessMachine);
    actor.start();
    
    // First select a piece
    actor.send({ 
      type: 'SELECT_PIECE' as const, 
      position: { row: 6, col: 0 } 
    });
    
    let snapshot = actor.getSnapshot();
    expect(snapshot.value).toEqual({ playing: 'pieceActuallySelected' }); // Changed from pieceSelected
    
    // Then reset the game
    actor.send({ type: 'RESET_GAME' as const });
    
    snapshot = actor.getSnapshot();
    expect(snapshot.value).toEqual({ playing: 'awaitingSelection' }); // Changed from selectPiece
    expect(snapshot.context.selectedPiece).toBeNull();
    expect(snapshot.context.currentPlayer).toBe('white');
  });
});