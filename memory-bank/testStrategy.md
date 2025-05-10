# Chess Game - Testing Strategy

## Overview
This document outlines our test-driven development (TDD) approach for the chess application. We've implemented a comprehensive testing strategy that focuses on three key areas:

1. **State Machine Logic** - Testing the XState chess machine that handles game state
2. **Chess Rules** - Testing the rules and valid move calculations for chess pieces
3. **UI Components** - Testing the React components that render the chess board

## Test Structure

### State Machine Tests (`__tests__/chessMachine.test.ts`)
These tests focus on the core game logic implemented in the XState state machine:

- **Initial State** - Verifies the chess board is correctly initialized with pieces in their starting positions
- **Piece Selection** - Tests the logic for selecting pieces and validating that players can only select their own pieces
- **Board Updates** - Ensures the board state updates correctly when pieces are moved
- **Game Reset** - Tests that the game can be properly reset to its initial state

### Chess Rules Tests (`__tests__/chessMoveValidation.test.ts`)
These tests verify the implementation of chess rules:

- **Pawn Movement** - Tests the valid moves for pawns, including initial two-square moves and diagonal captures
- **Future: Other Pieces** - Will extend with tests for knights, bishops, rooks, queens, and kings
- **Future: Check/Checkmate** - Will add tests for detecting check and checkmate conditions

### UI Component Tests (`__tests__/page.test.tsx`)
These tests ensure the React components render correctly and interact with the state machine:

- **Board Rendering** - Verifies the chess board is displayed with the correct pieces
- **Player Interaction** - Tests that clicking on pieces and valid squares triggers the correct state machine events
- **Game Reset UI** - Ensures the reset button functions correctly

## Test Coverage
Current test coverage focuses on the core game mechanics, with plans to expand to cover:

- Additional chess piece movement rules
- Check and checkmate detection
- Special moves (castling, en passant)
- Game history and move notation
- Time controls

## TDD Process
For each new feature, we follow this process:

1. Write a failing test that defines the expected behavior
2. Implement the minimum code to pass the test
3. Refactor the code while ensuring tests still pass
4. Proceed to the next feature

## Running Tests
Tests can be run using:

```bash
pnpm test          # Run all tests
pnpm test:watch    # Run in watch mode for development
pnpm test:coverage # Generate coverage report
```
