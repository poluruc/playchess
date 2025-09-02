// Use the helper from testHelpers.ts which correctly sets up the machine
import { createTestActor } from './helpers/testHelpers';

// Functions like isKingInCheck, getPossibleMoves etc. are part of the machine's internal logic 
// or context updates, so direct import might not be needed if tests rely on actor state.
// If they are indeed utility functions exported from chessMachine.ts and needed for assertions outside actor context:
// import { getPossibleMoves, isKingInCheck, isCheckmate, isStalemate, createInitialBoard } from '../lib/chessMachine';

describe('Chess Machine - Castling Logic', () => {
  // Test 1: White King-side Castling
  test('should allow white king-side castling when conditions are met', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 7 }, piece: 'wR' },
    ];
    const actor = createTestActor(pieceSetups, 'white'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } }); // Select King
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } });   // Move to g1

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][6]).toBe('wK');
    expect(snapshot.context.board[7][5]).toBe('wR');
    expect(snapshot.context.board[7][4]).toBe('');
    expect(snapshot.context.board[7][7]).toBe('');
    expect(snapshot.context.castlingRights.white.kingSide).toBe(false);
    expect(snapshot.context.castlingRights.white.queenSide).toBe(false); // King move invalidates both
    expect(snapshot.context.error).toBeNull();
  });

  // Test 2: White Queen-side Castling
  test('should allow white queen-side castling when conditions are met', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 0 }, piece: 'wR' },
    ];
    const actor = createTestActor(pieceSetups, 'white'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } }); // Select King
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 2 } });   // Move to c1

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][2]).toBe('wK');
    expect(snapshot.context.board[7][3]).toBe('wR');
    expect(snapshot.context.board[7][4]).toBe('');
    expect(snapshot.context.board[7][0]).toBe('');
    expect(snapshot.context.castlingRights.white.kingSide).toBe(false);
    expect(snapshot.context.castlingRights.white.queenSide).toBe(false);
    expect(snapshot.context.error).toBeNull();
  });

  // Test 3: Black King-side Castling
  test('should allow black king-side castling when conditions are met', () => {
    const pieceSetups = [
      { pos: { row: 0, col: 4 }, piece: 'bK' },
      { pos: { row: 0, col: 7 }, piece: 'bR' },
    ];
    const actor = createTestActor(pieceSetups, 'black'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 0, col: 4 } }); // Select King
    actor.send({ type: 'MOVE_PIECE', position: { row: 0, col: 6 } });   // Move to g8

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[0][6]).toBe('bK');
    expect(snapshot.context.board[0][5]).toBe('bR');
    expect(snapshot.context.board[0][4]).toBe('');
    expect(snapshot.context.board[0][7]).toBe('');
    expect(snapshot.context.castlingRights.black.kingSide).toBe(false);
    expect(snapshot.context.castlingRights.black.queenSide).toBe(false);
    expect(snapshot.context.error).toBeNull();
  });

  // Test 4: Black Queen-side Castling
  test('should allow black queen-side castling when conditions are met', () => {
    const pieceSetups = [
      { pos: { row: 0, col: 4 }, piece: 'bK' },
      { pos: { row: 0, col: 0 }, piece: 'bR' },
    ];
    const actor = createTestActor(pieceSetups, 'black'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 0, col: 4 } }); // Select King
    actor.send({ type: 'MOVE_PIECE', position: { row: 0, col: 2 } });   // Move to c8

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[0][2]).toBe('bK');
    expect(snapshot.context.board[0][3]).toBe('bR');
    expect(snapshot.context.board[0][4]).toBe('');
    expect(snapshot.context.board[0][0]).toBe('');
    expect(snapshot.context.castlingRights.black.kingSide).toBe(false);
    expect(snapshot.context.castlingRights.black.queenSide).toBe(false);
    expect(snapshot.context.error).toBeNull();
  });

  // Test 5: Prevent castling if King has moved
  test('should prevent white king-side castling if king has moved from its starting square', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' }, 
      { pos: { row: 7, col: 7 }, piece: 'wR' },
      { pos: { row: 1, col: 0 }, piece: 'bP' }, // Add a black pawn for turn passing
    ];
    // Create actor with castling rights initially true, but the machine should revoke them after king moves.
    const actor = createTestActor(pieceSetups, 'white', { // Pass pieceSetups directly
      white: { kingSide: true, queenSide: true }, 
      black: { kingSide: true, queenSide: true },
    });

    // Move king away and back
    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } }); 
    actor.send({ type: 'MOVE_PIECE', position: { row: 6, col: 4 } }); // Move to e2
    // Black's turn: move pawn a7 to a6
    actor.send({ type: 'SELECT_PIECE', position: { row: 1, col: 0 } }); 
    actor.send({ type: 'MOVE_PIECE', position: { row: 2, col: 0 } }); 
    // White's turn: move king back to e1
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 4 } }); 
    // Black's turn: move pawn a6 to a5
    actor.send({ type: 'SELECT_PIECE', position: { row: 2, col: 0 } }); 
    actor.send({ type: 'MOVE_PIECE', position: { row: 3, col: 0 } }); 

    // Attempt castle
    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } }); 
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } });   

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK'); // King should be on e1
    expect(snapshot.context.board[7][7]).toBe('wR'); // Rook should be on h1
    expect(snapshot.context.board[7][6]).toBe('');   // g1 should be empty
    expect(snapshot.context.board[7][5]).toBe('');   // f1 should be empty
    expect(snapshot.context.castlingRights.white.kingSide).toBe(false);
    expect(snapshot.context.error).not.toBeNull(); 
  });
  
  // Test 6: Prevent castling if Rook has moved
  test('should prevent white king-side castling if rook has moved from its starting square', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 7 }, piece: 'wR' }, 
      { pos: { row: 1, col: 0 }, piece: 'bP' }, // Add a black pawn for turn passing
    ];
    const actor = createTestActor(pieceSetups, 'white', { // Pass pieceSetups directly
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

    // Move rook away and back
    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 7 } }); 
    actor.send({ type: 'MOVE_PIECE', position: { row: 6, col: 7 } }); // Move to h2
    // Black's turn: move pawn a7 to a6
    actor.send({ type: 'SELECT_PIECE', position: { row: 1, col: 0 } }); 
    actor.send({ type: 'MOVE_PIECE', position: { row: 2, col: 0 } }); 
    // White's turn: move rook back to h1
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 7 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 7 } }); 
    // Black's turn: move pawn a6 to a5
    actor.send({ type: 'SELECT_PIECE', position: { row: 2, col: 0 } }); 
    actor.send({ type: 'MOVE_PIECE', position: { row: 3, col: 0 } }); 
    
    // Attempt castle
    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } }); 

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][7]).toBe('wR'); 
    expect(snapshot.context.board[7][6]).toBe('');
    expect(snapshot.context.board[7][5]).toBe('');
    expect(snapshot.context.castlingRights.white.kingSide).toBe(false);
    expect(snapshot.context.error).not.toBeNull();
  });

  // Test 7: Prevent castling if pieces are between King and Rook (White King-side)
  test('should prevent white king-side castling if pieces are between king and rook', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 5 }, piece: 'wB' }, // Bishop on f1
      { pos: { row: 7, col: 7 }, piece: 'wR' },
    ];
    const actor = createTestActor(pieceSetups, 'white'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][5]).toBe('wB');
    expect(snapshot.context.board[7][7]).toBe('wR');
    expect(snapshot.context.error).not.toBeNull();
  });

  // Test 8: Prevent castling if King is in check (White King-side)
  test('should prevent white king-side castling if king is in check', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 7 }, piece: 'wR' },
      { pos: { row: 0, col: 4 }, piece: 'bR' }, // Black rook on e8, checking white king on e1
    ];
    const actor = createTestActor(pieceSetups, 'white'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][7]).toBe('wR');
    expect(snapshot.context.isCheck).toBe(true); 
    expect(snapshot.context.error).not.toBeNull(); 
  });

  // Test 9: Prevent castling if King passes through an attacked square (White King-side)
  test('should prevent white king-side castling if king passes through an attacked square', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' }, // e1
      { pos: { row: 7, col: 7 }, piece: 'wR' }, // h1
      { pos: { row: 0, col: 5 }, piece: 'bR' }, // Black rook on f8, attacking f1 (7,5)
    ];
    const actor = createTestActor(pieceSetups, 'white'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } }); // Attempt to castle, king passes f1

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][7]).toBe('wR');
    expect(snapshot.context.error).not.toBeNull();
  });

  // Test 10: Prevent castling if King lands on an attacked square (White King-side)
  test('should prevent white king-side castling if king lands on an attacked square', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' }, // e1
      { pos: { row: 7, col: 7 }, piece: 'wR' }, // h1
      { pos: { row: 0, col: 6 }, piece: 'bR' }, // Black rook on g8, attacking g1 (7,6)
    ];
    const actor = createTestActor(pieceSetups, 'white'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } }); // Attempt to castle, king lands on g1

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][7]).toBe('wR');
    expect(snapshot.context.error).not.toBeNull();
  });
  
  // Test 11: Prevent castling if pieces are between King and Rook (White Queen-side)
  test('should prevent white queen-side castling if pieces are between king and rook', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 3 }, piece: 'wQ' }, // Queen on d1
      { pos: { row: 7, col: 0 }, piece: 'wR' },
    ];
    const actor = createTestActor(pieceSetups, 'white'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 2 } }); // Attempt queen-side castle

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][3]).toBe('wQ');
    expect(snapshot.context.board[7][0]).toBe('wR');
    expect(snapshot.context.error).not.toBeNull();
  });
  
  // Test 12: Prevent castling if King passes through d1 (attacked)
  test('should prevent white queen-side castling if king passes through d1 (attacked)', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' }, // e1
      { pos: { row: 7, col: 0 }, piece: 'wR' }, // a1
      { pos: { row: 0, col: 3 }, piece: 'bR' }, // Black rook on d8, attacking d1 (7,3)
    ];
    const actor = createTestActor(pieceSetups, 'white'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 2 } }); // Attempt queen-side, king passes d1

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][0]).toBe('wR');
    expect(snapshot.context.error).not.toBeNull();
  });

  // Test 13: Prevent castling if King lands on c1 (attacked)
  test('should prevent white queen-side castling if king lands on c1 (attacked)', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' }, // e1
      { pos: { row: 7, col: 0 }, piece: 'wR' }, // a1
      { pos: { row: 0, col: 2 }, piece: 'bR' }, // Black rook on c8, attacking c1 (7,2)
    ];
    const actor = createTestActor(pieceSetups, 'white'); // Pass pieceSetups directly

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 2 } }); // Attempt queen-side, king lands on c1

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][0]).toBe('wR');
    expect(snapshot.context.error).not.toBeNull();
  });

  // Test 14: Verify black is in check after white king-side castling
  test('should correctly identify black king in check after white king-side castling', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' }, // e1, White King
      { pos: { row: 7, col: 7 }, piece: 'wR' }, // h1, White Rook for castling
      { pos: { row: 0, col: 5 }, piece: 'bK' }, // f8, Black King
    ];
    const actor = createTestActor(pieceSetups, 'white', { // Pass pieceSetups directly
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }, // Black needs castling rights for this test to be about white's move
    });

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } }); // White castles king-side

    const snapshot = actor.getSnapshot();
    // After castling: wK on g1 (7,6), wR on f1 (7,5)
    expect(snapshot.context.board[7][6]).toBe('wK');
    expect(snapshot.context.board[7][5]).toBe('wR');
    expect(snapshot.context.currentPlayer).toBe('black');
    // The white rook on f1 (7,5) now checks the black king on f8 (0,5).
    expect(snapshot.context.isCheck).toBe(true); // Black king should be in check
    expect(snapshot.context.error).toBeNull();   // Castling itself is valid
  });

  // Test 15: Verify checkmate after white king-side castling (scenario)
  test('should correctly identify checkmate after white king-side castling', () => {
    const pieceSetups = [
      { pos: { row: 7, col: 4 }, piece: 'wK' }, // e1, White King
      { pos: { row: 7, col: 7 }, piece: 'wR' }, // h1, White Rook for castling
      { pos: { row: 0, col: 5 }, piece: 'bK' }, // f8, Black King
      // Pieces to create checkmate after white castles king-side (wK g1, wR f1)
      // wR f1 will check bK f8.
      // Escape squares for bK f8 (0,5): e8(0,4), g8(0,6), e7(1,4), f7(1,5), g7(1,6)
      { pos: { row: 2, col: 4 }, piece: 'wQ' }, // White Queen at e6 (covers e8, g8, e7, f7)
      { pos: { row: 3, col: 7 }, piece: 'wN' }, // White Knight at h5 (covers g7 and e7)
    ];
    const actor = createTestActor(pieceSetups, 'white', { // Pass pieceSetups directly
        white: { kingSide: true, queenSide: true },
        black: { kingSide: false, queenSide: false },
    });

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } }); // Select wK
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } });   // Castle King-side (wK to g1, wR to f1)

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][6]).toBe('wK'); // wK on g1
    expect(snapshot.context.board[7][5]).toBe('wR'); // wR on f1
    expect(snapshot.context.currentPlayer).toBe('black');
    expect(snapshot.context.isCheck).toBe(true);
    expect(snapshot.context.isCheckmate).toBe(true);
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe('white');
    expect(snapshot.context.error).toBeNull();
  });

  // Test 16: Verify stalemate after black queen-side castling (scenario)
  test('should correctly identify stalemate after black queen-side castling', () => {
    const pieceSetups = [
      { pos: { row: 0, col: 4 }, piece: 'bK' }, // e8, Black King
      { pos: { row: 0, col: 0 }, piece: 'bR' }, // a8, Black Rook for Q-side castling
      
      // Setup for white to be stalemated after black castles.
      // White King at a1 (7,0). Black Queen at c2 (6,2) will stalemate wK a1.
      // bQ c2 covers b1, a2, b2 (wK escape squares) and d1, d2, c1.
      { pos: { row: 7, col: 0 }, piece: 'wK' }, // a1, White King
      { pos: { row: 6, col: 2 }, piece: 'bQ' }, // c2, Black Queen
    ];
    const actor = createTestActor(pieceSetups, 'black', { // Pass pieceSetups directly
        white: { kingSide: false, queenSide: false }, // White cannot castle
        black: { kingSide: true, queenSide: true },   // Black can castle
    });

    actor.send({ type: 'SELECT_PIECE', position: { row: 0, col: 4 } }); // Select bK
    actor.send({ type: 'MOVE_PIECE', position: { row: 0, col: 2 } });   // Castle Queen-side (bK to c8, bR to d8)

    const snapshot = actor.getSnapshot();
    // After black castles: bK on c8 (0,2), bR on d8 (0,3)
    expect(snapshot.context.board[0][2]).toBe('bK');
    expect(snapshot.context.board[0][3]).toBe('bR');
    expect(snapshot.context.currentPlayer).toBe('white'); // Now it's white's turn

    // Verify white is stalemated by bQ on c2.
    // wK on a1 (7,0) is not in check by bQ c2 (6,2) or bK c8 (0,2) or bR d8 (0,3).
    // wK moves: b1 (7,1) - attacked by bQ c2.
    //           a2 (6,0) - attacked by bQ c2.
    //           b2 (6,1) - attacked by bQ c2.
    expect(snapshot.context.isCheck).toBe(false);      // White should not be in check
    expect(snapshot.context.isStalemate).toBe(true); // White should be stalemated
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBeNull();       // No winner in stalemate
    expect(snapshot.context.error).toBeNull();
  });
});

