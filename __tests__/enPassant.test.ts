import { Actor, createActor } from 'xstate';
import { ChessContext, ChessEvents, chessMachine, defaultInitialChessContext } from '../lib/chessMachine';

describe('En Passant Logic', () => {
  test('simple sanity check', () => {
    expect(true).toBe(true);
  });

  let machine: Actor<typeof chessMachine>;

  beforeEach(() => {
    // Create a new actor for each test to ensure isolation
    machine = createActor(chessMachine).start();
  });

  afterEach(() => {
    machine.stop();
  });

  const getContext = () => machine.getSnapshot().context;
  const sendEvent = (event: ChessEvents) => machine.send(event);

  test('should allow white pawn to perform en passant capture', () => {
    // Setup:
    // White pawn at e5 (row 3, col 4) - White's 5th rank.
    // Black pawn at d5 (row 3, col 3) - assumed to have just moved from d7 (row 1).
    // En passant target for white is d6 (row 2, col 3).
    const customContext: Partial<ChessContext> = {
      ...defaultInitialChessContext,
      board: [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', '', 'bP', 'bP', 'bP', 'bP'], // Black d7 pawn moved from here
        ['', '', '', '', '', '', '', ''],             // d6 (row 2, col 3) is en passant target
        ['', '', '', 'bP', 'wP', '', '', ''],         // Black d-pawn at d5 (row 3, col 3), White e-pawn at e5 (row 3, col 4)
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['wP', 'wP', 'wP', 'wP', '', 'wP', 'wP', 'wP'], // White e-pawn was not at e2 for this setup
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
      ],
      currentPlayer: 'white',
      enPassantTarget: { row: 2, col: 3 }, // d6
    };
    machine = createActor(chessMachine, { input: customContext }).start();
    
    expect(getContext().board[3][4]).toBe('wP'); // White e-pawn at e5
    expect(getContext().board[3][3]).toBe('bP'); // Black d-pawn at d5
    expect(getContext().enPassantTarget).toEqual({ row: 2, col: 3 }); // d6

    // White pawn e5 selects and captures black pawn d5 via en passant (moves to d6)
    sendEvent({ type: 'SELECT_PIECE', position: { row: 3, col: 4 } }); // Select wP at e5
    expect(getContext().selectedPiece).toEqual({ row: 3, col: 4 });
    sendEvent({ type: 'MOVE_PIECE', position: { row: 2, col: 3 } }); // Move wP to d6 (en passant target)

    expect(getContext().error).toBeNull();
    expect(getContext().board[2][3]).toBe('wP'); // White pawn moved to d6
    expect(getContext().board[3][4]).toBe('');   // Original e5 is empty
    expect(getContext().board[3][3]).toBe('');   // Captured black pawn at d5 is removed
    expect(getContext().currentPlayer).toBe('black');
    expect(getContext().enPassantTarget).toBeNull(); // En passant target cleared after capture
  });

  test('should allow black pawn to perform en passant capture', () => {
    // Setup:
    // Black pawn at d4 (row 4, col 3) - Black's 5th rank.
    // White pawn at e4 (row 4, col 4) - assumed to have just moved from e2 (row 6).
    // En passant target for black is e3 (row 5, col 4).
    const customContext: Partial<ChessContext> = {
      ...defaultInitialChessContext,
      board: [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', 'bP', 'wP', '', '', ''], // Black d-pawn at d4 (row 4, col 3), White e-pawn at e4 (row 4, col 4)
        ['', '', '', '', '', '', '', ''],             // e3 (row 5, col 4) is en passant target
        ['wP', 'wP', 'wP', 'wP', '', 'wP', 'wP', 'wP'], // White e2 pawn moved from here
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
      ],
      currentPlayer: 'black',
      enPassantTarget: { row: 5, col: 4 }, // e3
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    expect(getContext().board[4][3]).toBe('bP'); // Black d-pawn at d4
    expect(getContext().board[4][4]).toBe('wP'); // White e-pawn at e4
    expect(getContext().enPassantTarget).toEqual({ row: 5, col: 4 }); // e3

    // Black pawn d4 selects and captures white pawn e4 via en passant (moves to e3)
    sendEvent({ type: 'SELECT_PIECE', position: { row: 4, col: 3 } }); // Select bP at d4
    expect(getContext().selectedPiece).toEqual({ row: 4, col: 3 });
    sendEvent({ type: 'MOVE_PIECE', position: { row: 5, col: 4 } }); // Move bP to e3 (en passant target)

    expect(getContext().error).toBeNull();
    expect(getContext().board[5][4]).toBe('bP'); // Black pawn moved to e3
    expect(getContext().board[4][3]).toBe('');   // Original d4 is empty
    expect(getContext().board[4][4]).toBe('');   // Captured white pawn at e4 is removed
    expect(getContext().currentPlayer).toBe('white');
    expect(getContext().enPassantTarget).toBeNull(); // En passant target cleared
  });

  test('should correctly set enPassantTarget after a white pawn two-square advance', () => {
    sendEvent({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } }); // Select wP at e2
    sendEvent({ type: 'MOVE_PIECE', position: { row: 4, col: 4 } }); // Move wP to e4
    expect(getContext().error).toBeNull();
    expect(getContext().board[4][4]).toBe('wP');
    expect(getContext().enPassantTarget).toEqual({ row: 5, col: 4 }); // e3
    expect(getContext().currentPlayer).toBe('black');
  });

  test('should correctly set enPassantTarget after a black pawn two-square advance', () => {
    // White makes a move first
    sendEvent({ type: 'SELECT_PIECE', position: { row: 6, col: 0 } }); // Select wP at a2
    sendEvent({ type: 'MOVE_PIECE', position: { row: 5, col: 0 } }); // Move wP to a3
    expect(getContext().currentPlayer).toBe('black');
    expect(getContext().enPassantTarget).toBeNull(); // No en passant from single step

    // Black pawn two-square advance
    sendEvent({ type: 'SELECT_PIECE', position: { row: 1, col: 3 } }); // Select bP at d7
    sendEvent({ type: 'MOVE_PIECE', position: { row: 3, col: 3 } }); // Move bP to d5
    expect(getContext().error).toBeNull();
    expect(getContext().board[3][3]).toBe('bP');
    expect(getContext().enPassantTarget).toEqual({ row: 2, col: 3 }); // d6
    expect(getContext().currentPlayer).toBe('white');
  });

  test('en passant should only be available on the immediately subsequent turn', () => {
    // 1. White e2-e4 (sets enPassantTarget e3)
    sendEvent({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } }); // wP e2
    sendEvent({ type: 'MOVE_PIECE', position: { row: 4, col: 4 } });   // to e4
    expect(getContext().enPassantTarget).toEqual({ row: 5, col: 4 }); // e3

    // 2. Black d7-d5 (adjacent to e-pawn, could capture if it was white's turn)
    sendEvent({ type: 'SELECT_PIECE', position: { row: 1, col: 3 } }); // bP d7
    sendEvent({ type: 'MOVE_PIECE', position: { row: 3, col: 3 } });   // to d5
    // After black's move, enPassantTarget should be d6 (from black's perspective)
    // or null if black didn't move 2 squares. Here black moved 2 squares.
    expect(getContext().enPassantTarget).toEqual({ row: 2, col: 3 }); // d6

    // 3. White a2-a3 (another move, not en passant)
    sendEvent({ type: 'SELECT_PIECE', position: { row: 6, col: 0 } }); // wP a2
    sendEvent({ type: 'MOVE_PIECE', position: { row: 5, col: 0 } });   // to a3
    // After white's non-2-square-pawn move, enPassantTarget should be null
    expect(getContext().enPassantTarget).toBeNull();

    // 4. Black makes another move (e.g. g7-g6)
    sendEvent({ type: 'SELECT_PIECE', position: { row: 1, col: 6 } }); // bP g7
    sendEvent({ type: 'MOVE_PIECE', position: { row: 2, col: 6 } });   // to g6
    expect(getContext().enPassantTarget).toBeNull(); // Still null

    // Now, white e-pawn at e4 tries to capture black d-pawn at d5 via en passant (to d6)
    // This should NOT be allowed because the en passant opportunity from step 1 (e3) was missed.
    // The current enPassantTarget is null.
    sendEvent({ type: 'SELECT_PIECE', position: { row: 4, col: 4 } }); // Select wP at e4
    // The target for the *original* en passant would have been {row: 2, col: 3} (d6 if black moved d7-d5)
    // but that opportunity is gone.
    // Let's check if isValidMoveInternal would allow it (it shouldn't)
    const isValid = machine.getSnapshot().context.possibleMoves.some(
        (move) => move.row === 2 && move.col === 3
    );
    expect(isValid).toBe(false); // Should not be a valid move

    sendEvent({ type: 'MOVE_PIECE', position: { row: 2, col: 3 } }); // Try to move wP e4 to d6
    expect(getContext().error).not.toBeNull(); // Should be an invalid move
    expect(getContext().board[4][4]).toBe('wP'); // White pawn should remain at e4
    expect(getContext().board[3][3]).toBe('bP'); // Black pawn should remain at d5
  });
  
  test('en passant target should be cleared after a non-pawn move', () => {
    // 1. White e2-e4 (sets enPassantTarget e3)
    sendEvent({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } }); // wP e2
    sendEvent({ type: 'MOVE_PIECE', position: { row: 4, col: 4 } });   // to e4
    expect(getContext().enPassantTarget).toEqual({ row: 5, col: 4 }); // e3

    // 2. Black Knight g8-f6 (a non-pawn move)
    sendEvent({ type: 'SELECT_PIECE', position: { row: 0, col: 6 } }); // bN g8
    sendEvent({ type: 'MOVE_PIECE', position: { row: 2, col: 5 } });   // to f6
    expect(getContext().error).toBeNull();
    expect(getContext().board[2][5]).toBe('bN');
    // Crucially, the enPassantTarget set by white's previous move should now be cleared
    expect(getContext().enPassantTarget).toBeNull();
  });

  test('en passant target should be cleared after a single-step pawn move', () => {
    // 1. White e2-e4 (sets enPassantTarget e3)
    sendEvent({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } }); // wP e2
    sendEvent({ type: 'MOVE_PIECE', position: { row: 4, col: 4 } });   // to e4
    expect(getContext().enPassantTarget).toEqual({ row: 5, col: 4 }); // e3 for black to use

    // 2. Black d7-d6 (single-step pawn move)
    sendEvent({ type: 'SELECT_PIECE', position: { row: 1, col: 3 } }); // bP d7
    sendEvent({ type: 'MOVE_PIECE', position: { row: 2, col: 3 } });   // to d6
    expect(getContext().error).toBeNull();
    expect(getContext().board[2][3]).toBe('bP');
    // Crucially, the enPassantTarget set by white's previous move (e3) should now be cleared
    // because black made a move that was not a two-square pawn advance.
    expect(getContext().enPassantTarget).toBeNull();
  });

  test('should not allow en passant if capturing pawn is not on its 5th rank (White)', () => {
    // Setup: White pawn on e4 (row 4, col 4) - NOT White's 5th rank (which is row 3).
    // Black pawn on d5 (row 3, col 3) - assumed to have just moved from d7 (row 1).
    // enPassantTarget is d6 (row 2, col 3).
    // White e4 should not be able to capture d5 en passant to d6.
    const customContext: Partial<ChessContext> = {
        ...defaultInitialChessContext,
        board: [ // Simplified board
            ['', '', '', '', '', '', '', ''], // 0
            ['', '', '', '', '', '', '', ''], // 1
            ['', '', '', '', '', '', '', ''], // 2: d6 (enPassantTarget)
            ['', '', '', 'bP', '', '', '', ''], // 3: Black pawn at d5 (bP moved d7->d5)
            ['', '', '', '', 'wP', '', '', ''], // 4: White pawn at e4 (NOT 5th rank)
            ['', '', '', '', '', '', '', ''], // 5
            ['', '', '', '', '', '', '', ''], // 6
            ['', '', '', '', '', '', '', ''], // 7
        ],
        currentPlayer: 'white',
        enPassantTarget: { row: 2, col: 3 }, // d6
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    sendEvent({ type: 'SELECT_PIECE', position: { row: 4, col: 4 } }); // Select wP at e4
    const possibleMoves = getContext().possibleMoves;
    const canEnPassant = possibleMoves.some(m => m.row === 2 && m.col === 3);
    expect(canEnPassant).toBe(false);

    sendEvent({ type: 'MOVE_PIECE', position: { row: 2, col: 3 } }); // Attempt en passant to d6
    expect(getContext().error).not.toBeNull();
    expect(getContext().board[4][4]).toBe('wP'); // White Pawn remains at e4
    expect(getContext().board[3][3]).toBe('bP'); // Black Pawn remains at d5
    expect(getContext().board[2][3]).toBe('');   // Target d6 remains empty
  });

  test('should not allow en passant if capturing pawn is not on its 5th rank (Black)', () => {
    // Setup: Black pawn on d5 (row 3, col 3) - NOT Black's 5th rank (which is row 4).
    // White pawn on e4 (row 4, col 4) - assumed to have just moved from e2 (row 6).
    // enPassantTarget is e3 (row 5, col 4).
    // Black d5 should not be able to capture e4 en passant to e3.
    const customContext: Partial<ChessContext> = {
        ...defaultInitialChessContext,
        board: [ // Simplified board
            ['', '', '', '', '', '', '', ''], // 0
            ['', '', '', '', '', '', '', ''], // 1
            ['', '', '', '', '', '', '', ''], // 2
            ['', '', '', 'bP', '', '', '', ''], // 3: Black pawn at d5 (row 3, col 3)
            ['', '', '', '', 'wP', '', '', ''], // 4: White pawn at e4 (row 4, col 4)
            ['', '', '', '', '', '', '', ''], // 5: e3 (enPassantTarget is {row: 5, col: 4})
            ['', '', '', '', '', '', '', ''], // 6
            ['', '', '', '', '', '', '', ''], // 7
        ],
        currentPlayer: 'black',
        enPassantTarget: { row: 5, col: 4 }, // e3
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    sendEvent({ type: 'SELECT_PIECE', position: { row: 3, col: 3 } }); // Select bP at d5
    const possibleMoves = getContext().possibleMoves;
    const canEnPassant = possibleMoves.some(m => m.row === 5 && m.col === 4);
    expect(canEnPassant).toBe(false);
    
    sendEvent({ type: 'MOVE_PIECE', position: { row: 5, col: 4 } }); // Attempt en passant to e3

    expect(getContext().error).not.toBeNull(); // Should be an invalid move, error is set.
    
    // Assert that the board state remains unchanged for the involved pieces
    expect(getContext().board[3][3]).toBe('bP'); // Black Pawn remains at d5 (its original position)
    expect(getContext().board[4][4]).toBe('wP'); // White Pawn (at e4) remains untouched
    expect(getContext().board[5][4]).toBe('');   // Target en passant square (e3) remains empty
    expect(getContext().board[5][3]).toBe('');   // This square was empty and should remain empty
  });

});
