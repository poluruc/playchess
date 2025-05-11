import { createCustomBoard, createTestActor } from './helpers/testHelpers';

describe('Checkmate Detection', () => {
  test("should detect fool's mate (quickest possible checkmate)", () => {
    // Board after 1. f3 e5 2. g4 Qh4#
    // White is to play and is checkmated.
    const customBoard = createCustomBoard([
      // Black pieces
      { pos: { row: 0, col: 0 }, piece: 'bR' }, { pos: { row: 0, col: 1 }, piece: 'bN' }, { pos: { row: 0, col: 2 }, piece: 'bB' }, /* bQ moved from 0,3 */ { pos: { row: 0, col: 4 }, piece: 'bK' }, { pos: { row: 0, col: 5 }, piece: 'bB' }, { pos: { row: 0, col: 6 }, piece: 'bN' }, { pos: { row: 0, col: 7 }, piece: 'bR' },
      { pos: { row: 1, col: 0 }, piece: 'bP' }, { pos: { row: 1, col: 1 }, piece: 'bP' }, { pos: { row: 1, col: 2 }, piece: 'bP' }, { pos: { row: 1, col: 3 }, piece: 'bP' }, /* bP e7 moved from 1,4 */ { pos: { row: 1, col: 5 }, piece: 'bP' }, { pos: { row: 1, col: 6 }, piece: 'bP' }, { pos: { row: 1, col: 7 }, piece: 'bP' },
      { pos: { row: 3, col: 4 }, piece: 'bP' }, // Black Pawn at e5 (moved from e7)
      { pos: { row: 4, col: 7 }, piece: 'bQ' }, // Black Queen at h4 (moved from d8)

      // White pieces
      { pos: { row: 7, col: 0 }, piece: 'wR' }, { pos: { row: 7, col: 1 }, piece: 'wN' }, { pos: { row: 7, col: 2 }, piece: 'wB' }, { pos: { row: 7, col: 3 }, piece: 'wQ' }, { pos: { row: 7, col: 4 }, piece: 'wK' }, { pos: { row: 7, col: 5 }, piece: 'wB' }, { pos: { row: 7, col: 6 }, piece: 'wN' }, { pos: { row: 7, col: 7 }, piece: 'wR' },
      { pos: { row: 6, col: 0 }, piece: 'wP' }, { pos: { row: 6, col: 1 }, piece: 'wP' }, { pos: { row: 6, col: 2 }, piece: 'wP' }, { pos: { row: 6, col: 3 }, piece: 'wP' }, { pos: { row: 6, col: 4 }, piece: 'wP' }, /* wP f2 moved from 6,5 */ /* wP g2 moved from 6,6 */ { pos: { row: 6, col: 7 }, piece: 'wP' }, // White Pawn h2 is crucial for blocking rook
      { pos: { row: 5, col: 5 }, piece: 'wP' }, // White Pawn at f3 (moved from f2)
      { pos: { row: 4, col: 6 }, piece: 'wP' }, // White Pawn at g4 (moved from g2)
    ]);
    
    const actor = createTestActor(customBoard, 'white'); // White is checkmated
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(true);
    expect(snapshot.context.isCheckmate).toBe(true);
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe('black');
  });

  test('should detect a back-rank checkmate', () => {
    // Set up a classic back-rank checkmate with rook
    const customBoard = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' },  // e1: White King
      { pos: { row: 6, col: 3 }, piece: 'wP' },  // d2: White Pawn
      { pos: { row: 6, col: 4 }, piece: 'wP' },  // e2: White Pawn
      { pos: { row: 6, col: 5 }, piece: 'wP' },  // f2: White Pawn
      { pos: { row: 7, col: 0 }, piece: 'bR' }   // a1: Black Rook (checkmate on back rank)
    ]);
    
    const actor = createTestActor(customBoard, 'white');
    
    // Verify the white king is in checkmate
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(true);
    expect(snapshot.context.isCheckmate).toBe(true);
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe('black');
  });

  test('should detect a smothered checkmate', () => {
    // Standard smothered mate:
    // Black King at h8 (0,7)
    // Black Rook at g8 (0,6)
    // Black Pawn at h7 (1,7)
    // Black Pawn at g7 (1,6)
    // White Knight at f7 (1,5) delivers checkmate.
    // It is Black's turn.
    const customBoard = createCustomBoard([
      { pos: { row: 0, col: 7 }, piece: 'bK' }, // h8
      { pos: { row: 0, col: 6 }, piece: 'bR' }, // g8
      { pos: { row: 1, col: 7 }, piece: 'bP' }, // h7
      { pos: { row: 1, col: 6 }, piece: 'bP' }, // g7
      { pos: { row: 1, col: 5 }, piece: 'wN' }  // f7 (White Knight)
      // Ensure other pieces are not interfering or providing escape routes
    ]);
    
    const actor = createTestActor(customBoard, 'black'); // Black is checkmated
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(true);
    expect(snapshot.context.isCheckmate).toBe(true);
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe('white');
  });
});
