# Chess Game - Testing Strategy

## Overview
This document outlines our test-driven development (TDD) approach for the chess application. We've implemented a comprehensive testing strategy that focuses on three key areas:

1. **State Machine Logic** - Testing the XState chess machine that handles game state
2. **Chess Rules** - Testing the rules and valid move calculations for chess pieces
3. **UI Components** - Testing the React components that render the chess board

As part of our migration from XState v4 to v5, we've also added new tests that focus specifically on critical chess functionality:

1. **Check Detection** - Tests that verify when kings are in check from various pieces
2. **Checkmate Detection** - Tests that verify checkmate conditions in multiple scenarios
3. **Illegal Move Prevention** - Tests that ensure players cannot make illegal moves

## Test Structure

### State Machine Tests (`__tests__/chessMachine.test.ts`)
These tests focus on the core game logic implemented in the XState state machine:

- **Initial State** - Verifies the chess board is correctly initialized with pieces in their starting positions
- **Piece Selection** - Tests the logic for selecting pieces and validating that players can only select their own pieces
- **Board Updates** - Ensures the board state updates correctly when pieces are moved
- **Game Reset** - Tests that the game can be properly reset to its initial state

### Chess Rules Tests
We have multiple test suites to verify different aspects of chess rules:

#### Basic Move Validation (`__tests__/chessMoveValidation.test.ts`)
- **Pawn Movement** - Tests the valid moves for pawns, including initial two-square moves and diagonal captures
- **Move Restrictions** - Verifies that invalid moves are rejected with appropriate error messages

#### Check Detection
##### Legacy Tests (`__tests__/checkDetection.test.ts`)
- **Detection from Different Pieces** - Tests check detection from queen, rook, bishop, knight, and pawn
- **Resolving Check** - Verifies that check can be resolved by moving the king, capturing the attacking piece, or blocking
- **Check Status** - Ensures the check state is tracked correctly in the game context

##### New XState v5 Tests (`__tests__/checkDetectionNew.test.ts`)
- **Individual Piece Checks** - Tests check detection individually for each piece type
- **Multiple Attackers** - Tests scenarios where multiple pieces put the king in check
- **Edge Cases** - Tests checks along edges and corners of the board
- **Test Helper Accuracy** - Enhanced test helpers for more accurate check detection

#### Checkmate Detection
##### Legacy Tests (`__tests__/checkmateDetection.test.ts`)
- **Classic Checkmates** - Tests recognition of patterns like Fool's mate and Scholar's mate
- **Common Checkmate Patterns** - Tests back-rank checkmate, smothered checkmate, and queen-bishop checkmate
- **Non-Checkmate Scenarios** - Verifies that check situations that aren't checkmate are identified correctly

##### New XState v5 Tests (`__tests__/checkmateDetectionNew.test.ts`)
- **Classic Checkmate Patterns** - Comprehensive tests for fool's mate, back rank checkmate
- **Escape Validation** - Tests that verify no legal moves exist for the checkmated player
- **Game State Updates** - Ensures proper game state updates when checkmate occurs

#### Illegal Move Prevention
##### Legacy Tests (`__tests__/illegalMovesPrevention.test.ts`)
- **Pinned Pieces** - Tests that pinned pieces can't move in ways that would expose the king
- **King Movement** - Ensures kings can't move into check
- **Move Limitations** - Verifies that when in check, only moves that resolve check are allowed

##### New XState v5 Tests (`__tests__/illegalMovePreventionNew.test.ts`)
- **Turn Order Enforcement** - Tests that players can only move their own pieces
- **King Safety Rules** - Comprehensive tests for king movement limitations
- **Pinned Piece Validation** - Ensures pinned pieces stay where needed to protect the king
- **Check Resolution** - Tests that players must resolve check situations

### UI Component Tests (`__tests__/page.test.tsx`)
These tests ensure the React components render correctly and interact with the state machine:

- **Board Rendering** - Verifies the chess board is displayed with the correct pieces
- **Player Interaction** - Tests that clicking on pieces and valid squares triggers the correct state machine events
- **Game Reset UI** - Ensures the reset button functions correctly

## Test Coverage
Our testing coverage now includes:

### Implemented:
- Core state machine functionality (XState v4 and v5)
- Basic piece movement rules with comprehensive validation
- Check detection from all piece types with 100% test coverage
- Checkmate detection for various common patterns:
  - Fool's mate (quickest possible checkmate)
  - Back-rank checkmate
  - Smothered checkmate
- Illegal move prevention mechanisms:
  - Turn-based move restrictions
  - Piece-specific movement constraints
  - King safety rules preventing moves into check
- UI component rendering
- Advanced test helpers for creating custom board positions
- Custom test machine for more efficient testing
- Robust diagonal movement detection for bishops and queens
- Full test suite compatibility with XState v5

### Planned Extensions:
- Special moves (castling, en passant)
- Pawn promotion
- Stalemate detection
- Game history and move notation
- Time controls
- Performance testing for complex positions
- Edge case coverage for rare board situations
- Integration tests between UI and state machine

## TDD Process
For each new feature, we follow this process:

1. Write a failing test that defines the expected behavior
2. Implement the minimum code to pass the test
3. Refactor the code while ensuring tests still pass
4. Proceed to the next feature

## Test Helper Infrastructure

To facilitate comprehensive testing of chess rules, we've developed a robust set of test helper functions that make it easy to create and validate custom board positions:

### Custom Board Creation
- `createCustomBoard()` - Creates a chess board with pieces at specified positions
- `createTestActor()` - Creates a properly initialized state machine actor for testing

### Chess Rule Validation Helpers
- `isValidMove()` - Tests if a move is valid according to chess piece movement rules
- `isPositionUnderAttack()` - Checks if a position is attacked by an opponent's pieces
- `isKingInCheck()` - Determines if a player's king is in check
- `wouldMoveResultInCheck()` - Tests if a move would leave the king in check
- `isPlayerInCheckmate()` - Determines if a player is in checkmate by exhaustively testing all possible moves

These helpers abstract away the complexity of setting up specific test scenarios and allow tests to focus on the chess rule being tested rather than the mechanics of board setup.

## Running Tests
Tests can be run using:

```bash
pnpm test          # Run all tests
pnpm test:watch    # Run in watch mode for development
pnpm test:coverage # Generate coverage report
```
