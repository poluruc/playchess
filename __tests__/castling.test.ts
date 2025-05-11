import { createCustomBoard, createTestActor } from './helpers/testHelpers';

describe('Castling Logic', () => {
  // Test 1: White King-side Castling
  test('should allow white king-side castling when conditions are met', () => {
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 7 }, piece: 'wR' },
      // Ensure no pieces between king and rook
    ]);
    const actor = createTestActor(board, 'white', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

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
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 0 }, piece: 'wR' },
      // Ensure no pieces between king and rook (b1, c1, d1 are empty)
    ]);
    const actor = createTestActor(board, 'white', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

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
    const board = createCustomBoard([
      { pos: { row: 0, col: 4 }, piece: 'bK' },
      { pos: { row: 0, col: 7 }, piece: 'bR' },
    ]);
    const actor = createTestActor(board, 'black', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

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
    const board = createCustomBoard([
      { pos: { row: 0, col: 4 }, piece: 'bK' },
      { pos: { row: 0, col: 0 }, piece: 'bR' },
    ]);
    const actor = createTestActor(board, 'black', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

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
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' }, 
      { pos: { row: 7, col: 7 }, piece: 'wR' },
      { pos: { row: 1, col: 0 }, piece: 'bP' }, // Add a black pawn for turn passing
    ]);
    const actor = createTestActor(board, 'white', {
      white: { kingSide: true, queenSide: true }, // Assume rights are initially true
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
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 7 }, piece: 'wR' }, 
      { pos: { row: 1, col: 0 }, piece: 'bP' }, // Add a black pawn for turn passing
    ]);
    const actor = createTestActor(board, 'white', {
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
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 5 }, piece: 'wB' }, // Bishop on f1
      { pos: { row: 7, col: 7 }, piece: 'wR' },
    ]);
    const actor = createTestActor(board, 'white', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

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
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 7 }, piece: 'wR' },
      { pos: { row: 0, col: 4 }, piece: 'bR' }, // Black rook on e8, checking white king on e1
    ]);
    const actor = createTestActor(board, 'white', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

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
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' }, // e1
      { pos: { row: 7, col: 7 }, piece: 'wR' }, // h1
      { pos: { row: 0, col: 5 }, piece: 'bR' }, // Black rook on f8, attacking f1 (7,5)
    ]);
    const actor = createTestActor(board, 'white', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } }); // Attempt to castle, king passes f1

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][7]).toBe('wR');
    expect(snapshot.context.error).not.toBeNull();
  });

  // Test 10: Prevent castling if King lands on an attacked square (White King-side)
  test('should prevent white king-side castling if king lands on an attacked square', () => {
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' }, // e1
      { pos: { row: 7, col: 7 }, piece: 'wR' }, // h1
      { pos: { row: 0, col: 6 }, piece: 'bR' }, // Black rook on g8, attacking g1 (7,6)
    ]);
    const actor = createTestActor(board, 'white', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } }); // Attempt to castle, king lands on g1

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][7]).toBe('wR');
    expect(snapshot.context.error).not.toBeNull();
  });
  
  // Test 11: Prevent castling if pieces are between King and Rook (White Queen-side)
  test('should prevent white queen-side castling if pieces are between king and rook', () => {
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' },
      { pos: { row: 7, col: 3 }, piece: 'wQ' }, // Queen on d1
      { pos: { row: 7, col: 0 }, piece: 'wR' },
    ]);
    const actor = createTestActor(board, 'white', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

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
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' }, // e1
      { pos: { row: 7, col: 0 }, piece: 'wR' }, // a1
      { pos: { row: 0, col: 3 }, piece: 'bR' }, // Black rook on d8, attacking d1 (7,3)
    ]);
    const actor = createTestActor(board, 'white', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 2 } }); // Attempt queen-side, king passes d1

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][0]).toBe('wR');
    expect(snapshot.context.error).not.toBeNull();
  });

  // Test 13: Prevent castling if King lands on c1 (attacked)
  test('should prevent white queen-side castling if king lands on c1 (attacked)', () => {
    const board = createCustomBoard([
      { pos: { row: 7, col: 4 }, piece: 'wK' }, // e1
      { pos: { row: 7, col: 0 }, piece: 'wR' }, // a1
      { pos: { row: 0, col: 2 }, piece: 'bR' }, // Black rook on c8, attacking c1 (7,2)
    ]);
    const actor = createTestActor(board, 'white', {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    });

    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 2 } }); // Attempt queen-side, king lands on c1

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][0]).toBe('wR');
    expect(snapshot.context.error).not.toBeNull();
  });

});
