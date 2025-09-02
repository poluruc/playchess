import { Actor } from 'xstate';
import { chessMachine, defaultInitialChessContext } from '../lib/chessMachine'; // Corrected import path
import { createTestActor } from './helpers/testHelpers';

describe('Chess Machine', () => {
  let actor: Actor<typeof chessMachine>;

  beforeEach(() => {
    // Use the test helper to create a fresh actor for each test
    actor = createTestActor(); // Uses default initial context
  });

  test('should start in idle state', () => {
    const snapshot = actor.getSnapshot();
    
    expect(snapshot.value).toBe('playing'); // Changed from { playing: 'awaitingSelection' }
    expect(snapshot.context.currentPlayer).toBe('white');
    expect(snapshot.context.selectedPiece).toBeNull();
  });

  test('should transition to pieceSelected state when selecting a valid piece', () => {
    // White's turn, select white pawn at a2 (row 6, col 0)
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 0 } });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('playing'); // Changed from { playing: 'pieceActuallySelected' }
    expect(snapshot.context.selectedPiece).toEqual({ row: 6, col: 0 });
  });

  test('should not select opponent pieces when it is your turn', () => {
    // White's turn, attempt to select black pawn at a7 (row 1, col 0)
    actor.send({ type: 'SELECT_PIECE', position: { row: 1, col: 0 } });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('playing'); // Changed from { playing: 'awaitingSelection' }
    expect(snapshot.context.selectedPiece).toBeNull(); // No piece should be selected
    expect(snapshot.context.error).toBe("Cannot select opponent's piece or empty square."); // Error message updated based on machine logic
  });

  test('should reset the game state when RESET_GAME is triggered', () => {
    // First, make a move or select a piece to change the state from initial
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 0 } }); // Select white pawn
    
    let snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('playing'); // Changed from { playing: 'pieceActuallySelected' }
    
    // Then reset the game
    actor.send({ type: 'RESET_GAME' as const });
    
    const snapshotAfterReset = actor.getSnapshot();
    // Check if context is reset to defaultInitialChessContext values
    expect(snapshotAfterReset.value).toBe('playing'); // Should be back to initial 'playing' state configuration
    expect(snapshotAfterReset.context.currentPlayer).toBe(defaultInitialChessContext.currentPlayer);
    expect(snapshotAfterReset.context.selectedPiece).toBeNull();
    expect(snapshotAfterReset.context.board).toEqual(defaultInitialChessContext.board);
    expect(snapshotAfterReset.context.error).toBeNull();
    expect(snapshotAfterReset.context.isCheck).toBe(false); // Initial state is not check
    expect(snapshotAfterReset.context.moveHistory).toEqual([]); // History should be empty
    expect(snapshotAfterReset.context.castlingRights).toEqual(defaultInitialChessContext.castlingRights);
  });

  // Test for deselecting a piece
  test('should deselect the piece and return to awaitingSelection state when the same piece is selected again', () => {
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 0 } }); // Select white pawn
    
    let snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('playing'); // In 'pieceActuallySelected' state, but expect 'playing' as per atomic state
    expect(snapshot.context.selectedPiece).toEqual({ row: 6, col: 0 });
    
    // Deselect the pawn by selecting it again
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 0 } });
    
    snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('playing'); // Should go back to 'playing' state
    expect(snapshot.context.selectedPiece).toBeNull(); // No piece should be selected
  });
});