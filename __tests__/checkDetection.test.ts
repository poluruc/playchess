import { createCustomBoard, createTestActor } from './helpers/testHelpers';

describe('Check Detection', () => {
  test('should detect when white king is in check from black queen', () => {
    // Create a board with white king at e1 and black queen at e8
    const customBoard = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' },  // e1: White King
      { pos: { row: 0, col: 4 }, piece: 'bQ' }   // e8: Black Queen
    ]);
    
    const actor = createTestActor(customBoard, 'white');
    
    // Verify that the king is detected as being in check
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(true);
  });

  test('should detect when black king is in check from white bishop', () => {
    // Create a board with black king and a white bishop in position to check it
    const customBoard = createCustomBoard([
      { pos: { row: 0, col: 4 }, piece: 'bK' },  // e8: Black King
      { pos: { row: 2, col: 6 }, piece: 'wB' }   // g6: White Bishop (checking diagonally)
    ]);
    
    const actor = createTestActor(customBoard, 'black');
    
    // Verify the initial state has check detected
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(true);
  });

  test('should detect check from knight', () => {
    // Create a board with white king and black knight in position to check
    const customBoard = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' },  // e1: White King
      { pos: { row: 5, col: 5 }, piece: 'bN' }   // f3: Black Knight (L-shape to check)
    ]);
    
    const actor = createTestActor(customBoard, 'white');
    
    // Verify the initial state has check detected
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(true);
  });

  test('should detect check from pawn', () => {
    // Create a board with black king and white pawn in position to check
    const customBoard = createCustomBoard([
      { pos: { row: 0, col: 4 }, piece: 'bK' },  // e8: Black King
      { pos: { row: 1, col: 5 }, piece: 'wP' }   // f7: White Pawn (diagonal to check)
    ]);
    
    const actor = createTestActor(customBoard, 'black');
    
    // Verify the initial state has check detected
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(true);
  });
});