describe('Chess Machine - Basic Checkmate/Stalemate Diagnosis', () => {
  test('should correctly identify a simple checkmate (bK a8, wR a7, wR b7, black to play)', () => {
    const pieceSetups = [
      { pos: { row: 0, col: 0 }, piece: 'bK' }, // a8, Black King
      { pos: { row: 1, col: 0 }, piece: 'wR' }, // a7, White Rook (checks bK)
      { pos: { row: 1, col: 1 }, piece: 'wR' }, // b7, White Rook (covers bK escape to b8)
    ];
    const actor = createTestActor(
      pieceSetups, // Pass pieceSetups directly
      'black', 
      { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } },
      null       
    );

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.currentPlayer).toBe('black');
    expect(snapshot.context.isCheck).toBe(true);
    expect(snapshot.context.isCheckmate).toBe(true);
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe('white');
  });
});

describe('Chess Machine - Direct Checkmate Scenario Test', () => {
  test('should correctly identify checkmate with Rook and Queen (bK h8, wR h1, wQ f7, black to play)', () => {
    const pieceSetups = [
      { pos: { row: 0, col: 7 }, piece: 'bK' }, // h8, Black King
      { pos: { row: 7, col: 7 }, piece: 'wR' }, // h1, White Rook (checking bK)
      { pos: { row: 1, col: 5 }, piece: 'wQ' }, // f7, White Queen (covering g8, g7)
    ];

    // It's black's turn, and black is in check.
    const actor = createTestActor(
      pieceSetups, // Pass pieceSetups directly
      'black',
      { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } },
      null
    );

    const snapshot = actor.getSnapshot();
    // Black king (0,7) is checked by White Rook (7,7)
    // White Queen (1,5) f7 covers escape squares:
    // g8 (0,6) - covered by wQ (1,5) diagonally
    // g7 (1,6) - covered by wQ (1,5) vertically

    expect(snapshot.context.currentPlayer).toBe('black');
    expect(snapshot.context.isCheck).toBe(true);
    expect(snapshot.context.isCheckmate).toBe(true); // This is the key assertion
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe('white'); // White delivered checkmate
  });
});

