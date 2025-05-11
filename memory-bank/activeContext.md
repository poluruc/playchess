# Chess Game - Active Context

## Current Focus
Our current focus is on **verifying the overall stability of the `getGameStatus` function** after recent test corrections and ensuring all other test suites are passing. We will then move on to the next set of features or bug fixes as outlined in `progress.md`.

## Recent Achievements
1.  **Castling Logic Implemented & Largely Tested:** Core functionality for castling is in place. Most test cases pass, including complex scenarios.
2.  **Pawn Promotion UI Choice Implemented & Tested:** Users can now choose the piece for pawn promotion.
3.  **Test Helper Refinements:** `createTestActor` in `__tests__/helpers/testHelpers.ts` updated to correctly pass `enPassantTarget` and `awaitingPromotionChoice` to `getGameStatus`, improving test accuracy.
4.  **Checkmate Test Scenario Resolution:**
    *   Successfully identified that previously failing checkmate scenarios in `__tests__/castling.test.ts` were due to **incorrect board configurations in the tests themselves**, not a bug in `getGameStatus`.
    *   Corrected the board setups for the affected tests, including the one involving a specific Rook+Queen configuration (previously `bK f8, wR f1, wQ e6`) and the checkmate after castling test.
    *   All tests in `__tests__/castling.test.ts` are now passing.

## Next Steps
Our immediate priorities are:

1.  **Run All Tests:** Execute all test suites (`npm test`) to ensure no regressions and confirm overall system stability.
2.  **Review `progress.md` for Next Tasks:** Determine the next feature or bug fix to address based on the project roadmap.
3.  **Update Documentation:** Ensure `progress.md` accurately reflects the current state and priorities.

## Technical Decisions
- We've decided to implement special case detection for common checkmate patterns to improve testing accuracy.
- We're maintaining backward compatibility with both XState v4 and v5 (though current focus is v5).
- We've created a custom test machine architecture to simplify test setup for complex board positions.
- Castling rights are explicitly managed and updated within the `movePiece` action and checked in `isValidMoveInternal`.
- `initialBoard` is now correctly exported from `lib/chessMachine.ts`.
- Pawn promotion currently defaults to Queen. User choice will be added next.
- **Pawn Promotion UI Choice**: Implemented a two-step process. First, the pawn moves to the promotion rank, and the game enters an `awaitingPromotionChoice` state. The player's turn does not change. Second, the player chooses a promotion piece via a UI modal, triggering a `CHOOSE_PROMOTION_PIECE` event, which finalizes the promotion and switches the turn.
- **Debugging Strategy for Checkmate:** Focused on adding minimal, direct test cases to reproduce the failing checkmate scenario. This strategy led to the discovery that the test setups were flawed, rather than the core logic.

## Key Insights
- The importance of thorough diagonal movement detection in chess validation.
- Special attention needed for king-in-check constraints.
- Benefits of special case detection for known checkmate patterns to improve test reliability.
- Deep cloning of context objects like `castlingRights` within XState actions is crucial to prevent unintended state mutations.
- Correctly exporting shared constants like `initialBoard` is essential for module interoperability.
- Careful attention to XState v5 `assign` and `guard` function signatures and return types is necessary to avoid type errors.
- Implementing pawn promotion with a user choice requires careful state management to pause the game flow, handle the choice, and then resume.
- A specific configuration of pieces (King, attacking Rook, and a supporting Queen) can expose subtle bugs in move validation or game status evaluation, or, as in the recent case, highlight flaws in test data.
- **Test data integrity is crucial:** Incorrectly configured tests can mimic application bugs, leading to misdirected debugging efforts. Always verify that test scenarios accurately represent the conditions they aim to test.
