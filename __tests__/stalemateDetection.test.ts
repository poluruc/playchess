import { createCustomBoard, createTestActor } from './helpers/testHelpers';

describe('Stalemate Detection', () => {
  test('should detect a basic stalemate position', () => {
    // Set up a common stalemate position where black has only a king and white has a queen
    // The black king is not in check but has no legal moves
    const customBoard = createCustomBoard([
      { pos: { row: 0, col: 0 }, piece: 'bK' },  // a8: Black King
      { pos: { row: 1, col: 2 }, piece: 'wQ' },  // c7: White Queen (controls all squares around the king)
      { pos: { row: 2, col: 1 }, piece: 'wK' }   // b6: White King (supports the queen)
    ]);
    
    const actor = createTestActor(customBoard, 'black');
    
    // Verify the black king is in stalemate (not in check, but no legal moves)
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(false);
    expect(snapshot.context.isCheckmate).toBe(false);
    expect(snapshot.context.isStalemate).toBe(true);
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe(null); // Draw in stalemate
  });

  test('should detect stalemate with king and pawns', () => {
    // This is a classic stalemate position from an actual chess game
    // White king at a6, white pawn at a7, black king at a8
    // Black king has no legal moves but is not in check
    const customBoard = createCustomBoard([
      { pos: { row: 0, col: 0 }, piece: 'bK' },  // a8: Black King
      { pos: { row: 1, col: 0 }, piece: 'wP' },  // a7: White Pawn
      { pos: { row: 2, col: 0 }, piece: 'wK' }   // a6: White King
    ]);
    
    const actor = createTestActor(customBoard, 'black');
    
    // Verify the black king is in stalemate (not in check, but no legal moves)
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(false);
    expect(snapshot.context.isCheckmate).toBe(false);
    expect(snapshot.context.isStalemate).toBe(true);
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe(null);
  });

  test('should not identify check as stalemate', () => {
    // Set up a position where the king is in check
    const customBoard = createCustomBoard([
      { pos: { row: 0, col: 0 }, piece: 'bK' },  // a8: Black King
      { pos: { row: 0, col: 1 }, piece: 'wR' },  // b8: White Rook (puts king in check)
      { pos: { row: 2, col: 1 }, piece: 'wK' }   // b6: White King
    ]);
    
    const actor = createTestActor(customBoard, 'black');
    
    // Verify the position is check, not stalemate
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(true);
    expect(snapshot.context.isStalemate).toBe(false);
  });
});
