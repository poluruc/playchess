import { Actor, createActor } from 'xstate';
import { ChessContext, ChessEvents, chessMachine, defaultInitialChessContext } from '../lib/chessMachine';

describe('Pawn Promotion Logic', () => {
  test('simple sanity check for pawn promotion suite', () => {
    expect(true).toBe(true);
  });

  let machine: Actor<typeof chessMachine>;

  beforeEach(() => {
    machine = createActor(chessMachine).start();
  });

  afterEach(() => {
    machine.stop();
  });

  const getContext = () => machine.getSnapshot().context;
  const sendEvent = (event: ChessEvents) => machine.send(event);

  test('should promote white pawn to Queen on reaching 8th rank (row 0)', () => {
    const customContext: Partial<ChessContext> = {
      ...defaultInitialChessContext,
      board: [
        ['', '', '', '', '', '', '', ''], // 0 (Promotion rank for white)
        ['', '', '', '', 'wP', '', '', ''], // 1: White pawn at e7 (row 1, col 4)
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', 'bK', '', '', ''], // Black King for valid game
      ],
      currentPlayer: 'white',
      selectedPiece: null,
      enPassantTarget: null,
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    sendEvent({ type: 'SELECT_PIECE', position: { row: 1, col: 4 } }); // Select wP at e7
    expect(getContext().selectedPiece).toEqual({ row: 1, col: 4 });
    sendEvent({ type: 'MOVE_PIECE', position: { row: 0, col: 4 } }); // Move wP to e8 for promotion

    expect(getContext().error).toBeNull();
    expect(getContext().board[0][4]).toBe('wQ'); // White pawn promoted to Queen at e8
    expect(getContext().board[1][4]).toBe('');   // Original e7 is empty
    expect(getContext().currentPlayer).toBe('black');
    expect(getContext().enPassantTarget).toBeNull(); // En passant target should be null
  });

  test('should promote black pawn to Queen on reaching 1st rank (row 7)', () => {
    const customContext: Partial<ChessContext> = {
      ...defaultInitialChessContext,
      board: [
        ['', '', '', '', 'wK', '', '', ''], // White King for valid game
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', 'bP', '', '', ''], // 6: Black pawn at e2 (row 6, col 4)
        ['', '', '', '', '', '', '', ''], // 7 (Promotion rank for black)
      ],
      currentPlayer: 'black',
      selectedPiece: null,
      enPassantTarget: null,
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    sendEvent({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } }); // Select bP at e2
    expect(getContext().selectedPiece).toEqual({ row: 6, col: 4 });
    sendEvent({ type: 'MOVE_PIECE', position: { row: 7, col: 4 } }); // Move bP to e1 for promotion

    expect(getContext().error).toBeNull();
    expect(getContext().board[7][4]).toBe('bQ'); // Black pawn promoted to Queen at e1
    expect(getContext().board[6][4]).toBe('');   // Original e2 is empty
    expect(getContext().currentPlayer).toBe('white');
    expect(getContext().enPassantTarget).toBeNull(); // En passant target should be null
  });

  test('should promote white pawn to Queen on capture at 8th rank (row 0)', () => {
    const customContext: Partial<ChessContext> = {
      ...defaultInitialChessContext,
      board: [
        ['', '', '', 'bR', '', '', '', ''], // 0: Black Rook at d8 (row 0, col 3) for capture
        ['', '', '', '', 'wP', '', '', ''], // 1: White pawn at e7 (row 1, col 4)
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', 'bK', '', '', ''], // Black King for valid game
      ],
      currentPlayer: 'white',
      selectedPiece: null,
      enPassantTarget: null,
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    sendEvent({ type: 'SELECT_PIECE', position: { row: 1, col: 4 } }); // Select wP at e7
    expect(getContext().selectedPiece).toEqual({ row: 1, col: 4 });
    sendEvent({ type: 'MOVE_PIECE', position: { row: 0, col: 3 } }); // Move wP to d8 for capture and promotion

    expect(getContext().error).toBeNull();
    expect(getContext().board[0][3]).toBe('wQ'); // White pawn promoted to Queen at d8
    expect(getContext().board[1][4]).toBe('');   // Original e7 is empty
    expect(getContext().currentPlayer).toBe('black');
  });

  test('should promote black pawn to Queen on capture at 1st rank (row 7)', () => {
    const customContext: Partial<ChessContext> = {
      ...defaultInitialChessContext,
      board: [
        ['', '', '', '', 'wK', '', '', ''], // White King for valid game
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', 'bP', '', '', ''], // 6: Black pawn at e2 (row 6, col 4)
        ['', '', '', 'wR', '', '', '', ''], // 7: White Rook at d1 (row 7, col 3) for capture
      ],
      currentPlayer: 'black',
      selectedPiece: null,
      enPassantTarget: null,
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    sendEvent({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } }); // Select bP at e2
    expect(getContext().selectedPiece).toEqual({ row: 6, col: 4 });
    sendEvent({ type: 'MOVE_PIECE', position: { row: 7, col: 3 } }); // Move bP to d1 for capture and promotion

    expect(getContext().error).toBeNull();
    expect(getContext().board[7][3]).toBe('bQ'); // Black pawn promoted to Queen at d1
    expect(getContext().board[6][4]).toBe('');   // Original e2 is empty
    expect(getContext().currentPlayer).toBe('white');
  });
});
