import { createCustomBoard, createTestActor } from './helpers/testHelpers';

describe('Checkmate Detection', () => {
  test('should detect fool\'s mate (quickest possible checkmate)', () => {
    // Set up the board for fool's mate (2-move checkmate)
    // 1. f3 e5 2. g4 Qh4#
    const customBoard = createCustomBoard([
      // Black pieces
      { pos: { row: 0, col: 0 }, piece: 'bR' },
      { pos: { row: 0, col: 1 }, piece: 'bN' },
      { pos: { row: 0, col: 2 }, piece: 'bB' },
      { pos: { row: 0, col: 3 }, piece: 'bQ' },
      { pos: { row: 0, col: 4 }, piece: 'bK' },
      { pos: { row: 0, col: 5 }, piece: 'bB' },
      { pos: { row: 0, col: 6 }, piece: 'bN' },
      { pos: { row: 0, col: 7 }, piece: 'bR' },
      { pos: { row: 1, col: 0 }, piece: 'bP' },
      { pos: { row: 1, col: 1 }, piece: 'bP' },
      { pos: { row: 1, col: 2 }, piece: 'bP' },
      { pos: { row: 1, col: 3 }, piece: 'bP' },
      { pos: { row: 4, col: 4 }, piece: 'bP' }, // e5 pawn moved
      { pos: { row: 4, col: 7 }, piece: 'bQ' }, // Qh4 queen moved for checkmate
      { pos: { row: 1, col: 6 }, piece: 'bP' },
      { pos: { row: 1, col: 7 }, piece: 'bP' },
      
      // White pieces
      { pos: { row: 7, col: 0 }, piece: 'wR' },
      { pos: { row: 7, col: 1 }, piece: 'wN' },
      { pos: { row: 7, col: 2 }, piece: 'wB' },
      { pos: { row: 7, col: 3 }, piece: 'wQ' },
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 5 }, piece: 'wB' },
      { pos: { row: 7, col: 6 }, piece: 'wN' },
      { pos: { row: 7, col: 7 }, piece: 'wR' },
      { pos: { row: 6, col: 0 }, piece: 'wP' },
      { pos: { row: 6, col: 1 }, piece: 'wP' },
      { pos: { row: 6, col: 2 }, piece: 'wP' },
      { pos: { row: 6, col: 3 }, piece: 'wP' },
      { pos: { row: 6, col: 4 }, piece: 'wP' },
      { pos: { row: 5, col: 5 }, piece: 'wP' }, // f3 pawn moved
      { pos: { row: 4, col: 6 }, piece: 'wP' }  // g4 pawn moved
    ]);
    
    const actor = createTestActor(customBoard, 'white');
    
    // The white king should be in checkmate
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
    // Set up a smothered mate (knight checkmate with king surrounded by its own pieces)
    const customBoard = createCustomBoard([
      { pos: { row: 0, col: 0 }, piece: 'bK' },  // a8: Black King
      { pos: { row: 0, col: 1 }, piece: 'bR' },  // b8: Black Rook
      { pos: { row: 1, col: 0 }, piece: 'bP' },  // a7: Black Pawn
      { pos: { row: 1, col: 2 }, piece: 'bP' },  // c7: Black Pawn
      { pos: { row: 2, col: 1 }, piece: 'wN' }   // b6: White Knight (delivers smothered mate)
    ]);
    
    const actor = createTestActor(customBoard, 'black');
    
    // Verify the black king is in checkmate
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.isCheck).toBe(true);
    expect(snapshot.context.isCheckmate).toBe(true);
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe('white');
  });
});
