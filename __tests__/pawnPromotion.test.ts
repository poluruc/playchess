import { Actor, createActor } from 'xstate';
import { ChessContext, ChessEvents, chessMachine, defaultInitialChessContext } from '../lib/chessMachine';
import { PieceType } from '../lib/chessTypes'; // Corrected import for PieceType

describe('Pawn Promotion Logic with Choice', () => {
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
  const getStateValue = () => machine.getSnapshot().value;

  test('white pawn reaches promotion rank, should await choice, then promote to Queen', () => {
    const customContext: Partial<ChessContext> = {
      ...defaultInitialChessContext,
      board: [
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', 'wP', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', 'bK', '', '', ''],
      ],
      currentPlayer: 'white',
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    sendEvent({ type: 'SELECT_PIECE', position: { row: 1, col: 4 } });
    sendEvent({ type: 'MOVE_PIECE', position: { row: 0, col: 4 } });

    expect(getContext().error).toBeNull();
    expect(getContext().awaitingPromotionChoice).toEqual({ row: 0, col: 4 });
    expect(getContext().board[0][4]).toBe('wP'); // Pawn is still a pawn
    expect(getContext().currentPlayer).toBe('white'); // Player turn doesn't change yet
    expect(getStateValue()).toEqual({ playing: 'awaitingPromotionChoice' });

    sendEvent({ type: 'CHOOSE_PROMOTION_PIECE', piece: PieceType.Queen });

    expect(getContext().awaitingPromotionChoice).toBeNull();
    expect(getContext().board[0][4]).toBe('wQ');
    expect(getContext().currentPlayer).toBe('black');
    expect(getStateValue()).toEqual({ playing: 'awaitingSelection' });
  });

  test('black pawn reaches promotion rank, should await choice, then promote to Rook', () => {
    const customContext: Partial<ChessContext> = {
      ...defaultInitialChessContext,
      board: [
        ['', '', '', '', 'wK', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', 'bP', '', '', ''],
        ['', '', '', '', '', '', '', ''],
      ],
      currentPlayer: 'black',
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    sendEvent({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } });
    sendEvent({ type: 'MOVE_PIECE', position: { row: 7, col: 4 } });

    expect(getContext().awaitingPromotionChoice).toEqual({ row: 7, col: 4 });
    expect(getContext().board[7][4]).toBe('bP');
    expect(getContext().currentPlayer).toBe('black');
    expect(getStateValue()).toEqual({ playing: 'awaitingPromotionChoice' });

    sendEvent({ type: 'CHOOSE_PROMOTION_PIECE', piece: PieceType.Rook });

    expect(getContext().awaitingPromotionChoice).toBeNull();
    expect(getContext().board[7][4]).toBe('bR');
    expect(getContext().currentPlayer).toBe('white');
    expect(getStateValue()).toEqual({ playing: 'awaitingSelection' });
  });

  test('white pawn captures on promotion rank, should await choice, then promote to Bishop', () => {
    const customContext: Partial<ChessContext> = {
      ...defaultInitialChessContext,
      board: [
        ['', '', '', 'bN', '', '', '', ''], // Black Knight to capture
        ['', '', '', '', 'wP', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', 'bK', '', '', ''],
      ],
      currentPlayer: 'white',
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    sendEvent({ type: 'SELECT_PIECE', position: { row: 1, col: 4 } });
    sendEvent({ type: 'MOVE_PIECE', position: { row: 0, col: 3 } }); // Capture bN at d8

    expect(getContext().awaitingPromotionChoice).toEqual({ row: 0, col: 3 });
    expect(getContext().board[0][3]).toBe('wP'); // Pawn is still a pawn after moving to capture square
    expect(getContext().board[1][4]).toBe(''); // Original square empty
    expect(getContext().currentPlayer).toBe('white');
    expect(getStateValue()).toEqual({ playing: 'awaitingPromotionChoice' });

    sendEvent({ type: 'CHOOSE_PROMOTION_PIECE', piece: PieceType.Bishop });

    expect(getContext().awaitingPromotionChoice).toBeNull();
    expect(getContext().board[0][3]).toBe('wB');
    expect(getContext().currentPlayer).toBe('black');
    expect(getStateValue()).toEqual({ playing: 'awaitingSelection' });
  });

  test('black pawn captures on promotion rank, should await choice, then promote to Knight', () => {
    const customContext: Partial<ChessContext> = {
      ...defaultInitialChessContext,
      board: [
        ['', '', '', '', 'wK', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', 'bP', '', '', ''],
        ['', '', '', 'wR', '', '', '', ''], // White Rook to capture
      ],
      currentPlayer: 'black',
    };
    machine = createActor(chessMachine, { input: customContext }).start();

    sendEvent({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } });
    sendEvent({ type: 'MOVE_PIECE', position: { row: 7, col: 3 } }); // Capture wR at d1

    expect(getContext().awaitingPromotionChoice).toEqual({ row: 7, col: 3 });
    expect(getContext().board[7][3]).toBe('bP');
    expect(getContext().board[6][4]).toBe('');
    expect(getContext().currentPlayer).toBe('black');
    expect(getStateValue()).toEqual({ playing: 'awaitingPromotionChoice' });

    sendEvent({ type: 'CHOOSE_PROMOTION_PIECE', piece: PieceType.Knight });

    expect(getContext().awaitingPromotionChoice).toBeNull();
    expect(getContext().board[7][3]).toBe('bN');
    expect(getContext().currentPlayer).toBe('white');
    expect(getStateValue()).toEqual({ playing: 'awaitingSelection' });
  });

  test('should not allow other moves when awaiting promotion choice', () => {
    const customContext: Partial<ChessContext> = {
        ...defaultInitialChessContext,
        board: [
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', 'wP', '', '', ''],
          ['wK', '', '', '', '', '', '', ''], // White king for a possible move
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', 'bK', '', '', ''],
        ],
        currentPlayer: 'white',
      };
      machine = createActor(chessMachine, { input: customContext }).start();
  
      sendEvent({ type: 'SELECT_PIECE', position: { row: 1, col: 4 } });
      sendEvent({ type: 'MOVE_PIECE', position: { row: 0, col: 4 } }); // Pawn moves to promotion rank
  
      expect(getStateValue()).toEqual({ playing: 'awaitingPromotionChoice' });
      expect(getContext().awaitingPromotionChoice).toEqual({ row: 0, col: 4 });
  
      // Attempt to select another piece (e.g., the white king)
      sendEvent({ type: 'SELECT_PIECE', position: { row: 2, col: 0 } });
      expect(getContext().error).toBe("Choose a promotion piece."); // Corrected error message
      expect(getContext().selectedPiece).toBeNull(); // Selection should not change
      expect(getStateValue()).toEqual({ playing: 'awaitingPromotionChoice' }); // Still awaiting choice

      // Attempt to move the (still selected) pawn elsewhere (invalid move anyway, but testing state)
      // Note: the pawn is at {row: 0, col: 4} but selectedPiece in context is still its original before movePiece action processed it.
      // The machine should prevent any move if awaitingPromotionChoice is set.
      // To properly test this, we might need to simulate a click on an empty square or another piece.
      // Let's try to select the pawn again (which is now at the promotion square)
      sendEvent({ type: 'SELECT_PIECE', position: { row: 0, col: 4 } });
      expect(getContext().error).toBe("Choose a promotion piece."); // Corrected error message
      expect(getStateValue()).toEqual({ playing: 'awaitingPromotionChoice' });

      // Attempt a direct MOVE_PIECE event (e.g. trying to move the king)
      // First, we need to ensure selectedPiece is null as it would be if user tried to click king
      machine.send({type: 'SELECT_PIECE', position: {row: 2, col: 0}});
      // Now selectedPiece is null because of the error, try to move the king
      // This is a bit artificial as UI wouldn't allow this flow easily, but tests machine logic.
      // Actually, the SELECT_PIECE above would set an error and not change selectedPiece from the pawn.
      // The machine should prevent any MOVE_PIECE if awaitingPromotionChoice is set.
      // Let's assume the user somehow tries to send a MOVE_PIECE event for the king.
      // The guard `isValidMoveTarget` in chessMachine.ts has `if (context.awaitingPromotionChoice) return false;`
      // So, even if a piece *were* selected, the move would be blocked.
      // If we send a MOVE_PIECE for a random square, it should also be blocked.
      sendEvent({ type: 'MOVE_PIECE', position: {row: 2, col: 1}}); // Try to move King to b6
      expect(getContext().error).toBe("Choose a promotion piece."); // Error from the awaitingPromotionChoice state
      expect(getStateValue()).toEqual({ playing: 'awaitingPromotionChoice' });
  });

});
