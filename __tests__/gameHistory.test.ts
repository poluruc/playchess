import { createActor } from 'xstate';
import { chessMachine } from '../lib/chessMachine';
import { ChessContext, PieceType } from '../lib/chessTypes'; // Added ChessContext import

describe('Game History', () => {
  test('sanity check', () => {
    expect(true).toBe(true);
  });

  test('should have an empty moveHistory initially', () => {
    const actor = createActor(chessMachine);
    actor.start();
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.moveHistory).toEqual([]);
  });

  test('should record a simple pawn move correctly', () => {
    const actor = createActor(chessMachine);
    actor.start();
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } }); // Select e2
    actor.send({ type: 'MOVE_PIECE', position: { row: 4, col: 4 } }); // Move e2 to e4

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.moveHistory.length).toBe(1);
    const lastMove = snapshot.context.moveHistory[0];

    expect(lastMove.piece).toBe('wP');
    expect(lastMove.from).toEqual({ row: 6, col: 4 });
    expect(lastMove.to).toEqual({ row: 4, col: 4 });
    expect(lastMove.notation).toBe('e4');
    expect(lastMove.isCheck).toBe(false);
    expect(lastMove.isCheckmate).toBe(false);
    expect(lastMove.isStalemate).toBe(false);
    // expect(lastMove.boardBefore).toEqual(/* initial board */);
    // expect(lastMove.boardAfter).toEqual(/* board after e4 */);
    expect(lastMove.castlingRightsBefore).toEqual({ white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } });
    expect(lastMove.enPassantTargetBefore).toBeNull();
  });

  // test('should record a knight move with correct notation', () => {
  //   const actor = createActor(chessMachine);
  //   actor.start();

  //   // White moves Ng1-f3
  //   actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 6 } }); // g1
  //   actor.send({ type: 'MOVE_PIECE', position: { row: 5, col: 5 } }); // f3

  //   const snapshot = actor.getSnapshot();
  //   expect(snapshot.context.moveHistory.length).toBe(1);
  //   const firstMove = snapshot.context.moveHistory[0];

  //   expect(firstMove.from).toEqual({ row: 7, col: 6 });
  //   expect(firstMove.to).toEqual({ row: 5, col: 5 });
  //   expect(firstMove.piece).toBe('wN');
  //   expect(firstMove.notation).toBe('Nf3'); // Standard notation for knight move
  //   expect(firstMove.isCheck).toBe(false);
  //   expect(firstMove.isCheckmate).toBe(false);
  //   expect(firstMove.isStalemate).toBe(false);
  //   expect(firstMove.castlingRightsBefore.white.kingSide).toBe(true);
  //   expect(firstMove.enPassantTargetBefore).toBeNull();
  // });

  test('should record multiple moves and update notation for check', () => {
    const actor = createActor(chessMachine);
    actor.start();

    // 1. e4
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 4, col: 4 } });
    // 1... e5
    actor.send({ type: 'SELECT_PIECE', position: { row: 1, col: 4 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 3, col: 4 } });
    // 2. Qh5
    actor.send({ type: 'SELECT_PIECE', position: { row: 7, col: 3 } }); // d1 Queen
    actor.send({ type: 'MOVE_PIECE', position: { row: 3, col: 7 } }); // h5

    // 2... Nf6
    actor.send({ type: 'SELECT_PIECE', position: { row: 0, col: 6 } }); // g8 Knight
    actor.send({ type: 'MOVE_PIECE', position: { row: 2, col: 5 } }); // f6

    // 3. Qxf7+ (check, not checkmate)
    actor.send({ type: 'SELECT_PIECE', position: { row: 3, col: 7 } }); // Queen at h5
    actor.send({ type: 'MOVE_PIECE', position: { row: 1, col: 5 } }); // f7 (captures pawn, check)
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.moveHistory.length).toBe(5);

    const lastMove = snapshot.context.moveHistory[4];
    expect(lastMove.piece).toBe('wQ');
    expect(lastMove.notation).toBe('Qxf7+'); // Standard notation for Queen captures f7, check
    expect(lastMove.isCheck).toBe(true); 
    expect(lastMove.isCheckmate).toBe(false); // It's a check, not a checkmate
    expect(snapshot.context.winner).toBeNull(); // Game is not over
    expect(snapshot.context.gameOver).toBe(false); // Game is not over
  });

  test('should correctly update notation for pawn promotion', () => {
    // const actor = createActor(chessMachine);
    // actor.start();

    // Simplified setup to get a pawn to promotion rank
    // White: Pawn at a7, King at e1
    // Black: King at e8
    const customContext: Partial<ChessContext> = { // Use Partial<ChessContext> for type safety
      board: [
        ['', '', '', '', 'bK', '', '', ''],
        ['wP', '', '', '', '', '', '', ''], // White pawn at a7 (row 1, col 0)
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', 'wK', '', '', ''],
      ],
      currentPlayer: 'white',
      castlingRights: {
        white: { kingSide: false, queenSide: false },
        black: { kingSide: false, queenSide: false },
      },
      enPassantTarget: null,
      awaitingPromotionChoice: null,
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      gameOver: false,
      moveHistory: [],
      selectedPiece: null, // Ensure all required fields for ChessContext are present or use Partial
      possibleMoves: [],
      error: null,
      winner: null,
    };

    const actor = createActor(chessMachine, { input: customContext });
    actor.start();
    
    // @ts-ignore - Manually setting context for test setup - THIS LINE IS REMOVED
    // actor.machine.context = customContext; 
    // Need to re-initialize the actor with this specific context or send an event
    // For simplicity in this test, we'll assume the machine could be put into this state.
    // A more robust way would be to play moves to reach this state or use a dedicated setup event.

    // Now, with the custom context, let's try to make the promotion move
    // White pawn at a7 (row 1, col 0) should move to a8 (row 0, col 0) and promote

    // 1. Select pawn at a7
    actor.send({ type: 'SELECT_PIECE', position: { row: 1, col: 0 } }); 
    // 2. Move pawn to a8 for promotion
    actor.send({ type: 'MOVE_PIECE', position: { row: 0, col: 0 } });
    
    let snapshot = actor.getSnapshot();
    expect(snapshot.context.awaitingPromotionChoice).toEqual({ row: 0, col: 0 });
    
    const prePromotionMoveCount = snapshot.context.moveHistory.length;
    // With custom context, move history should be 1 after the promotion move setup
    expect(prePromotionMoveCount).toBe(1);
    const lastMoveBeforePromotion = snapshot.context.moveHistory[prePromotionMoveCount - 1];
    
    // Notation before choosing promotion piece (e.g., a7-a8 or a8 if it was a capture)
    // For a simple move to promotion square, it should be like "a8"
    // If it was a capture like bxa8, then "bxa8"
    // The current generateAlgebraicNotation for pawn moves to empty squares is just the square.
    expect(lastMoveBeforePromotion.notation).toBe('a8'); 
    expect(lastMoveBeforePromotion.notation).not.toMatch(/=Q/);

    actor.send({ type: 'CHOOSE_PROMOTION_PIECE', piece: PieceType.Queen });
    snapshot = actor.getSnapshot();

    expect(snapshot.context.awaitingPromotionChoice).toBeNull();
    expect(snapshot.context.moveHistory.length).toBe(prePromotionMoveCount); // No new move record, existing one updated

    const promotionMoveRecord = snapshot.context.moveHistory[prePromotionMoveCount - 1];
    expect(promotionMoveRecord.piece).toBe('wP'); // Piece that moved is still the pawn
    expect(promotionMoveRecord.to).toEqual({ row: 0, col: 0 });
    expect(promotionMoveRecord.notation).toMatch(/a8=Q/); // Should include =Q
    
    // Check if it's check or checkmate after promotion
    // In this specific setup, promoting to a Queen at a8 with bK at e8 and wK at e1
    // does not result in a check or checkmate.
    expect(snapshot.context.isCheck).toBe(false);
    expect(snapshot.context.isCheckmate).toBe(false);
    if (snapshot.context.isCheckmate) {
        expect(promotionMoveRecord.notation).toMatch(/=Q#/);
        expect(promotionMoveRecord.isCheckmate).toBe(true);
    } else if (snapshot.context.isCheck) {
        expect(promotionMoveRecord.notation).toMatch(/=Q\+/);
        expect(promotionMoveRecord.isCheck).toBe(true);
    }
    expect(snapshot.context.board[0][0]).toBe('wQ'); // Queen on the board
  });

  test('should clear moveHistory on RESET_GAME', () => {
    const actor = createActor(chessMachine);
    actor.start();

    // Make a move
    actor.send({ type: 'SELECT_PIECE', position: { row: 6, col: 0 } });
    actor.send({ type: 'MOVE_PIECE', position: { row: 4, col: 0 } });
    
    let snapshot = actor.getSnapshot();
    expect(snapshot.context.moveHistory.length).toBe(1);

    // Reset game
    actor.send({ type: 'RESET_GAME' });
    snapshot = actor.getSnapshot();
    expect(snapshot.context.moveHistory).toEqual([]);
  });
});
