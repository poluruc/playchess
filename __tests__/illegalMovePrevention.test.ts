import { PieceSetup } from '../lib/chessTypes';
import { createTestActor } from './helpers/testHelpers';

describe('Illegal Move Prevention', () => {
  it('prevents moving a piece that would leave the king in check', () => {
    const pieceSetups: PieceSetup[] = [
      { piece: 'wK', pos: { row: 7, col: 4 } },
      { piece: 'wR', pos: { row: 7, col: 0 } }, // This rook is protecting the king
      { piece: 'bR', pos: { row: 0, col: 0 } }, // Black rook attacking along the a-file
    ];
    const actor = createTestActor(
      pieceSetups,
      'white',
      { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } }
    );

    actor.start();
    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 0 } }); // Select the white rook at a1
    actor.send({ type: 'MOVE_PIECE', position: { row: 0, col: 0 } });   // Attempt to move it to a8 (capturing black rook)

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][0]).toBe('wR'); // Rook should not have moved
    expect(snapshot.context.error).not.toBeNull(); // Should be an error
  });

  it('prevents moving a pinned piece if the move does not resolve the pin', () => {
    const pieceSetups: PieceSetup[] = [
      { piece: 'wK', pos: { row: 7, col: 4 } }, // King on e1
      { piece: 'wN', pos: { row: 6, col: 4 } }, // Knight on e2, pinned by queen on e8
      { piece: 'bQ', pos: { row: 0, col: 4 } }, // Queen on e8
    ];
    const actor = createTestActor(pieceSetups, 'white');

    actor.start();
    // Attempt to move the pinned knight off the line of attack (e.g., to d4 or f4)
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } }); // Select knight
    actor.send({ type: 'MOVE_PIECE', position: { row: 4, col: 3 } });   // Attempt to move to d4 (invalid)

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[6][4]).toBe('wN'); // Knight should still be on e2
    expect(snapshot.context.error).not.toBeNull();
  });

  it('allows moving a pinned piece along the line of the pin', () => {
    const pieceSetups: PieceSetup[] = [
      { piece: 'wK', pos: { row: 7, col: 4 } }, // King on e1
      { piece: 'wR', pos: { row: 6, col: 4 } }, // Rook on e2, pinned by queen on e8
      { piece: 'bQ', pos: { row: 0, col: 4 } }, // Queen on e8
    ];
    const actor = createTestActor(pieceSetups, 'white');

    actor.start();
    // Attempt to move the pinned rook along the e-file (e.g., to e3)
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } }); // Select rook
    actor.send({ type: 'MOVE_PIECE', position: { row: 5, col: 4 } });   // Attempt to move to e3 (valid)

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[5][4]).toBe('wR'); // Rook should be on e3
    expect(snapshot.context.error).toBeNull();
  });

  it('prevents castling if the king is in check', () => {
    const pieceSetups: PieceSetup[] = [
      { piece: 'wK', pos: { row: 7, col: 4 } }, // King on e1
      { piece: 'wR', pos: { row: 7, col: 7 } }, // Rook on h1
      { piece: 'bR', pos: { row: 0, col: 4 } }, // Black rook on e8, checking the white king
    ];
    const actor = createTestActor( 
      pieceSetups, 
      'white', 
      { white: { kingSide: true, queenSide: false }, black: { kingSide: false, queenSide: false }}
    );
    actor.start();
    // Attempt king-side castling (e1 to g1)
    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK'); // King should still be on e1
    expect(snapshot.context.board[7][6]).toBe(''); // No piece should be on g1
    expect(snapshot.context.error).not.toBeNull();
  });

  it('prevents castling if a square the king passes through is attacked', () => {
    const pieceSetups: PieceSetup[] = [
      { piece: 'wK', pos: { row: 7, col: 4 } }, // King on e1
      { piece: 'wR', pos: { row: 7, col: 7 } }, // Rook on h1
      { piece: 'bR', pos: { row: 0, col: 5 } }, // Black rook on f8, attacking f1 (row 7, col 5)
    ];
    const actor = createTestActor(
      pieceSetups, 
      'white', 
      { white: { kingSide: true, queenSide: false }, black: { kingSide: false, queenSide: false }}
    );
    actor.start();
    // Attempt king-side castling (e1 to g1, passes f1)
    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][6]).toBe('');
    expect(snapshot.context.error).not.toBeNull();
  });

  it('prevents castling if the destination square for the king is attacked', () => {
    const pieceSetups: PieceSetup[] = [
      { piece: 'wK', pos: { row: 7, col: 4 } }, // King on e1
      { piece: 'wR', pos: { row: 7, col: 7 } }, // Rook on h1
      { piece: 'bR', pos: { row: 0, col: 6 } }, // Black rook on g8, attacking g1 (row 7, col 6)
    ];
    const actor = createTestActor( 
      pieceSetups, 
      'white', 
      { white: { kingSide: true, queenSide: false }, black: { kingSide: false, queenSide: false }}
    );
    actor.start();
    // Attempt king-side castling (e1 to g1)
    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 6 } });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK');
    expect(snapshot.context.board[7][6]).toBe('');
    expect(snapshot.context.error).not.toBeNull();
  });

  it('prevents moving into check - simple case', () => {
    const pieceSetups: PieceSetup[] = [
        { piece: 'wK', pos: { row: 7, col: 4 } }, // White king on e1
        { piece: 'bR', pos: { row: 0, col: 5 } }, // Black rook on f8, controlling the f-file
    ];
    const actor = createTestActor(pieceSetups, 'white');
    actor.start();
    // Attempt to move king from e1 to f1 (into check)
    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 7, col: 5 } });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.board[7][4]).toBe('wK'); // King should still be on e1
    expect(snapshot.context.board[7][5]).toBe(''); // f1 should be empty
    expect(snapshot.context.error).not.toBeNull(); // Should be an error
  });
});