describe('Chess Machine - More Direct Checkmate Scenarios', () => {
  test('should correctly identify checkmate with Rook and Queen (bK h8, wR h1, wQ f7, black to play) - REPEATED', () => {
    const pieceSetups = [
      { pos: { row: 0, col: 7 }, piece: 'bK' }, // h8, Black King
      { pos: { row: 7, col: 7 }, piece: 'wR' }, // h1, White Rook (checking bK)
      { pos: { row: 1, col: 5 }, piece: 'wQ' }, // f7, White Queen (covering g8, g7)
    ];

    const actor = createTestActor(
      pieceSetups, // Pass pieceSetups directly
      'black',
      { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } },
      null
    );

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.currentPlayer).toBe('black');
    expect(snapshot.context.isCheck).toBe(true);
    expect(snapshot.context.isCheckmate).toBe(true);
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe('white');
  });

  test('should correctly identify a simple Queen+Rook checkmate (bK a8, wQ a7, wR b7, black to play)', () => {
    const pieceSetups = [
      { pos: { row: 0, col: 0 }, piece: 'bK' }, // a8
      { pos: { row: 1, col: 0 }, piece: 'wQ' }, // a7 (directly checks and covers a8 escape to a7)
      { pos: { row: 1, col: 1 }, piece: 'wR' }, // b7 (covers a8 escape to b8, and protects wQ if bK tries bKxa7)
    ];
    const actor = createTestActor(
      pieceSetups, // Pass pieceSetups directly
      'black',
      { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } },
      null
    );
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.currentPlayer).toBe('black');
    // King at (0,0) is checked by Queen at (1,0)
    expect(snapshot.context.isCheck).toBe(true); 
    // Escape moves for bK at (0,0):
    // 1. to b8 (0,1): Attacked by wQ(1,0) diagonally, and by wR(1,1) vertically.
    // No other moves.
    expect(snapshot.context.isCheckmate).toBe(true);
    expect(snapshot.context.gameOver).toBe(true);
    expect(snapshot.context.winner).toBe('white');
  });
});
