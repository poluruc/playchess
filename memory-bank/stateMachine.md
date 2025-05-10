# Chess State Machine Implementation

## Overview
Our chess application uses XState for state management, which provides a robust way to model the game's states, transitions, and business logic. This document explains the core architecture of our chess state machine.

## Machine Structure

### States
The chess machine has two main states:

1. **waitingForSelection**
   - Initial state when a player needs to select a piece
   - Transitions to `pieceSelected` when a valid piece is selected

2. **pieceSelected**
   - Active when a player has selected a piece and is deciding where to move it
   - Can transition back to `waitingForSelection` after a move or when selection is cleared

### Context
The machine maintains the following context (state):

- **board**: 2D array representing the chess board with pieces
- **currentPlayer**: Current player ('white' or 'black')
- **selectedPiece**: Position of the currently selected piece, or null if no piece is selected
- **possibleMoves**: Array of valid positions where the selected piece can move

### Events
The machine responds to these events:

- **SELECT_PIECE**: Select a piece at a specific position
- **MOVE_PIECE**: Move a piece to a new position
- **RESET_GAME**: Reset the game to its initial state

### Guards
Guards are used to validate transitions:

- **isCurrentPlayerPiece**: Ensures the selected piece belongs to the current player
- **isValidMove**: Verifies that a move is legal according to chess rules

### Actions
Actions update the machine's context:

- **selectPiece**: Updates the selected piece and calculates possible moves
- **clearSelection**: Clears the current piece selection
- **movePiece**: Updates the board with the new piece position
- **switchPlayer**: Switches the current player
- **resetGame**: Resets the game to its initial state

## Chess Rules Implementation

### Piece Representation
Pieces are represented by a two-character string:
- First character: 'w' for white, 'b' for black
- Second character: 'P' for pawn, 'R' for rook, 'N' for knight, 'B' for bishop, 'Q' for queen, 'K' for king

### Move Calculation
The `calculatePossibleMoves` function determines valid moves for a piece:
- Currently implements pawn movement rules
- Future versions will add rules for all piece types
- Enforces capture rules and board boundaries

## Future Enhancements
Planned improvements to the state machine:

1. Implement move rules for all piece types
2. Add check and checkmate detection
3. Add special moves (castling, en passant)
4. Implement game history for move tracking
5. Add promotions for pawns
